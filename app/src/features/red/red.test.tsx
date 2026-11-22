import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useRoutes } from 'react-router-dom';
import type { ComercioEnRed, ResumenRed } from '../../lib/tipos';
import { rutasRed } from './rutas';

const sesion = vi.hoisted(() => ({
  tokenRed: vi.fn<() => string | null>(() => 't-red'),
  guardarTokenRed: vi.fn(),
}));
const api = vi.hoisted(() => ({
  redEntrar: vi.fn(),
  redResumen: vi.fn(),
  crearComercio: vi.fn(),
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

function comercio(c: Partial<ComercioEnRed> & Pick<ComercioEnRed, 'id' | 'nombre'>): ComercioEnRed {
  return {
    estado_pais: 'Carabobo',
    ciudad: 'Valencia',
    plan: 'basico',
    membresia_usd: null,
    fecha_alta: '2026-01-01T12:00:00Z',
    fin_periodo_gratis: null,
    activo: true,
    es_demostracion: false,
    tiendas: 1,
    hogares: 0,
    mediciones_mes: 0,
    pedidos_pendientes: 0,
    pedidos_mes: 0,
    productos_propios: 0,
    estado_membresia: 'activa',
    dias_gratis_restantes: null,
    ...c,
  };
}

const RESUMEN: ResumenRed = {
  comercios: [
    comercio({
      id: 'aliado-lara',
      nombre: 'Ferretería El Tunal (comercio de demostración)',
      estado_pais: 'Lara',
      ciudad: 'Barquisimeto',
      fecha_alta: '2026-11-01T12:00:00Z',
      es_demostracion: true,
      estado_membresia: 'periodo_gratis',
      dias_gratis_restantes: 70,
      hogares: 6,
      pedidos_pendientes: 3,
    }),
    comercio({ id: 'grimuca', nombre: 'Grimuca', plan: 'premium', fecha_alta: '2026-11-15T12:00:00Z', tiendas: 3, hogares: 30 }),
    comercio({
      id: 'aliado-aragua',
      nombre: 'Ferretería Maracay (comercio de demostración)',
      estado_pais: 'Aragua',
      ciudad: 'Maracay',
      fecha_alta: '2026-11-10T12:00:00Z',
      es_demostracion: true,
      estado_membresia: 'vencida',
    }),
  ],
  totales: { comercios: 3, estados_cubiertos: 3, tiendas: 5, hogares: 40, mediciones_mes: 12, pedidos_mes: 9, pedidos_pendientes: 5 },
};

function montar(ruta = '/red') {
  function Rutas() {
    return useRoutes(rutasRed);
  }
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Rutas />
    </MemoryRouter>,
  );
}

describe('/red', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sesion.tokenRed.mockReturnValue('t-red');
    api.redResumen.mockResolvedValue(RESUMEN);
  });

  it('pide el PIN de administración sin sesión', () => {
    sesion.tokenRed.mockReturnValue(null);
    montar();
    expect(screen.getByRole('heading', { name: 'Red Grimuca Agua' })).toBeInTheDocument();
    expect(screen.getByText('Entra con el PIN de administración.')).toBeInTheDocument();
  });

  it('lista los comercios con Grimuca primero, su membresía y la cobertura por estado', async () => {
    montar();
    const tabla = await screen.findByRole('table', { name: 'Comercios de la red' });
    const filas = within(tabla).getAllByRole('row').slice(1);
    expect(filas[0]).toHaveTextContent('Grimuca');
    expect(filas[0]).toHaveTextContent('Premium');
    expect(filas[1]).toHaveTextContent('Periodo gratis: quedan 70 días');
    expect(within(filas[1]).getByText('Demostración')).toBeInTheDocument();
    expect(filas[2]).toHaveTextContent('Vencida');
    expect(screen.getByText('Red de comercios')).toBeInTheDocument();

    const cifras = screen.getByLabelText('Cifras de la red');
    expect(within(cifras).getByText('Comercios en la red').closest('div')).toHaveTextContent('3');
    expect(within(cifras).getByText('Pedidos del mes').closest('div')).toHaveTextContent('9');

    expect(screen.getByText('Con una ferretería por estado, ese estado queda cubierto.')).toBeInTheDocument();
    expect(screen.getByText('Membresía y cobros: fuera de esta demostración.')).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/\$\s?\d/);
  });

  it('da de alta un comercio y aparece en la lista sin recargar', async () => {
    const usuario = userEvent.setup();
    api.crearComercio.mockResolvedValue(
      comercio({
        id: 'ferre-zulia',
        nombre: 'Ferretería del Lago',
        estado_pais: 'Zulia',
        ciudad: 'Maracaibo',
        fecha_alta: '2026-11-21T12:00:00Z',
        fin_periodo_gratis: '2027-02-21',
        estado_membresia: 'periodo_gratis',
        dias_gratis_restantes: 92,
      }),
    );
    montar();
    await screen.findByRole('table', { name: 'Comercios de la red' });

    await usuario.click(screen.getByRole('button', { name: 'Dar de alta' }));
    expect(screen.getByText('Escribe el nombre del comercio.')).toBeInTheDocument();
    expect(api.crearComercio).not.toHaveBeenCalled();

    await usuario.type(screen.getByLabelText('Nombre del comercio'), 'Ferretería del Lago');
    await usuario.selectOptions(screen.getByLabelText('Estado'), 'Zulia');
    await usuario.type(screen.getByLabelText('Ciudad'), 'Maracaibo');
    await usuario.selectOptions(screen.getByLabelText('Meses gratis'), '3');
    await usuario.type(screen.getByLabelText('Nombre de su primera tienda'), 'Del Lago Centro');
    await usuario.click(screen.getByRole('button', { name: 'Dar de alta' }));

    expect(api.crearComercio).toHaveBeenCalledWith(
      {
        nombre: 'Ferretería del Lago',
        estado_pais: 'Zulia',
        ciudad: 'Maracaibo',
        plan: 'basico',
        meses_gratis: 3,
        tienda_nombre: 'Del Lago Centro',
        tienda_direccion: null,
      },
      't-red',
    );
    expect(await screen.findByText('Comercio dado de alta. Periodo gratis hasta el 21 de febrero de 2027.')).toBeInTheDocument();
    const tabla = screen.getByRole('table', { name: 'Comercios de la red' });
    expect(within(tabla).getByText('Ferretería del Lago')).toBeInTheDocument();
    expect(within(screen.getByLabelText('Cifras de la red')).getByText('Comercios en la red').closest('div')).toHaveTextContent('4');
    expect(screen.getByText(/Zulia:/).closest('li')).toHaveTextContent('Ferretería del Lago');
  });

  it('/modulos muestra los cuatro módulos con su dirección', () => {
    montar('/modulos');
    expect(screen.getByRole('link', { name: /^Cliente:/ })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /^Comercio:/ })).toHaveAttribute('href', '/comercio');
    expect(screen.getByRole('link', { name: /^Técnico:/ })).toHaveAttribute('href', '/tecnico');
    expect(screen.getByRole('link', { name: /^Red:/ })).toHaveAttribute('href', '/red');
  });
});
