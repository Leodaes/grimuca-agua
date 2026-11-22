import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Las pruebas que llenan el perfil completo tardan de 2 a 3 s solas; con la suite entera en paralelo pasaban de 5 s.
vi.setConfig({ testTimeout: 15_000 });

vi.mock('../../lib/api', () => ({
  api: {
    crearHogar: vi.fn(),
    obtenerHogar: vi.fn(),
    actualizarHogar: vi.fn(),
    tiendas: vi.fn(),
    crearPedido: vi.fn(),
    medicionesDeHogar: vi.fn(),
  },
}));

vi.mock('../../lib/sesion', () => ({
  hogarId: vi.fn(() => null),
  guardarHogarId: vi.fn(),
  vaciarLista: vi.fn(),
}));

import { api } from '../../lib/api';
import { guardarHogarId, hogarId, vaciarLista } from '../../lib/sesion';
import { Marco } from '../../Marco';
import { Bienvenida } from './Bienvenida';
import { Envio } from './Envio';
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
  await usuario.selectOptions(screen.getByLabelText('¿En qué zona vives?'), 'Naguanagua');
  // Personas con el botón + (cuatro toques), sin teclear.
  for (let i = 0; i < 4; i++) await usuario.click(screen.getByRole('button', { name: 'Una persona más' }));
  await usuario.click(screen.getByLabelText(/^Chorro/));
  const turbia = screen.getByRole('group', { name: '¿El agua a veces sale turbia o amarilla?' });
  await usuario.click(within(turbia).getByLabelText('No'));
  const filtro = screen.getByRole('group', { name: '¿Tienen filtro en casa?' });
  await usuario.click(within(filtro).getByLabelText('No'));
  await usuario.type(screen.getByLabelText('Nombre'), 'Ana');
  await usuario.type(screen.getByLabelText(/^Apellido/), 'Pérez');
  await usuario.selectOptions(screen.getByLabelText('Operadora'), '0414');
  await usuario.type(screen.getByLabelText(/^Número/), '123 4567');
}

