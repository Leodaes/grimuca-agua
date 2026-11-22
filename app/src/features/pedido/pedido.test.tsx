import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PaginaLista } from './PaginaLista';

const sesion = vi.hoisted(() => ({
  hogarId: vi.fn(() => 'hogar-1'),
  lista: vi.fn(() => [{ codigo: 'OA-01', nombre: 'Cartucho de carbón', cantidad: 1 }]),
  agregarALista: vi.fn(),
  cambiarCantidad: vi.fn(),
  quitarDeLista: vi.fn(),
  vaciarLista: vi.fn(),
}));
const api = vi.hoisted(() => ({
  tiendas: vi.fn(),
  obtenerHogar: vi.fn(),
  crearPedido: vi.fn(),
}));

vi.mock('../../lib/sesion', () => sesion);
vi.mock('../../lib/api', () => ({ api }));

describe('PaginaLista', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.tiendas.mockResolvedValue([
      { id: 'manongo', nombre: 'Mañongo', horario: '8 a 6', direccion: null },
      { id: 'cem', nombre: 'CC CEM', horario: '9 a 7', direccion: null },
    ]);
    api.obtenerHogar.mockResolvedValue({ id: 'hogar-1', tienda_id: 'manongo', direccion: 'Calle 1, casa 2' });
    api.crearPedido.mockResolvedValue({ id: 41 });
  });

  it('hace el pedido con tipo cartucho y vacía la lista', async () => {
    render(
      <MemoryRouter initialEntries={['/lista']}>
        <Routes>
          <Route path="/lista" element={<PaginaLista />} />
          <Route path="/pedido/:id" element={<p>Confirmación del pedido</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Retiro en tienda' })).toHaveAttribute('aria-pressed', 'true');
    await screen.findByRole('option', { name: 'Grimuca Mañongo' });
    await userEvent.click(screen.getByRole('button', { name: 'Agregar una unidad de Cartucho de carbón' }));
    await userEvent.click(screen.getByRole('button', { name: 'Hacer pedido' }));

    expect(api.crearPedido).toHaveBeenCalledWith({
      hogar_id: 'hogar-1',
      tipo: 'cartucho',
      cartucho_codigo: 'OA-01',
      cantidad: 2,
      modalidad: 'retiro',
      direccion: null,
      tienda_id: 'manongo',
    });
    expect(sesion.cambiarCantidad).toHaveBeenCalledWith('OA-01', 2);
    expect(sesion.vaciarLista).toHaveBeenCalled();
    expect(await screen.findByText('Confirmación del pedido')).toBeInTheDocument();
  });
});
