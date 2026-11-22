import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useRoutes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { Comercio, EntradaProducto, ProductoComercio, ServicioConReporte } from '../../lib/tipos';
import { ProveedorServicios } from './contexto';
import type { ServiciosOperador } from './contexto';
import { rutasOperador } from './rutas';

const LARA: Comercio = {
  id: 'aliado-lara',
  nombre: 'Ferretería El Tunal (comercio de demostración)',
  estado_pais: 'Lara',
  ciudad: 'Barquisimeto',
  plan: 'basico',
  membresia_usd: null,
  fecha_alta: '2026-11-01T12:00:00Z',
  fin_periodo_gratis: '2027-02-01',
  activo: true,
  es_demostracion: true,
};

function producto(cambios: Partial<ProductoComercio> & Pick<ProductoComercio, 'codigo' | 'nombre'>): ProductoComercio {
  return {
    marca: 'Grimuca',
    precio_usd: null,
    corrige: ['sedimentos'],
    es_ejemplo: false,
    foto_url: null,
    categoria: 'cartucho',
    url_producto: null,
    disponible: true,
    propio: false,
    existencias: [{ tienda_id: 'tunal', tienda_nombre: 'El Tunal', cantidad: 4 }],
    ...cambios,
  };
}

function montar(ruta: string, extra: Partial<ServiciosOperador> = {}) {
  const servicios: ServiciosOperador = {
    leerToken: () => 't-lara',
    guardarToken: vi.fn(),
    entrar: vi.fn(async () => 't-lara'),
    pedidosPendientes: vi.fn(async () => []),
    despachar: vi.fn(),
    resumen: vi.fn(async () => []),
    inventario: vi.fn(async () => []),
    zonas: vi.fn(async () => []),
    mapa: vi.fn(async () => []),
    enVivo: (_t, m) => {
      m.conexion('en_vivo');
      return () => undefined;
    },
    yo: vi.fn(async () => ({
      rol: 'comercio' as const,
      comercio: LARA,
      tiendas: [{ id: 'tunal', nombre: 'El Tunal', horario: '8 a 5', direccion: null }],
    })),
    productos: vi.fn(async () => [producto({ codigo: 'SED-10', nombre: 'Cartucho de sedimentos' })]),
    crearProducto: vi.fn(async (_t: string, d: EntradaProducto) =>
      producto({
        codigo: d.codigo,
        nombre: d.nombre,
        categoria: d.categoria,
        corrige: d.corrige,
        propio: true,
        existencias: [{ tienda_id: 'tunal', tienda_nombre: 'El Tunal', cantidad: d.existencias.tunal ?? 0 }],
      }),
    ),
    reportes: vi.fn(async () => [] as ServicioConReporte[]),
    urlFoto: (_t, id) => `/api/servicios/${id}/foto?token=t`,
    ...extra,
  };
  function Rutas() {
    return useRoutes(rutasOperador);
  }
  render(
    <ProveedorServicios servicios={servicios}>
      <MemoryRouter initialEntries={[ruta]}>
        <Rutas />
      </MemoryRouter>
    </ProveedorServicios>,
  );
  return servicios;
}

