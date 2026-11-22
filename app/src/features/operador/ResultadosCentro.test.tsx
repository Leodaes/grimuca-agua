import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useRoutes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { Comercio, MedicionCentro, PanelCentro } from '../../lib/tipos';
import { ProveedorServicios } from './contexto';
import type { ServiciosOperador } from './contexto';
import { textoReferencia } from './ResultadosCentro';
import { rutasOperador } from './rutas';

const CENTRO: Comercio = {
  id: 'centro-demo-naguanagua',
  nombre: 'Centro de llenado Naguanagua (comercio de demostración)',
  tipo: 'centro_llenado',
  estado_pais: 'Carabobo',
  ciudad: 'Naguanagua',
  plan: 'basico',
  membresia_usd: null,
  fecha_alta: '2026-09-01T12:00:00Z',
  fin_periodo_gratis: null,
  activo: true,
  es_demostracion: true,
};

const FERRETERIA: Comercio = { ...CENTRO, id: 'aliado-lara', nombre: 'Ferretería El Tunal', tipo: 'ferreteria' };

function medicion(cambios: Partial<MedicionCentro> = {}): MedicionCentro {
  return {
    id: 2,
    tienda_id: 'llenado-el-naranjal',
    fecha: '2026-11-21T14:00:00Z',
    casillas: [
      { clave: 'ph', nombre: 'pH', unidad: '', valor: 7.2, nivel: 'verde', referencia_desde: 6.5, referencia_hasta: 8.5, orientativo: false },
      { clave: 'dureza', nombre: 'Dureza', unidad: 'mg/L', valor: 425, nivel: 'rojo', referencia_desde: null, referencia_hasta: 120, orientativo: false },
      { clave: 'plomo', nombre: 'Plomo', unidad: 'ppb', valor: null, nivel: 'sin_dato', referencia_desde: null, referencia_hasta: 5, orientativo: true },
    ],
    casillas_en_rango: 1,
    casillas_leidas: 2,
    bacterias: 'pendiente',
    fecha_bacterias: null,
    nota: 'Muestra del grifo de despacho.',
    medido_por: 'Técnico de Grimuca',
    ...cambios,
  };
}

const PANEL: PanelCentro = {
  centros: [
    {
      tienda_id: 'llenado-el-naranjal',
      comercio_id: CENTRO.id,
      nombre: CENTRO.nombre,
      local: 'Centro de llenado · El Naranjal',
      direccion: 'Calle 4, local 2',
      horario: 'Todos los días',
      zona: 'Naguanagua',
      urbanizacion: 'El Naranjal',
      lat: 10.268,
      lng: -68.027,
      es_demostracion: true,
      ultima: medicion(),
      vencida: false,
      historial: [medicion(), medicion({ id: 1, fecha: '2026-10-12T14:00:00Z', bacterias: 'sin_cambio', casillas_en_rango: 2 })],
      clientes_cercanos: 7,
    },
  ],
};

function montar(ruta: string, comercio: Comercio, extra: Partial<ServiciosOperador> = {}) {
  const servicios: ServiciosOperador = {
    leerToken: () => 't-centro',
    guardarToken: vi.fn(),
    entrar: vi.fn(async () => 't-centro'),
    pedidosPendientes: vi.fn(async () => []),
    despachar: vi.fn(),
    resumen: vi.fn(async () => []),
    inventario: vi.fn(async () => []),
    zonas: vi.fn(async () => []),
    mapa: vi.fn(async () => []),
    enVivo: (_t, m) => {
      m.conexion('en_vivo');
      return () => undefined;
    },
    yo: vi.fn(async () => ({
      rol: 'comercio' as const,
      comercio,
      tiendas: [{ id: 'llenado-el-naranjal', nombre: 'Centro de llenado · El Naranjal', horario: '7 a 7', direccion: null }],
    })),
    panelCentro: vi.fn(async () => PANEL),
    ...extra,
  };
  function Rutas() {
    return useRoutes(rutasOperador);
  }
  render(
    <ProveedorServicios servicios={servicios}>
      <MemoryRouter initialEntries={[ruta]}>
        <Rutas />
      </MemoryRouter>
    </ProveedorServicios>,
  );
  return servicios;
}

