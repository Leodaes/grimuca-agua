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
        tipo: 'ferreteria',
        urbanizacion: null,
      },
      't-red',
    );
    expect(await screen.findByText('Comercio dado de alta. Periodo gratis hasta el 21 de febrero de 2027.')).toBeInTheDocument();
    const tabla = screen.getByRole('table', { name: 'Comercios de la red' });
    expect(within(tabla).getByText('Ferretería del Lago')).toBeInTheDocument();
    expect(within(screen.getByLabelText('Cifras de la red')).getByText('Comercios en la red').closest('div')).toHaveTextContent('4');
    expect(screen.getByText(/Zulia:/).closest('li')).toHaveTextContent('Ferretería del Lago');
  });

  it('marca los centros de llenado con la fecha de su última medición; las ferreterías se ven igual', async () => {
    api.redResumen.mockResolvedValue({
      ...RESUMEN,
      comercios: [
        ...RESUMEN.comercios,
        comercio({
          id: 'centro-naranjal',
          nombre: 'Centro de llenado El Naranjal',
          tipo: 'centro_llenado',
          ciudad: 'Naguanagua',
          fecha_alta: '2026-11-18T12:00:00Z',
          ultima_medicion_centro: '2026-11-12T15:00:00Z',
        }),
        comercio({
          id: 'centro-tulipan',
          nombre: 'Centro de llenado El Tulipán',
          tipo: 'centro_llenado',
          ciudad: 'San Diego',
          fecha_alta: '2026-11-19T12:00:00Z',
          ultima_medicion_centro: null,
        }),
      ],
    });
    montar();
    const tabla = await screen.findByRole('table', { name: 'Comercios de la red' });
    const fila = (texto: string) => within(tabla).getByText(texto).closest('tr') as HTMLElement;
    expect(within(fila('Centro de llenado El Naranjal')).getByText('Centro de llenado')).toBeInTheDocument();
    expect(fila('Centro de llenado El Naranjal')).toHaveTextContent('Última medición: 12 de noviembre de 2026');
    expect(fila('Centro de llenado El Tulipán')).toHaveTextContent('Sin medición todavía');
    expect(within(fila('Grimuca')).queryByText('Centro de llenado')).not.toBeInTheDocument();
    expect(fila('Grimuca')).not.toHaveTextContent(/medición/i);
  });

  it('da de alta un centro de llenado con la urbanización del local (obligatoria)', async () => {
    const usuario = userEvent.setup();
    api.crearComercio.mockResolvedValue(
      comercio({
        id: 'centro-tulipan',
        nombre: 'Agua El Tulipán',
        tipo: 'centro_llenado',
        ciudad: 'San Diego',
        fecha_alta: '2026-11-22T12:00:00Z',
        ultima_medicion_centro: null,
      }),
    );
    montar();
    await screen.findByRole('table', { name: 'Comercios de la red' });

    // Con ferretería no se pide urbanización.
    expect(screen.queryByLabelText('Urbanización del local')).not.toBeInTheDocument();
    await usuario.selectOptions(screen.getByLabelText('Tipo de comercio'), 'centro_llenado');
    const urbanizacion = screen.getByLabelText('Urbanización del local');
    expect(
      screen.getByText('Sirve para mostrarlo como el centro con resultados públicos más cercano a cada cliente.'),
    ).toBeInTheDocument();
    // Agrupada por zona.
    const grupos = within(urbanizacion).getAllByRole('group').map((g) => g.getAttribute('label'));
    expect(grupos).toEqual(['Naguanagua', 'San Diego', 'Valencia norte']);

    await usuario.type(screen.getByLabelText('Nombre del comercio'), 'Agua El Tulipán');
    await usuario.selectOptions(screen.getByLabelText('Estado'), 'Carabobo');
    await usuario.type(screen.getByLabelText('Ciudad'), 'San Diego');
    await usuario.type(screen.getByLabelText('Nombre de su primera tienda'), 'Local El Tulipán');
    await usuario.click(screen.getByRole('button', { name: 'Dar de alta' }));
    expect(screen.getByText('Elige la urbanización del local.')).toBeInTheDocument();
    expect(api.crearComercio).not.toHaveBeenCalled();

    await usuario.selectOptions(urbanizacion, 'El Tulipán');
    expect(screen.queryByText('Elige la urbanización del local.')).not.toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Dar de alta' }));
    expect(api.crearComercio).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Agua El Tulipán', tipo: 'centro_llenado', urbanizacion: 'El Tulipán' }),
      't-red',
    );
    const tabla = await screen.findByRole('table', { name: 'Comercios de la red' });
    const fila = within(tabla).getByText('Agua El Tulipán').closest('tr') as HTMLElement;
    expect(await within(fila).findByText('Centro de llenado')).toBeInTheDocument();
    expect(fila).toHaveTextContent('Sin medición todavía');
    // El formulario vuelve a ferretería.
    expect(screen.getByLabelText('Tipo de comercio')).toHaveValue('ferreteria');
    expect(screen.queryByLabelText('Urbanización del local')).not.toBeInTheDocument();
  });

  it('los textos de la red no califican el agua', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByRole('table', { name: 'Comercios de la red' });
    await usuario.selectOptions(screen.getByLabelText('Tipo de comercio'), 'centro_llenado');
    expect(document.body).not.toHaveTextContent(
      /verificad|certificad|aprobad|garantizad|potable|segura|\bapta\b|agua de calidad|\bbuena\b|\bmala\b/i,
    );
  });

  it('/modulos muestra los cuatro módulos con su dirección', () => {
    montar('/modulos');
    expect(screen.getByRole('link', { name: /^Cliente:/ })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /^Comercio:/ })).toHaveAttribute('href', '/comercio');
    expect(screen.getByRole('link', { name: /^Técnico:/ })).toHaveAttribute('href', '/tecnico');
    expect(screen.getByRole('link', { name: /^Red:/ })).toHaveAttribute('href', '/red');
  });
});