describe('alta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
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
        nombre: 'Ana Pérez',
        zona: 'Naguanagua',
        origen_agua: 'chorro',
        personas: 4,
        tiene_filtro: false,
        whatsapp: '+584141234567',
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

  it('con filtro no pregunta las etapas y lleva a la foto del filtro antes de seguir', async () => {
    simulada.crearHogar.mockResolvedValue({ ...hogar, tiene_filtro: true, filtro: null });
    const usuario = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/perfil?ya=1']}>
        <Routes>
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/mi-filtro" element={<p>Pantalla de mi filtro</p>} />
        </Routes>
      </MemoryRouter>,
    );
    await llenarPerfil(usuario);
    await usuario.click(within(screen.getByRole('group', { name: '¿Tienen filtro en casa?' })).getByLabelText('Sí'));
    expect(screen.queryByLabelText(/etapas/)).not.toBeInTheDocument();
    expect(screen.getByText('En el siguiente paso le tomas una foto a tu filtro y lo identificamos.')).toBeInTheDocument();
    await usuario.click(within(screen.getByRole('group', { name: '¿Cuándo cambiaste el cartucho por última vez?' })).getByLabelText('No me acuerdo'));
    await usuario.click(screen.getByRole('checkbox'));
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(await screen.findByText('Pantalla de mi filtro')).toBeInTheDocument();
    expect(simulada.crearHogar).toHaveBeenCalledWith(expect.objectContaining({ tiene_filtro: true }));
  });

  it('si el agua sale de un filtro, no pregunta si tienen filtro y pasa directo al cartucho', async () => {
    simulada.crearHogar.mockResolvedValue({ ...hogar, origen_agua: 'filtro', tiene_filtro: true, filtro: null });
    const usuario = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/perfil?ya=1']}>
        <Routes>
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/mi-filtro" element={<p>Pantalla de mi filtro</p>} />
        </Routes>
      </MemoryRouter>,
    );
    await usuario.selectOptions(screen.getByLabelText('¿En qué zona vives?'), 'Naguanagua');
    for (let i = 0; i < 4; i++) await usuario.click(screen.getByRole('button', { name: 'Una persona más' }));
    await usuario.click(screen.getByLabelText(/^Filtro/));
    expect(screen.queryByRole('group', { name: '¿Tienen filtro en casa?' })).not.toBeInTheDocument();
    await usuario.click(within(screen.getByRole('group', { name: '¿El agua a veces sale turbia o amarilla?' })).getByLabelText('No'));
    await usuario.click(within(screen.getByRole('group', { name: '¿Cuándo cambiaste el cartucho por última vez?' })).getByLabelText('No me acuerdo'));
    await usuario.type(screen.getByLabelText('Nombre'), 'Ana');
    await usuario.type(screen.getByLabelText(/^Apellido/), 'Pérez');
    await usuario.selectOptions(screen.getByLabelText('Operadora'), '0414');
    await usuario.type(screen.getByLabelText(/^Número/), '123 4567');
    await usuario.click(screen.getByRole('checkbox'));
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(await screen.findByText('Pantalla de mi filtro')).toBeInTheDocument();
    expect(simulada.crearHogar).toHaveBeenCalledWith(
      expect.objectContaining({ origen_agua: 'filtro', tiene_filtro: true, ultimo_cambio: 'no_me_acuerdo' }),
    );
  });

  it.each([
    ['Hace menos de un mes', 'menos_de_un_mes'],
    ['Hace más de tres meses', 'mas_de_tres_meses'],
    ['No me acuerdo', 'no_me_acuerdo'],
  ])('con filtro, "%s" se guarda como %s (sin campo de fecha)', async (etiqueta, valor) => {
    simulada.crearHogar.mockResolvedValue({ ...hogar, tiene_filtro: true, filtro: null });
    const usuario = userEvent.setup();
    enRuta('/perfil', <Perfil />);
    await llenarPerfil(usuario);
    expect(screen.queryByRole('group', { name: '¿Cuándo cambiaste el cartucho por última vez?' })).not.toBeInTheDocument();
    await usuario.click(within(screen.getByRole('group', { name: '¿Tienen filtro en casa?' })).getByLabelText('Sí'));
    const grupo = screen.getByRole('group', { name: '¿Cuándo cambiaste el cartucho por última vez?' });
    expect(within(grupo).getAllByRole('radio').map((r) => r.closest('label')?.textContent)).toEqual([
      'Hace menos de un mes',
      'Hace más de tres meses',
      'No me acuerdo',
    ]);
    expect(document.querySelector('input[type="date"]')).toBeNull();

    await usuario.click(screen.getByRole('checkbox'));
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByText('Elige una opción.')).toBeInTheDocument();
    expect(simulada.crearHogar).not.toHaveBeenCalled();

    await usuario.click(within(grupo).getByLabelText(etiqueta));
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(simulada.crearHogar).toHaveBeenCalledWith(expect.objectContaining({ tiene_filtro: true, ultimo_cambio: valor }));
    expect(simulada.crearHogar.mock.calls[0][0]).not.toHaveProperty('fecha_ultimo_cambio');
  });

  it('WhatsApp de Venezuela: operadora + 7 dígitos, sin espacios ni guiones, y error claro', async () => {
    simulada.crearHogar.mockResolvedValue(hogar);
    const usuario = userEvent.setup();
    enRuta('/perfil', <Perfil />);
    const codigo = screen.getByLabelText('Código de país') as HTMLSelectElement;
    expect(codigo.value).toBe('58');
    expect([...codigo.options].map((o) => o.textContent)).toContain('+58 Venezuela');
    expect([...codigo.options]).toHaveLength(10);
    expect(screen.getByRole('group', { name: 'Tu WhatsApp' })).toHaveTextContent('Solo para coordinar tu pedido.');

    const operadora = screen.getByLabelText('Operadora') as HTMLSelectElement;
    expect(operadora.value).toBe('');
    expect([...operadora.options].map((o) => o.value).filter(Boolean)).toEqual(['0412', '0414', '0416', '0422', '0424', '0426']);
    const numero = screen.getByLabelText(/^Número/) as HTMLInputElement;
    expect(numero).toHaveAttribute('inputmode', 'numeric');

    await usuario.type(numero, '555-01 99');
    await usuario.tab();
    expect(numero.value).toBe('5550199');

    // Sin operadora no se guarda.
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(
      screen.getByText('Elige la operadora y escribe los 7 dígitos del número, por ejemplo 0414 y 555 01 99'),
    ).toBeInTheDocument();
    expect(simulada.crearHogar).not.toHaveBeenCalled();

    // Con 6 dígitos, al salir del campo avisa.
    await usuario.selectOptions(operadora, '0424');
    await usuario.clear(numero);
    await usuario.type(numero, '555019');
    await usuario.tab();
    expect(numero).toHaveAttribute('aria-invalid', 'true');

    // Si pega el número completo, se reparte solo.
    await usuario.clear(numero);
    await usuario.type(numero, '+58 414-555.01(99)');
    await usuario.tab();
    expect(operadora.value).toBe('0414');
    expect(numero.value).toBe('5550199');
  });

  it('WhatsApp de otro país: un solo campo; un número +57 cambia el código solo', async () => {
    const usuario = userEvent.setup();
    enRuta('/perfil', <Perfil />);
    await usuario.type(screen.getByLabelText(/^Número/), '+57 300 123 4567');
    await usuario.tab();
    expect((screen.getByLabelText('Código de país') as HTMLSelectElement).value).toBe('57');
    expect(screen.queryByLabelText('Operadora')).not.toBeInTheDocument();
    const campo = screen.getByLabelText(/^Número/) as HTMLInputElement;
    expect(campo.value).toBe('3001234567');
    expect(campo).toHaveAttribute('inputmode', 'tel');
    expect(campo).toHaveAttribute('autocomplete', 'tel-national');
  });

  it('nombre y apellido separados: se guardan como un solo nombre y el teléfono queda +58', async () => {
    simulada.crearHogar.mockResolvedValue(hogar);
    const usuario = userEvent.setup();
    enRuta('/perfil', <Perfil />);
    expect(screen.getByLabelText('Nombre')).toHaveAttribute('autocomplete', 'given-name');
    expect(screen.getByLabelText(/^Apellido/)).toHaveAttribute('autocomplete', 'family-name');
    await llenarPerfil(usuario);
    await usuario.clear(screen.getByLabelText('Nombre'));
    await usuario.type(screen.getByLabelText('Nombre'), '  Ana  ');
    await usuario.clear(screen.getByLabelText(/^Apellido/));
    await usuario.type(screen.getByLabelText(/^Apellido/), ' Pérez  Gómez ');
    await usuario.click(screen.getByRole('checkbox'));
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(simulada.crearHogar).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Ana Pérez Gómez', whatsapp: '+584141234567' }),
    );
  });

  it('el apellido es obligatorio', async () => {
    const usuario = userEvent.setup();
    enRuta('/perfil', <Perfil />);
    await llenarPerfil(usuario);
    await usuario.clear(screen.getByLabelText(/^Apellido/));
    await usuario.click(screen.getByRole('checkbox'));
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByText('Escribe tu apellido. Con uno basta.')).toBeInTheDocument();
    expect(simulada.crearHogar).not.toHaveBeenCalled();
  });

  it('perfil existente: separa nombre y apellido y la operadora del número', async () => {
    vi.mocked(hogarId).mockReturnValue('h-1');
    simulada.obtenerHogar.mockResolvedValue({ ...hogar, nombre: 'Ana María Pérez', whatsapp: '+584145550199' });
    simulada.actualizarHogar.mockResolvedValue(hogar);
    const usuario = userEvent.setup();
    enRuta('/perfil', <Perfil />);
    expect(await screen.findByDisplayValue('Ana')).toHaveAttribute('id', 'perfil-nombre');
    expect(screen.getByLabelText(/^Apellido/)).toHaveValue('María Pérez');
    expect(screen.getByLabelText('Operadora')).toHaveValue('0414');
    expect(screen.getByLabelText(/^Número/)).toHaveValue('5550199');
    // Ya aceptó al crear el hogar: no se vuelve a pedir.
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(simulada.actualizarHogar).toHaveBeenCalledWith(
      'h-1',
      expect.objectContaining({ nombre: 'Ana María Pérez', whatsapp: '+584145550199' }),
    );
  });

  it('al enviar con errores: resumen arriba con enlaces y foco en el primer error', async () => {
    const usuario = userEvent.setup();
    enRuta('/perfil', <Perfil />);
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
    const resumen = screen.getAllByRole('alert').find((a) => a.classList.contains('alta-resumen'))!;
    expect(resumen).toHaveTextContent('Faltan 9 datos para seguir:');
    const enlaces = within(resumen).getAllByRole('link').map((a) => a.textContent);
    expect(enlaces[0]).toBe('Elige tu zona');
    expect(enlaces).toContain('Marca la casilla de aceptación');
    expect(screen.getByLabelText('¿En qué zona vives?')).toHaveFocus();
    await usuario.click(within(resumen).getByRole('link', { name: 'Escribe tu apellido' }));
    expect(screen.getByLabelText(/^Apellido/)).toHaveFocus();
    // El botón no se deshabilita: sigue disponible para intentar otra vez.
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();
  });

  it('urbanización deshabilitada hasta elegir la zona; con filtro aparece su pregunta', async () => {
    const usuario = userEvent.setup();
    enRuta('/perfil', <Perfil />);
    expect(screen.getByLabelText(/^Urbanización/)).toBeDisabled();
    expect(screen.getByText('Primero elige tu zona.')).toBeInTheDocument();
    await usuario.selectOptions(screen.getByLabelText('¿En qué zona vives?'), 'San Diego');
    expect(screen.getByLabelText(/^Urbanización/)).toBeEnabled();
    expect(screen.queryByText('En el siguiente paso le tomas una foto a tu filtro y lo identificamos.')).not.toBeInTheDocument();
  });

  it('personas con − y +: sin valor por defecto, entre 1 y 20', async () => {
    const usuario = userEvent.setup();
    enRuta('/perfil', <Perfil />);
    const personas = screen.getByLabelText('¿Cuántos viven en la casa?') as HTMLInputElement;
    expect(personas.value).toBe('');
    await usuario.click(screen.getByRole('button', { name: 'Una persona menos' }));
    expect(personas.value).toBe('1');
    await usuario.click(screen.getByRole('button', { name: 'Una persona más' }));
    expect(personas.value).toBe('2');
  });

  it('lo escrito no se pierde al salir y volver (borrador de la sesión, sin el consentimiento)', async () => {
    const usuario = userEvent.setup();
    const { unmount } = enRuta('/perfil', <Perfil />);
    await usuario.type(screen.getByLabelText('Nombre'), 'Ana');
    await usuario.click(screen.getByRole('checkbox'));
    unmount();
    enRuta('/perfil', <Perfil />);
    expect(screen.getByLabelText('Nombre')).toHaveValue('Ana');
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('urbanización según la zona y mascotas: se guardan con el perfil', async () => {
    simulada.crearHogar.mockResolvedValue(hogar);
    const usuario = userEvent.setup();
    enRuta('/perfil', <Perfil />);
    await llenarPerfil(usuario);
    const urbanizacion = screen.getByLabelText(/^Urbanización/) as HTMLSelectElement;
    const opciones = [...urbanizacion.options].map((o) => o.value).filter(Boolean);
    expect(opciones).toContain('El Retobo');
    expect(opciones).not.toContain('Trigal Norte');
    expect(opciones[opciones.length - 1]).toBe('Otra');
    await usuario.selectOptions(urbanizacion, 'El Retobo');

    const mascotas = screen.getByRole('group', { name: '¿Hay mascotas en casa?' });
    expect(within(mascotas).getByLabelText('No')).toBeChecked();
    expect(screen.getByText('Ellas también toman de esa agua.')).toBeInTheDocument();
    await usuario.click(within(mascotas).getByLabelText('Sí'));

    await usuario.click(screen.getByRole('checkbox'));
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(simulada.crearHogar).toHaveBeenCalledWith(
      expect.objectContaining({ zona: 'Naguanagua', urbanizacion: 'El Retobo', mascotas: true }),
    );
  });

  it('en Valencia sur la urbanización solo ofrece "Otra"', async () => {
    const usuario = userEvent.setup();
    enRuta('/perfil', <Perfil />);
    await usuario.selectOptions(screen.getByLabelText('¿En qué zona vives?'), 'Valencia sur');
    const urbanizacion = screen.getByLabelText(/^Urbanización/) as HTMLSelectElement;
    expect([...urbanizacion.options].map((o) => o.value).filter(Boolean)).toEqual(['Otra']);
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

  it('envío: dirección con punto de referencia opcional, tienda explicada en una línea y "Atrás"', async () => {
    vi.mocked(hogarId).mockReturnValue('h-1');
    simulada.obtenerHogar.mockResolvedValue({ ...hogar, direccion: null, tienda_id: null });
    simulada.tiendas.mockResolvedValue([
      { id: 'manongo', nombre: 'Mañongo', horario: '8 a 5', direccion: 'Naguanagua' },
      { id: 'biglow', nombre: 'Big Low', horario: '8 a 5', direccion: 'San Diego' },
    ]);
    simulada.actualizarHogar.mockResolvedValue(hogar);
    const usuario = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/envio']}>
        <Routes>
          <Route path="/envio" element={<Envio />} />
          <Route path="/pago" element={<p>Pantalla de pago</p>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(
      await screen.findByText('Lo enviamos desde Grimuca Mañongo, la más cercana a tu zona; puedes cambiarla.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Atrás' })).toHaveAttribute('href', '/perfil');
    const direccion = screen.getByLabelText('Dirección de entrega');
    expect(direccion).toHaveAttribute('autocomplete', 'street-address');

    await usuario.click(screen.getByRole('button', { name: 'Continuar al pago' }));
    expect(screen.getByText('Este dato hace falta.')).toBeInTheDocument();
    expect(direccion).toHaveFocus();

    await usuario.type(direccion, 'Urb. El Retobo, calle 3, casa 12.');
    await usuario.type(screen.getByLabelText(/^Punto de referencia/), 'frente a la panadería');
    await usuario.click(screen.getByRole('button', { name: 'Cambiar tienda' }));
    await usuario.click(screen.getByLabelText(/^Big Low/));
    await usuario.click(screen.getByRole('button', { name: 'Continuar al pago' }));
    expect(simulada.actualizarHogar).toHaveBeenCalledWith('h-1', {
      direccion: 'Urb. El Retobo, calle 3, casa 12. Referencia: frente a la panadería',
      tienda_id: 'biglow',
    });
    expect(await screen.findByText('Pantalla de pago')).toBeInTheDocument();
  });

  it('envío: precarga la dirección y el punto de referencia guardados', async () => {
    vi.mocked(hogarId).mockReturnValue('h-1');
    simulada.obtenerHogar.mockResolvedValue({ ...hogar, direccion: 'Calle 3, casa 12. Referencia: portón negro' });
    simulada.tiendas.mockResolvedValue([]);
    enRuta('/envio', <Envio />);
    expect(await screen.findByLabelText('Dirección de entrega')).toHaveValue('Calle 3, casa 12');
    expect(screen.getByLabelText(/^Punto de referencia/)).toHaveValue('portón negro');
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
    // El título no lleva el nombre del hogar (va en el cuerpo).
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Listo. Tu sobre está pedido.');
    expect(screen.getByText('Gracias, Ana.')).toBeInTheDocument();
    expect(screen.getByText('Cuando el pedido salga de la tienda, su estado cambia a Despachado en la app.')).toBeInTheDocument();
  });

  it('el pago muestra el paso 3 de 3 y la ilustración del sobre (sin la foto de campaña)', async () => {
    vi.mocked(hogarId).mockReturnValue('h-1');
    simulada.obtenerHogar.mockResolvedValue(hogar);
    simulada.tiendas.mockResolvedValue([]);
    enRuta('/pago', <Pago />);
    expect(await screen.findByRole('img', { name: /El sobre de medición con la tira/ })).toBeInTheDocument();
    expect(screen.getByText('Paso 3 de 3: tu sobre')).toBeInTheDocument();
    expect(document.querySelector('img[src="/promo/sobre.jpg"]')).toBeNull();
  });
});

describe('indicador de pasos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hogarId).mockReturnValue(null);
  });

  it('perfil: paso 1 de 3 al pedir el sobre y 1 de 2 con ?ya=1', () => {
    const { unmount } = enRuta('/perfil', <Perfil />);
    expect(screen.getByText('Paso 1 de 3: tu casa')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Avance' }).querySelector('[aria-current="step"]')).not.toBeNull();
    unmount();
    enRuta('/perfil?ya=1', <Perfil />);
    expect(screen.getByText('Paso 1 de 2: tu casa')).toBeInTheDocument();
  });

  it('envío: paso 2 de 3', async () => {
    vi.mocked(hogarId).mockReturnValue('h-1');
    simulada.obtenerHogar.mockResolvedValue(hogar);
    simulada.tiendas.mockResolvedValue([]);
    enRuta('/envio', <Envio />);
    expect(await screen.findByRole('button', { name: 'Continuar al pago' })).toBeInTheDocument();
    expect(screen.getByText('Paso 2 de 3: a dónde va')).toBeInTheDocument();
  });
});