describe('panel del comercio', () => {
  it('pide el PIN de la ferretería en /comercio', async () => {
    montar('/comercio', { leerToken: () => null });
    expect(screen.getByRole('heading', { name: 'Panel del comercio' })).toBeInTheDocument();
    expect(screen.getByText('Entra con el PIN de tu comercio.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('muestra el nombre del comercio, su plan y solo sus tiendas', async () => {
    montar('/comercio/despacho');
    const ficha = await screen.findByTestId('ficha-comercio');
    expect(ficha).toHaveTextContent('Ferretería El Tunal (comercio de demostración)');
    expect(ficha).toHaveTextContent('Barquisimeto, Lara');
    expect(within(ficha).getByText('Plan Básico')).toBeInTheDocument();
    expect(within(ficha).getByText('Demostración')).toBeInTheDocument();
    expect(screen.getByText('Comercio')).toBeInTheDocument();

    const filtro = screen.getByRole('group', { name: 'Tienda' });
    expect(within(filtro).getByRole('button', { name: 'El Tunal' })).toBeInTheDocument();
    expect(screen.queryByText('Mañongo')).not.toBeInTheDocument();
    expect(screen.queryByText('Big Low')).not.toBeInTheDocument();
    // Las pestañas apuntan a /comercio.
    expect(screen.getByRole('link', { name: 'Productos' })).toHaveAttribute('href', '/comercio/productos');
  });

  it('agrega un producto con sus existencias y avisa que entra en las recomendaciones', async () => {
    const usuario = userEvent.setup();
    const servicios = montar('/comercio/productos');
    const tabla = await screen.findByRole('table', { name: 'Productos del comercio' });
    expect(within(tabla).getByText('Cartucho de sedimentos')).toBeInTheDocument();

    // Código repetido: validación clara, no llama a la API.
    await usuario.type(screen.getByLabelText('Código'), 'sed-10');
    await usuario.click(screen.getByRole('button', { name: 'Guardar producto' }));
    expect(screen.getByText('Ese código ya está en el catálogo. Usa otro.')).toBeInTheDocument();
    expect(servicios.crearProducto).not.toHaveBeenCalled();

    await usuario.clear(screen.getByLabelText('Código'));
    await usuario.type(screen.getByLabelText('Código'), 'tun-carbon');
    await usuario.type(screen.getByLabelText('Nombre'), 'Cartucho de carbón El Tunal');
    await usuario.selectOptions(screen.getByLabelText('Tipo'), 'cartucho');
    await usuario.click(screen.getByLabelText('Cloro y sabor'));
    await usuario.type(screen.getByLabelText('Existencias en El Tunal'), '12');
    await usuario.click(screen.getByRole('button', { name: 'Guardar producto' }));

    expect(servicios.crearProducto).toHaveBeenCalledWith('t-lara', {
      codigo: 'TUN-CARBON',
      nombre: 'Cartucho de carbón El Tunal',
      categoria: 'cartucho',
      corrige: ['cloro_libre', 'sabor_olor'],
      foto_url: null,
      existencias: { tunal: 12 },
    });
    expect(await screen.findByText('Producto agregado. Ya entra en las recomendaciones.')).toBeInTheDocument();
    const filas = within(tabla).getAllByRole('row');
    // Los propios van primero, con su insignia.
    expect(filas[1]).toHaveTextContent('Cartucho de carbón El Tunal');
    expect(within(filas[1]).getByText('Cargado por ti')).toBeInTheDocument();
    expect(filas[1]).toHaveTextContent('12');
  });

  it('en Despacho muestra los servicios atendidos con "Ver reporte"', async () => {
    const usuario = userEvent.setup();
    montar('/comercio/despacho', {
      reportes: vi.fn(async () => [
        {
          id: 9,
          hogar_id: 'h',
          tipo: 'servicio' as const,
          cartucho_codigo: null,
          cantidad: 1,
          modalidad: 'envio' as const,
          direccion: 'Calle 2',
          pago: 'no_aplica' as const,
          tienda_id: 'tunal',
          estado: 'despachado' as const,
          fecha: '2026-11-21T13:00:00Z',
          fecha_despacho: '2026-11-21T15:00:00Z',
          servicio: 'cambio_cartucho' as const,
          fecha_preferida: '2026-11-21',
          momento: 'manana' as const,
          nota: null,
          hogar_nombre: 'Familia Pérez',
          zona: 'Barquisimeto',
          reporte: { fecha_visita: '2026-11-21T15:00:00Z', nota: 'Cambié el cartucho de sedimentos.', tiene_foto: true },
        },
      ]),
    });
    await usuario.click(await screen.findByText(/Reportes del técnico/));
    expect(await screen.findByText('Atendido')).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: /Ver reporte de Familia Pérez/ }));
    expect(screen.getByText('Cambié el cartucho de sedimentos.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Foto del trabajo en Familia Pérez/ })).toHaveAttribute(
      'src',
      '/api/servicios/9/foto?token=t',
    );
  });
});
