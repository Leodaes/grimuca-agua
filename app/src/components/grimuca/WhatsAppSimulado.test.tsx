import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TEXTO_SIMULACION_WA, WhatsAppSimulado } from './WhatsAppSimulado';

describe('WhatsAppSimulado', () => {
  it('muestra el rótulo de simulación, quién escribe, el mensaje y la hora', () => {
    render(<WhatsAppSimulado de="Grimuca Mañongo" mensaje="Hola, Ana. Recibimos tu pedido." hora={new Date(2026, 10, 22, 9, 5)} />);
    const tarjeta = screen.getByRole('status');
    expect(tarjeta).toHaveTextContent(TEXTO_SIMULACION_WA);
    expect(tarjeta).toHaveTextContent('Grimuca Mañongo');
    expect(screen.getByText('Hola, Ana. Recibimos tu pedido.')).toBeInTheDocument();
    expect(screen.getByText('09:05')).toBeInTheDocument();
  });

  it('el toast se cierra con "Cerrar" o solo a los 6 segundos', async () => {
    const alCerrar = vi.fn();
    const { unmount } = render(
      <WhatsAppSimulado variante="toast" titulo="WhatsApp simulado enviado a Ana" de="Grimuca Mañongo" para="Ana" mensaje="Salió" alCerrar={alCerrar} />,
    );
    expect(screen.getByRole('status')).toHaveTextContent(TEXTO_SIMULACION_WA);
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(alCerrar).toHaveBeenCalledTimes(1);
    unmount();

    vi.useFakeTimers();
    try {
      const solo = vi.fn();
      render(<WhatsAppSimulado variante="toast" de="Grimuca Mañongo" para="Ana" mensaje="Salió" alCerrar={solo} />);
      act(() => vi.advanceTimersByTime(5999));
      expect(solo).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(1));
      expect(solo).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
