import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EVENTO_PERFIL_PERDIDO, TEXTO_AVISO_PERFIL_PERDIDO } from './lib/avisosSesion';
import { guardarHogarId } from './lib/sesion';
import { Marco } from './Marco';

const pedir = vi.fn();

function Donde() {
  const { pathname, search } = useLocation();
  return <p data-testid="donde">{pathname + search}</p>;
}

function montar(ruta: string) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route element={<Marco />}>
          <Route path="/medir" element={<Donde />} />
          <Route path="/perfil" element={<Donde />} />
          <Route path="/medir/manual" element={<Donde />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  pedir.mockReset();
  pedir.mockResolvedValue(new Response(JSON.stringify({ id: 'x' }), { status: 200 }));
  vi.stubGlobal('fetch', pedir);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Marco: perfil que ya no existe', () => {
  it('el evento lleva a /perfil?ya=1 con el aviso, que se cierra al guardar el perfil nuevo', async () => {
    montar('/medir/manual');
    expect(screen.queryByText(TEXTO_AVISO_PERFIL_PERDIDO)).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new CustomEvent(EVENTO_PERFIL_PERDIDO));
    });
    expect(screen.getByTestId('donde')).toHaveTextContent('/perfil?ya=1');
    expect(screen.getByRole('alert')).toHaveTextContent(TEXTO_AVISO_PERFIL_PERDIDO);

    act(() => guardarHogarId('nuevo-id'));
    expect(screen.queryByText(TEXTO_AVISO_PERFIL_PERDIDO)).not.toBeInTheDocument();
  });

  it('al cargar con un hogar que ya no existe, lo valida en segundo plano y lleva al perfil', async () => {
    guardarHogarId('33333333-3333-4333-8333-333333333333');
    pedir.mockResolvedValue(new Response(JSON.stringify({ error: 'El hogar no existe.' }), { status: 404 }));
    montar('/medir');
    // La pantalla se muestra de una vez, sin esperar la validación.
    expect(screen.getByTestId('donde')).toHaveTextContent('/medir');
    await waitFor(() => expect(screen.getByTestId('donde')).toHaveTextContent('/perfil?ya=1'));
    expect(screen.getByRole('alert')).toHaveTextContent(TEXTO_AVISO_PERFIL_PERDIDO);
    expect(window.localStorage.getItem('agua.hogar_id')).toBeNull();
    expect(pedir).toHaveBeenCalledWith('/api/hogares/33333333-3333-4333-8333-333333333333', expect.anything());
  });

  it('sin hogar en sesión no consulta nada', () => {
    montar('/medir');
    expect(pedir).not.toHaveBeenCalled();
  });
});
