import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useParams, useRoutes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ErrorApi } from '../../lib/api';
import { CLAVE_HOGAR } from '../../lib/sesion';
import type { Medicion, ParametroTira } from '../../lib/tipos';
import { medidasReducidas } from './reducirImagen';
import { rutasMedicion } from './rutas';

vi.mock('../../lib/api', async (original) => {
  const real = await original<typeof import('../../lib/api')>();
  return {
    ...real,
    api: { configTira: vi.fn(), medirManual: vi.fn(), medirConFoto: vi.fn() },
  };
});

const apiSimulada = vi.mocked(api);

const tiraDePrueba: ParametroTira[] = [
  { clave: 'ph', nombre: 'pH', unidad: '', niveles: [6.2, 6.8, 7.2], orientativo: false },
  { clave: 'cloro_libre', nombre: 'Cloro libre', unidad: 'mg/L', niveles: [0, 0.5, 1, 3], orientativo: false },
  { clave: 'plomo', nombre: 'Plomo', unidad: 'ppb', niveles: [0, 5, 15], orientativo: true },
];

const medicion = { id: 'med-1' } as Medicion;

function Resultado() {
  const { id } = useParams();
  return <p>Resultado de {id}</p>;
}

function Rutas() {
  return useRoutes([
    ...rutasMedicion,
    { path: '/resultado/:id', element: <Resultado /> },
    { path: '/perfil', element: <p>Perfil del hogar</p> },
  ]);
}

function abrir(ruta: string) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Rutas />
    </MemoryRouter>,
  );
}

function elegirFoto(contenedor: HTMLElement) {
  const entrada = contenedor.querySelector<HTMLInputElement>('input[type="file"][capture]')!;
  const foto = new File(['datos'], 'tira.jpg', { type: 'image/jpeg' });
  fireEvent.change(entrada, { target: { files: [foto] } });
  return foto;
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  window.localStorage.setItem(CLAVE_HOGAR, 'hogar-1');
});

