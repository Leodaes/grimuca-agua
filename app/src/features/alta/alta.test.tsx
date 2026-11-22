import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/api', () => ({
  api: {
    crearHogar: vi.fn(),
    obtenerHogar: vi.fn(),
    actualizarHogar: vi.fn(),
    tiendas: vi.fn(),
    crearPedido: vi.fn(),
    medicionesDeHogar: vi.fn(),
  },
}));

vi.mock('../../lib/sesion', () => ({
  hogarId: vi.fn(() => null),
  guardarHogarId: vi.fn(),
}));

import { api } from '../../lib/api';
import { guardarHogarId, hogarId } from '../../lib/sesion';
import { Marco } from '../../Marco';
import { Bienvenida } from './Bienvenida';
import { Envio } from './Envio';
import { Pago } from './Pago';
import { Perfil } from './Perfil';

const simulada = api as unknown as Record<string, ReturnType<typeof vi.fn>>;

const hogar = {
  id: 'h-1',
  nombre: 'Ana',
  zona: 'Naguanagua',
  origen_agua: 'chorro',
  personas: 4,
  tiene_filtro: false,
  etapas_filtro: null,
  fecha_ultimo_cambio: null,
  agua_turbia: false,
  whatsapp: '04141234567',
  direccion: 'Urb. Mañongo, calle 3, casa 12',
  tienda_id: 'manongo',
  consentimiento_fecha: '2026-11-21T10:00:00Z',
};

