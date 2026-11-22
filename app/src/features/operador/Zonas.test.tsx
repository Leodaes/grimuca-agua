import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { UrbanizacionMapa } from '../../lib/tipos';
import { ProveedorServicios, type ServiciosOperador } from './contexto';
import { etiquetaCorta } from './mapaHex';
import { Zonas } from './Zonas';

function urb(cambios: Partial<UrbanizacionMapa> & Pick<UrbanizacionMapa, 'id' | 'nombre'>): UrbanizacionMapa {
  return {
    zona: 'Naguanagua',
    col: 1,
    fila: 1,
    en_tablero: true,
    grupo: null,
    verificada: true,
    tiendas: [],
    lat: 10.25,
    lng: -68.01,
    hogares: 0,
    hogares_con_medicion_30_dias: 0,
    hogares_en_rojo_7_dias: 0,
    estado: 'sin_clientes',
    alerta: false,
    parametros: [],
    pedidos_pendientes: 0,
    ...cambios,
  };
}

const MAPA: UrbanizacionMapa[] = [
  urb({
    id: 'el-retobo',
    nombre: 'El Retobo',
    col: 2,
    fila: 1,
    hogares: 4,
    hogares_con_medicion_30_dias: 4,
    hogares_en_rojo_7_dias: 3,
    estado: 'rojo',
    alerta: true,
    parametros: ['nitrato'],
    pedidos_pendientes: 2,
  }),
  urb({ id: 'manongo', nombre: 'Mañongo', col: 1, fila: 3, tiendas: ['manongo'], lat: 10.234, lng: -67.998 }),
  urb({
    id: 'trigal-norte',
    nombre: 'Trigal Norte',
    zona: 'Valencia norte',
    col: 1,
    fila: 5,
    lat: 10.228,
    lng: -67.997,
    hogares: 4,
    hogares_con_medicion_30_dias: 3,
    estado: 'verde',
  }),
  urb({ id: 'otras-naguanagua', nombre: 'Otras de Naguanagua', col: null, fila: null, lat: null, lng: null, en_tablero: false, hogares: 1, estado: 'sin_medicion' }),
];

function montar() {
  const servicios: ServiciosOperador = {
    leerToken: () => 't',
    guardarToken: vi.fn(),
    entrar: vi.fn(async () => 't'),
    pedidosPendientes: vi.fn(async () => []),
    despachar: vi.fn(),
    resumen: vi.fn(async () => []),
    inventario: vi.fn(async () => []),
    zonas: vi.fn(async () => [{ zona: 'Naguanagua', hogares_en_rojo_7_dias: 3, alerta: true, parametros: ['nitrato'] }]),
    mapa: vi.fn(async () => MAPA),
    enVivo: () => () => undefined,
  };
  const vista = render(
    <ProveedorServicios servicios={servicios}>
      <MemoryRouter>
        <Zonas token="t" version={0} alNoAutorizado={vi.fn()} />
      </MemoryRouter>
    </ProveedorServicios>,
  );
  return { servicios, ...vista };
}

describe('pestaña Zonas: mapa real (por defecto)', () => {
  it('muestra un círculo por urbanización con letra y color, y la tienda; al tocarlo abre el detalle', async () => {
    const usuario = userEvent.setup();
    const { container } = montar();
    expect(await screen.findByRole('region', { name: 'Mapa de resultados de la tira por urbanización' })).toBeInTheDocument();
    expect(screen.getByText('Resultados de la tira por urbanización y dónde hay (o no hay) clientes.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resultados de la tira' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText(/calidad del agua/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mapa' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Tablero' })).toHaveAttribute('aria-pressed', 'false');

    const retobo = container.querySelector('[data-id="el-retobo"]')!;
    expect(retobo).toHaveAttribute('aria-label', expect.stringMatching(/^El Retobo, 4 hogares, estado rojo, en alerta/));
    expect(retobo.querySelector('.mr-urb')).toHaveClass('mr-urb--rojo', 'mr-urb--alerta');
    expect(retobo).toHaveTextContent('!');
    expect(container.querySelector('[data-id="trigal-norte"] .mr-urb')).toHaveTextContent('V');
    expect(container.querySelector('[data-id="manongo"] .mr-urb')).toHaveClass('mr-urb--vacio');
    // Las "Otras de <zona>" no van en el mapa; la tienda sí, con su nombre.
    expect(container.querySelector('[data-id="otras-naguanagua"]')).toBeNull();
    expect(container.querySelector('[data-id="tienda-manongo"]')).toHaveTextContent('Mañongo');
    expect(screen.getByText(/OpenStreetMap/)).toBeInTheDocument();

    await usuario.click(retobo as HTMLElement);
    const detalle = await screen.findByRole('complementary', { name: 'Detalle de El Retobo' });
    expect(within(detalle).getByText('Varios hogares de la zona reportaron resultados fuera de rango.')).toBeInTheDocument();

    // Vista Clientes sobre el mapa real: tono de azul con el número de hogares.
    await usuario.click(screen.getByRole('button', { name: 'Clientes' }));
    expect(container.querySelector('[data-id="el-retobo"] .mr-urb')).toHaveClass('mr-urb--azul-2');
    expect(container.querySelector('[data-id="el-retobo"] .mr-urb')).toHaveTextContent('4');
    expect(screen.getByRole('region', { name: 'Mapa de clientes por urbanización' })).toBeInTheDocument();
  });
});

