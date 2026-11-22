import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { hoyLocal, sumarDias } from '../../lib/recordatorios';
import type { Hogar } from '../../lib/tipos';
import { RecordatorioMedicion, SeccionCartucho, cambiosDeRegistro } from './CambioCartucho';

const sesion = vi.hoisted(() => ({ hogarId: vi.fn<() => string | null>(() => 'hogar-1') }));
const api = vi.hoisted(() => ({
  obtenerHogar: vi.fn(),
  actualizarHogar: vi.fn(),
  filtroDeHogar: vi.fn(),
}));
vi.mock('../../lib/sesion', () => sesion);
vi.mock('../../lib/api', () => ({ api }));

const hogar = {
  id: 'hogar-1',
  nombre: 'Ana',
  tienda_id: 'manongo',
  tiene_filtro: true,
  etapas_filtro: 2,
  fecha_ultimo_cambio: null,
  agua_turbia: false,
  personas: 3,
} as unknown as Hogar;

function montar(elemento: JSX.Element) {
  return render(<MemoryRouter>{elemento}</MemoryRouter>);
}

beforeEach(() => {
  vi.clearAllMocks();
  api.obtenerHogar.mockResolvedValue(hogar);
  api.filtroDeHogar.mockResolvedValue({ filtro: null, cartuchos: [{ nombre: 'Sedimentos 10"' }, { nombre: 'Carbón en bloque' }] });
  api.actualizarHogar.mockImplementation(async (_id: string, cambios: Partial<Hogar>) => ({ ...hogar, ...cambios }));
});

describe('cambiosDeRegistro', () => {
  it('marca "menos de un mes" solo si la fecha es de los últimos 30 días', () => {
    expect(cambiosDeRegistro('2026-11-10', null, '2026-11-22')).toEqual({
      tiene_filtro: true,
      fecha_ultimo_cambio: '2026-11-10',
      ultimo_cambio: 'menos_de_un_mes',
    });
    expect(cambiosDeRegistro('2026-09-30', 'Sedimentos', '2026-11-22')).toMatchObject({
      ultimo_cambio: null,
      ultimo_cartucho: 'Sedimentos',
    });
    expect(cambiosDeRegistro('2026-01-01', '  ', '2026-11-22')).toEqual({
      tiene_filtro: true,
      fecha_ultimo_cambio: '2026-01-01',
      ultimo_cambio: 'mas_de_tres_meses',
    });
  });
});

describe('Registrar cambio de cartucho', () => {
  it('sin fecha pide registrarla; guarda con fecha y cartucho, confirma y ofrece el recordatorio', async () => {
    const usuario = userEvent.setup();
    montar(<SeccionCartucho />);
    expect(
      await screen.findByText('Para crear el recordatorio de cambio de cartucho, primero registra cuándo lo cambiaste.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Crear recordatorio de cambio de cartucho' })).not.toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Registrar cambio de cartucho' }));
    const fecha = screen.getByLabelText(/¿Qué día lo cambiaste\?/);
    expect(fecha).toHaveValue(hoyLocal());
    expect(fecha).toHaveAttribute('max', hoyLocal());

    // No se acepta una fecha futura.
    await usuario.clear(fecha);
    await usuario.type(fecha, sumarDias(hoyLocal(), 2));
    await usuario.click(screen.getByRole('button', { name: 'Guardar el cambio' }));
    expect(await screen.findByText('La fecha no puede ser después de hoy.')).toBeInTheDocument();
    expect(api.actualizarHogar).not.toHaveBeenCalled();

    const ayer = sumarDias(hoyLocal(), -1);
    await usuario.clear(fecha);
    await usuario.type(fecha, ayer);
    await usuario.selectOptions(await screen.findByLabelText(/¿Cuál cartucho cambiaste\?/), 'Sedimentos 10"');
    await usuario.click(screen.getByRole('button', { name: 'Guardar el cambio' }));

    expect(api.actualizarHogar).toHaveBeenCalledWith('hogar-1', {
      tiene_filtro: true,
      fecha_ultimo_cambio: ayer,
      ultimo_cambio: 'menos_de_un_mes',
      ultimo_cartucho: 'Sedimentos 10"',
    });
    expect(await screen.findByText(/^Listo\. Registramos el cambio del \d+ de \S+ de \d{4}\.$/)).toBeInTheDocument();
    expect(screen.getAllByText(/Registramos el cambio de cartucho del/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Crear recordatorio de cambio de cartucho' })).toHaveLength(1);
  });

  it('sin cartuchos compatibles ofrece texto libre', async () => {
    api.filtroDeHogar.mockResolvedValue({ filtro: null, cartuchos: [] });
    const usuario = userEvent.setup();
    montar(<SeccionCartucho hogar={{ ...hogar, fecha_ultimo_cambio: '2026-11-01' }} />);
    expect(screen.getByRole('button', { name: 'Crear recordatorio de cambio de cartucho' })).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Registrar cambio de cartucho' }));
    await usuario.type(screen.getByRole('textbox', { name: /¿Cuál cartucho cambiaste\?/ }), 'Carbón');
    await usuario.click(screen.getByRole('button', { name: 'Guardar el cambio' }));
    expect(api.actualizarHogar).toHaveBeenCalledWith('hogar-1', expect.objectContaining({ ultimo_cartucho: 'Carbón' }));
  });
});

describe('BotonRecordatorio', () => {
  it('abre el panel con la fecha en palabras, Google Calendar y el .ics, y el texto de prudencia', async () => {
    const usuario = userEvent.setup();
    montar(<RecordatorioMedicion hogar={hogar} ultimaMedicion="2026-11-24" />);
    expect(screen.getByText(/Tu próxima medición:/)).toHaveTextContent('el lunes 22 de febrero de 2027');
    const boton = screen.getByRole('button', { name: 'Recuérdame cuándo hacer mi próxima medición' });
    expect(boton).toHaveAttribute('aria-expanded', 'false');
    await usuario.click(boton);
    expect(boton).toHaveAttribute('aria-expanded', 'true');
    const panel = screen.getByRole('group', { name: 'Dónde guardar el recordatorio' });
    const google = within(panel).getByRole('link', { name: 'Google Calendar' });
    expect(google).toHaveAttribute('target', '_blank');
    expect(google.getAttribute('href')).toContain('dates=20270222%2F20270223');
    const ics = within(panel).getByRole('link', { name: 'Calendario del teléfono (.ics)' });
    expect(ics).toHaveAttribute('download', 'recordatorio-grimuca-agua.ics');
    expect(ics.getAttribute('href')).toMatch(/^(blob:|data:text\/calendar)/);
    expect(panel).toHaveTextContent('Te lo recordamos el lunes 22 de febrero de 2027.');
    expect(panel).toHaveTextContent('Te lo recordamos en tu calendario y por WhatsApp (en la demo, el WhatsApp es simulado).');

    ics.addEventListener('click', (e) => e.preventDefault());
    await usuario.click(ics);
    expect(panel).toHaveTextContent('Listo: te escribiremos el lunes 22 de febrero de 2027 para recordarte tu próxima medición.');
  });
});
