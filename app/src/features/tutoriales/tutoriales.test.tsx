import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { rutasTutoriales } from './rutas';
import { manana } from './PaginaExperto';
import { TUTORIALES } from './contenido';

const sesion = vi.hoisted(() => ({ hogarId: vi.fn<() => string | null>(() => 'hogar-1') }));
const api = vi.hoisted(() => ({
  tiendas: vi.fn(),
  obtenerHogar: vi.fn(),
  crearPedido: vi.fn(),
  actualizarHogar: vi.fn(),
}));

vi.mock('../../lib/sesion', () => sesion);
vi.mock('../../lib/api', () => ({ api }));

function montar(ruta: string) {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        {rutasTutoriales.map((r) => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}
        <Route path="/pedido/:id" element={<p>Confirmación del pedido</p>} />
        <Route path="/perfil" element={<p>Perfil</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  sesion.hogarId.mockReturnValue('hogar-1');
  api.tiendas.mockResolvedValue([
    { id: 'manongo', nombre: 'Mañongo', horario: '8 a 4', direccion: null },
    { id: 'biglow', nombre: 'Big Low', horario: '8 a 4', direccion: null },
  ]);
  api.obtenerHogar.mockResolvedValue({ id: 'hogar-1', tienda_id: 'biglow', direccion: 'Calle 5, casa 8' });
  api.crearPedido.mockResolvedValue({ id: 77 });
  api.actualizarHogar.mockResolvedValue({ id: 'hogar-1' });
});

describe('tutoriales', () => {
  it('la lista muestra las 4 guías con duración y nivel', () => {
    montar('/tutoriales');
    expect(screen.getByRole('heading', { level: 1, name: 'Aprende a cambiar tus cartuchos' })).toBeInTheDocument();
    for (const t of TUTORIALES) {
      expect(screen.getByRole('heading', { name: t.titulo })).toBeInTheDocument();
    }
    expect(screen.getAllByRole('link', { name: /Ver la guía/ })).toHaveLength(4);
    expect(screen.getByText('6 min · Nivel: Intermedio')).toBeInTheDocument();
  });

  it('una guía muestra sus pasos, la nota del fabricante y el botón del experto', async () => {
    const usuario = userEvent.setup();
    montar('/tutoriales/sedimentos');
    expect(screen.getByRole('heading', { level: 1, name: 'Cómo cambiar el cartucho de sedimentos' })).toBeInTheDocument();
    expect(screen.getAllByText('Video de demostración: disponible pronto').length).toBeGreaterThan(0);
    expect(screen.getByText('Llave del portafiltro')).toBeInTheDocument();

    const pasos = screen.getByRole('list', { name: /Pasos:/ });
    expect(pasos.querySelectorAll('li')).toHaveLength(10);
    expect(pasos).toHaveTextContent('Cierra la llave de paso');
    expect(pasos).toHaveTextContent('Deja correr el agua unos 5 minutos antes de usarla');
    expect(screen.getByText('Guía general. Sigue siempre el manual del fabricante de tu filtro.')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: '¿No sabes hacerlo? Contrata a un experto' })).toHaveAttribute(
      'href',
      '/experto?servicio=cambio',
    );

    await usuario.click(screen.getByRole('button', { name: 'Ya lo cambié: anotar la fecha de hoy' }));
    expect(api.actualizarHogar).toHaveBeenCalledWith('hogar-1', {
      tiene_filtro: true,
      fecha_ultimo_cambio: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    });
    expect(await screen.findByText('Listo. Te avisamos aquí cuando toque el próximo cambio.')).toBeInTheDocument();
  });

  it('sin hogar en sesión no ofrece anotar la fecha', () => {
    sesion.hogarId.mockReturnValue(null);
    montar('/tutoriales/carbon');
    expect(screen.queryByRole('button', { name: /Ya lo cambié/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '¿No sabes hacerlo? Contrata a un experto' })).toBeInTheDocument();
  });
});

describe('contratar a un experto', () => {
  it('envía un pedido de tipo servicio con la dirección y la tienda del hogar', async () => {
    const usuario = userEvent.setup();
    montar('/experto?servicio=cambio');
    expect(screen.getByRole('heading', { level: 1, name: 'Un experto lo hace por ti' })).toBeInTheDocument();
    const direccion = await screen.findByLabelText(/Dirección/);
    expect(direccion).toHaveValue('Calle 5, casa 8');
    expect(screen.getByRole('radio', { name: /Cambiar el cartucho/ })).toBeChecked();
    expect(screen.getByText('Desde $30')).toBeInTheDocument();
    expect(screen.getByText('De $40 a $60')).toBeInTheDocument();
    expect(screen.getByLabelText(/Fecha preferida/)).toHaveAttribute('min', manana());

    await usuario.click(screen.getByRole('radio', { name: /En la tarde/ }));
    await usuario.type(screen.getByLabelText(/Nota para el técnico/), 'Portón negro');
    await usuario.click(screen.getByRole('button', { name: 'Pedir el servicio' }));

    expect(api.crearPedido).toHaveBeenCalledWith({
      hogar_id: 'hogar-1',
      tipo: 'servicio',
      servicio: 'cambio_cartucho',
      fecha_preferida: manana(),
      momento: 'tarde',
      nota: 'Portón negro',
      cartucho_codigo: null,
      modalidad: 'envio',
      direccion: 'Calle 5, casa 8',
      tienda_id: 'biglow',
    });
    expect(await screen.findByText('Confirmación del pedido')).toBeInTheDocument();
  });

  it('sin hogar en sesión manda a llenar los datos', () => {
    sesion.hogarId.mockReturnValue(null);
    montar('/experto');
    expect(screen.getByRole('link', { name: 'Llenar mis datos' })).toHaveAttribute('href', '/perfil?ya=1');
  });
});