function enRuta(ruta: string, elemento: JSX.Element) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path={ruta.split('?')[0]} element={elemento} />
        <Route path="/envio" element={<p>Pantalla de envío</p>} />
        <Route path="/medir" element={<p>Pantalla de medir</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function llenarPerfil(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.type(screen.getByLabelText('¿Cómo te llamas?'), 'Ana');
  await usuario.selectOptions(screen.getByLabelText('¿En qué zona vives?'), 'Naguanagua');
  await usuario.click(screen.getByLabelText(/^Chorro/));
  await usuario.type(screen.getByLabelText('¿Cuántos viven en la casa?'), '4');
  const filtro = screen.getByRole('group', { name: '¿Tienen filtro en casa?' });
  await usuario.click(within(filtro).getByLabelText('No'));
  const turbia = screen.getByRole('group', { name: '¿El agua a veces sale turbia o amarilla?' });
  await usuario.click(within(turbia).getByLabelText('No'));
  await usuario.type(screen.getByLabelText('Tu WhatsApp'), '0414 123 4567');
}

describe('alta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hogarId).mockReturnValue(null);
  });

  it('el perfil no se envía sin consentimiento', async () => {
    const usuario = userEvent.setup();
    enRuta('/perfil', <Perfil />);
    await llenarPerfil(usuario);
    expect(screen.getByRole('checkbox')).not.toBeChecked();

    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(simulada.crearHogar).not.toHaveBeenCalled();
    expect(screen.getByText('Marca la casilla para poder seguir.')).toBeInTheDocument();
  });

  it('con consentimiento crea el hogar, lo guarda y va a envío', async () => {
    simulada.crearHogar.mockResolvedValue(hogar);
    const usuario = userEvent.setup();
    enRuta('/perfil', <Perfil />);
    await llenarPerfil(usuario);
    await usuario.click(screen.getByRole('checkbox'));
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(simulada.crearHogar).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Ana',
        zona: 'Naguanagua',
        origen_agua: 'chorro',
        personas: 4,
        tiene_filtro: false,
        whatsapp: '+584141234567',
        consentimiento: true,
      }),
    );
    expect(guardarHogarId).toHaveBeenCalledWith('h-1');
    expect(await screen.findByText('Pantalla de envío')).toBeInTheDocument();
  });

  it('con ?ya=1 el perfil va directo a medir', async () => {
    simulada.crearHogar.mockResolvedValue(hogar);
    const usuario = userEvent.setup();
    enRuta('/perfil?ya=1', <Perfil />);
    await llenarPerfil(usuario);
    await usuario.click(screen.getByRole('checkbox'));
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(await screen.findByText('Pantalla de medir')).toBeInTheDocument();
  });

  it('con filtro no pregunta las etapas y lleva a la foto del filtro antes de seguir', async () => {
    simulada.crearHogar.mockResolvedValue({ ...hogar, tiene_filtro: true, filtro: null });
    const usuario = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/perfil?ya=1']}>
        <Routes>
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/mi-filtro" element={<p>Pantalla de mi filtro</p>} />
        </Routes>
      </MemoryRouter>,
    );
    await llenarPerfil(usuario);
    await usuario.click(within(screen.getByRole('group', { name: '¿Tienen filtro en casa?' })).getByLabelText('Sí'));
    expect(screen.queryByLabelText(/etapas/)).not.toBeInTheDocument();
    expect(screen.getByText('En el siguiente paso le tomas una foto a tu filtro y lo identificamos.')).toBeInTheDocument();
    await usuario.click(within(screen.getByRole('group', { name: '¿Cuándo cambiaste el cartucho por última vez?' })).getByLabelText('No me acuerdo'));
    await usuario.click(screen.getByRole('checkbox'));
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(await screen.findByText('Pantalla de mi filtro')).toBeInTheDocument();
    expect(simulada.crearHogar).toHaveBeenCalledWith(expect.objectContaining({ tiene_filtro: true }));
  });

  it.each([
    ['Hace menos de un mes', 'menos_de_un_mes'],
    ['Hace más de tres meses', 'mas_de_tres_meses'],
    ['No me acuerdo', 'no_me_acuerdo'],
  ])('con filtro, "%s" se guarda como %s (sin campo de fecha)', async (etiqueta, valor) => {
    simulada.crearHogar.mockResolvedValue({ ...hogar, tiene_filtro: true, filtro: null });
    const usuario = userEvent.setup();
    enRuta('/perfil', <Perfil />);
    await llenarPerfil(usuario);
    expect(screen.queryByRole('group', { name: '¿Cuándo cambiaste el cartucho por última vez?' })).not.toBeInTheDocument();
    await usuario.click(within(screen.getByRole('group', { name: '¿Tienen filtro en casa?' })).getByLabelText('Sí'));
    const grupo = screen.getByRole('group', { name: '¿Cuándo cambiaste el cartucho por última vez?' });
    expect(within(grupo).getAllByRole('radio').map((r) => r.closest('label')?.textContent)).toEqual([
      'Hace menos de un mes',
      'Hace más de tres meses',
      'No me acuerdo',
    ]);
    expect(document.querySelector('input[type="date"]')).toBeNull();

    await usuario.click(screen.getByRole('checkbox'));
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByText('Elige una opción.')).toBeInTheDocument();
    expect(simulada.crearHogar).not.toHaveBeenCalled();

    await usuario.click(within(grupo).getByLabelText(etiqueta));
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(simulada.crearHogar).toHaveBeenCalledWith(expect.objectContaining({ tiene_filtro: true, ultimo_cambio: valor }));
    expect(simulada.crearHogar.mock.calls[0][0]).not.toHaveProperty('fecha_ultimo_cambio');
  });

  it('WhatsApp: código de país, formato al salir del campo y error claro', async () => {
    const usuario = userEvent.setup();
    enRuta('/perfil', <Perfil />);
    const codigo = screen.getByLabelText('Código de país') as HTMLSelectElement;
    expect(codigo.value).toBe('58');
    expect([...codigo.options].map((o) => o.textContent)).toContain('+58 Venezuela');
    expect([...codigo.options]).toHaveLength(10);
    const campo = screen.getByLabelText('Tu WhatsApp') as HTMLInputElement;
    expect(campo).toHaveAttribute('inputmode', 'tel');
    expect(campo).toHaveAttribute('autocomplete', 'tel-national');

    await usuario.type(campo, '+58 414-555.01(99)');
    await usuario.tab();
    expect(campo.value).toBe('0414 555 01 99');

    await usuario.clear(campo);
    await usuario.type(campo, '0212 555 0199');
    await usuario.tab();
    expect(screen.getByText('Revisa el número: debe ser un celular, por ejemplo 0414 555 01 99')).toBeInTheDocument();

    await usuario.clear(campo);
    await usuario.type(campo, '+57 300 123 4567');
    await usuario.tab();
    expect(codigo.value).toBe('57');
    expect(campo.value).toBe('3001234567');
  });

  it('urbanización según la zona y mascotas: se guardan con el perfil', async () => {
    simulada.crearHogar.mockResolvedValue(hogar);
    const usuario = userEvent.setup();
    enRuta('/perfil', <Perfil />);
    await llenarPerfil(usuario);
    const urbanizacion = screen.getByLabelText(/^Urbanización/) as HTMLSelectElement;
    const opciones = [...urbanizacion.options].map((o) => o.value).filter(Boolean);
    expect(opciones).toContain('El Retobo');
    expect(opciones).not.toContain('Trigal Norte');
    expect(opciones[opciones.length - 1]).toBe('Otra');
    await usuario.selectOptions(urbanizacion, 'El Retobo');

    const mascotas = screen.getByRole('group', { name: '¿Hay mascotas en casa?' });
    expect(within(mascotas).getByLabelText('No')).toBeChecked();
    expect(screen.getByText('Ellas también toman de esa agua.')).toBeInTheDocument();
    await usuario.click(within(mascotas).getByLabelText('Sí'));

    await usuario.click(screen.getByRole('checkbox'));
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(simulada.crearHogar).toHaveBeenCalledWith(
      expect.objectContaining({ zona: 'Naguanagua', urbanizacion: 'El Retobo', mascotas: true }),
    );
  });

  it('en Valencia sur la urbanización solo ofrece "Otra"', async () => {
    const usuario = userEvent.setup();
    enRuta('/perfil', <Perfil />);
    await usuario.selectOptions(screen.getByLabelText('¿En qué zona vives?'), 'Valencia sur');
    const urbanizacion = screen.getByLabelText(/^Urbanización/) as HTMLSelectElement;
    expect([...urbanizacion.options].map((o) => o.value).filter(Boolean)).toEqual(['Otra']);
  });

  it('si falla el guardado, el botón conserva su nombre', async () => {
    simulada.crearHogar.mockRejectedValue({ mensaje: 'No se pudo guardar.' });
    const usuario = userEvent.setup();
    enRuta('/perfil', <Perfil />);
    await llenarPerfil(usuario);
    await usuario.click(screen.getByRole('checkbox'));
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(await screen.findByText('No se pudo guardar.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument();
  });

  it('el pago crea un pedido de tipo sobre', async () => {
    vi.mocked(hogarId).mockReturnValue('h-1');
    simulada.obtenerHogar.mockResolvedValue(hogar);
    simulada.tiendas.mockResolvedValue([
      { id: 'manongo', nombre: 'Grimuca Mañongo', horario: '8 a 5', direccion: null },
    ]);
    simulada.crearPedido.mockResolvedValue({ id: 42, tipo: 'sobre' });
    const usuario = userEvent.setup();
    enRuta('/pago', <Pago />);

    await usuario.click(await screen.findByRole('button', { name: 'Simular pago de $9' }));

    expect(simulada.crearPedido).toHaveBeenCalledWith({
      hogar_id: 'h-1',
      tipo: 'sobre',
      modalidad: 'envio',
      direccion: hogar.direccion,
      tienda_id: 'manongo',
    });
    expect(await screen.findByText('Pago simulado registrado. No se hizo ningún cobro.')).toBeInTheDocument();
    expect(screen.getByText(/Pedido N\.º 42/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ya me llegó el sobre/ })).toHaveAttribute('href', '/medir');
    // El título no lleva el nombre del hogar (va en el cuerpo).
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Listo. Tu sobre está pedido.');
    expect(screen.getByText('Gracias, Ana.')).toBeInTheDocument();
    expect(screen.getByText('Cuando el pedido salga de la tienda, su estado cambia a Despachado en la app.')).toBeInTheDocument();
  });

  it('el pago muestra el paso 3 de 3 y la ilustración del sobre (sin la foto de campaña)', async () => {
    vi.mocked(hogarId).mockReturnValue('h-1');
    simulada.obtenerHogar.mockResolvedValue(hogar);
    simulada.tiendas.mockResolvedValue([]);
    enRuta('/pago', <Pago />);
    expect(await screen.findByRole('img', { name: /El sobre de medición con la tira/ })).toBeInTheDocument();
    expect(screen.getByText('Paso 3 de 3: tu sobre')).toBeInTheDocument();
    expect(document.querySelector('img[src="/promo/sobre.jpg"]')).toBeNull();
  });
});

