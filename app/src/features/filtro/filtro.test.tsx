import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation, useRoutes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../lib/api';
import { CLAVE_HOGAR } from '../../lib/sesion';
import type { CartuchoDelFiltro, FiltroHogar } from '../../lib/tipos';
import { rutasFiltro } from './rutas';
import { destinoSeguro } from './textos';

vi.mock('../../lib/api', async (original) => {
  const real = await original<typeof import('../../lib/api')>();
  return {
    ...real,
    api: {
      identificarFiltro: vi.fn(),
      guardarFiltro: vi.fn(),
      filtroDeHogar: vi.fn(),
      modelosDeFiltro: vi.fn(),
    },
  };
});

const apiSimulada = vi.mocked(api);

const filtro: FiltroHogar = {
  tipo: 'portafiltro_triple',
  tipo_nombre: 'Portafiltro triple',
  etapas: 3,
  medida: '10x2.5',
  modelo_codigo: null,
  modelo_nombre: null,
  marca_visible: 'Oasis',
  modelo_visible: null,
  confianza: 'media',
  origen: 'foto',
  observaciones: null,
};

const cartucho: CartuchoDelFiltro = {
  codigo: 'SED-10',
  nombre: 'Cartucho de Sedimentos 10" x 2.5"',
  marca: 'Oasis',
  precio_usd: null,
  corrige: ['sedimentos'],
  es_ejemplo: false,
  foto_url: null,
  categoria: 'cartucho',
  url_producto: null,
  disponible: true,
  funcion: 'sedimentos',
  para_que: 'Pensado para retener tierra, óxido y partículas.',
  atiende_medicion: true,
  confirmar_medida: false,
};

function Donde() {
  const ubicacion = useLocation();
  return <p>Estás en {ubicacion.pathname}{ubicacion.search}</p>;
}

function Rutas() {
  return useRoutes([...rutasFiltro, { path: '*', element: <Donde /> }]);
}

function abrir(ruta: string) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Rutas />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  window.localStorage.setItem(CLAVE_HOGAR, 'hogar-1');
  apiSimulada.filtroDeHogar.mockResolvedValue({ filtro: null, cartuchos: [] });
  apiSimulada.modelosDeFiltro.mockResolvedValue([
    { codigo: 'OPW-6STUF10S', nombre: 'Filtro de Agua por Ultrafiltración UF de 6 Etapas', categoria: 'cartucho' },
  ]);
});

