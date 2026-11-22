import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ClaveParametro, Hogar, Medicion, Nivel } from '../../lib/tipos';
import { LINEA_FIJA_CONSECUENCIAS } from './consecuencias';
import { PaginaResultado } from './PaginaResultado';

const sesion = vi.hoisted(() => ({
  hogarId: vi.fn(() => 'hogar-1'),
  lista: vi.fn(() => [] as Array<{ codigo: string; nombre: string; cantidad: number }>),
  agregarALista: vi.fn(),
  cambiarCantidad: vi.fn(),
  quitarDeLista: vi.fn(),
  vaciarLista: vi.fn(),
}));
const api = vi.hoisted(() => ({
  medicion: vi.fn(),
  medicionesDeHogar: vi.fn(),
  obtenerHogar: vi.fn(),
  tiendas: vi.fn(),
}));

vi.mock('../../lib/sesion', () => sesion);
vi.mock('../../lib/api', () => ({ api }));

const MOTIVO =
  'Te recomendamos este cartucho de carbón porque tu medición dio Cloro libre en Amarillo. Está pensado para esa casilla.';

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
    {
      codigo: 'OA-01',
      nombre: 'Cartucho de carbón',
      marca: 'Oasis',
      precio_usd: null,
      corrige: ['cloro_libre', 'sabor_olor'],
      es_ejemplo: false,
      foto_url: 'https://grimuca.com/foto-oa-01.png',
      categoria: 'cartucho',
      url_producto: null,
      disponible: true,
      motivo: MOTIVO,
      atiende: [
        { clave: 'cloro_libre', nombre: 'Cloro libre', nivel: 'amarillo' },
        { clave: 'filtro', nombre: 'Tu filtro', nivel: null },
      ],
    },
    {
      codigo: 'OA-02',
      nombre: 'Cartucho de sedimentos',
      marca: 'Oasis',
      precio_usd: null,
      corrige: ['sedimentos'],
      es_ejemplo: false,
      foto_url: null,
      categoria: 'cartucho',
      url_producto: null,
      disponible: true,
      motivo: 'Te recomendamos este cartucho de sedimentos porque nos dijiste que el agua sale turbia.',
      atiende: [],
    },
  ],
};

const medicionAmarilla: Medicion = {
  ...medicionVerde,
  evaluacion: {
    ...medicionVerde.evaluacion,
    semaforo: 'amarillo',
    porParametro: [
      { clave: 'cloro_libre', nombre: 'Cloro', unidad: 'mg/L', valor: 4, nivel: 'amarillo', frase: '', orientativo: false },
      { clave: 'plomo', nombre: 'Plomo', unidad: 'ppb', valor: 15, nivel: 'rojo', frase: '', orientativo: true },
    ],
  },
};

