import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/api', () => ({
  api: {
    crearHogar: vi.fn(),
    obtenerHogar: vi.fn(),
    actualizarHogar: vi.fn(),
    tiendas: vi.fn(),
    crearPedido: vi.fn(),
  },
}));

vi.mock('../../lib/sesion', () => ({
  hogarId: vi.fn(() => null),
  guardarHogarId: vi.fn(),
}));

import { api } from '../../lib/api';
import { guardarHogarId, hogarId } from '../../lib/sesion';
import { Pago } from './Pago';
import { Perfil } from './Perfil';

const simulada = api as unknown as Record<string, ReturnType<typeof vi.fn>>;

const hogar = {
  id: 'h-1',
  nombre: 'Ana',
  zona: 'Naguanagua',
  origen_agua: 'chorro',
  personas: 4,
  tiene_filtro: false,
  etapas_filtro: null,
  fecha_ultimo_cambio: null,
  agua_turbia: false,
  whatsapp: '04141234567',
  direccion: 'Urb. Mañongo, calle 3, casa 12',
  tienda_id: 'manongo',
  consentimiento_fecha: '2026-11-21T10:00:00Z',
};

function enRuta(ruta: string, elemento: JSX.Element) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path={ruta.split('?')[0]} element={elemento} />
        <Route path="/envio" element={<p>Pantalla de envío</p>} />
        <Route path="/medir" element={<p>Pantalla de medir</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function llenarPerfil(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.type(screen.getByLabelText('¿Cómo te llamas?'), 'Ana');
  await usuario.selectOptions(screen.getByLabelText('¿En qué zona vives?'), 'Naguanagua');
  await usuario.click(screen.getByLabelText(/^Chorro/));
  await usuario.type(screen.getByLabelText('¿Cuántos viven en la casa?'), '4');
  const filtro = screen.getByRole('group', { name: '¿Tienen filtro en casa?' });
  await usuario.click(within(filtro).getByLabelText('No'));
  const turbia = screen.getByRole('group', { name: '¿El agua a veces sale turbia o amarilla?' });
  await usuario.click(within(turbia).getByLabelText('No'));
  await usuario.type(screen.getByLabelText('Tu WhatsApp'), '0414 123 4567');
}

describe('alta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hogarId).mockReturnValue(null);
  });

  it('el perfil no se envía sin consentimiento', async () => {
    const usuario = userEvent.setup();
    enRuta('/perfil', <Perfil />);
    await llenarPerfil(usuario);
    expect(screen.getByRole('checkbox')).not.toBeChecked();

    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(simulada.crearHogar).not.toHaveBeenCalled();
    expect(screen.getByText('Marca la casilla para poder seguir.')).toBeInTheDocument();
  });

  it('con consentimiento crea el hogar, lo guarda y va a envío', async () => {
    simulada.crearHogar.mockResolvedValue(hogar);
    const usuario = userEvent.setup();
    enRuta('/perfil', <Perfil />);
    await llenarPerfil(usuario);
    await usuario.click(screen.getByRole('checkbox'));
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(simulada.crearHogar).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Ana',
        zona: 'Naguanagua',
        origen_agua: 'chorro',
        personas: 4,
        tiene_filtro: false,
        whatsapp: '04141234567',
        consentimiento: true,
      }),
    );
    expect(guardarHogarId).toHaveBeenCalledWith('h-1');
    expect(await screen.findByText('Pantalla de envío')).toBeInTheDocument();
  });

  it('con ?ya=1 el perfil va directo a medir', async () => {
    simulada.crearHogar.mockResolvedValue(hogar);
    const usuario = userEvent.setup();
    enRuta('/perfil?ya=1', <Perfil />);
    await llenarPerfil(usuario);
    await usuario.click(screen.getByRole('checkbox'));
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(await screen.findByText('Pantalla de medir')).toBeInTheDocument();
  });

  it('si falla el guardado, el botón conserva su nombre', async () => {
    simulada.crearHogar.mockRejectedValue({ mensaje: 'No se pudo guardar.' });
    const usuario = userEvent.setup();
    enRuta('/perfil', <Perfil />);
    await llenarPerfil(usuario);
    await usuario.click(screen.getByRole('checkbox'));
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(await screen.findByText('No se pudo guardar.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument();
  });

  it('el pago crea un pedido de tipo sobre', async () => {
    vi.mocked(hogarId).mockReturnValue('h-1');
    simulada.obtenerHogar.mockResolvedValue(hogar);
    simulada.tiendas.mockResolvedValue([
      { id: 'manongo', nombre: 'Grimuca Mañongo', horario: '8 a 5', direccion: null },
    ]);
    simulada.crearPedido.mockResolvedValue({ id: 42, tipo: 'sobre' });
    const usuario = userEvent.setup();
    enRuta('/pago', <Pago />);

    await usuario.click(await screen.findByRole('button', { name: 'Simular pago de $9' }));

    expect(simulada.crearPedido).toHaveBeenCalledWith({
      hogar_id: 'h-1',
      tipo: 'sobre',
      modalidad: 'envio',
      direccion: hogar.direccion,
      tienda_id: 'manongo',
    });
    expect(await screen.findByText('Pago simulado registrado. No se hizo ningún cobro.')).toBeInTheDocument();
    expect(screen.getByText(/Pedido N\.º 42/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ya me llegó el sobre/ })).toHaveAttribute('href', '/medir');
  });
});
