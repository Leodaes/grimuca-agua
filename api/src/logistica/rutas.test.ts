import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { crearApp, type Medidor } from '../app';
import { crearToken } from '../rutas/operador';
import { crearBdDePrueba } from '../rutas/ayudas-prueba';

const SECRETO = 'secreto-de-prueba-logistica';
let app: FastifyInstance;

beforeAll(async () => {
  // Todas las migraciones: desde la 008 las tiendas pertenecen a un comercio.
  const bd = await crearBdDePrueba();
  const medicion = { tira: [], leerTira: async () => ({ estado: 'no_legible', motivo: '' }), evaluarAgua: () => ({}), diasParaRecambio: () => null } as unknown as Medidor;
  app = await crearApp({
    bd,
    config: { pinOperador: '1234', secretoSesion: SECRETO, version: 'prueba' },
    medicion,
  });
});

afterAll(async () => {
  await app?.close();
});

describe('rutas de logística', () => {
  it.each(['/api/operador/resumen', '/api/operador/inventario', '/api/operador/zonas'])('%s exige token', async (url) => {
    const sin = await app.inject({ method: 'GET', url });
    expect(sin.statusCode).toBe(401);
    const con = await app.inject({ method: 'GET', url, headers: { authorization: `Bearer ${crearToken(SECRETO)}` } });
    expect(con.statusCode).toBe(200);
    expect(Array.isArray(con.json())).toBe(true);
  });

  it('el resumen trae las tres tiendas', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/operador/resumen',
      headers: { authorization: `Bearer ${crearToken(SECRETO)}` },
    });
    expect(res.json().map((r: { tienda_id: string }) => r.tienda_id).sort()).toEqual(['biglow', 'cem', 'manongo']);
  });
});
