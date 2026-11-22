import { describe, expect, it } from 'vitest';
import type { PerfilHogar, ValoresMedicion } from '../tipos';
import { tira } from './config/tira';
import { FRASE_SIN_DATO, umbrales } from './config/umbrales';
import { ajustarACasilla, diasParaRecambio, evaluarAgua } from './evaluar';

const todoEnRango: ValoresMedicion = {
  alcalinidad: 80,
  dureza: 50,
  cobre: 0,
  nitrato: 10,
  cloro_libre: 0.5,
  plomo: 0,
  ph: 7.2,
  nitrito: 0,
};

const perfilBase: PerfilHogar = {
  origen_agua: 'chorro',
  tiene_filtro: false,
  etapas_filtro: null,
  fecha_ultimo_cambio: null,
  agua_turbia: false,
  personas: 3,
};

describe('evaluarAgua', () => {
  it('todo en rango: semáforo verde, sin hallazgos y sin nada que corregir', () => {
    const e = evaluarAgua(todoEnRango);
    expect(e.semaforo).toBe('verde');
    expect(e.hallazgos).toEqual([]);
    expect(e.corrige).toEqual([]);
    expect(e.diasParaRecambio).toBeNull();
    expect(e.porParametro.map((p) => p.clave)).toEqual(tira.map((p) => p.clave));
    expect(e.porParametro.every((p) => p.nivel === 'verde')).toBe(true);
  });

  it('un rojo de salud manda en el semáforo general y pide laboratorio', () => {
    const e = evaluarAgua({ ...todoEnRango, plomo: 15, dureza: 250 });
    expect(e.semaforo).toBe('rojo');
    const plomo = e.porParametro.find((p) => p.clave === 'plomo')!;
    expect(plomo.nivel).toBe('rojo');
    expect(plomo.orientativo).toBe(true);
    expect(plomo.frase).toMatch(/posible presencia/i);
    expect(plomo.frase).toMatch(/confirma con un laboratorio/i);
    // Los rojos van primero en los hallazgos.
    expect(e.hallazgos).toHaveLength(2);
    expect(e.hallazgos[0]).toBe(plomo.frase);
    expect(e.corrige).toEqual(expect.arrayContaining(['plomo', 'dureza']));
  });

  it('plomo y cobre en amarillo también dicen "posible presencia, confirma con un laboratorio"', () => {
    const e = evaluarAgua({ ...todoEnRango, plomo: 5, cobre: 1 });
    for (const clave of ['plomo', 'cobre'] as const) {
      const p = e.porParametro.find((x) => x.clave === clave)!;
      expect(p.nivel).toBe('amarillo');
      expect(p.frase).toMatch(/posible presencia/i);
      expect(p.frase).toMatch(/confirma con un laboratorio/i);
    }
    expect(e.semaforo).toBe('amarillo');
  });

  it('las casillas que faltan quedan sin dato, nunca en verde', () => {
    const e = evaluarAgua({ dureza: 50, ph: 7.2, cloro_libre: null });
    expect(e.semaforo).toBe('verde');
    const sinDato = e.porParametro.filter((p) => p.nivel === 'sin_dato');
    expect(sinDato).toHaveLength(tira.length - 2);
    for (const p of sinDato) {
      expect(p.valor).toBeNull();
      expect(p.frase).toBe(FRASE_SIN_DATO);
    }
    expect(e.porParametro.find((p) => p.clave === 'cloro_libre')!.nivel).toBe('sin_dato');
  });

  it('un valor entre dos casillas toma la más alta', () => {
    // 180 de dureza cae entre 120 y 250: se evalúa como 250 (amarillo), no como verde.
    const e = evaluarAgua({ ...todoEnRango, dureza: 180 });
    const dureza = e.porParametro.find((p) => p.clave === 'dureza')!;
    expect(dureza.valor).toBe(250);
    expect(dureza.nivel).toBe('amarillo');
    expect(ajustarACasilla(0.3, [0, 0.5, 1])).toBe(0.5);
    expect(ajustarACasilla(0.5, [0, 0.5, 1])).toBe(0.5);
    expect(ajustarACasilla(99, [0, 0.5, 1])).toBe(1);
  });

  it('perfil con agua turbia pide sedimentos; pozo o tanque sugiere desinfección', () => {
    const turbia = evaluarAgua(todoEnRango, { ...perfilBase, agua_turbia: true });
    expect(turbia.semaforo).toBe('verde');
    expect(turbia.corrige).toEqual(['sedimentos']);

    const pozo = evaluarAgua(todoEnRango, { ...perfilBase, origen_agua: 'pozo' });
    expect(pozo.corrige).toEqual(['bacterias']);

    const tanque = evaluarAgua(todoEnRango, { ...perfilBase, origen_agua: 'tanque', agua_turbia: true });
    expect(tanque.corrige).toEqual(['sedimentos', 'bacterias']);
  });

  it('cloro alto pide corregir cloro y también sabor y olor', () => {
    const e = evaluarAgua({ ...todoEnRango, cloro_libre: 5 });
    expect(e.semaforo).toBe('rojo');
    expect(e.corrige).toEqual(['cloro_libre', 'sabor_olor']);
  });

  it('cloro en cero, sin filtro y con agua de chorro, tanque o pozo: amarillo "sin cloro"', () => {
    const sinFiltro = evaluarAgua({ ...todoEnRango, cloro_libre: 0 }, perfilBase);
    const cloro = sinFiltro.porParametro.find((p) => p.clave === 'cloro_libre')!;
    expect(cloro.nivel).toBe('amarillo');
    expect(sinFiltro.corrige).toEqual(['bacterias']);

    const conFiltro = evaluarAgua({ ...todoEnRango, cloro_libre: 0 }, { ...perfilBase, tiene_filtro: true });
    expect(conFiltro.porParametro.find((p) => p.clave === 'cloro_libre')!.nivel).toBe('verde');
    const sinPerfil = evaluarAgua({ ...todoEnRango, cloro_libre: 0 });
    expect(sinPerfil.semaforo).toBe('verde');
  });

  it('alcalinidad y pH nunca dan rojo; fuera de rango quedan en amarillo', () => {
    const e = evaluarAgua({ ...todoEnRango, alcalinidad: 0, ph: 6.2 });
    expect(e.porParametro.find((p) => p.clave === 'alcalinidad')!.nivel).toBe('amarillo');
    expect(e.porParametro.find((p) => p.clave === 'ph')!.nivel).toBe('amarillo');
    expect(e.semaforo).toBe('amarillo');
  });

  it('evalúa una casilla que no está en la tira en uso si viene con valor (hierro)', () => {
    const e = evaluarAgua({ ...todoEnRango, hierro: 3 });
    const hierro = e.porParametro.find((p) => p.clave === 'hierro')!;
    expect(hierro.nivel).toBe('rojo');
    expect(e.corrige).toContain('hierro');
  });

  it('todo vacío: semáforo sin dato', () => {
    const e = evaluarAgua({});
    expect(e.semaforo).toBe('sin_dato');
    expect(e.porParametro).toHaveLength(tira.length);
    expect(e.porParametro.every((p) => p.nivel === 'sin_dato' && p.valor === null)).toBe(true);
    expect(e.hallazgos).toEqual([]);
    expect(e.corrige).toEqual([]);
  });

  it('cada casilla de la tira de referencia cae en el color que dice la tabla de negocio', () => {
    const esperado: Record<string, Array<[number, string]>> = {
      alcalinidad: [[0, 'amarillo'], [40, 'verde'], [180, 'verde'], [240, 'amarillo']],
      dureza: [[120, 'verde'], [250, 'amarillo'], [425, 'rojo']],
      cobre: [[0.5, 'verde'], [1, 'amarillo'], [2, 'rojo']],
      nitrato: [[10, 'verde'], [25, 'amarillo'], [50, 'rojo']],
      cloro_libre: [[1, 'verde'], [3, 'amarillo'], [5, 'rojo']],
      plomo: [[0, 'verde'], [5, 'amarillo'], [15, 'rojo']],
      ph: [[6.2, 'amarillo'], [6.8, 'verde'], [8.4, 'verde']],
      nitrito: [[0, 'verde'], [1, 'amarillo'], [5, 'rojo']],
    };
    for (const [clave, casos] of Object.entries(esperado)) {
      for (const [valor, nivel] of casos) {
        const e = evaluarAgua({ [clave]: valor });
        expect(e.porParametro.find((p) => p.clave === clave)!.nivel, `${clave} ${valor}`).toBe(nivel);
      }
    }
  });

  it('ninguna frase usa la palabra prohibida', () => {
    const prohibida = new RegExp(['pot', 'able'].join(''), 'i');
    const frases = Object.values(umbrales).flatMap((u) => u.tramos.map((t) => t.frase));
    expect(frases.some((f) => prohibida.test(f))).toBe(false);
  });
});