describe('portada', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hogarId).mockReturnValue(null);
  });

  function portada(ruta = '/') {
    return render(
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route element={<Marco />}>
            <Route path="/" element={<Bienvenida />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
  }

  function hero() {
    return within(screen.getByRole('region', { name: /Saber qué tomas empieza en casa/ }));
  }

  it('sin hogar: página de venta con el lema, el título original y los dos caminos', () => {
    portada();
    const titulo = screen.getByRole('heading', { level: 1 });
    expect(titulo).toHaveTextContent('Descubre la calidad del agua de tu casa');
    expect(titulo).toHaveTextContent('Saber qué tomas empieza en casa');
    expect(screen.getAllByText('Medición orientativa con tira. No es un análisis de laboratorio.').length).toBeGreaterThan(0);

    const pedir = hero().getByRole('link', { name: 'Pedir el sobre a domicilio ($9)' });
    const ya = hero().getByRole('link', { name: 'Ya tengo mi sobre' });
    expect(pedir).toHaveAttribute('href', '/perfil');
    expect(pedir).toHaveClass('g-boton--primario');
    expect(ya).toHaveAttribute('href', '/perfil?ya=1');
    expect(ya).not.toHaveClass('g-boton--primario');

    // Sin barra de navegación: en su lugar, la barra fija de compra.
    expect(screen.queryByRole('navigation', { name: 'Navegación principal' })).not.toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Comprar el sobre' })).toBeInTheDocument();
    expect(simulada.medicionesDeHogar).not.toHaveBeenCalled();
  });

  it('sin hogar: muestra las cifras de botellones, el sobre, la muestra del resultado y las dudas', () => {
    portada();
    expect(screen.getByRole('heading', { name: '¿Cuánto se te va en botellones?' })).toBeInTheDocument();
    expect(screen.getByText('Hasta $576')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Qué trae el sobre' })).toBeInTheDocument();
    expect(screen.getByText('Ejemplo')).toBeInTheDocument();
    expect(screen.getByText('¿Es difícil hacer la prueba?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Aviso de privacidad' })).toHaveAttribute('href', '/privacidad');
    expect(document.body.textContent ?? '').not.toMatch(/potable|vive tranquilo/i);
  });

  it('con ?sobre=1 el botón principal pasa a ser "Ya tengo mi sobre"', () => {
    portada('/?sobre=1');
    expect(hero().getByRole('link', { name: 'Ya tengo mi sobre' })).toHaveClass('g-boton--primario');
    expect(hero().getByRole('link', { name: 'Pedir el sobre a domicilio ($9)' })).not.toHaveClass('g-boton--primario');
  });

  it('con hogar: tablero con saludo, último resultado y accesos, y la barra de navegación', async () => {
    vi.mocked(hogarId).mockReturnValue('h-1');
    simulada.obtenerHogar.mockResolvedValue(hogar);
    simulada.medicionesDeHogar.mockResolvedValue([
      {
        id: 'm-7',
        hogar_id: 'h-1',
        fecha: '2026-11-20T10:00:00Z',
        origen: 'foto',
        valores: {},
        evaluacion: { semaforo: 'amarillo', porParametro: [], hallazgos: [], corrige: [], diasParaRecambio: null },
        sugeridos: [],
      },
    ]);
    portada();
    expect(await screen.findByRole('heading', { level: 1, name: 'Hola, Ana' })).toBeInTheDocument();
    expect(await screen.findByText('Amarillo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver el detalle/ })).toHaveAttribute('href', '/resultado/m-7');
    expect(screen.getByRole('link', { name: 'Medir mi agua' })).toHaveAttribute('href', '/medir');
    for (const nombre of [
      'Ver mis resultados',
      'Mi filtro',
      'Productos de la tienda',
      'Tutoriales para cambiar tu cartucho',
      'Pedir el sobre a domicilio ($9)',
    ]) {
      expect(screen.getByRole('link', { name: nombre })).toBeInTheDocument();
    }
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'Comprar el sobre' })).not.toBeInTheDocument();
  });

  it('con hogar: "Cerrar sesión" pide confirmar, olvida el perfil y vuelve a la portada', async () => {
    vi.mocked(hogarId).mockReturnValue('h-1');
    simulada.obtenerHogar.mockResolvedValue(hogar);
    simulada.medicionesDeHogar.mockResolvedValue([]);
    const ir = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign: ir });
    const usuario = userEvent.setup();
    portada();
    await usuario.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));
    expect(guardarHogarId).not.toHaveBeenCalledWith(null);
    await usuario.click(screen.getByRole('button', { name: 'Sí, cerrar sesión' }));
    expect(guardarHogarId).toHaveBeenCalledWith(null);
    expect(vaciarLista).toHaveBeenCalled();
    expect(ir).toHaveBeenCalledWith('/');
    vi.unstubAllGlobals();
  });

  it('con hogar y sin mediciones: "Aún no has medido"', async () => {
    vi.mocked(hogarId).mockReturnValue('h-1');
    simulada.obtenerHogar.mockResolvedValue(hogar);
    simulada.medicionesDeHogar.mockResolvedValue([]);
    portada();
    expect(await screen.findByText('Aún no has medido')).toBeInTheDocument();
  });
});
