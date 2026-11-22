import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useRoutes } from 'react-router-dom';
import type { CentroPublico, MedicionCentro, ServicioConReporte } from '../../lib/tipos';
import { ErrorApi } from '../../lib/api';
import { rutasTecnico } from './rutas';

const sesion = vi.hoisted(() => ({
  tokenTecnico: vi.fn<() => string | null>(() => 't-tec'),
  guardarTokenTecnico: vi.fn(),
}));
const api = vi.hoisted(() => ({
  tecnicoEntrar: vi.fn(),
  tecnicoServicios: vi.fn(),
  atenderServicio: vi.fn(),
  urlFotoServicio: vi.fn((id: number) => `/api/servicios/${id}/foto?token=t-tec`),
  tecnicoCentros: vi.fn(),
  medirCentro: vi.fn(),
  frascoCentro: vi.fn(),
  configTira: vi.fn(),
}));

const enVivo = vi.hoisted(() => ({
  manejadores: null as null | { pedidoNuevo?: (p: unknown) => void },
}));

vi.mock('../red/enVivo', () => ({
  escucharEventos: (_token: string, m: { pedidoNuevo?: (p: unknown) => void }) => {
    enVivo.manejadores = m;
    return () => {};
  },
}));
vi.mock('../../lib/sesion', () => sesion);
vi.mock('../../lib/api', () => ({
  api,
  BASE_API: '/api',
  ErrorApi: class ErrorApi extends Error {
    constructor(
      public mensaje: string,
      public estado: number,
    ) {
      super(mensaje);
    }
  },
}));

function servicio(id: number, c: Partial<ServicioConReporte> = {}): ServicioConReporte {
  return {
    id,
    hogar_id: `h-${id}`,
    tipo: 'servicio',
    cartucho_codigo: null,
    cantidad: 1,
    modalidad: 'envio',
    direccion: 'Av. Principal, casa 4',
    pago: 'no_aplica',
    tienda_id: 'manongo',
    estado: 'pendiente',
    fecha: '2026-11-21T13:00:00Z',
    fecha_despacho: null,
    servicio: 'cambio_cartucho',
    fecha_preferida: '2026-11-23',
    momento: 'manana',
    nota: 'Tocar el timbre dos veces',
    hogar_nombre: `Hogar ${id}`,
    zona: 'Naguanagua',
    tienda_nombre: 'Mañongo',
    comercio_nombre: 'Grimuca',
    reporte: null,
    ...c,
  };
}

function montar() {
  function Rutas() {
    return useRoutes(rutasTecnico);
  }
  render(
    <MemoryRouter initialEntries={['/tecnico']}>
      <Rutas />
    </MemoryRouter>,
  );
}