const hogar: Hogar = {
  id: 'hogar-1',
  nombre: 'Ana',
  zona: 'Naguanagua',
  origen_agua: 'chorro',
  personas: 4,
  tiene_filtro: true,
  etapas_filtro: 3,
  fecha_ultimo_cambio: '2026-11-06',
  agua_turbia: false,
  whatsapp: '+584145550199',
  direccion: null,
  tienda_id: 'manongo',
  urbanizacion: null,
  mascotas: false,
  ultimo_cambio: 'menos_de_un_mes',
  consentimiento_fecha: '2026-11-21T10:00:00.000Z',
  filtro: null,
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

function textoDelEnlace(enlace: HTMLElement): string {
  const url = new URL(enlace.getAttribute('href') ?? '');
  return url.searchParams.get('text') ?? '';
}

describe('PaginaResultado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.medicion.mockResolvedValue(medicionVerde);
    api.obtenerHogar.mockRejectedValue(new Error('sin red'));
    api.tiendas.mockResolvedValue([]);
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

  it('muestra colores, qué mide cada casilla, el pie, el recambio y el WhatsApp de la tienda', async () => {
    montar();
    expect(await screen.findByText('Esta prueba es una orientación, no un análisis de laboratorio, y no certifica que el agua sea apta para tomar.')).toBeInTheDocument();
    expect(screen.getAllByText('Verde').length).toBeGreaterThan(0);
    expect(screen.queryByText('En rango')).not.toBeInTheDocument();
    expect(screen.getByText('Es lo que se usa para desinfectar el agua. Si hay mucho, cambia el sabor y el olor.')).toBeInTheDocument();
    expect(screen.getByText('Pueden venir de las tuberías. La tira solo marca una posible presencia: confirma con un laboratorio.')).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('Con esto no se juega');
    // El aviso "Tu cartucho" y el paso "Revisa el recambio de tu filtro" lo dicen.
    expect(screen.getAllByText(/Te toca cambiar el cartucho en 30 días/)).toHaveLength(2);
    // Todo en verde: "Qué hacer hoy" empieza por volver a medir, con el recordatorio de calendario.
    const hoy = screen.getByRole('list', { name: 'Qué hacer hoy' });
    expect(within(hoy).getByRole('heading', { name: 'Paso 1: Vuelve a medir en 3 meses' })).toBeInTheDocument();
    expect(within(hoy).getByRole('button', { name: /Recuérdame cuándo hacer mi próxima medición/ })).toBeInTheDocument();
    const cotizar = screen.getAllByRole('link', { name: 'Cotizar por WhatsApp' })[0];
    expect(cotizar.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/584144409396\?text=.*OA-01/);
    expect(screen.getAllByText('El precio te lo confirma la tienda por WhatsApp, sin compromiso.')).toHaveLength(2);
  });

  it('cada sugerido muestra "Por qué te lo recomendamos", sus chips y la foto; el primero es la mejor opción', async () => {
    montar();
    expect(await screen.findByRole('heading', { name: 'Lo que te recomendamos' })).toBeInTheDocument();
    expect(screen.getByText('Según tu resultado y lo que nos contaste de tu casa.')).toBeInTheDocument();
    const mejor = screen.getByRole('article', { name: /La mejor opción para tu casa/ });
    expect(within(mejor).getByText('La mejor opción para tu casa')).toBeInTheDocument();
    expect(within(mejor).getByRole('heading', { name: 'Por qué te lo recomendamos' })).toBeInTheDocument();
    expect(within(mejor).getByText(MOTIVO)).toBeInTheDocument();
    expect(within(mejor).getByText('Cloro libre · Amarillo')).toBeInTheDocument();
    expect(within(mejor).getByText('Tu filtro')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Por qué te lo recomendamos' })).toHaveLength(2);

    const foto = mejor.querySelector('img')!;
    expect(foto).toHaveAttribute('src', 'https://grimuca.com/foto-oa-01.png');
    expect(foto).toHaveAttribute('loading', 'lazy');
    fireEvent.error(foto);
    expect(within(mejor).getByText('Foto no disponible')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Ver todos los productos de la tienda' })).toHaveAttribute('href', '/catalogo');
  });

  it('agrega el sugerido a la lista', async () => {
    montar();
    const boton = (await screen.findAllByRole('button', { name: 'Agregar a mi lista' }))[0];
    await userEvent.click(boton);
    expect(sesion.agregarALista).toHaveBeenCalledWith({ codigo: 'OA-01', nombre: 'Cartucho de carbón', cantidad: 1 });
    expect(screen.getByRole('button', { name: 'Agregado' })).toBeDisabled();
    const aviso = screen.getByText(/quedó en tu lista/);
    expect(within(aviso).getByRole('link', { name: 'Ver mi lista' })).toHaveAttribute('href', '/lista');
  });

  it('el mensaje de WhatsApp lleva los datos del hogar y la medición, y se puede editar', async () => {
    api.medicion.mockResolvedValue(medicionAmarilla);
    api.obtenerHogar.mockResolvedValue(hogar);
    api.tiendas.mockResolvedValue([{ id: 'manongo', nombre: 'Mañongo', horario: '', direccion: null }]);
    montar();
    await screen.findAllByText(/porque tu medición dio Cloro libre/);
    const enlace = () => screen.getAllByRole('link', { name: 'Cotizar por WhatsApp' })[0];
    await vi.waitFor(() => expect(textoDelEnlace(enlace())).toContain('¿Tienen en Grimuca Mañongo?'));
    expect(textoDelEnlace(enlace())).toBe(
      'Hola, soy Ana, de Naguanagua. Medí mi agua con el sobre de Grimuca Agua el 21 de noviembre de 2026. ' +
        'Casillas para vigilar o atender: Cloro: Amarillo, Plomo: Rojo (orientativo). ' +
        'Somos 4 en casa y tenemos un filtro de 3 etapas. Quiero cotizar: Cartucho de carbón (código OA-01). ¿Tienen en Grimuca Mañongo?',
    );

    const campo = screen.getAllByLabelText('Tu mensaje para la tienda')[0];
    fireEvent.change(campo, { target: { value: 'Hola, quiero el cartucho' } });
    expect(textoDelEnlace(enlace())).toBe('Hola, quiero el cartucho');
    // Hogar con "menos de un mes" y días por delante: sin aviso de recambio.
    expect(screen.queryByText(/Te toca cambiar el cartucho/)).not.toBeInTheDocument();
  });

  it('sin sugeridos y con filtro: "Lo que sigue" con el recambio por WhatsApp', async () => {
    api.medicion.mockResolvedValue({ ...medicionVerde, sugeridos: [] });
    api.obtenerHogar.mockResolvedValue({ ...hogar, ultimo_cambio: 'no_me_acuerdo', fecha_ultimo_cambio: null });
    montar();
    expect(await screen.findByRole('heading', { name: 'Lo que sigue' })).toBeInTheDocument();
    const recambio = await screen.findByRole('link', { name: 'Cotizar el recambio de mi filtro por WhatsApp' });
    expect(textoDelEnlace(recambio)).toBe(
      'Hola, soy Ana, de Naguanagua. Tengo un filtro de 3 etapas y no me acuerdo cuándo fue el último cambio de cartucho. ' +
        'Mi medición del 21 de noviembre de 2026: Todas las casillas medidas salieron en Verde. Quiero cotizar el recambio.',
    );
    expect(screen.getByText(/Como no recuerdas el último cambio, conviene revisarlo\./)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cotizar el recambio' })).toHaveAttribute('href', '#titulo-sugeridos');
    expect(screen.getByRole('link', { name: '¿Dudas? Pasa por la tienda y lo vemos contigo.' })).toBeInTheDocument();
  });

  it('caso del dueño (plomo, cobre y nitrito en rojo; pH en amarillo): conclusión, consecuencias y qué hacer hoy', async () => {
    const fila = (clave: ClaveParametro, nombre: string, unidad: string, valor: number, nivel: Nivel) => ({
      clave,
      nombre,
      unidad,
      valor,
      nivel,
      frase: '',
      orientativo: clave === 'plomo' || clave === 'cobre',
    });
    const medicionDueno: Medicion = {
      ...medicionVerde,
      evaluacion: {
        ...medicionVerde.evaluacion,
        semaforo: 'rojo',
        porParametro: [
          fila('alcalinidad', 'Alcalinidad', 'mg/L', 80, 'verde'),
          fila('dureza', 'Dureza', 'mg/L', 50, 'verde'),
          fila('cobre', 'Cobre', 'mg/L', 2, 'rojo'),
          fila('nitrato', 'Nitrato', 'mg/L', 0, 'verde'),
          fila('cloro_libre', 'Cloro libre', 'mg/L', 1, 'verde'),
          fila('plomo', 'Plomo', 'ppb', 15, 'rojo'),
          fila('ph', 'pH', '', 6.2, 'amarillo'),
          fila('nitrito', 'Nitrito', 'mg/L', 5, 'rojo'),
          fila('hierro', 'Hierro', 'mg/L', 0, 'verde'),
        ],
      },
    };
    api.medicion.mockResolvedValue(medicionDueno);
    api.obtenerHogar.mockResolvedValue({ ...hogar, mascotas: true, ultimo_cambio: 'mas_de_tres_meses' });
    montar();

    const conclusion = await screen.findByRole('region', { name: 'Tu conclusión' });
    await vi.waitFor(() =>
      expect(conclusion).toHaveTextContent(
        'Tu agua necesita atención en 3 cosas: plomo, cobre y nitrito. Lo primero es no usarla para tomar ni cocinar mientras la confirmas con un laboratorio. Son 4 en casa y tienen mascotas: ellas también toman de esa agua.',
      ),
    );

    const siNo = screen.getByRole('region', { name: 'Si no haces nada' });
    const lineas = within(siNo).getAllByRole('listitem');
    expect(lineas.map((l) => l.querySelector('.resultado-consecuencia__nombre')?.textContent)).toEqual(['Plomo', 'Cobre', 'Nitrito', 'pH']);
    expect(lineas[0]).toHaveTextContent('Rojo');
    expect(lineas[0]).toHaveTextContent('(OMS, EPA).');
    expect(lineas[3]).toHaveTextContent('Amarillo');
    expect(within(siNo).getByText(LINEA_FIJA_CONSECUENCIAS)).toBeInTheDocument();

    const hoy = screen.getByRole('list', { name: 'Qué hacer hoy' });
    const pasos = within(hoy).getAllByRole('heading', { level: 3 });
    expect(pasos.map((h) => h.textContent)).toEqual([
      'Paso 1: Protege a tu familia hoy',
      'Paso 2: Confírmalo con un laboratorio',
      'Paso 3: Elige la opción para tu casa',
    ]);
    expect(hoy).toHaveTextContent('hervir no quita el plomo ni el cobre, y el nitrito se concentra (EPA).');
    expect(within(hoy).getByText(MOTIVO)).toBeInTheDocument();
    expect(within(hoy).getByRole('button', { name: 'Agregar a mi lista' })).toBeInTheDocument();
    expect(within(hoy).getByRole('link', { name: 'Cotizar por WhatsApp' })).toBeInTheDocument();

    // Casillas: una frase corta y lo largo plegado; ya no está "Qué encontramos".
    expect(screen.getByRole('heading', { name: 'Tu agua, casilla por casilla' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Qué encontramos' })).not.toBeInTheDocument();
    expect(screen.getAllByText('Qué mide y por qué importa').length).toBe(9);
    expect(screen.getByRole('heading', { name: 'Lo que te recomendamos' })).toBeInTheDocument();
    expect(
      screen.getByText('Esta tira no mide todo. Un buen resultado no significa que el agua sea apta para tomar.'),
    ).toBeInTheDocument();

    const texto = (document.body.textContent ?? '').toLowerCase();
    expect(texto).not.toMatch(/potable|segura|te vas a enfermar|tu agua tiene plomo/);
  });

  it('hogar sin filtro: puerta al filtro por WhatsApp', async () => {
    api.obtenerHogar.mockResolvedValue({ ...hogar, tiene_filtro: false, ultimo_cambio: null, etapas_filtro: null, zona: 'Otra' });
    montar();
    expect(await screen.findByRole('heading', { name: '¿Todavía no tienes filtro?' })).toBeInTheDocument();
    const enlace = screen.getByRole('link', { name: 'Preguntar por filtros por WhatsApp' });
    expect(textoDelEnlace(enlace)).toBe(
      'Hola, soy Ana. Somos 4 en casa y no tenemos filtro. Mi medición del 21 de noviembre de 2026: ' +
        'Todas las casillas medidas salieron en Verde. ¿Qué filtros tienen y cuánto cuestan?',
    );
    expect(screen.queryByText(/Te toca cambiar el cartucho/)).not.toBeInTheDocument();
  });
});
