import { describe, expect, it } from 'vitest';
import { detalleModelo, esComercial, modelosDelTipo, nombreCorto, tipoDeModelo } from './modelos';

/** Copia del catálogo publicado en /api/filtros/modelos (22 nov). */
export const CATALOGO = [
  { codigo: '100L434', nombre: 'Tanque de Salmueras de 100 Litros con Válvula 434', categoria: 'suavizador' },
  { codigo: '70L434', nombre: 'Tanque de Salmueras de 70 Litros con Válvula 434', categoria: 'suavizador' },
  { codigo: 'CMB-T1054V34F', nombre: 'Filtro tipo Tanque de Fibra de Vidrio (FRP) 10" x 54" con tubo, difusores y válvula 1"', categoria: 'filtro_desbarrador' },
  { codigo: 'CMB-T1252V1F', nombre: 'Tanque de Fibra de Vidrio (FRP) 12" x 52" con Tubo, Difusores y Válvula de 1"', categoria: 'filtro_desbarrador' },
  { codigo: 'CMB-T844V34F', nombre: 'Filtro tipo Tanque de Fibra de Vidrio (FRP) 8" x 44" con tubo, difusores y válvula ¾»', categoria: 'filtro_desbarrador' },
  { codigo: 'OPW-1000UFMY', nombre: 'Filtro de Agua por Ósmosis Inversa de 7 Etapas - 1200 GPD', categoria: 'sistema_osmosis_inversa' },
  { codigo: 'OPW-100GPD-8TN', nombre: 'Filtro de Agua por Ósmosis Inversa de 8 Etapas - 110 GPD', categoria: 'sistema_osmosis_inversa' },
  { codigo: 'OPW-2000UFMY', nombre: 'Filtro de Agua por Ultrafiltración UF de 2000 L/h', categoria: 'cartucho' },
  { codigo: 'OPW-200GPD-8TN', nombre: 'Filtro de Agua por Ósmosis Inversa de 8 Etapas - 200 GPD', categoria: 'sistema_osmosis_inversa' },
  { codigo: 'OPW-3CPUFMS', nombre: 'Filtro de Agua UF de 3 Cartuchos Multietapas', categoria: 'cartucho' },
  { codigo: 'OPW-6STUF10S', nombre: 'Filtro de Agua por Ultrafiltración UF de 6 Etapas - 10" x 2.5"', categoria: 'cartucho' },
  { codigo: 'OPW-FS-6UV16', nombre: 'Filtro de Agua por Ultrafiltración UF de 6 Etapas con Lámpara UV - 20" x 2.5"', categoria: 'cartucho' },
  { codigo: 'OPW-RO-100H', nombre: 'Filtro de Agua de 3 Etapas Acuarios - 100 GPD', categoria: 'filtro' },
  { codigo: 'RO-1200GPD-7T', nombre: 'Filtro de Agua por Ósmosis Inversa de 7 Etapas, 1200 GPD', categoria: 'sistema_osmosis_inversa' },
  { codigo: 'T1054ST', nombre: 'Filtro Desbarrador de tanque de Fibra de Vidrio (FRP) 10" x 54" sin Tubo ni Difusores', categoria: 'filtro_desbarrador' },
  { codigo: 'T1252ST', nombre: 'Filtro tipo Tanque de Fibra de Vidrio (FRP) 12" x 52" (sin tubo ni difusores)', categoria: 'filtro_desbarrador' },
  { codigo: 'T1665ST', nombre: 'Filtro tipo Tanque de Fibra de Vidrio (FRP) 16" x 65" (sin tubo ni difusores)', categoria: 'filtro_desbarrador' },
  { codigo: 'T1865ST', nombre: 'Filtro tipo Tanque de Fibra de Vidrio (FRP) 18" x 65" (sin tubo ni difusores)', categoria: 'filtro_desbarrador' },
  { codigo: 'T2472ST', nombre: 'Filtro tipo Tanque de Fibra de Vidrio (FRP) 24" x 72" (sin tubo ni difusores)', categoria: 'filtro_desbarrador' },
  { codigo: 'T844ST', nombre: 'Filtro Desbarrador de tanque de Fibra de Vidrio (FRP) 8" x 44" sin Tubo ni Difusores', categoria: 'filtro_desbarrador' },
];

describe('modelos del catálogo para la carga manual', () => {
  it('nombre corto sin "Filtro de Agua por" ni medidas; detalle con capacidad o medida y código', () => {
    const osmosis = CATALOGO.find((m) => m.codigo === 'OPW-200GPD-8TN')!;
    expect(nombreCorto(osmosis.nombre)).toBe('Ósmosis inversa 8 etapas');
    expect(detalleModelo(osmosis)).toBe('200 GPD · OPW-200GPD-8TN');
    expect(detalleModelo({ ...osmosis, marca: 'Oasis' })).toBe('200 GPD · Oasis · OPW-200GPD-8TN');

    const tanque = CATALOGO.find((m) => m.codigo === 'T1252ST')!;
    expect(nombreCorto(tanque.nombre)).toBe('Tanque de fibra de vidrio (FRP) sin tubo ni difusores');
    expect(detalleModelo(tanque)).toBe('12" x 52" · T1252ST');

    expect(nombreCorto('Filtro de Agua por Ultrafiltración UF de 6 Etapas con Lámpara UV - 20" x 2.5"')).toBe(
      'Ultrafiltración UF 6 etapas con lámpara UV',
    );
    expect(nombreCorto('Tanque de Salmueras de 100 Litros con Válvula 434')).toBe('Tanque de salmueras con válvula 434');
    expect(nombreCorto('Filtro de Agua de 3 Etapas Acuarios - 100 GPD')).toBe('Filtro de 3 etapas para acuarios');
  });

  it('los equipos comerciales (1200 GPD, 2000 L/h) no se ofrecen', () => {
    expect(CATALOGO.filter(esComercial).map((m) => m.codigo).sort()).toEqual(['OPW-1000UFMY', 'OPW-2000UFMY', 'RO-1200GPD-7T']);
  });

  it('cada tipo muestra solo sus modelos, de menor a mayor', () => {
    expect(modelosDelTipo(CATALOGO, 'osmosis_inversa').map((m) => m.codigo)).toEqual([
      'OPW-RO-100H',
      'OPW-100GPD-8TN',
      'OPW-200GPD-8TN',
    ]);
    expect(modelosDelTipo(CATALOGO, 'ultrafiltracion').map((m) => m.codigo)).toEqual([
      'OPW-3CPUFMS',
      'OPW-6STUF10S',
      'OPW-FS-6UV16',
    ]);
    const tanques = modelosDelTipo(CATALOGO, 'desbarrador_tanque');
    expect(tanques[0].codigo).toBe('70L434');
    expect(tanques).toHaveLength(11);
    expect(tipoDeModelo(CATALOGO[0])).toBe('desbarrador_tanque');
    expect(modelosDelTipo(CATALOGO, 'otro')).toEqual([]);
    expect(modelosDelTipo(CATALOGO, 'portafiltro_triple')).toEqual([]);
  });
});
