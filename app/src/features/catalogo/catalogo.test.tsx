import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Cartucho, Medicion } from '../../lib/tipos';
import { PaginaCatalogo } from './PaginaCatalogo';
import { grupoDeCategoria, leerPara, leerTipo } from './filtros';

const sesion = vi.hoisted(() => ({
  hogarId: vi.fn<() => string | null>(() => null),
  lista: vi.fn(() => [] as Array<{ codigo: string; nombre: string; cantidad: number }>),
  agregarALista: vi.fn(),
}));
const api = vi.hoisted(() => ({ cartuchos: vi.fn(), medicionesDeHogar: vi.fn() }));

vi.mock('../../lib/sesion', () => sesion);
vi.mock('../../lib/api', () => ({ api }));

function producto(codigo: string, nombre: string, categoria: string, corrige: string[] = []): Cartucho {
  return {
    codigo,
    nombre,
    marca: 'Oasis',
    precio_usd: null,
    corrige,
    es_ejemplo: false,
    foto_url: null,
    categoria,
    url_producto: null,
    disponible: true,
  };
}

const catalogo: Cartucho[] = [
  producto('CB-10', 'Cartucho de carbón', 'cartucho', ['cloro_libre', 'sabor_olor']),
  producto('SD-20', 'Cartucho de sedimentos', 'cartucho', ['sedimentos']),
  producto('FD-01', 'Filtro desbarrador', 'filtro_desbarrador', ['sedimentos']),
  producto('OI-50', 'Equipo de ósmosis inversa', 'sistema_osmosis_inversa', ['dureza', 'nitrato', 'plomo']),
  producto('UV-11', 'Lámpara UV 11W', 'lampara_uv', ['bacterias']),
  producto('PW-2045B', 'Atesador plástico', 'accesorio'),
];

const medicion: Medicion = {
  id: 'm9',
  hogar_id: 'hogar-1',
  fecha: '2026-11-21T10:00:00.000Z',
  origen: 'foto',
  valores: {},
  evaluacion: { semaforo: 'amarillo', porParametro: [], hallazgos: [], corrige: ['cloro_libre'], diasParaRecambio: null },
  sugeridos: [catalogo[0]],
};

function montar(ruta = '/catalogo') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/catalogo" element={<PaginaCatalogo />} />
      </Routes>
    </MemoryRouter>,
  );
}

function nombresVisibles() {
  return screen.queryAllByRole('heading', { level: 3 }).map((h) => h.textContent);
}

describe('PaginaCatalogo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sesion.hogarId.mockReturnValue(null);
    sesion.lista.mockReturnValue([]);
    api.cartuchos.mockResolvedValue(catalogo);
    api.medicionesDeHogar.mockResolvedValue([]);
  });

  it('muestra los productos y filtra por tipo', async () => {
    const usuario = userEvent.setup();
    montar();
    expect(await screen.findByText('6 productos')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Productos de la tienda' })).toBeInTheDocument();
    expect(screen.getAllByText('Cotizar por WhatsApp')).toHaveLength(6);
    expect(screen.getByText(/No significa que el agua quede apta para tomar/)).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Desbarradores' }));
    expect(screen.getByRole('button', { name: 'Desbarradores' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('1 producto')).toBeInTheDocument();
    expect(nombresVisibles()).toEqual(['Filtro desbarrador']);

    await usuario.click(screen.getByRole('button', { name: 'Repuestos y otros' }));
    expect(nombresVisibles()).toEqual(['Atesador plástico']);
    expect(screen.queryByText(/Pensado para:/)).not.toBeInTheDocument();
  });

  it('busca por código y muestra el vacío si no hay coincidencias', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByText('6 productos');
    const buscador = screen.getByLabelText('Buscar por nombre o código');
    await usuario.type(buscador, 'oi-50');
    expect(nombresVisibles()).toEqual(['Equipo de ósmosis inversa']);
    await usuario.clear(buscador);
    await usuario.type(buscador, 'zzz');
    expect(screen.getByText('No encontramos productos con ese filtro')).toBeInTheDocument();
  });

  it('abre filtrado desde la URL con ?para=', async () => {
    montar('/catalogo?para=dureza');
    expect(await screen.findByText('1 producto')).toBeInTheDocument();
    expect(nombresVisibles()).toEqual(['Equipo de ósmosis inversa']);
    expect(screen.getByRole('button', { name: 'Dureza' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('agrega a mi lista y el botón cambia a "Agregado"', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByText('6 productos');
    await usuario.click(screen.getByRole('button', { name: 'Agregar Cartucho de carbón a mi lista' }));
    expect(sesion.agregarALista).toHaveBeenCalledWith({ codigo: 'CB-10', nombre: 'Cartucho de carbón', cantidad: 1 });
    const boton = screen.getByRole('button', { name: 'Cartucho de carbón: agregado' });
    expect(boton).toBeDisabled();
    expect(boton).toHaveTextContent('Agregado');
  });

  it('sin medición invita a medir', async () => {
    montar();
    expect(await screen.findByText(/Mide tu agua y te decimos cuáles van con tu casa/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Medir mi agua' })).toHaveAttribute('href', '/medir');
  });

  it('con medición muestra "Recomendados para ti" con enlace al resultado', async () => {
    sesion.hogarId.mockReturnValue('hogar-1');
    api.medicionesDeHogar.mockResolvedValue([medicion]);
    montar();
    const seccion = (await screen.findByRole('heading', { name: 'Recomendados para ti' })).closest('section')!;
    expect(within(seccion).getByText('Cartucho de carbón')).toBeInTheDocument();
    expect(within(seccion).getByRole('link', { name: 'Ver por qué' })).toHaveAttribute('href', '/resultado/m9');
    await screen.findByText('6 productos');
    expect(screen.getAllByText('Recomendado para ti')).toHaveLength(2);
  });

  it('muestra error con reintento', async () => {
    const usuario = userEvent.setup();
    api.cartuchos.mockRejectedValueOnce(new Error('x'));
    montar();
    await usuario.click(await screen.findByRole('button', { name: 'Intentar otra vez' }));
    expect(await screen.findByText('6 productos')).toBeInTheDocument();
  });
});

describe('filtros', () => {
  it('lleva las categorías reales a sus grupos', () => {
    expect(grupoDeCategoria('membrana_ultrafiltracion')).toBe('ultrafiltracion');
    expect(grupoDeCategoria('membrana_osmosis')).toBe('membranas');
    expect(grupoDeCategoria('tanque_osmosis')).toBe('otros');
    expect(grupoDeCategoria('portafiltro')).toBe('filtros');
    expect(leerTipo('lampara_uv')).toBe('lamparas');
    expect(leerPara('nitrito')).toBe('nitrato');
    expect(leerPara('cualquiera')).toBe('todos');
  });
});
