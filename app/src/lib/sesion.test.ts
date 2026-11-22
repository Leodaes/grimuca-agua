import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  agregarALista,
  alCambiarLista,
  cambiarCantidad,
  cantidadEnLista,
  CLAVE_HOGAR,
  CLAVE_LISTA,
  guardarHogarId,
  guardarTokenOperador,
  hogarId,
  lista,
  quitarDeLista,
  tokenOperador,
  vaciarLista,
} from './sesion';

beforeEach(() => {
  window.localStorage.clear();
});

describe('hogar', () => {
  it('guarda, lee y olvida el identificador con la clave del contrato', () => {
    expect(hogarId()).toBeNull();
    guardarHogarId('00000000-0000-4000-8000-000000000001');
    expect(window.localStorage.getItem(CLAVE_HOGAR)).toBe('00000000-0000-4000-8000-000000000001');
    expect(CLAVE_HOGAR).toBe('agua.hogar_id');
    expect(hogarId()).toBe('00000000-0000-4000-8000-000000000001');
    guardarHogarId(null);
    expect(hogarId()).toBeNull();
  });
});

describe('Mi lista', () => {
  it('agrega productos y suma la cantidad si se repiten', () => {
    expect(lista()).toEqual([]);
    agregarALista({ codigo: 'A-1', nombre: 'Cartucho A' });
    agregarALista({ codigo: 'B-2', nombre: 'Cartucho B', cantidad: 2 });
    const final = agregarALista({ codigo: 'A-1', nombre: 'Cartucho A', cantidad: 3 });
    expect(final).toEqual([
      { codigo: 'A-1', nombre: 'Cartucho A', cantidad: 4 },
      { codigo: 'B-2', nombre: 'Cartucho B', cantidad: 2 },
    ]);
    expect(lista()).toEqual(final);
    expect(cantidadEnLista()).toBe(6);
    expect(CLAVE_LISTA).toBe('agua.lista');
    expect(JSON.parse(window.localStorage.getItem(CLAVE_LISTA)!)).toEqual(final);
  });

  it('cambia cantidades, quita productos y vacía la lista', () => {
    agregarALista({ codigo: 'A-1', nombre: 'Cartucho A' });
    agregarALista({ codigo: 'B-2', nombre: 'Cartucho B' });
    expect(cambiarCantidad('A-1', 5)[0].cantidad).toBe(5);
    expect(cambiarCantidad('B-2', 0).map((item) => item.codigo)).toEqual(['A-1']);
    expect(quitarDeLista('A-1')).toEqual([]);
    agregarALista({ codigo: 'C-3', nombre: 'Cartucho C' });
    vaciarLista();
    expect(lista()).toEqual([]);
    expect(window.localStorage.getItem(CLAVE_LISTA)).toBeNull();
  });

  it('ignora lo que esté dañado en el almacenamiento', () => {
    window.localStorage.setItem(CLAVE_LISTA, '{esto no es json');
    expect(lista()).toEqual([]);
    window.localStorage.setItem(
      CLAVE_LISTA,
      JSON.stringify([{ codigo: 'A-1', nombre: 'Bueno', cantidad: 1 }, { codigo: 7 }, null, { codigo: 'X', nombre: 'Sin cantidad' }]),
    );
    expect(lista()).toEqual([{ codigo: 'A-1', nombre: 'Bueno', cantidad: 1 }]);
  });

  it('avisa cuando la lista cambia y deja de avisar al darse de baja', () => {
    const manejador = vi.fn();
    const baja = alCambiarLista(manejador);
    agregarALista({ codigo: 'A-1', nombre: 'Cartucho A' });
    expect(manejador).toHaveBeenLastCalledWith([{ codigo: 'A-1', nombre: 'Cartucho A', cantidad: 1 }]);
    baja();
    vaciarLista();
    expect(manejador).toHaveBeenCalledTimes(1);
  });

  it('sigue funcionando aunque el navegador bloquee el almacenamiento', () => {
    const poner = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    const leer = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    try {
      expect(() => guardarHogarId('abc')).not.toThrow();
      expect(hogarId()).toBeNull();
      expect(lista()).toEqual([]);
      expect(() => agregarALista({ codigo: 'A-1', nombre: 'Cartucho A' })).not.toThrow();
    } finally {
      poner.mockRestore();
      leer.mockRestore();
    }
  });
});

describe('operador', () => {
  it('guarda y borra el token', () => {
    expect(tokenOperador()).toBeNull();
    guardarTokenOperador('123.firma');
    expect(tokenOperador()).toBe('123.firma');
    guardarTokenOperador(null);
    expect(tokenOperador()).toBeNull();
  });
});