describe('/medir', () => {
  it('muestra los 4 pasos, el contador y el botón de la foto', () => {
    const { container } = abrir('/medir');
    expect(screen.getByRole('heading', { level: 1, name: 'Cómo medir tu agua en 4 pasos' })).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Cómo medir tu agua' })).getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByRole('timer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tomar la foto' })).toBeInTheDocument();
    const camara = container.querySelector('input[type="file"][capture="environment"]');
    expect(camara).toHaveAttribute('accept', 'image/*');
    expect(screen.getByRole('link', { name: /carga los colores a mano/i })).toHaveAttribute('href', '/medir/manual');
  });

  it('sin hogar en sesión manda al perfil', () => {
    window.localStorage.clear();
    abrir('/medir');
    expect(screen.getByRole('link', { name: 'Ir a mi perfil' })).toHaveAttribute('href', '/perfil');
    expect(screen.queryByRole('button', { name: 'Tomar la foto' })).not.toBeInTheDocument();
  });

  it('lee la foto y pasa al resultado', async () => {
    apiSimulada.medirConFoto.mockResolvedValueOnce({ estado: 'ok', medicion });
    const { container } = abrir('/medir');
    const foto = elegirFoto(container);

    await userEvent.click(await screen.findByRole('button', { name: 'Leer mi tira' }));

    expect(await screen.findByText('Resultado de med-1')).toBeInTheDocument();
    expect(apiSimulada.medirConFoto).toHaveBeenCalledWith('hogar-1', foto);
  });

  it('mientras lee muestra "Leyendo tu tira…"', async () => {
    apiSimulada.medirConFoto.mockReturnValueOnce(new Promise(() => {}));
    const { container } = abrir('/medir');
    elegirFoto(container);
    await userEvent.click(await screen.findByRole('button', { name: 'Leer mi tira' }));
    expect(await screen.findByText('Leyendo tu tira…')).toBeInTheDocument();
  });

  it('foto no legible: muestra el motivo y las dos salidas', async () => {
    apiSimulada.medirConFoto.mockResolvedValueOnce({ estado: 'no_legible', motivo: 'La foto salió borrosa.' });
    const { container } = abrir('/medir');
    elegirFoto(container);
    await userEvent.click(await screen.findByRole('button', { name: 'Leer mi tira' }));

    expect(await screen.findByText('La foto salió borrosa.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Repetir la foto' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cargar los colores a mano' })).toHaveAttribute('href', '/medir/manual');
  });

  it('error de red: avisa y deja intentar otra vez con la misma foto', async () => {
    apiSimulada.medirConFoto
      .mockRejectedValueOnce(new ErrorApi('No pudimos conectar. Revisa tu internet e intenta de nuevo.', 0))
      .mockResolvedValueOnce({ estado: 'ok', medicion });
    const { container } = abrir('/medir');
    elegirFoto(container);
    await userEvent.click(await screen.findByRole('button', { name: 'Leer mi tira' }));

    expect(await screen.findByText('No hay conexión')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Intentar otra vez' }));
    expect(await screen.findByText('Resultado de med-1')).toBeInTheDocument();
    expect(apiSimulada.medirConFoto).toHaveBeenCalledTimes(2);
  });
});

describe('/medir/manual', () => {
  it('arma un grupo de chips por casilla y envía los valores marcados', async () => {
    apiSimulada.configTira.mockResolvedValueOnce(tiraDePrueba);
    apiSimulada.medirManual.mockResolvedValueOnce(medicion);
    abrir('/medir/manual');

    const grupoPh = await screen.findByRole('group', { name: 'pH' });
    const grupoCloro = screen.getByRole('group', { name: /Cloro libre/ });
    const grupoPlomo = screen.getByRole('group', { name: /Plomo/ });
    expect(within(grupoCloro).getAllByRole('button')).toHaveLength(5); // 4 niveles + "No la tiene / no se ve"
    expect(screen.getByText('0 de 3 casillas')).toBeInTheDocument();

    await userEvent.click(within(grupoPh).getByRole('button', { name: '6,8' }));
    await userEvent.click(within(grupoCloro).getByRole('button', { name: '0,5' }));
    await userEvent.click(within(grupoPlomo).getByRole('button', { name: 'No la tiene / no se ve' }));
    expect(within(grupoPh).getByRole('button', { name: '6,8' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('3 de 3 casillas')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Ver mi resultado' }));

    expect(await screen.findByText('Resultado de med-1')).toBeInTheDocument();
    expect(apiSimulada.medirManual).toHaveBeenCalledWith('hogar-1', { ph: 6.8, cloro_libre: 0.5, plomo: null });
  });

  it('no envía si no se marcó ninguna casilla', async () => {
    apiSimulada.configTira.mockResolvedValueOnce(tiraDePrueba);
    abrir('/medir/manual');
    await userEvent.click(await screen.findByRole('button', { name: 'Ver mi resultado' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Marca al menos una casilla');
    expect(apiSimulada.medirManual).not.toHaveBeenCalled();
  });

  it('si no carga la tira, deja reintentar', async () => {
    apiSimulada.configTira.mockRejectedValueOnce(new ErrorApi('Algo salió mal.', 500)).mockResolvedValueOnce(tiraDePrueba);
    abrir('/medir/manual');
    await userEvent.click(await screen.findByRole('button', { name: 'Intentar otra vez' }));
    await waitFor(() => expect(screen.getByRole('group', { name: 'pH' })).toBeInTheDocument());
  });
});

describe('medidasReducidas', () => {
  it('lleva el lado mayor a 1600 px sin deformar ni agrandar', () => {
    expect(medidasReducidas(4000, 3000)).toEqual({ ancho: 1600, alto: 1200 });
    expect(medidasReducidas(3000, 4000)).toEqual({ ancho: 1200, alto: 1600 });
    expect(medidasReducidas(800, 600)).toEqual({ ancho: 800, alto: 600 });
  });
});
