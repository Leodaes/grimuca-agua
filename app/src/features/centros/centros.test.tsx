import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CentroCercano, DetalleCentro, MedicionCentro } from '../../lib/tipos';

vi.mock('../../lib/api', async () => {
  const real = await vi.importActual<typeof import('../../lib/api')>('../../lib/api');
  return {
    ErrorApi: real.ErrorApi,
    api: {
      centro: vi.fn(),
      centrosCercanos: vi.fn(),
      crearHogar: vi.fn(),
      obtenerHogar: vi.fn(),
      actualizarHogar: vi.fn(),
    },
  };
});

vi.mock('../../lib/sesion', () => ({
  hogarId: vi.fn(() => null),
  guardarHogarId: vi.fn(),
  vaciarLista: vi.fn(),
}));

import { api, ErrorApi } from '../../lib/api';
import { Perfil } from '../alta/Perfil';
import { PaginaCentro } from './PaginaCentro';
import { CentroMasCercano, elegirCercano } from './TarjetaCentro';
import { textoReferencia } from './textos';

const simulada = api as unknown as Record<string, ReturnType<typeof vi.fn>>;

const PROHIBIDAS = /verificad|certificad|aprobad|garantiz|potable|segur[ao]|\bapta\b|agua de calidad|\bbuena\b|\bmala\b/i;

function medicion(cambios: Partial<MedicionCentro> = {}): MedicionCentro {
  return {
    id: 2,
    tienda_id: 'llenado-el-tulipan',
    fecha: '2026-11-21T14:00:00Z',
    casillas: [
      { clave: 'ph', nombre: 'pH', unidad: '', valor: 7.2, nivel: 'verde', referencia_desde: 6.5, referencia_hasta: 8.5, orientativo: false },
      { clave: 'dureza', nombre: 'Dureza', unidad: 'mg/L', valor: 425, nivel: 'rojo', referencia_desde: null, referencia_hasta: 120, orientativo: false },
      { clave: 'plomo', nombre: 'Plomo', unidad: 'ppb', valor: null, nivel: 'sin_dato', referencia_desde: null, referencia_hasta: 5, orientativo: true },
    ],
    casillas_en_rango: 1,
    casillas_leidas: 2,
    bacterias: 'pendiente',
    fecha_bacterias: null,
    nota: 'Muestra del grifo de despacho.',
    medido_por: 'Técnico de Grimuca',
    ...cambios,
  };
}

const detalle: DetalleCentro = {
  tienda_id: 'llenado-el-tulipan',
  comercio_id: 'centro-demo-san-diego',
  nombre: 'Centro de llenado San Diego (comercio de demostración)',
  local: 'Centro de llenado · El Tulipán',
  direccion: 'Av. principal, local 5, El Tulipán (dato de prueba)',
  horario: 'Lunes a sábado de 7:00 a.m. a 6:00 p.m.',
  zona: 'San Diego',
  urbanizacion: 'El Tulipán',
  lat: 10.27,
  lng: -67.96,
  es_demostracion: true,
  ultima: medicion(),
  vencida: false,
  historial: [medicion(), medicion({ id: 1, fecha: '2026-10-15T14:00:00Z', bacterias: 'sin_cambio', casillas_en_rango: 2 })],
};

const cercano: CentroCercano = { ...detalle, distancia_km: 1.2 };
delete (cercano as Partial<DetalleCentro>).historial;

function enRuta(ruta: string, patron: string, elemento: JSX.Element) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path={patron} element={elemento} />
        <Route path="/centros/:tiendaId" element={<p>Página del centro</p>} />
        <Route path="/envio" element={<p>Pantalla de envío</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  window.sessionStorage.clear();
});

