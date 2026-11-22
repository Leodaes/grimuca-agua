import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useRoutes } from 'react-router-dom';
import type { ServicioConReporte } from '../../lib/tipos';
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
  });

  it('sin servicios muestra el estado vacío; si falla, ofrece reintentar', async () => {
    const usuario = userEvent.setup();
    api.tecnicoServicios.mockRejectedValueOnce(new Error('red')).mockResolvedValueOnce([]);
    montar();
    await usuario.click(await screen.findByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('No tienes servicios pendientes.')).toBeInTheDocument();
  });
});