describe('/tecnico', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sesion.tokenTecnico.mockReturnValue('t-tec');
  });

  it('pide el PIN del técnico sin sesión', () => {
    sesion.tokenTecnico.mockReturnValue(null);
    montar();
    expect(screen.getByRole('heading', { name: 'Servicio técnico' })).toBeInTheDocument();
    expect(screen.getByText('Entra con tu PIN de técnico.')).toBeInTheDocument();
  });

  it('lista los servicios asignados y "Ya fui" → "Guardar reporte" llama a atenderServicio', async () => {
    const usuario = userEvent.setup();
    api.tecnicoServicios.mockResolvedValue([
      servicio(1),
      servicio(2, { servicio: 'instalacion_filtro', hogar_nombre: 'Familia Rojas' }),
      // Cerrado por la tienda desde Despacho, sin reporte del técnico: no va en Atendidos.
      servicio(3, { estado: 'despachado', fecha_despacho: '2026-11-21T15:00:00Z', hogar_nombre: 'Cerrado por la tienda' }),
    ]);
    api.atenderServicio.mockImplementation(async (id: number) =>
      servicio(id, {
        estado: 'despachado',
        reporte: { fecha_visita: '2026-11-21T16:00:00Z', nota: 'Listo', tiene_foto: false },
      }),
    );
    montar();

    const lista = await screen.findByRole('list', { name: 'Servicios pendientes' });
    expect(api.tecnicoServicios).toHaveBeenCalledWith('todos', 't-tec');
    const tarjetas = within(lista).getAllByRole('listitem');
    expect(tarjetas).toHaveLength(2);
    expect(within(tarjetas[0]).getByText('Cambio de cartucho')).toBeInTheDocument();
    expect(tarjetas[0]).toHaveTextContent('Hogar 1');
    expect(tarjetas[0]).toHaveTextContent('Naguanagua · Av. Principal, casa 4');
    expect(tarjetas[0]).toHaveTextContent('Tocar el timbre dos veces');
    expect(tarjetas[0]).toHaveTextContent('Mañongo');
    expect(tarjetas[1]).toHaveTextContent('Instalación de filtro');
    expect(screen.getByText('Técnico')).toBeInTheDocument();

    await usuario.click(within(tarjetas[0]).getByRole('button', { name: /Ya fui/ }));
    expect(screen.getByLabelText('Sube una foto de cómo quedó')).toHaveAttribute('capture', 'environment');
    expect(screen.getByText('Sin foto no queda evidencia del trabajo.')).toBeInTheDocument();
    await usuario.type(screen.getByLabelText(/Nota/), 'Cambié el cartucho de sedimentos');
    await usuario.click(screen.getByRole('button', { name: 'Guardar reporte' }));

    expect(api.atenderServicio).toHaveBeenCalledWith(1, { foto: null, nota: 'Cambié el cartucho de sedimentos' }, 't-tec');
    const atendidos = await screen.findByRole('list', { name: 'Servicios atendidos' });
    expect(atendidos).toHaveTextContent('Hogar 1');
    expect(screen.getByRole('button', { name: 'Pendientes (1)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Atendidos (1)' })).toHaveAttribute('aria-pressed', 'true');
    expect(atendidos).not.toHaveTextContent('Cerrado por la tienda');
  });

  it('cada pendiente muestra su parada de la ruta y "Cómo llegar", en el orden de la ruta', async () => {
    api.tecnicoServicios.mockResolvedValue([
      servicio(1, { orden_ruta: 2, destino_ruta: { lat: 10.26, lng: -68.022 }, hogar_nombre: 'Segundo' }),
      servicio(2, { orden_ruta: 1, destino_ruta: { lat: 10.245, lng: -68.007 }, hogar_nombre: 'Primero' }),
    ]);
    montar();
    const lista = await screen.findByRole('list', { name: 'Servicios pendientes' });
    const tarjetas = within(lista).getAllByRole('listitem');
    expect(within(tarjetas[0]).getByText('Parada 1')).toBeInTheDocument();
    expect(within(tarjetas[0]).getByText('Primero')).toBeInTheDocument();
    expect(within(tarjetas[0]).getByRole('link', { name: /Cómo llegar/ })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=10.245,-68.007',
    );
    expect(within(tarjetas[1]).getByText('Parada 2')).toBeInTheDocument();
  });

  it('un servicio que llega en vivo vuelve a pedir la lista y sale en el orden de la ruta, con su parada', async () => {
    api.tecnicoServicios.mockResolvedValueOnce([
      servicio(1, { orden_ruta: 1, destino_ruta: { lat: 10.245, lng: -68.007 }, hogar_nombre: 'Primero' }),
      servicio(2, { orden_ruta: 2, destino_ruta: { lat: 10.26, lng: -68.022 }, hogar_nombre: 'Tercero' }),
    ]);
    montar();
    await screen.findByText('Tercero');
    expect(api.tecnicoServicios).toHaveBeenCalledTimes(1);

    // La API ya devuelve el nuevo en medio de la ruta, como Parada 2.
    api.tecnicoServicios.mockResolvedValueOnce([
      servicio(1, { orden_ruta: 1, destino_ruta: { lat: 10.245, lng: -68.007 }, hogar_nombre: 'Primero' }),
      servicio(9, { orden_ruta: 2, destino_ruta: { lat: 10.25, lng: -68.01 }, hogar_nombre: 'En vivo' }),
      servicio(2, { orden_ruta: 3, destino_ruta: { lat: 10.26, lng: -68.022 }, hogar_nombre: 'Tercero' }),
    ]);
    act(() => enVivo.manejadores?.pedidoNuevo?.(servicio(9, { hogar_nombre: 'En vivo' })));

    expect(await screen.findByText('Servicio nuevo')).toBeInTheDocument();
    await waitFor(() => expect(within(screen.getByRole('list', { name: 'Servicios pendientes' })).getAllByRole('listitem')).toHaveLength(3));
    expect(api.tecnicoServicios).toHaveBeenCalledTimes(2);
    const tarjetas = within(screen.getByRole('list', { name: 'Servicios pendientes' })).getAllByRole('listitem');
    expect(tarjetas.map((t) => within(t).getByText(/Primero|En vivo|Tercero/).textContent)).toEqual(['Primero', 'En vivo', 'Tercero']);
    expect(within(tarjetas[1]).getByText('Parada 2')).toBeInTheDocument();
    expect(within(tarjetas[1]).getByRole('link', { name: /Cómo llegar/ })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=10.25,-68.01',
    );
  });

  it('sin servicios muestra el estado vacío; si falla, ofrece reintentar', async () => {
    const usuario = userEvent.setup();
    api.tecnicoServicios.mockRejectedValueOnce(new Error('red')).mockResolvedValueOnce([]);
    montar();
    await usuario.click(await screen.findByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('No tienes servicios pendientes.')).toBeInTheDocument();
  });
});

