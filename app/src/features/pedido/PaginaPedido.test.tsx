import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Pedido } from '../../lib/tipos';
import { PaginaPedido } from './PaginaPedido';

const sesion = vi.hoisted(() => ({ hogarId: vi.fn(() => 'hogar-1') }));
const api = vi.hoisted(() => ({
  pedido: vi.fn(),
  tiendas: vi.fn(),
  cartuchos: vi.fn(),
  obtenerHogar: vi.fn(),
}));

vi.mock('../../lib/sesion', () => sesion);
vi.mock('../../lib/api', () => ({ api }));

function pedido(cambios: Partial<Pedido> = {}): Pedido {
  return {
    id: 41,
    hogar_id: 'hogar-1',
    tipo: 'cartucho',
    cartucho_codigo: 'OA-01',
    cantidad: 1,
    modalidad: 'envio',
    direccion: 'Calle 1',
    pago: 'simulado',
    tienda_id: 'manongo',
    estado: 'pendiente',
    fecha: new Date(2026, 10, 22, 9, 42).toISOString(),
    fecha_despacho: null,
    servicio: null,
    fecha_preferida: null,
    momento: null,
    nota: null,
    cartucho_nombre: 'Cartucho de carbón',
    ...cambios,
  };
}

function montar() {
  render(
    <MemoryRouter initialEntries={['/pedido/41']}>
      <Routes>
        <Route path="/pedido/:id" element={<PaginaPedido />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function chat() {
  await screen.findByRole('heading', { name: 'Te escribimos por WhatsApp' });
  return screen.getByRole('status', { name: 'WhatsApp simulado de Grimuca Mañongo' });
}

describe('PaginaPedido: WhatsApp simulado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.tiendas.mockResolvedValue([{ id: 'manongo', nombre: 'Mañongo', horario: '8 a 6', direccion: null }]);
    api.cartuchos.mockResolvedValue([]);
    api.obtenerHogar.mockResolvedValue({ id: 'hogar-1', nombre: 'Ana Pérez' });
  });

  it('cartucho: recibimos tu pedido, con el producto y la tienda', async () => {
    api.pedido.mockResolvedValue(pedido());
    montar();
    const tarjeta = await chat();
    expect(tarjeta).toHaveTextContent('Simulación: en la demo no se envía un WhatsApp real.');
    expect(tarjeta).toHaveTextContent(
      'Hola, Ana. Recibimos tu pedido N.º 41: Cartucho de carbón. Te avisamos por aquí cuando salga de Grimuca Mañongo.',
    );
    expect(tarjeta).not.toHaveTextContent('Tu pedido salió');
  });

  it('sobre despachado: dos mensajes, el segundo dice que salió', async () => {
    api.pedido.mockResolvedValue(pedido({ tipo: 'sobre', cartucho_codigo: null, cartucho_nombre: null, estado: 'despachado' }));
    montar();
    const tarjeta = await chat();
    expect(tarjeta).toHaveTextContent('Recibimos tu pedido N.º 41: tu sobre de medición.');
    expect(tarjeta).toHaveTextContent('Tu pedido salió de Grimuca Mañongo.');
  });

  it('servicio técnico: la fecha preferida y, si se atendió, el aviso del técnico', async () => {
    api.pedido.mockResolvedValue(
      pedido({
        tipo: 'servicio',
        servicio: 'instalacion_filtro',
        fecha_preferida: '2026-11-23',
        momento: 'tarde',
        pago: 'no_aplica',
        cartucho_codigo: null,
        cartucho_nombre: null,
        estado: 'despachado',
      }),
    );
    montar();
    const tarjeta = await chat();
    expect(tarjeta).toHaveTextContent(/Hola, Ana\. Recibimos tu solicitud de servicio técnico para el .*23.*en la tarde\. Un técnico te confirmará la hora\./);
    expect(tarjeta).toHaveTextContent('El técnico marcó tu servicio como atendido.');
  });
});
