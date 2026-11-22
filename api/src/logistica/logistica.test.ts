import { describe, expect, it } from 'vitest';
import { calcularAlertas, calcularInventario, calcularResumen, recambioEnVentana } from './index';
import type { FilaHogarDemanda, FilaPedidoDemanda, FilaUltimaMedicion } from './index';

const HOY = new Date('2026-11-21T12:00:00Z');
const TIENDAS = [
  { id: 'manongo', nombre: 'Mañongo' },
  { id: 'biglow', nombre: 'Big Low' },
  { id: 'cem', nombre: 'CC CEM' },
];

function hogar(id: string, cambios: Partial<FilaHogarDemanda> = {}): FilaHogarDemanda {
  return {
    id,
    zona: 'Naguanagua',
    tienda_id: 'manongo',
    tiene_filtro: true,
    fecha_ultimo_cambio: null,
    vida_util_meses: null,
    ultimo_cartucho: null,
    ...cambios,
  };
}

/** Fecha 'AAAA-MM-DD' de hace `dias` días respecto de HOY. */
function haceDias(dias: number): string {
  return new Date(HOY.getTime() - dias * 86_400_000).toISOString().slice(0, 10);
}

describe('recambios en ventana', () => {
  it('usa 90 días por defecto y cuenta vencidos en ambas ventanas', () => {
    const vencido = hogar('a', { fecha_ultimo_cambio: haceDias(110) });
    const en5 = hogar('b', { fecha_ultimo_cambio: haceDias(85) });
    const en20 = hogar('c', { fecha_ultimo_cambio: haceDias(70) });
    const en60 = hogar('d', { fecha_ultimo_cambio: haceDias(30) });
    expect([vencido, en5, en20, en60].map((h) => recambioEnVentana(h, 7, HOY))).toEqual([true, true, false, false]);
    expect([vencido, en5, en20, en60].map((h) => recambioEnVentana(h, 30, HOY))).toEqual([true, true, true, false]);
  });

  it('respeta la vida útil del cartucho y no cuenta hogares sin filtro o sin fecha', () => {
    expect(recambioEnVentana(hogar('a', { fecha_ultimo_cambio: haceDias(85), vida_util_meses: 3 }), 7, HOY)).toBe(true);
    expect(recambioEnVentana(hogar('b', { fecha_ultimo_cambio: haceDias(300), tiene_filtro: false }), 30, HOY)).toBe(false);
    expect(recambioEnVentana(hogar('c'), 30, HOY)).toBe(false);
  });

  it('resume por tienda, con la tienda sugerida por zona si el hogar no eligió', () => {
    const hogares = [
      hogar('a', { fecha_ultimo_cambio: haceDias(88) }),
      hogar('b', { tienda_id: null, zona: 'San Diego', fecha_ultimo_cambio: haceDias(70) }),
    ];
    const pedidos: FilaPedidoDemanda[] = [
      { tienda_id: 'manongo', tipo: 'sobre', estado: 'pendiente', cartucho_codigo: null, cantidad: 1 },
      { tienda_id: 'manongo', tipo: 'cartucho', estado: 'pendiente', cartucho_codigo: 'X', cantidad: 1 },
      { tienda_id: 'manongo', tipo: 'sobre', estado: 'despachado', cartucho_codigo: null, cantidad: 1 },
    ];
    const resumen = calcularResumen(TIENDAS, hogares, pedidos, HOY);
    expect(resumen.find((r) => r.tienda_id === 'manongo')).toMatchObject({
      hogares: 1,
      pedidos_pendientes: 2,
      sobres_pendientes: 1,
      recambios_7_dias: 1,
      recambios_30_dias: 1,
    });
    expect(resumen.find((r) => r.tienda_id === 'biglow')).toMatchObject({
      hogares: 1,
      recambios_7_dias: 0,
      recambios_30_dias: 1,
    });
    expect(resumen.find((r) => r.tienda_id === 'cem')?.hogares).toBe(0);
  });
});

describe('inventario', () => {
  const cartuchos = [
    { codigo: 'SED', nombre: 'Sedimentos' },
    { codigo: 'CAR', nombre: 'Carbón' },
  ];

  it('calcula faltante = max(0, demanda - stock) y pone los faltantes primero', () => {
    const pedidos: FilaPedidoDemanda[] = [
      { tienda_id: 'manongo', tipo: 'cartucho', estado: 'pendiente', cartucho_codigo: 'SED', cantidad: 2 },
      { tienda_id: 'manongo', tipo: 'cartucho', estado: 'despachado', cartucho_codigo: 'SED', cantidad: 1 },
    ];
    const hogares = [
      hogar('a', { fecha_ultimo_cambio: haceDias(190) }), // sin pedido propio → el más pedido (SED)
      hogar('b', { fecha_ultimo_cambio: haceDias(190), ultimo_cartucho: 'CAR' }),
      hogar('c', { fecha_ultimo_cambio: haceDias(10) }), // fuera de ventana
    ];
    const stock = [
      { tienda_id: 'manongo', cartucho_codigo: 'SED', cantidad: 1 },
      { tienda_id: 'manongo', cartucho_codigo: 'CAR', cantidad: 5 },
    ];
    const filas = calcularInventario(TIENDAS, cartuchos, stock, hogares, pedidos, HOY);
    expect(filas[0]).toMatchObject({ cartucho_codigo: 'SED', stock: 1, demanda_30_dias: 3, faltante: 2 });
    expect(filas[1]).toMatchObject({ cartucho_codigo: 'CAR', stock: 5, demanda_30_dias: 1, faltante: 0 });
  });
});

describe('alertas por zona', () => {
  const rojo = (hogar_id: string, zona = 'Naguanagua', dias = 1, sem: unknown = { nitrato: 'rojo' }): FilaUltimaMedicion => ({
    hogar_id,
    zona,
    fecha: new Date(HOY.getTime() - dias * 86_400_000).toISOString(),
    semaforo_por_parametro: sem,
  });

  it('con 2 hogares en rojo no hay alerta', () => {
    const [zona] = calcularAlertas(['Naguanagua'], [rojo('a'), rojo('b')], HOY);
    expect(zona).toMatchObject({ zona: 'Naguanagua', hogares_en_rojo_7_dias: 2, alerta: false, parametros: ['nitrato'] });
  });

  it('con 3 hogares en rojo hay alerta y lista los parámetros que más se repiten', () => {
    const filas = [
      rojo('a', 'Naguanagua', 1, { nitrato: 'rojo', plomo: 'rojo' }),
      rojo('b', 'Naguanagua', 2, [{ clave: 'nitrato', nivel: 'rojo' }]),
      rojo('c', 'Naguanagua', 3, { nitrato: 'rojo', dureza: 'rojo' }),
    ];
    const [zona] = calcularAlertas(['Naguanagua', 'San Diego'], filas, HOY);
    expect(zona).toMatchObject({ hogares_en_rojo_7_dias: 3, alerta: true, parametros: ['nitrato'] });
  });

  it('ignora mediciones viejas y rojos que no son de salud', () => {
    const filas = [rojo('a', 'Naguanagua', 10), rojo('b', 'Naguanagua', 1, { dureza: 'rojo', ph: 'rojo' })];
    const [zona] = calcularAlertas(['Naguanagua'], filas, HOY);
    expect(zona).toMatchObject({ hogares_en_rojo_7_dias: 0, alerta: false, parametros: [] });
  });
});