function medicionCentro(c: Partial<MedicionCentro> = {}): MedicionCentro {
  return {
    id: 7,
    tienda_id: 'llenado-el-tulipan',
    fecha: '2026-11-21T14:00:00Z',
    casillas: [
      { clave: 'ph', nombre: 'pH', unidad: '', valor: 7.2, nivel: 'verde', referencia_desde: 6.5, referencia_hasta: 8.5, orientativo: false },
      { clave: 'dureza', nombre: 'Dureza', unidad: 'mg/L', valor: 425, nivel: 'rojo', referencia_desde: null, referencia_hasta: 120, orientativo: false },
    ],
    casillas_en_rango: 1,
    casillas_leidas: 2,
    bacterias: 'pendiente',
    fecha_bacterias: null,
    nota: null,
    medido_por: 'Técnico de Grimuca',
    ...c,
  };
}

function centro(c: Partial<CentroPublico> = {}): CentroPublico {
  return {
    tienda_id: 'llenado-el-naranjal',
    comercio_id: 'centro-demo-naguanagua',
    nombre: 'Centro de llenado Naguanagua',
    local: 'Centro de llenado · El Naranjal',
    direccion: null,
    horario: 'Todos los días',
    zona: 'Naguanagua',
    urbanizacion: 'El Naranjal',
    lat: 10.268,
    lng: -68.027,
    es_demostracion: true,
    ultima: null,
    vencida: true,
    ...c,
  };
}

