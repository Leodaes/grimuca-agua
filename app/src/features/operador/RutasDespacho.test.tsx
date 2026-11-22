import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { RutasDespacho as DatosRutas, RutaTienda } from '../../lib/tipos';
import { ProveedorServicios, type ServiciosOperador } from './contexto';
import { NOTA_DISTANCIAS, RutasDespacho } from './RutasDespacho';

const MANONGO: RutaTienda = {
  tienda_id: 'manongo',
  tienda_nombre: 'Mañongo',
  origen: { lat: 10.234, lng: -68 },
  paradas: [
    {
      orden: 1,
      urbanizacion: 'Mañongo',
      lat: 10.234,
      lng: -67.998,
      distancia_desde_anterior_km: 0.4,
      pedidos: [{ id: 81, tipo: 'sobre', hogar_nombre: 'Pedro L.', detalle: 'Sobre de prueba de agua' }],
    },
    {
      orden: 2,
      urbanizacion: 'La Begoña',
      lat: 10.26,
      lng: -68.022,
      distancia_desde_anterior_km: 5.1,
      pedidos: [
        { id: 82, tipo: 'cartucho', hogar_nombre: 'Ramón V.', detalle: 'Cartucho de sedimentos' },
        { id: 90, tipo: 'servicio', hogar_nombre: 'Luis M.', detalle: 'Servicio técnico: cambio de cartucho' },
      ],
    },
  ],
  entregas: 3,
  distancia_ruta_km: 10.9,
  distancia_viajes_sueltos_km: 22.4,
  ahorro_km: 11.5,
  ahorro_porcentaje: 51,
  sin_ubicacion: 1,
};

const BIGLOW: RutaTienda = {
  ...MANONGO,
  tienda_id: 'biglow',
  tienda_nombre: 'Big Low',
  origen: { lat: 10.193, lng: -67.965 },
  paradas: [{ ...MANONGO.paradas[0], urbanizacion: 'El Morro I', lat: 10.219, lng: -67.961, pedidos: [{ id: 83, tipo: 'sobre', hogar_nombre: 'Daniela F.', detalle: 'Sobre de prueba de agua' }] }],
  entregas: 1,
  sin_ubicacion: 0,
};

const DATOS: DatosRutas = {
  rutas: [BIGLOW, MANONGO],
  totales: { entregas: 4, paradas: 3, distancia_ruta_km: 21.8, distancia_viajes_sueltos_km: 44.8, ahorro_km: 23, ahorro_porcentaje: 51 },
};

function montar(rutas: () => Promise<DatosRutas>, version = 0) {
  const servicios: ServiciosOperador = {
    leerToken: () => 't',
    guardarToken: vi.fn(),
    entrar: vi.fn(async () => 't'),
    pedidosPendientes: vi.fn(async () => []),
    despachar: vi.fn(),
    resumen: vi.fn(async () => []),
    inventario: vi.fn(async () => []),
    zonas: vi.fn(async () => []),
    rutas: vi.fn(rutas),
    enVivo: () => () => undefined,
  };
  const arbol = (v: number) => (
    <ProveedorServicios servicios={servicios}>
      <MemoryRouter>
        <RutasDespacho token="t" version={v} alNoAutorizado={vi.fn()} />
      </MemoryRouter>
    </ProveedorServicios>
  );
  const vista = render(arbol(version));
  return { servicios, ...vista, cambiarVersion: (v: number) => vista.rerender(arbol(v)) };
}

describe('pestaña Rutas', () => {
  it('muestra la banda, el mapa, la hoja de ruta en orden y el detalle de una parada', async () => {
    const usuario = userEvent.setup();
    const { container, servicios, cambiarVersion } = montar(async () => DATOS);

    const banda = await screen.findByLabelText('Cifras de las rutas');
    expect(within(banda).getByText('Entregas con envío').closest('div')).toHaveTextContent('4');
    expect(within(banda).getByText('1 ruta por tienda contra 4 viajes sueltos').closest('div')).toHaveTextContent('2');
    expect(within(banda).getByText('Km de la ruta').closest('div')).toHaveTextContent('21,8 km');
    expect(within(banda).getByText('Km de viajes sueltos').closest('div')).toHaveTextContent('44,8 km');
    expect(within(banda).getByText('Ahorro (51 %)').closest('div')).toHaveTextContent('23,0 km');

    expect(screen.getByRole('region', { name: 'Mapa de las rutas de despacho' })).toBeInTheDocument();
    expect(container.querySelector('[data-id="tienda-manongo"]')).toHaveTextContent('Mañongo');
    expect(container.querySelector('[data-id="parada-manongo-2"]')).toHaveTextContent('2');
    expect(screen.getByText(NOTA_DISTANCIAS)).toBeInTheDocument();

    // Hoja de ruta: paradas en orden, con su insignia por tipo y el enlace "Cómo llegar".
    const hoja = screen.getByRole('region', { name: 'Hoja de ruta' });
    const deManongo = within(hoja).getByRole('region', { name: /Desde Mañongo/ });
    const paradas = within(deManongo).getAllByRole('listitem').filter((li) => li.classList.contains('rutas-parada'));
    expect(paradas.map((li) => li.querySelector('strong')?.textContent)).toEqual(['Mañongo', 'La Begoña']);
    expect(within(paradas[1]).getByText('Cartucho')).toBeInTheDocument();
    expect(within(paradas[1]).getByText('Servicio técnico')).toBeInTheDocument();
    expect(within(paradas[1]).getByText(/5,1 km desde la parada anterior/)).toBeInTheDocument();
    expect(within(paradas[1]).getByRole('link', { name: /Cómo llegar/ })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=10.26,-68.022',
    );
    expect(within(deManongo).getByText(/Total de la ruta: 10,9 km/)).toBeInTheDocument();
    expect(within(deManongo).getByText(/1 pedido sin urbanización conocida/)).toBeInTheDocument();

    // Tocar la parada en el mapa abre sus pedidos.
    await usuario.click(container.querySelector('[data-id="parada-manongo-2"]') as HTMLElement);
    const detalle = await screen.findByRole('complementary', { name: 'Parada 2 de Mañongo' });
    expect(within(detalle).getByText('Luis M.')).toBeInTheDocument();

    // El chip de una tienda deja solo su hoja de ruta.
    await usuario.click(screen.getByRole('button', { name: /Big Low \(1\)/ }));
    expect(within(hoja).queryByRole('region', { name: /Desde Mañongo/ })).not.toBeInTheDocument();
    expect(within(hoja).getByRole('region', { name: /Desde Big Low/ })).toBeInTheDocument();

    // Un pedido nuevo o un despacho (cambia la versión) recalcula las rutas.
    cambiarVersion(1);
    await vi.waitFor(() => expect(servicios.rutas).toHaveBeenCalledTimes(2));
  });

  it('un comercio aliado sin coordenadas ve un estado vacío claro', async () => {
    montar(async () => ({
      rutas: [{ ...MANONGO, tienda_id: 'lara-1', tienda_nombre: 'Aliado Lara · Centro', origen: null, paradas: [], entregas: 0, motivo: 'Sin ubicación.' }],
      totales: { entregas: 0, paradas: 0, distancia_ruta_km: 0, distancia_viajes_sueltos_km: 0, ahorro_km: 0, ahorro_porcentaje: 0 },
    }));
    expect(await screen.findByText('Tus tiendas todavía no tienen ubicación en el mapa')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Mapa de las rutas de despacho' })).not.toBeInTheDocument();
  });
});
