import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { DataType, newDb } from 'pg-mem';
import type { Pool } from 'pg';
import { expect, it } from 'vitest';
import { alertasZona, inventario, resumenPorTienda } from './index';

const H1 = '11111111-1111-1111-1111-111111111111';
const H2 = '22222222-2222-2222-2222-222222222222';

it('las consultas corren contra el esquema de la migración (pg-mem)', async () => {
  const db = newDb();
  db.public.registerFunction({ name: 'gen_random_uuid', returns: DataType.uuid, implementation: randomUUID, impure: true });
  db.public.none(readFileSync(new URL('../../../db/migraciones/001_inicial.sql', import.meta.url), 'utf8'));
  db.public.none(`
    INSERT INTO cartuchos (codigo, nombre, marca, vida_util_meses) VALUES ('SED', 'Sedimentos', 'Ejemplo', 6);
    INSERT INTO stock (tienda_id, cartucho_codigo, cantidad) VALUES ('manongo', 'SED', 1);
    INSERT INTO hogares (id, nombre, zona, origen_agua, personas, tiene_filtro, fecha_ultimo_cambio, whatsapp, tienda_id) VALUES
      ('${H1}', 'A', 'Naguanagua', 'chorro', 2, true, '2026-01-01', '04141234567', 'manongo'),
      ('${H2}', 'B', 'Naguanagua', 'chorro', 2, true, null, '04141234567', null);
    INSERT INTO pedidos (hogar_id, tipo, cartucho_codigo, modalidad, pago, tienda_id) VALUES
      ('${H1}', 'cartucho', 'SED', 'retiro', 'no_aplica', 'manongo'),
      ('${H2}', 'sobre', null, 'envio', 'simulado', 'manongo');
    INSERT INTO mediciones (hogar_id, origen, valores, semaforo, semaforo_por_parametro, evaluacion) VALUES
      ('${H1}', 'manual', '{}', 'rojo', '{"nitrato":"rojo"}', '{}'),
      ('${H2}', 'manual', '{}', 'rojo', '{"plomo":"rojo"}', '{}');
  `);
  const { Pool: PoolMem } = db.adapters.createPg();
  const bd = new PoolMem() as Pool;
  const hoy = new Date('2026-11-21T12:00:00Z');

  const resumen = await resumenPorTienda(bd, hoy);
  expect(resumen.find((r) => r.tienda_id === 'manongo')).toMatchObject({
    hogares: 2,
    pedidos_pendientes: 2,
    sobres_pendientes: 1,
    recambios_7_dias: 1,
    recambios_30_dias: 1,
  });
  expect(await inventario(bd, hoy)).toEqual([
    expect.objectContaining({ tienda_id: 'manongo', cartucho_codigo: 'SED', stock: 1, demanda_30_dias: 2, faltante: 1 }),
  ]);
  const zonas = await alertasZona(bd, new Date());
  expect(zonas[0]).toMatchObject({ zona: 'Naguanagua', hogares_en_rojo_7_dias: 2, alerta: false });
});
