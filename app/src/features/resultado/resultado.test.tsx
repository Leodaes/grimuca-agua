import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Medicion } from '../../lib/tipos';
import { PaginaResultado } from './PaginaResultado';

const sesion = vi.hoisted(() => ({
  hogarId: vi.fn(() => 'hogar-1'),
  lista: vi.fn(() => [] as Array<{ codigo: string; nombre: string; cantidad: number }>),
  agregarALista: vi.fn(),
  cambiarCantidad: vi.fn(),
  quitarDeLista: vi.fn(),
  vaciarLista: vi.fn(),
}));
const api = vi.hoisted(() => ({ medicion: vi.fn(), medicionesDeHogar: vi.fn() }));

vi.mock('../../lib/sesion', () => sesion);
vi.mock('../../lib/api', () => ({ api }));

const medicionVerde: Medicion = {
  id: 'm1',
  hogar_id: 'hogar-1',
  fecha: '2026-11-21T10:00:00.000Z',
  origen: 'foto',
  valores: { cloro_libre: 1, plomo: 0 },
  evaluacion: {
    semaforo: 'verde',
    porParametro: [
      { clave: 'cloro_libre', nombre: 'Cloro', unidad: 'mg/L', valor: 1, nivel: 'verde', frase: 'Cloro en rango.', orientativo: false },
      { clave: 'plomo', nombre: 'Plomo', unidad: 'ppb', valor: 0, nivel: 'verde', frase: 'La tira no marcó presencia de plomo.', orientativo: true },
    ],
    hallazgos: [],
    corrige: ['cloro_libre'],
    diasParaRecambio: 30,
  },
  sugeridos: [
    { codigo: 'OA-01', nombre: 'Cartucho de carbón', marca: 'Oasis', precio_usd: null, corrige: ['cloro_libre', 'sabor_olor'], es_ejemplo: false, foto_url: null, categoria: 'cartucho', url_producto: null, disponible: true },
  ],
};

function montar() {
  return render(
    <MemoryRouter initialEntries={['/resultado/m1']}>
      <Routes>
        <Route path="/resultado/:id" element={<PaginaResultado />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PaginaResultado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.medicion.mockResolvedValue(medicionVerde);
  });

  it('muestra el aviso fijo literal y nunca la palabra "potable"', async () => {
    montar();
    expect(
      await screen.findByText('Esta tira no mide todo. Un buen resultado no significa que el agua sea apta para tomar.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Lo que midió la tira está en rango');
    expect(screen.getAllByText('Orientativo').length).toBeGreaterThan(0);
    expect(screen.getByText('Pensado para: cloro y mal sabor u olor.')).toBeInTheDocument();
    expect(document.body.textContent?.toLowerCase()).not.toContain('potable');
    expect(document.body.textContent?.toLowerCase()).not.toContain('segura');
  });

  it('agrega el sugerido a la lista', async () => {
    montar();
    const boton = await screen.findByRole('button', { name: 'Agregar a mi lista' });
    await userEvent.click(boton);
    expect(sesion.agregarALista).toHaveBeenCalledWith({ codigo: 'OA-01', nombre: 'Cartucho de carbón', cantidad: 1 });
    expect(screen.getByRole('button', { name: 'Agregado' })).toBeDisabled();
    const aviso = screen.getByText(/quedó en tu lista/);
    expect(within(aviso).getByRole('link', { name: 'Ver mi lista' })).toHaveAttribute('href', '/lista');
  });
});
