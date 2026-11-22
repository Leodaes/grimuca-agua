import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useRoutes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { Pedido } from '../../lib/tipos';
import { ProveedorServicios } from './contexto';
import type { ManejadoresEnVivo, ServiciosOperador } from './contexto';
import { rutasOperador } from './rutas';

function pedido(id: number, cambios: Partial<Pedido> = {}): Pedido {
  return {
    id,
    hogar_id: `h-${id}`,
    tipo: 'sobre',
    cartucho_codigo: null,
    cantidad: 1,
    modalidad: 'envio',
    direccion: 'Calle 1',
    pago: 'simulado',
    tienda_id: 'manongo',
    estado: 'pendiente',
    fecha: new Date(Date.UTC(2026, 10, 21, 13, id)).toISOString(),
    fecha_despacho: null,
    hogar_nombre: `Hogar ${id}`,
    zona: 'Naguanagua',
    cartucho_nombre: null,
    ...cambios,
  };
}

function montar(inicial: Pedido[], despachar?: ServiciosOperador['despachar']) {
  let manejadores: ManejadoresEnVivo | null = null;
  const servicios: ServiciosOperador = {
    leerToken: () => 'token-prueba',
    guardarToken: vi.fn(),
    entrar: vi.fn(async () => 'token-prueba'),
    pedidosPendientes: vi.fn(async () => inicial),
    despachar: despachar ?? vi.fn(async (_t: string, id: number) => ({ ...pedido(id), estado: 'despachado' as const })),
    resumen: vi.fn(async () => []),
    inventario: vi.fn(async () => []),
    zonas: vi.fn(async () => []),
    enVivo: (_token, m) => {
      manejadores = m;
      m.conexion('en_vivo');
      return () => undefined;
    },
  };
  function Rutas() {
    return useRoutes(rutasOperador);
  }
  render(
    <ProveedorServicios servicios={servicios}>
      <MemoryRouter initialEntries={['/operador/despacho']}>
        <Rutas />
      </MemoryRouter>
    </ProveedorServicios>,
  );
  return { servicios, emitir: () => manejadores! };
}

describe('Despacho en vivo', () => {
  it('un pedido_nuevo aparece arriba sin recargar, resaltado y anunciado', async () => {
    const { servicios, emitir } = montar([pedido(1)]);
    expect(await screen.findByText(/Hogar 1/)).toBeInTheDocument();
    expect(screen.getByText('En vivo')).toBeInTheDocument();

    act(() => emitir().pedidoNuevo(pedido(2, { tipo: 'cartucho', cartucho_nombre: 'Cartucho de carbón', hogar_nombre: 'Ana' })));

    const lista = screen.getByRole('list', { name: 'Pedidos de Mañongo' });
    const filas = within(lista).getAllByRole('listitem');
    expect(filas).toHaveLength(2);
    expect(filas[0]).toHaveTextContent('Cartucho de carbón · Ana');
    expect(filas[0]).toHaveClass('g-fila-pedido--nuevo');
    expect(within(filas[0]).getByText('Nuevo')).toBeInTheDocument();
    expect(screen.getByTestId('aviso-en-vivo')).toHaveTextContent('Pedido nuevo en Mañongo');
    expect(screen.getByText('Nuevos: 1')).toBeInTheDocument();
    // Solo una carga inicial: el pedido llegó por evento.
    expect(servicios.pedidosPendientes).toHaveBeenCalledTimes(1);

    // El mismo pedido otra vez (por sondeo o recarga) no se duplica.
    act(() => emitir().listaPedidos([pedido(1), pedido(2, { hogar_nombre: 'Ana' })]));
    expect(within(lista).getAllByRole('listitem')).toHaveLength(2);
  });

  it('"Despachado" lo quita; si otro operador lo despacha también sale', async () => {
    const usuario = userEvent.setup();
    const { servicios, emitir } = montar([pedido(1), pedido(2)]);
    await screen.findByText(/Hogar 2/);

    await usuario.click(screen.getByRole('button', { name: /Marcar como despachado: .*Hogar 2/ }));
    expect(screen.queryByText(/Hogar 2/)).not.toBeInTheDocument();
    expect(servicios.despachar).toHaveBeenCalledWith('token-prueba', 2);

    act(() => emitir().pedidoDespachado({ ...pedido(1), estado: 'despachado' }));
    expect(screen.queryByText(/Hogar 1/)).not.toBeInTheDocument();
    expect(screen.getByText('No hay nada por despachar en Mañongo.')).toBeInTheDocument();
  });

  it('si despachar falla, el pedido vuelve a la lista', async () => {
    const usuario = userEvent.setup();
    montar([pedido(1)], vi.fn(async () => {
      throw new Error('red');
    }));
    await screen.findByText(/Hogar 1/);
    await usuario.click(screen.getByRole('button', { name: /Marcar como despachado/ }));
    expect(await screen.findByText(/Hogar 1/)).toBeInTheDocument();
    expect(screen.getByText('No se pudo marcar como despachado. Intenta otra vez.')).toBeInTheDocument();
  });
});
