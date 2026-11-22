import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { cargarConfig, ErrorConfig, RAIZ_API } from './config';

describe('cargarConfig', () => {
  it('lee las variables y aplica los valores por defecto', () => {
    const config = cargarConfig({
      DATABASE_URL: 'postgres://usuario:clave@bd:5432/agua',
      PIN_OPERADOR: ' 2468 ',
      SECRETO_SESION: 'un-secreto-largo-de-prueba-123',
      VISION_API_KEY: 'clave-de-prueba',
      MARCAS_EXCLUIDAS: ' Marca Uno, marca dos ,,',
    });
    expect(config).toMatchObject({
      puerto: 3070,
      urlBd: 'postgres://usuario:clave@bd:5432/agua',
      pinOperador: '2468',
      secretoSesion: 'un-secreto-largo-de-prueba-123',
      secretoEfimero: false,
      marcasExcluidas: ['marca uno', 'marca dos'],
      lectorSimulado: false,
      avisos: [],
    });
    expect(config.dirEstaticos).toBe(path.resolve(RAIZ_API, '../app/dist'));
  });

  it('sin PIN ni secreto no inventa valores fijos: cierra el panel y firma con un secreto temporal', () => {
    const a = cargarConfig({});
    const b = cargarConfig({ SECRETO_SESION: 'corto' });
    expect(a.pinOperador).toBeNull();
    expect(a.urlBd).toBeNull();
    expect(a.secretoEfimero).toBe(true);
    expect(a.secretoSesion.length).toBeGreaterThanOrEqual(32);
    expect(a.secretoSesion).not.toBe(b.secretoSesion);
    expect(a.avisos.join(' ')).toMatch(/PIN_OPERADOR/);
    expect(a.avisos.join(' ')).toMatch(/SECRETO_SESION/);
    expect(a.marcasExcluidas).toEqual([]);
  });

  it('el lector va simulado si se pide o si falta la clave del servicio de visión', () => {
    expect(cargarConfig({}).lectorSimulado).toBe(true);
    expect(cargarConfig({ VISION_API_KEY: 'x', LECTOR_SIMULADO: '1' }).lectorSimulado).toBe(true);
    expect(cargarConfig({ VISION_API_KEY: 'x', LECTOR_SIMULADO: '0' }).lectorSimulado).toBe(false);
  });

  it('acepta otro puerto y otra carpeta del front, y rechaza un puerto inválido', () => {
    const config = cargarConfig({ PUERTO: '8080', DIR_ESTATICOS: '/srv/front' });
    expect(config.puerto).toBe(8080);
    expect(config.dirEstaticos).toBe(path.resolve('/srv/front'));
    expect(() => cargarConfig({ PUERTO: 'abc' })).toThrow(ErrorConfig);
  });
});