describe('página pública del centro', () => {
  it('publica cada casilla con su valor, su nivel frente a la referencia y todo el historial', async () => {
    simulada.centro.mockResolvedValue(detalle);
    enRuta('/centros/llenado-el-tulipan', '/centros/:tiendaId', <PaginaCentro />);

    expect(await screen.findByRole('heading', { level: 1, name: detalle.nombre })).toBeInTheDocument();
    expect(simulada.centro).toHaveBeenCalledWith('llenado-el-tulipan');
    expect(screen.getAllByText('Comercio de demostración').length).toBeGreaterThan(0);
    expect(screen.getByText(detalle.horario)).toBeInTheDocument();

    const reciente = screen.getByRole('region', { name: 'Medición más reciente' });
    expect(within(reciente).getByText('1 de 2 casillas en rango')).toBeInTheDocument();
    expect(within(reciente).getByText('En rango')).toBeInTheDocument();
    // Lo que sale fuera de rango también se publica.
    expect(within(reciente).getByText('Fuera de rango')).toBeInTheDocument();
    expect(within(reciente).getByText('425 mg/L')).toBeInTheDocument();
    expect(within(reciente).getByText('Rango de referencia: de 6,5 a 8,5.')).toBeInTheDocument();
    expect(within(reciente).getByText('Rango de referencia: hasta 120 mg/L.')).toBeInTheDocument();
    expect(within(reciente).getByText('Sin dato')).toBeInTheDocument();
    expect(within(reciente).getByText('El frasco se lee a las 48 horas.')).toBeInTheDocument();
    expect(within(reciente).getByText(/Medido por Técnico de Grimuca/)).toBeInTheDocument();

    const historial = screen.getByRole('region', { name: 'Historial de mediciones' });
    expect(within(historial).getAllByRole('listitem', { name: undefined }).length).toBeGreaterThan(0);
    expect(
      within(historial).getByText('La prueba no detectó bacterias coliformes en esta muestra. Esto no certifica el agua.'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Medición orientativa con tira, no es un análisis de laboratorio.').length).toBeGreaterThan(0);
    expect(screen.queryByText(/Medición vencida/)).not.toBeInTheDocument();
  });

  it('avisa cuando la medición está vencida', async () => {
    simulada.centro.mockResolvedValue({ ...detalle, vencida: true });
    enRuta('/centros/llenado-el-tulipan', '/centros/:tiendaId', <PaginaCentro />);
    expect(await screen.findByText('Medición vencida: tiene más de 35 días.')).toBeInTheDocument();
  });

  it('no usa palabras que califiquen el agua', async () => {
    simulada.centro.mockResolvedValue({ ...detalle, vencida: true });
    const { container } = enRuta('/centros/llenado-el-tulipan', '/centros/:tiendaId', <PaginaCentro />);
    await screen.findByRole('heading', { level: 1, name: detalle.nombre });
    // "Esto no certifica el agua" es el texto aprobado por Legal: se quita antes de buscar.
    const texto = (container.textContent ?? '').replace('Esto no certifica el agua.', '');
    expect(texto).not.toMatch(PROHIBIDAS);
  });

  it('si el centro no existe lo dice', async () => {
    simulada.centro.mockRejectedValue(new ErrorApi('El centro de llenado no existe.', 404));
    enRuta('/centros/otro', '/centros/:tiendaId', <PaginaCentro />);
    expect(await screen.findByRole('heading', { name: 'No encontramos este centro' })).toBeInTheDocument();
  });
});

describe('centro con resultados públicos más cercano', () => {
  it('muestra el primero con su distancia y enlaza a sus resultados', async () => {
    simulada.centrosCercanos.mockResolvedValue([cercano]);
    enRuta('/', '/', <CentroMasCercano consulta={{ zona: 'San Diego', urbanizacion: 'Bosqueserino' }} />);
    expect(await screen.findByText('Centro con resultados públicos más cercano')).toBeInTheDocument();
    expect(screen.getByText(/a unos 1,2 km/)).toBeInTheDocument();
    expect(screen.getByText(/1 de 2 casillas en rango/)).toBeInTheDocument();
    expect(simulada.centrosCercanos).toHaveBeenCalledWith({ hogarId: undefined, zona: 'San Diego', urbanizacion: 'Bosqueserino' });
    await userEvent.setup().click(screen.getByRole('link', { name: 'Ver sus resultados públicos' }));
    expect(await screen.findByText('Página del centro')).toBeInTheDocument();
  });

  it('sin centros cerca lo dice; si la búsqueda falla no muestra nada', async () => {
    simulada.centrosCercanos.mockResolvedValue([]);
    const { unmount } = enRuta('/', '/', <CentroMasCercano consulta={{ zona: 'Naguanagua' }} />);
    expect(await screen.findByText('Todavía no hay centros con resultados públicos cerca de ti.')).toBeInTheDocument();
    unmount();

    simulada.centrosCercanos.mockRejectedValue(new ErrorApi('Sin conexión', 0));
    const { container } = enRuta('/', '/', <CentroMasCercano consulta={{ zona: 'Naguanagua' }} />);
    await waitFor(() => expect(simulada.centrosCercanos).toHaveBeenCalledTimes(2));
    expect(container.textContent).toBe('');
  });

  it('un centro de otra zona y sin distancia no se presenta como el más cercano', () => {
    const lejos = { ...cercano, distancia_km: null, zona: 'San Diego' };
    expect(elegirCercano([lejos], 'Naguanagua')).toBeNull();
    expect(elegirCercano([lejos], 'San Diego')).toBe(lejos);
    expect(elegirCercano([cercano], null)).toBe(cercano);
  });

  it('arma el rango de referencia con los extremos que tenga', () => {
    expect(textoReferencia({ referencia_desde: 6.5, referencia_hasta: 8.5, unidad: '' })).toBe('de 6,5 a 8,5');
    expect(textoReferencia({ referencia_desde: null, referencia_hasta: 10, unidad: 'mg/L' })).toBe('hasta 10 mg/L');
    expect(textoReferencia({ referencia_desde: 0.2, referencia_hasta: null, unidad: 'mg/L' })).toBe('desde 0,2 mg/L');
    expect(textoReferencia({ referencia_desde: null, referencia_hasta: null, unidad: '' })).toBeNull();
  });
});

describe('perfil: hogar o negocio', () => {
  async function llenar(usuario: ReturnType<typeof userEvent.setup>) {
    await usuario.selectOptions(screen.getByLabelText('¿En qué zona queda?'), 'San Diego');
    for (let i = 0; i < 3; i++) await usuario.click(screen.getByRole('button', { name: 'Una persona más' }));
    await usuario.click(screen.getByLabelText(/^Botellón/));
    await usuario.click(within(screen.getByRole('group', { name: '¿El agua a veces sale turbia o amarilla?' })).getByLabelText('No'));
    await usuario.click(within(screen.getByRole('group', { name: '¿Tienen filtro ahí?' })).getByLabelText('No'));
    await usuario.type(screen.getByLabelText('Nombre'), 'Luis');
    await usuario.type(screen.getByLabelText(/^Apellido/), 'Rojas');
    await usuario.selectOptions(screen.getByLabelText('Operadora'), '0414');
    await usuario.type(screen.getByLabelText(/^Número/), '123 4567');
  }

  it('un negocio indica su rubro, ve sus propios textos y el centro más cercano a su zona', async () => {
    simulada.centrosCercanos.mockResolvedValue([cercano]);
    simulada.crearHogar.mockResolvedValue({ id: 'h-9', filtro: null });
    const usuario = userEvent.setup();
    enRuta('/perfil', '/perfil', <Perfil />);

    expect(screen.getByRole('heading', { name: 'Cuéntanos de tu casa' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Hogar/)).toBeChecked();
    await usuario.click(screen.getByLabelText(/^Negocio/));
    expect(screen.getByRole('heading', { name: 'Cuéntanos de tu negocio' })).toBeInTheDocument();
    expect(screen.getByLabelText('¿Cuántas personas toman agua ahí?')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: '¿De dónde sale el agua que toman ahí?' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: '¿Hay mascotas en casa?' })).not.toBeInTheDocument();
    await usuario.type(screen.getByLabelText(/^¿A qué se dedica\?/), 'Restaurante');

    expect(simulada.centrosCercanos).not.toHaveBeenCalled();
    await llenar(usuario);
    expect(await screen.findByText('Centro con resultados públicos más cercano')).toBeInTheDocument();
    expect(simulada.centrosCercanos).toHaveBeenLastCalledWith({ hogarId: undefined, zona: 'San Diego', urbanizacion: null });

    await usuario.click(screen.getByRole('checkbox'));
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(simulada.crearHogar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo_cliente: 'negocio', rubro: 'Restaurante', origen_agua: 'botellon', mascotas: false }),
    );
    expect(await screen.findByText('Pantalla de envío')).toBeInTheDocument();
  });

  it('un hogar va sin rubro', async () => {
    simulada.centrosCercanos.mockResolvedValue([]);
    simulada.crearHogar.mockResolvedValue({ id: 'h-10', filtro: null });
    const usuario = userEvent.setup();
    enRuta('/perfil', '/perfil', <Perfil />);
    await usuario.click(screen.getByLabelText(/^Negocio/));
    await usuario.type(screen.getByLabelText(/^¿A qué se dedica\?/), 'Oficina');
    await usuario.click(screen.getByLabelText(/^Hogar/));
    expect(screen.queryByLabelText(/^¿A qué se dedica\?/)).not.toBeInTheDocument();
    await usuario.selectOptions(screen.getByLabelText('¿En qué zona vives?'), 'Naguanagua');
    expect(await screen.findByText('Todavía no hay centros con resultados públicos cerca de ti.')).toBeInTheDocument();
    for (let i = 0; i < 2; i++) await usuario.click(screen.getByRole('button', { name: 'Una persona más' }));
    await usuario.click(screen.getByLabelText(/^Chorro/));
    await usuario.click(within(screen.getByRole('group', { name: '¿El agua a veces sale turbia o amarilla?' })).getByLabelText('No'));
    await usuario.click(within(screen.getByRole('group', { name: '¿Tienen filtro en casa?' })).getByLabelText('No'));
    await usuario.type(screen.getByLabelText('Nombre'), 'Ana');
    await usuario.type(screen.getByLabelText(/^Apellido/), 'Pérez');
    await usuario.selectOptions(screen.getByLabelText('Operadora'), '0414');
    await usuario.type(screen.getByLabelText(/^Número/), '123 4567');
    await usuario.click(screen.getByRole('checkbox'));
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(simulada.crearHogar).toHaveBeenCalledWith(expect.objectContaining({ tipo_cliente: 'hogar', rubro: null }));
  });
});