describe('pestaña Resultados públicos', () => {
  it('aparece solo para un centro de llenado', async () => {
    montar('/comercio/despacho', CENTRO);
    expect(await screen.findByRole('link', { name: 'Resultados públicos' })).toHaveAttribute('href', '/comercio/resultados');
  });

  it('no aparece para una ferretería, y su dirección vuelve a Despacho', async () => {
    const servicios = montar('/comercio/resultados', FERRETERIA);
    await screen.findByTestId('ficha-comercio');
    expect(screen.queryByRole('link', { name: 'Resultados públicos' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Resultados públicos' })).not.toBeInTheDocument();
    expect(servicios.panelCentro).not.toHaveBeenCalled();
  });

  it('muestra los clientes cercanos, la medición más reciente tal cual y el historial', async () => {
    const usuario = userEvent.setup();
    montar('/comercio/resultados', CENTRO);
    expect(await screen.findByRole('heading', { name: 'Centro de llenado · El Naranjal' })).toBeInTheDocument();
    expect(
      screen.getByText('Grimuca mide tu grifo de despacho cada mes y publica el resultado tal cual, también si algo sale fuera de rango.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Medición orientativa con tira, no es un análisis de laboratorio.')).toBeInTheDocument();
    expect(screen.getByTestId('clientes-llenado-el-naranjal')).toHaveTextContent(
      '7 clientes te tienen como el centro con resultados públicos más cercano.',
    );
    expect(screen.getByText('1 de 2 casillas en rango')).toBeInTheDocument();

    const casillas = screen.getAllByRole('list', { name: /Casillas de la medición/ })[0];
    expect(within(casillas).getByText('425 mg/L')).toBeInTheDocument();
    expect(within(casillas).getByText('Fuera de rango')).toBeInTheDocument();
    expect(within(casillas).getByText('En rango')).toBeInTheDocument();
    expect(within(casillas).getByText('Sin dato')).toBeInTheDocument();
    expect(within(casillas).getByText('Referencia en rango: hasta 120 mg/L')).toBeInTheDocument();
    expect(screen.getByText('El frasco se lee a las 48 horas.')).toBeInTheDocument();

    await usuario.click(screen.getByText('Historial (1 medición anterior)'));
    expect(
      screen.getByText('La prueba no detectó bacterias coliformes en esta muestra. Esto no certifica el agua.'),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Ver tu página pública' })).toHaveAttribute('href', '/centros/llenado-el-naranjal');

    // Nada de veredictos sobre el agua.
    const texto = document.body.textContent ?? '';
    for (const palabra of ['verificad', 'certificad', 'aprobad', 'garantiz', 'potable', 'segura', 'apta', 'buena', 'mala', 'de calidad']) {
      expect(texto.toLowerCase()).not.toContain(palabra);
    }
  });

  it('dice qué hacer si no carga', async () => {
    montar('/comercio/resultados', CENTRO, { panelCentro: vi.fn(async () => Promise.reject(new Error('caída'))) });
    expect(await screen.findByText('No se pudieron cargar tus resultados.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });
});

describe('textoReferencia', () => {
  it('arma el rango con los límites que tiene', () => {
    expect(textoReferencia({ referencia_desde: 6.5, referencia_hasta: 8.5, unidad: '' })).toBe('de 6,5 a 8,5');
    expect(textoReferencia({ referencia_desde: null, referencia_hasta: 10, unidad: 'mg/L' })).toBe('hasta 10 mg/L');
    expect(textoReferencia({ referencia_desde: 2, referencia_hasta: null, unidad: 'mg/L' })).toBe('desde 2 mg/L');
    expect(textoReferencia({ referencia_desde: null, referencia_hasta: null, unidad: '' })).toBe('');
  });
});