describe('diasParaRecambio', () => {
  const hoy = new Date(2026, 10, 21); // 21 nov 2026
  const conFiltro: PerfilHogar = { ...perfilBase, tiene_filtro: true, etapas_filtro: 2, fecha_ultimo_cambio: '2026-10-22' };

  it('sin filtro o sin fecha devuelve null', () => {
    expect(diasParaRecambio(perfilBase, hoy)).toBeNull();
    expect(diasParaRecambio({ ...conFiltro, fecha_ultimo_cambio: null }, hoy)).toBeNull();
    expect(diasParaRecambio({ ...conFiltro, fecha_ultimo_cambio: 'ayer' }, hoy)).toBeNull();
  });

  it('filtro de 2 etapas: manda el de sedimentos (90 días) menos los días transcurridos', () => {
    expect(diasParaRecambio(conFiltro, hoy)).toBe(60);
  });

  it('filtro de 1 etapa: carbón en bloque, 180 días', () => {
    expect(diasParaRecambio({ ...conFiltro, etapas_filtro: 1 }, hoy)).toBe(150);
  });

  it('agua turbia acorta el de sedimentos a la mitad', () => {
    expect(diasParaRecambio({ ...conFiltro, agua_turbia: true }, hoy)).toBe(15);
  });

  it('con 5 o más personas todo dura 0.75', () => {
    expect(diasParaRecambio({ ...conFiltro, personas: 5 }, hoy)).toBe(38); // redondeo de 67.5 − 30
  });

  it('si ya se pasó la fecha, devuelve negativo (vencido)', () => {
    expect(diasParaRecambio({ ...conFiltro, fecha_ultimo_cambio: '2026-06-01' }, hoy)).toBeLessThan(0);
  });

  it('si no se sabe cuántas etapas tiene, asume la base de 2', () => {
    expect(diasParaRecambio({ ...conFiltro, etapas_filtro: null }, hoy)).toBe(60);
  });

  it('evaluarAgua incluye los días para el recambio cuando hay perfil con filtro', () => {
    expect(evaluarAgua(todoEnRango, conFiltro, hoy).diasParaRecambio).toBe(60);
  });
});