describe('/tecnico · centros de llenado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sesion.tokenTecnico.mockReturnValue('t-tec');
    api.tecnicoServicios.mockResolvedValue([]);
    api.configTira.mockResolvedValue([
      { clave: 'ph', nombre: 'pH', unidad: '', niveles: [6.2, 6.8, 7.2, 7.6, 8.4], orientativo: false },
      { clave: 'dureza', nombre: 'Dureza', unidad: 'mg/L', niveles: [0, 50, 120, 250, 425], orientativo: false },
    ]);
  });

  it('la lista de servicios sigue primero y los centros se cargan al abrir su pestaña', async () => {
    montar();
    expect(await screen.findByText('No tienes servicios pendientes.')).toBeInTheDocument();
    expect(api.tecnicoCentros).not.toHaveBeenCalled();
  });

  it('mide un centro y publica la medición tal cual, con el enlace a su página pública', async () => {
    const usuario = userEvent.setup();
    api.tecnicoCentros.mockResolvedValue([centro()]);
    api.medirCentro.mockResolvedValue(
      medicionCentro({ tienda_id: 'llenado-el-naranjal', casillas_en_rango: 1, casillas_leidas: 2 }),
    );
    montar();
    await usuario.click(await screen.findByRole('button', { name: 'Centros de llenado' }));

    const lista = await screen.findByRole('list', { name: 'Centros de llenado' });
    expect(api.tecnicoCentros).toHaveBeenCalledWith('t-tec');
    expect(lista).toHaveTextContent('Sin medición');
    expect(within(lista).getByText('Toca medir')).toBeInTheDocument();

    await usuario.click(within(lista).getByRole('button', { name: /Medir/ }));
    expect(await screen.findByRole('heading', { name: 'Medición del grifo de despacho' })).toBeInTheDocument();
    expect(screen.getByText('Se publica tal cual, también lo que salga fuera de rango.')).toBeInTheDocument();
    await usuario.selectOptions(screen.getByLabelText('pH'), '7.2');
    await usuario.selectOptions(screen.getByLabelText('Dureza (mg/L)'), '425');
    await usuario.type(screen.getByLabelText(/Nota/), 'Grifo de despacho');
    await usuario.click(screen.getByRole('button', { name: 'Publicar medición' }));

    expect(api.medirCentro).toHaveBeenCalledWith(
      'llenado-el-naranjal',
      { valores: { ph: 7.2, dureza: 425 }, nota: 'Grifo de despacho' },
      't-tec',
    );
    expect((await screen.findAllByText(/1 de 2 casillas en rango/)).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Ver la página pública' })).toHaveAttribute('href', '/centros/llenado-el-naranjal');
    expect(screen.getByText('Medición orientativa con tira, no es un análisis de laboratorio.')).toBeInTheDocument();
    expect(screen.getByText(/Dureza: 425 mg\/L · Fuera de rango/)).toBeInTheDocument();
  });

  it('no publica una medición sin casillas', async () => {
    const usuario = userEvent.setup();
    api.tecnicoCentros.mockResolvedValue([centro()]);
    montar();
    await usuario.click(await screen.findByRole('button', { name: 'Centros de llenado' }));
    await usuario.click(await screen.findByRole('button', { name: /Medir/ }));
    await usuario.click(await screen.findByRole('button', { name: 'Publicar medición' }));
    expect(await screen.findByText('Carga al menos una casilla de la tira.')).toBeInTheDocument();
    expect(api.medirCentro).not.toHaveBeenCalled();
  });

  it('anota el frasco pendiente y muestra el mensaje si ya estaba anotado', async () => {
    const usuario = userEvent.setup();
    const pendiente = medicionCentro();
    api.tecnicoCentros.mockResolvedValue([centro({ tienda_id: 'llenado-el-tulipan', ultima: pendiente, vencida: false })]);
    api.frascoCentro.mockRejectedValueOnce(new ErrorApi('El resultado del frasco ya está publicado y no se cambia.', 409));
    api.frascoCentro.mockResolvedValueOnce({ ...pendiente, bacterias: 'sin_cambio' });
    montar();
    await usuario.click(await screen.findByRole('button', { name: 'Centros de llenado' }));

    await usuario.click(await screen.findByRole('button', { name: 'El frasco sigue igual' }));
    expect(api.frascoCentro).toHaveBeenCalledWith(7, 'sin_cambio', 't-tec');
    expect(await screen.findByText('El resultado del frasco ya está publicado y no se cambia.')).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'El frasco sigue igual' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'El frasco sigue igual' })).not.toBeInTheDocument());
    expect(screen.getByText('Medición vigente')).toBeInTheDocument();
  });
});