describe('/mi-filtro', () => {
  it('foto → "¿Es este tu filtro?" con cartuchos → "Sí, es este" sigue el recorrido', async () => {
    apiSimulada.identificarFiltro.mockResolvedValue({ estado: 'ok', filtro, cartuchos: [cartucho] });
    apiSimulada.guardarFiltro.mockResolvedValue({ filtro, cartuchos: [cartucho] });
    const { container } = abrir('/mi-filtro?sigue=%2Fmedir');

    expect(screen.getByRole('heading', { level: 1, name: 'Cuéntanos qué filtro tienes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tomar una foto de mi filtro/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Elegir una foto del teléfono' })).toBeInTheDocument();
    expect(screen.getByText('Que se vea el filtro completo y, si tiene, la etiqueta.')).toBeInTheDocument();
    expect(container.querySelectorAll('main#contenido')).toHaveLength(1);
    // Parte del alta: indicador de pasos, "Atrás" al perfil, ejemplo de la foto y la alternativa a mano.
    expect(screen.getByText('Paso 1 de 2: tu filtro')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Atrás' })).toHaveAttribute('href', '/perfil?ya=1');
    expect(screen.getByRole('img', { name: /Ejemplo de foto/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cargarlo a mano' })).toHaveAttribute('href', '/mi-filtro/manual?sigue=%2Fmedir');

    const entrada = container.querySelector<HTMLInputElement>('input[type="file"][capture]')!;
    fireEvent.change(entrada, { target: { files: [new File(['x'], 'filtro.jpg', { type: 'image/jpeg' })] } });

    expect(await screen.findByRole('heading', { level: 1, name: '¿Es este tu filtro?' })).toBeInTheDocument();
    expect(apiSimulada.identificarFiltro).toHaveBeenCalledWith('hogar-1', expect.any(Blob));
    expect(screen.getByText('Portafiltro triple')).toBeInTheDocument();
    expect(screen.getByText(/Corto y delgado/)).toBeInTheDocument();
    expect(screen.getByText('Marca/modelo que se lee: Oasis')).toBeInTheDocument();
    expect(screen.getByText(/Identificación orientativa a partir de la foto/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cartuchos que necesita' })).toBeInTheDocument();
    expect(screen.getByText('Pensado para retener tierra, óxido y partículas.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cotizar por WhatsApp' })).toHaveAttribute('href', expect.stringContaining('wa.me'));

    await userEvent.click(screen.getByRole('button', { name: /Agregar .* a mi lista/ }));
    expect(JSON.parse(window.localStorage.getItem('agua.lista') ?? '[]')).toEqual([
      expect.objectContaining({ codigo: 'SED-10' }),
    ]);
    expect(screen.getByRole('link', { name: 'Corregir' })).toHaveAttribute('href', '/mi-filtro/manual?sigue=%2Fmedir');
    // Identificar no guarda: solo "Sí, es este" guarda.
    expect(apiSimulada.guardarFiltro).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Sí, es este' }));
    expect(await screen.findByText('Estás en /medir')).toBeInTheDocument();
    expect(apiSimulada.guardarFiltro).toHaveBeenCalledWith('hogar-1', {
      tipo: 'portafiltro_triple',
      etapas: 3,
      medida: '10x2.5',
      modelo_codigo: null,
      origen: 'foto',
      detalle: { marca_visible: 'Oasis', modelo_visible: null, confianza: 'media', observaciones: null },
    });
  });

  it('"Corregir" abre la carga manual precargada con lo identificado, sin guardarlo', async () => {
    const otraMedida = { ...cartucho, codigo: 'RL-10', nombre: 'Cartucho Rellenable en Línea 10" x 2"', confirmar_medida: true };
    apiSimulada.identificarFiltro.mockResolvedValue({ estado: 'ok', filtro, cartuchos: [cartucho, otraMedida] });
    const { container } = abrir('/mi-filtro');
    const entrada = container.querySelector<HTMLInputElement>('input[type="file"][capture]')!;
    fireEvent.change(entrada, { target: { files: [new File(['x'], 'filtro.jpg', { type: 'image/jpeg' })] } });
    await screen.findByRole('heading', { level: 1, name: '¿Es este tu filtro?' });
    // Solo el que no es de la misma medida pide confirmarla.
    expect(screen.getAllByText('Confirma la medida en la tienda.')).toHaveLength(1);

    await userEvent.click(screen.getByRole('link', { name: 'Corregir' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Carga tu filtro a mano' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Tres vasos/)).toBeChecked();
    expect(screen.getByRole('spinbutton', { name: /etapas/ })).toHaveValue(3);
    expect(apiSimulada.filtroDeHogar).toHaveBeenCalledTimes(1); // solo el de /mi-filtro: la carga manual usa lo identificado
    expect(apiSimulada.guardarFiltro).not.toHaveBeenCalled();
  });

  it('foto que no se reconoce: muestra el motivo y ofrece repetir o cargar a mano', async () => {
    apiSimulada.identificarFiltro.mockResolvedValue({ estado: 'no_identificado', motivo: 'No vemos un filtro de agua en la foto.' });
    const { container } = abrir('/mi-filtro');
    // Fuera del alta no hay indicador de pasos.
    expect(screen.queryByText(/Paso \d de \d/)).not.toBeInTheDocument();
    const entrada = container.querySelector<HTMLInputElement>('input[type="file"]:not([capture])')!;
    fireEvent.change(entrada, { target: { files: [new File(['x'], 'f.jpg', { type: 'image/jpeg' })] } });
    expect(await screen.findByRole('heading', { level: 1, name: 'No pudimos reconocer tu filtro' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('No vemos un filtro de agua en la foto.');
    expect(screen.getByRole('button', { name: 'Repetir la foto' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cargarlo a mano' })).toHaveAttribute('href', '/mi-filtro/manual');
  });
});

describe('/mi-filtro/manual', () => {
  it('carga a mano con PUT y muestra los cartuchos; Continuar sigue el recorrido', async () => {
    apiSimulada.guardarFiltro.mockResolvedValue({
      filtro: { ...filtro, tipo: 'portafiltro_doble', tipo_nombre: 'Portafiltro doble', etapas: 2, medida: '20x4.5', origen: 'manual' },
      cartuchos: [cartucho],
    });
    abrir('/mi-filtro/manual?sigue=%2Fenvio');
    expect(screen.getByRole('heading', { level: 1, name: 'Carga tu filtro a mano' })).toBeInTheDocument();
    expect(screen.getByText('Paso 1 de 3: tu filtro')).toBeInTheDocument();
    await waitFor(() => expect(apiSimulada.modelosDeFiltro).toHaveBeenCalled());
    // Sin tipo elegido no hay lista de modelos (y ya no hay select nativo).
    expect(screen.queryByRole('group', { name: /Modelo/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /Modelo/ })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Guardar mi filtro' }));
    expect(screen.getByText(/Elige una opción/)).toBeInTheDocument();
    expect(apiSimulada.guardarFiltro).not.toHaveBeenCalled();

    await userEvent.click(screen.getByLabelText(/Dos vasos/));
    await userEvent.type(screen.getByRole('spinbutton', { name: /etapas/ }), '2');
    await userEvent.click(screen.getByLabelText(/Largo y grueso/));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar mi filtro' }));

    await waitFor(() =>
      expect(apiSimulada.guardarFiltro).toHaveBeenCalledWith('hogar-1', {
        tipo: 'portafiltro_doble',
        etapas: 2,
        medida: '20x4.5',
        modelo_codigo: null,
      }),
    );
    expect(await screen.findByRole('heading', { level: 1, name: 'Listo, guardamos tu filtro' })).toBeInTheDocument();
    expect(screen.getByText('Portafiltro doble')).toBeInTheDocument();
    expect(screen.queryByText(/Identificación orientativa/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continuar' })).toHaveAttribute('href', '/envio');
  });

  it('modelo opcional al final: solo los del tipo elegido, en filas legibles, y se guarda su código', async () => {
    apiSimulada.modelosDeFiltro.mockResolvedValue([
      { codigo: 'OPW-6STUF10S', nombre: 'Filtro de Agua por Ultrafiltración UF de 6 Etapas - 10" x 2.5"', categoria: 'cartucho' },
      { codigo: 'OPW-2000UFMY', nombre: 'Filtro de Agua por Ultrafiltración UF de 2000 L/h', categoria: 'cartucho' },
      { codigo: 'OPW-200GPD-8TN', nombre: 'Filtro de Agua por Ósmosis Inversa de 8 Etapas - 200 GPD', categoria: 'sistema_osmosis_inversa' },
    ]);
    apiSimulada.guardarFiltro.mockResolvedValue({ filtro: { ...filtro, origen: 'manual' }, cartuchos: [] });
    abrir('/mi-filtro/manual');
    await waitFor(() => expect(apiSimulada.modelosDeFiltro).toHaveBeenCalled());

    await userEvent.click(screen.getByLabelText(/No sé/, { selector: '#tipo_filtro-otro' }));
    expect(screen.queryByRole('group', { name: /Modelo/ })).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText(/Ultrafiltración/, { selector: '#tipo_filtro-ultrafiltracion' }));
    const grupo = await screen.findByRole('group', { name: 'Modelo (opcional)' });
    const filas = within(grupo).getAllByRole('radio');
    // "No sé el modelo" + el de casa; el comercial (2000 L/h) y el de ósmosis no aparecen.
    expect(filas).toHaveLength(2);
    expect(within(grupo).getByLabelText('No sé el modelo')).toBeChecked();
    const uf = within(grupo).getByLabelText(/Ultrafiltración UF 6 etapas/);
    expect(uf.closest('label')).toHaveTextContent('10" x 2.5" · OPW-6STUF10S');

    await userEvent.click(uf);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar mi filtro' }));
    await waitFor(() =>
      expect(apiSimulada.guardarFiltro).toHaveBeenCalledWith('hogar-1', expect.objectContaining({ tipo: 'ultrafiltracion', modelo_codigo: 'OPW-6STUF10S' })),
    );
  });

  it('más de 6 modelos: muestra 6 de menor a mayor y "Ver más modelos"', async () => {
    apiSimulada.modelosDeFiltro.mockResolvedValue(
      [44, 54, 52, 65, 72, 60, 48, 50].map((alto, i) => ({
        codigo: `T${i}`,
        nombre: `Filtro tipo Tanque de Fibra de Vidrio (FRP) 10" x ${alto}" (sin tubo ni difusores)`,
        categoria: 'filtro_desbarrador',
      })),
    );
    abrir('/mi-filtro/manual');
    await waitFor(() => expect(apiSimulada.modelosDeFiltro).toHaveBeenCalled());
    await userEvent.click(screen.getByLabelText(/Tanque grande/));
    const grupo = await screen.findByRole('group', { name: 'Modelo (opcional)' });
    expect(within(grupo).getAllByRole('radio')).toHaveLength(7);
    const detalles = within(grupo)
      .getAllByRole('radio')
      .slice(1)
      .map((r) => r.closest('label')?.textContent ?? '');
    expect(detalles[0]).toContain('10" x 44"');
    expect(detalles[5]).toContain('10" x 60"');
    await userEvent.click(within(grupo).getByRole('button', { name: 'Ver más modelos' }));
    expect(within(grupo).getAllByRole('radio')).toHaveLength(9);
    expect(within(grupo).queryByRole('button', { name: 'Ver más modelos' })).not.toBeInTheDocument();
  });

  it('destinoSeguro solo acepta rutas internas', () => {
    expect(destinoSeguro('/medir?ya=1')).toBe('/medir?ya=1');
    expect(destinoSeguro('https://otro.sitio')).toBe('/');
    expect(destinoSeguro('//otro.sitio')).toBe('/');
    expect(destinoSeguro(null)).toBe('/');
  });
});