describe('pestaña Zonas: tablero de hexágonos', () => {
  it('muestra las cifras, cambia de vista y abre el detalle al elegir un hexágono', async () => {
    const usuario = userEvent.setup();
    const { container } = montar();

    await usuario.click(await screen.findByRole('button', { name: 'Tablero' }));
    const trigal = await screen.findByRole('button', { name: /^Trigal Norte, 4 hogares, estado verde/ });
    const cifras = screen.getByLabelText('Cifras del mapa');
    expect(within(cifras).getByText('Urbanizaciones con clientes').closest('div')).toHaveTextContent('2');
    expect(within(cifras).getByText('Urbanizaciones en alerta').closest('div')).toHaveTextContent('1');
    expect(within(cifras).getByText('Urbanizaciones por captar').closest('div')).toHaveTextContent('1');

    // Vista de calidad por defecto: letra del estado y alerta marcada.
    const calidad = screen.getByRole('button', { name: 'Resultados de la tira' });
    expect(screen.getByRole('group', { name: 'Mapa de resultados de la tira por urbanización' })).toBeInTheDocument();
    const clientes = screen.getByRole('button', { name: 'Clientes' });
    expect(calidad).toHaveAttribute('aria-pressed', 'true');
    expect(container.querySelector('[data-id="el-retobo"]')).toHaveClass('mapa-hex--rojo', 'mapa-hex--alerta');
    expect(screen.getByText('Verde (V)')).toBeInTheDocument();

    await usuario.click(clientes);
    expect(clientes).toHaveAttribute('aria-pressed', 'true');
    expect(calidad).toHaveAttribute('aria-pressed', 'false');
    expect(container.querySelector('[data-id="el-retobo"]')).toHaveClass('mapa-hex--azul-2');
    expect(container.querySelector('[data-id="manongo"]')).toHaveClass('mapa-hex--vacio');
    expect(screen.getByText('Por captar (sin clientes)')).toBeInTheDocument();
    expect(screen.queryByText('Verde (V)')).not.toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: /^El Retobo, 4 hogares, estado rojo, en alerta/ }));
    const detalle = screen.getByRole('complementary', { name: 'Detalle de El Retobo' });
    expect(within(detalle).getByText('Varios hogares de la zona reportaron resultados fuera de rango.')).toBeInTheDocument();
    expect(within(detalle).getByText('Conviene revisar y avisar a los hogares.')).toBeInTheDocument();
    expect(within(detalle).getByText('nitrato')).toBeInTheDocument();
    expect(within(detalle).getByText('Grimuca Mañongo')).toBeInTheDocument();
    expect(detalle).not.toHaveTextContent(/potable/i);

    // Con teclado: enfocar otro hexágono cambia el detalle.
    trigal.focus();
    expect(await screen.findByRole('complementary', { name: 'Detalle de Trigal Norte' })).toBeInTheDocument();

    // Los hogares sin urbanización se listan fuera del tablero y la lista de alertas por zona se conserva.
    expect(screen.getByRole('button', { name: /Otras de Naguanagua: 1 hogar/ })).toBeInTheDocument();
    expect(screen.getByText(/Alerta en Naguanagua: 3 hogares en rojo/)).toBeInTheDocument();

    // Avisar a los vecinos: solo muestra el WhatsApp simulado con el texto aprobado, sin nombrar hogares.
    await usuario.click(screen.getByRole('button', { name: 'Avisar a los vecinos de la zona' }));
    expect(screen.getByText('Varios hogares de tu zona reportaron resultados fuera de rango. Te sugerimos medir tu agua.')).toBeInTheDocument();
    expect(screen.getByText('Enviado (simulado)')).toBeInTheDocument();
    expect(screen.getByText(/en la demo no se envía un WhatsApp real/)).toBeInTheDocument();
  });

  it('abrevia los nombres largos en dos líneas', () => {
    expect(etiquetaCorta('Ciudad Jardín Mañongo')).toEqual(['C. Jardín', 'Mañongo']);
    expect(etiquetaCorta('Los Guayabitos')).toEqual(['Los', 'Guayabitos']);
    expect(etiquetaCorta('Kerdell')).toEqual(['Kerdell']);
  });
});