describe('indicador de pasos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hogarId).mockReturnValue(null);
  });

  it('perfil: paso 1 de 3 al pedir el sobre y 1 de 2 con ?ya=1', () => {
    const { unmount } = enRuta('/perfil', <Perfil />);
    expect(screen.getByText('Paso 1 de 3: tu casa')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Avance' }).querySelector('[aria-current="step"]')).not.toBeNull();
    unmount();
    enRuta('/perfil?ya=1', <Perfil />);
    expect(screen.getByText('Paso 1 de 2: tu casa')).toBeInTheDocument();
  });

  it('envío: paso 2 de 3', async () => {
    vi.mocked(hogarId).mockReturnValue('h-1');
    simulada.obtenerHogar.mockResolvedValue(hogar);
    simulada.tiendas.mockResolvedValue([]);
    enRuta('/envio', <Envio />);
    expect(await screen.findByRole('button', { name: 'Continuar al pago' })).toBeInTheDocument();
    expect(screen.getByText('Paso 2 de 3: a dónde va')).toBeInTheDocument();
  });
});

describe('portada', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hogarId).mockReturnValue(null);
  });

  function portada(ruta = '/') {
    return render(
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route element={<Marco />}>
            <Route path="/" element={<Bienvenida />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
  }

  function hero() {
    return within(screen.getByRole('region', { name: /Saber qué tomas empieza en casa/ }));
  }

  it('sin hogar: página de venta con el lema, el título original y los dos caminos', () => {
    portada();
    const titulo = screen.getByRole('heading', { level: 1 });
    expect(titulo).toHaveTextContent('Descubre la calidad del agua de tu casa');
    expect(titulo).toHaveTextContent('Saber qué tomas empieza en casa');
    expect(screen.getAllByText('Medición orientativa con tira. No es un análisis de laboratorio.').length).toBeGreaterThan(0);

    const pedir = hero().getByRole('link', { name: 'Pedir el sobre a domicilio ($9)' });
    const ya = hero().getByRole('link', { name: 'Ya tengo mi sobre' });
    expect(pedir).toHaveAttribute('href', '/perfil');
    expect(pedir).toHaveClass('g-boton--primario');
    expect(ya).toHaveAttribute('href', '/perfil?ya=1');
    expect(ya).not.toHaveClass('g-boton--primario');

    // Sin barra de navegación: en su lugar, la barra fija de compra.
    expect(screen.queryByRole('navigation', { name: 'Navegación principal' })).not.toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Comprar el sobre' })).toBeInTheDocument();
    expect(simulada.medicionesDeHogar).not.toHaveBeenCalled();
  });

  it('sin hogar: muestra las cifras de botellones, el sobre, la muestra del resultado y las dudas', () => {
    portada();
    expect(screen.getByRole('heading', { name: '¿Cuánto se te va en botellones?' })).toBeInTheDocument();
    expect(screen.getByText('Hasta $576')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Qué trae el sobre' })).toBeInTheDocument();
    expect(screen.getByText('Ejemplo')).toBeInTheDocument();
    expect(screen.getByText('¿Es difícil hacer la prueba?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Aviso de privacidad' })).toHaveAttribute('href', '/privacidad');
    expect(document.body.textContent ?? '').not.toMatch(/potable|vive tranquilo/i);
  });

  it('con ?sobre=1 el botón principal pasa a ser "Ya tengo mi sobre"', () => {
    portada('/?sobre=1');
    expect(hero().getByRole('link', { name: 'Ya tengo mi sobre' })).toHaveClass('g-boton--primario');
    expect(hero().getByRole('link', { name: 'Pedir el sobre a domicilio ($9)' })).not.toHaveClass('g-boton--primario');
  });

  it('con hogar: tablero con saludo, último resultado y accesos, y la barra de navegación', async () => {
    vi.mocked(hogarId).mockReturnValue('h-1');
    simulada.obtenerHogar.mockResolvedValue(hogar);
    simulada.medicionesDeHogar.mockResolvedValue([
      {
        id: 'm-7',
        hogar_id: 'h-1',
        fecha: '2026-11-20T10:00:00Z',
        origen: 'foto',
        valores: {},
        evaluacion: { semaforo: 'amarillo', porParametro: [], hallazgos: [], corrige: [], diasParaRecambio: null },
        sugeridos: [],
      },
    ]);
    portada();
    expect(await screen.findByRole('heading', { level: 1, name: 'Hola, Ana' })).toBeInTheDocument();
    expect(await screen.findByText('Amarillo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver el detalle/ })).toHaveAttribute('href', '/resultado/m-7');
    expect(screen.getByRole('link', { name: 'Medir mi agua' })).toHaveAttribute('href', '/medir');
    for (const nombre of [
      'Ver mis resultados',
      'Mi filtro',
      'Productos de la tienda',
      'Tutoriales para cambiar tu cartucho',
      'Pedir el sobre a domicilio ($9)',
    ]) {
      expect(screen.getByRole('link', { name: nombre })).toBeInTheDocument();
    }
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'Comprar el sobre' })).not.toBeInTheDocument();
  });

  it('con hogar y sin mediciones: "Aún no has medido"', async () => {
    vi.mocked(hogarId).mockReturnValue('h-1');
    simulada.obtenerHogar.mockResolvedValue(hogar);
    simulada.medicionesDeHogar.mockResolvedValue([]);
    portada();
    expect(await screen.findByText('Aún no has medido')).toBeInTheDocument();
  });
});
