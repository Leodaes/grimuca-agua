// Plataforma de comercios (docs/decisiones/contrato-red.md): roles, filtro por comercio, red, técnico y productos.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { ComercioEnRed, EventoAgua, Pedido, ProductoComercio, ResumenRed, ServicioConReporte } from '../tipos';
import {
  crearEntorno,
  formularioFoto,
  insertarComercio,
  perfilDePrueba,
  PIN_LARA_PRUEBA,
  PIN_PRUEBA,
  PIN_RED_PRUEBA,
  PIN_TECNICO_PRUEBA,
  SECRETO_PRUEBA,
  type Entorno,
} from './ayudas-prueba';
import { eventoParaSesion } from './eventos';
import { crearToken, crearTokenConRol, leerToken } from './operador';
import { aKebab, estadoMembresia, hoyEnVenezuela, sumarMeses } from './plataforma';
import { aBinario, aHexBytea } from './tecnico';

const bearer = (token: string) => ({ authorization: `Bearer ${token}` });
function diaMas(dias: number): string {
  const base = Date.parse(`${hoyEnVenezuela()}T00:00:00Z`);
  return new Date(base + dias * 86_400_000).toISOString().slice(0, 10);
}

let e: Entorno;
let tokenGrimuca: string;
let tokenLara: string;
let tokenRed: string;
let tokenTecnico: string;
let hogarGrimuca: string;
let hogarLara: string;

async function entrar(url: string, pin: string) {
  return e.app.inject({ method: 'POST', url, payload: { pin } });
}

async function crearHogar(cambios: Record<string, unknown>): Promise<string> {
  const res = await e.app.inject({ method: 'POST', url: '/api/hogares', payload: perfilDePrueba(cambios) });
  expect(res.statusCode).toBe(201);
  return res.json().id as string;
}

async function crearPedido(hogar: string, tienda: string, extra: Record<string, unknown> = {}): Promise<Pedido> {
  const res = await e.app.inject({
    method: 'POST',
    url: '/api/pedidos',
    payload: { hogar_id: hogar, tipo: 'sobre', modalidad: 'retiro', tienda_id: tienda, ...extra },
  });
  expect(res.statusCode).toBe(201);
  return res.json();
}

async function crearServicio(hogar: string, tienda = 'manongo'): Promise<Pedido> {
  return crearPedido(hogar, tienda, {
    tipo: 'servicio',
    modalidad: 'envio',
    servicio: 'cambio_cartucho',
    fecha_preferida: diaMas(2),
    momento: 'manana',
    direccion: 'Calle 1, casa 2 (dato de prueba)',
  });
}

beforeAll(async () => {
  e = await crearEntorno({ conLogistica: true });
  await insertarComercio(e.bd, {
    id: 'aliado-lara',
    nombre: 'Aliado Lara (comercio de demostración)',
    estado: 'Lara',
    ciudad: 'Barquisimeto',
    tienda: 'lara-1',
    finGratis: diaMas(70),
  });
  await insertarComercio(e.bd, {
    id: 'aliado-aragua',
    nombre: 'Aliado Aragua (comercio de demostración)',
    estado: 'Aragua',
    ciudad: 'Maracay',
    tienda: 'aragua-1',
    finGratis: diaMas(-10),
  });
  tokenGrimuca = (await entrar('/api/operador/entrar', PIN_PRUEBA)).json().token;
  tokenLara = (await entrar('/api/operador/entrar', PIN_LARA_PRUEBA)).json().token;
  tokenRed = (await entrar('/api/red/entrar', PIN_RED_PRUEBA)).json().token;
  tokenTecnico = (await entrar('/api/tecnico/entrar', PIN_TECNICO_PRUEBA)).json().token;
  hogarGrimuca = await crearHogar({ nombre: 'Casa de Grimuca', tienda_id: 'manongo' });
  hogarLara = await crearHogar({ nombre: 'Casa de Lara', zona: 'Otra', tienda_id: 'lara-1' });
});

afterAll(async () => {
  await e.app.close();
});

describe('entrada y roles', () => {
  it('cada PIN entra con su rol y su comercio', async () => {
    const grimuca = await entrar('/api/operador/entrar', PIN_PRUEBA);
    expect(grimuca.statusCode).toBe(200);
    expect(grimuca.json()).toMatchObject({ rol: 'comercio', comercio: { id: 'grimuca', nombre: 'Grimuca', plan: 'premium' } });

    const lara = await entrar('/api/operador/entrar', PIN_LARA_PRUEBA);
    expect(lara.json()).toMatchObject({ rol: 'comercio', comercio: { id: 'aliado-lara' } });

    const red = await entrar('/api/red/entrar', PIN_RED_PRUEBA);
    expect(red.json()).toEqual({ token: expect.any(String), rol: 'superadmin' });

    const tecnico = await entrar('/api/tecnico/entrar', PIN_TECNICO_PRUEBA);
    expect(tecnico.json()).toMatchObject({ rol: 'tecnico', comercio: { id: 'grimuca' } });

    expect(leerToken(tokenLara, SECRETO_PRUEBA)).toEqual({ rol: 'comercio', comercio_id: 'aliado-lara' });
    expect(leerToken(tokenRed, SECRETO_PRUEBA)).toEqual({ rol: 'superadmin', comercio_id: null });
    expect(leerToken(tokenTecnico, SECRETO_PRUEBA)).toEqual({ rol: 'tecnico', comercio_id: 'grimuca' });
  });

  it('un PIN equivocado (o el de otro rol) no entra', async () => {
    for (const url of ['/api/operador/entrar', '/api/red/entrar', '/api/tecnico/entrar']) {
      const malo = await entrar(url, '0000');
      expect(malo.statusCode).toBe(401);
      expect(malo.json()).toEqual({ error: 'PIN incorrecto.' });
    }
    expect((await entrar('/api/operador/entrar', PIN_RED_PRUEBA)).statusCode).toBe(401);
    expect((await entrar('/api/operador/entrar', PIN_TECNICO_PRUEBA)).statusCode).toBe(401);
    expect((await entrar('/api/red/entrar', PIN_PRUEBA)).statusCode).toBe(401);
    expect((await entrar('/api/tecnico/entrar', PIN_PRUEBA)).statusCode).toBe(401);
  });

  it('cada token sirve solo para su sección', async () => {
    const pedidos = (token: string) => e.app.inject({ method: 'GET', url: '/api/operador/pedidos', headers: bearer(token) });
    expect((await pedidos(tokenTecnico)).statusCode).toBe(403);
    expect((await pedidos(tokenRed)).statusCode).toBe(403);
    const resumenRed = (token: string) => e.app.inject({ method: 'GET', url: '/api/red/resumen', headers: bearer(token) });
    expect((await resumenRed(tokenGrimuca)).statusCode).toBe(403);
    expect((await resumenRed('malo')).statusCode).toBe(401);
    const servicios = (token: string) => e.app.inject({ method: 'GET', url: '/api/tecnico/servicios', headers: bearer(token) });
    expect((await servicios(tokenGrimuca)).statusCode).toBe(403);
    expect((await servicios(tokenTecnico)).statusCode).toBe(200);
  });

  it('un token alterado no vale: no se puede cambiar el rol ni el comercio sin volver a firmar', () => {
    const [, , vencimiento, firma] = tokenLara.split('.');
    expect(leerToken(`comercio.grimuca.${vencimiento}.${firma}`, SECRETO_PRUEBA)).toBeNull();
    expect(leerToken(`superadmin.-.${vencimiento}.${firma}`, SECRETO_PRUEBA)).toBeNull();
    // Superadmin con comercio, o comercio sin comercio: no tienen forma válida.
    expect(leerToken(crearTokenConRol(SECRETO_PRUEBA, { rol: 'comercio', comercio_id: null }), SECRETO_PRUEBA)).toBeNull();
  });

  it('un token viejo, sin rol, sigue valiendo como el comercio grimuca', async () => {
    const viejo = crearToken(SECRETO_PRUEBA);
    expect(leerToken(viejo, SECRETO_PRUEBA)).toEqual({ rol: 'comercio', comercio_id: 'grimuca' });
    const yo = await e.app.inject({ method: 'GET', url: '/api/operador/yo', headers: bearer(viejo) });
    expect(yo.statusCode).toBe(200);
    expect(yo.json().comercio.id).toBe('grimuca');
    expect(yo.json().tiendas.map((t: { id: string }) => t.id).sort()).toEqual(['biglow', 'cem', 'manongo']);
  });

  it('GET /api/operador/yo trae el comercio y sus tiendas', async () => {
    const yo = await e.app.inject({ method: 'GET', url: '/api/operador/yo', headers: bearer(tokenLara) });
    expect(yo.json()).toMatchObject({ rol: 'comercio', comercio: { id: 'aliado-lara', estado_pais: 'Lara' } });
    expect(yo.json().tiendas.map((t: { id: string }) => t.id)).toEqual(['lara-1']);
  });

  it('el cliente sigue viendo las tiendas de Grimuca en GET /api/tiendas', async () => {
    const tiendas = await e.app.inject({ method: 'GET', url: '/api/tiendas' });
    expect(tiendas.json().map((t: { id: string }) => t.id).sort()).toEqual(['biglow', 'cem', 'manongo']);
    const todas = await e.app.inject({ method: 'GET', url: '/api/tiendas?comercio=todos' });
    expect(todas.json()).toHaveLength(5);
  });
});

describe('cada comercio ve solo lo suyo', () => {
  let deGrimuca: Pedido;
  let deLara: Pedido;

  beforeAll(async () => {
    deGrimuca = await crearPedido(hogarGrimuca, 'manongo');
    deLara = await crearPedido(hogarLara, 'lara-1');
  });

  it('los pedidos traen la tienda y el comercio, también para el cliente', async () => {
    expect(deLara).toMatchObject({ tienda_nombre: 'Tienda de Aliado Lara (comercio de demostración)', comercio_nombre: 'Aliado Lara (comercio de demostración)' });
    const delCliente = await e.app.inject({ method: 'GET', url: `/api/pedidos/${deGrimuca.id}` });
    expect(delCliente.json()).toMatchObject({ id: deGrimuca.id, tienda_nombre: 'Mañongo', comercio_nombre: 'Grimuca' });
  });

  it('la lista de pedidos se filtra por comercio', async () => {
    const lista = async (token: string) =>
      (await e.app.inject({ method: 'GET', url: '/api/operador/pedidos?estado=todos', headers: bearer(token) })).json() as Pedido[];
    const deG = await lista(tokenGrimuca);
    const deL = await lista(tokenLara);
    expect(deG.map((p) => p.id)).toContain(deGrimuca.id);
    expect(deG.map((p) => p.id)).not.toContain(deLara.id);
    expect(deL.map((p) => p.id)).toEqual([deLara.id]);
    expect(deL[0]).toMatchObject({ hogar_nombre: 'Casa de Lara', comercio_nombre: 'Aliado Lara (comercio de demostración)' });
  });

  it('un comercio no puede despachar el pedido de otro (404), y sí el suyo', async () => {
    const ajeno = await e.app.inject({ method: 'POST', url: `/api/operador/pedidos/${deLara.id}/despachar`, headers: bearer(tokenGrimuca) });
    expect(ajeno.statusCode).toBe(404);
    const otroAjeno = await e.app.inject({ method: 'POST', url: `/api/operador/pedidos/${deGrimuca.id}/despachar`, headers: bearer(tokenLara) });
    expect(otroAjeno.statusCode).toBe(404);
    const propio = await e.app.inject({ method: 'POST', url: `/api/operador/pedidos/${deLara.id}/despachar`, headers: bearer(tokenLara) });
    expect(propio.statusCode).toBe(200);
    expect(propio.json()).toMatchObject({ id: deLara.id, estado: 'despachado' });
  });

  it('resumen, inventario, zonas y mapa solo con sus tiendas y sus hogares', async () => {
    await e.bd.query("INSERT INTO stock (tienda_id, cartucho_codigo, cantidad) VALUES ('lara-1', 'PR-SED', 3), ('manongo', 'PR-SED', 9)");
    const pedir = async (url: string, token: string) => (await e.app.inject({ method: 'GET', url, headers: bearer(token) })).json();

    const resumenLara = await pedir('/api/operador/resumen', tokenLara);
    expect(resumenLara).toEqual([expect.objectContaining({ tienda_id: 'lara-1', hogares: 1 })]);
    const resumenGrimuca = await pedir('/api/operador/resumen', tokenGrimuca);
    expect(resumenGrimuca.map((r: { tienda_id: string }) => r.tienda_id).sort()).toEqual(['biglow', 'cem', 'manongo']);

    const inventarioLara = await pedir('/api/operador/inventario', tokenLara);
    expect(inventarioLara.every((f: { tienda_id: string }) => f.tienda_id === 'lara-1')).toBe(true);
    expect(inventarioLara).toEqual([expect.objectContaining({ cartucho_codigo: 'PR-SED', stock: 3 })]);
    const inventarioGrimuca = await pedir('/api/operador/inventario', tokenGrimuca);
    expect(inventarioGrimuca.some((f: { tienda_id: string }) => f.tienda_id === 'lara-1')).toBe(false);

    const zonasLara = await pedir('/api/operador/zonas', tokenLara);
    expect(zonasLara.map((z: { zona: string }) => z.zona)).toEqual(['Otra']);
    const zonasGrimuca = await pedir('/api/operador/zonas', tokenGrimuca);
    expect(zonasGrimuca.map((z: { zona: string }) => z.zona)).not.toContain('Otra');

    const mapaLara = await pedir('/api/operador/mapa', tokenLara);
    const conHogares = mapaLara.filter((u: { hogares: number }) => u.hogares > 0);
    expect(conHogares).toEqual([expect.objectContaining({ nombre: 'Otras de Otra', hogares: 1 })]);
  });
});

describe('eventos en vivo por comercio', () => {
  it('cada sesión recibe solo los eventos de su comercio; el superadmin, todos', () => {
    const pedido = (comercio_id?: string) =>
      ({ tipo: 'pedido_nuevo', datos: { id: 1, comercio_id } as unknown as Pedido }) as EventoAgua;
    const medicion = { tipo: 'medicion_nueva', datos: { hogar_id: 'x', zona: 'Otra', semaforo: 'verde', comercio_id: 'aliado-lara' } } as EventoAgua;
    const lara = { rol: 'comercio', comercio_id: 'aliado-lara' } as const;
    const grimuca = { rol: 'comercio', comercio_id: 'grimuca' } as const;
    const tecnico = { rol: 'tecnico', comercio_id: 'grimuca' } as const;
    const red = { rol: 'superadmin', comercio_id: null } as const;
    expect(eventoParaSesion(pedido('aliado-lara'), lara)).toBe(true);
    expect(eventoParaSesion(pedido('aliado-lara'), grimuca)).toBe(false);
    expect(eventoParaSesion(pedido('grimuca'), tecnico)).toBe(true);
    expect(eventoParaSesion(pedido(), grimuca)).toBe(true); // sin comercio = grimuca
    expect(eventoParaSesion(pedido(), lara)).toBe(false);
    expect(eventoParaSesion(medicion, lara)).toBe(true);
    expect(eventoParaSesion(medicion, tecnico)).toBe(false);
    expect(eventoParaSesion(pedido('aliado-lara'), red)).toBe(true);
  });

  it('por SSE, el panel de Lara no recibe los pedidos de Grimuca', async () => {
    const entorno = await crearEntorno();
    await insertarComercio(entorno.bd, { id: 'aliado-lara', nombre: 'Aliado Lara', estado: 'Lara', ciudad: 'Barquisimeto', tienda: 'lara-1' });
    const direccion = await entorno.app.listen({ host: '127.0.0.1', port: 0 });
    const corte = new AbortController();
    try {
      const token = (await entorno.app.inject({ method: 'POST', url: '/api/operador/entrar', payload: { pin: PIN_LARA_PRUEBA } })).json().token;
      const respuesta = await fetch(`${direccion}/api/eventos?token=${encodeURIComponent(token)}`, { signal: corte.signal });
      expect(respuesta.status).toBe(200);
      const lector = respuesta.body!.getReader();
      const decodificador = new TextDecoder();
      let recibido = '';
      const leerHasta = async (marca: string) => {
        const limite = Date.now() + 5_000;
        while (!recibido.includes(marca)) {
          if (Date.now() > limite) throw new Error(`no llegó "${marca}"; recibido: ${recibido}`);
          const { value, done } = await lector.read();
          if (done) break;
          recibido += decodificador.decode(value, { stream: true });
        }
      };
      await leerHasta(': conectado');

      const alta = async (tienda: string) =>
        (await entorno.app.inject({ method: 'POST', url: '/api/hogares', payload: perfilDePrueba({ zona: 'Otra', tienda_id: tienda }) })).json().id;
      const pedir = async (hogar: string, tienda: string) =>
        (
          await entorno.app.inject({
            method: 'POST',
            url: '/api/pedidos',
            payload: { hogar_id: hogar, tipo: 'sobre', modalidad: 'retiro', tienda_id: tienda },
          })
        ).json().id as number;
      const hogarG = await alta('manongo');
      const hogarL = await alta('lara-1');
      const deGrimuca = await pedir(hogarG, 'manongo');
      const deLara = await pedir(hogarL, 'lara-1');
      // Los eventos llegan en orden: si el de Grimuca hubiera salido, estaría antes que el de Lara.
      await leerHasta(`"id":${deLara}`);
      expect(recibido).not.toContain(`"id":${deGrimuca},`);
      expect(recibido).not.toContain('"comercio_id":"grimuca"');
    } finally {
      corte.abort();
      await entorno.app.close();
    }
  });
});

describe('red (superadmin)', () => {
  it('estado de la membresía: periodo gratis, activa y vencida', () => {
    const hoy = '2026-11-21';
    expect(estadoMembresia({ activo: true, fin_periodo_gratis: '2026-12-01' }, hoy)).toEqual({
      estado_membresia: 'periodo_gratis',
      dias_gratis_restantes: 10,
    });
    expect(estadoMembresia({ activo: true, fin_periodo_gratis: hoy }, hoy)).toEqual({ estado_membresia: 'periodo_gratis', dias_gratis_restantes: 0 });
    expect(estadoMembresia({ activo: true, fin_periodo_gratis: null }, hoy)).toEqual({ estado_membresia: 'activa', dias_gratis_restantes: null });
    expect(estadoMembresia({ activo: true, fin_periodo_gratis: '2026-11-20' }, hoy).estado_membresia).toBe('vencida');
    expect(estadoMembresia({ activo: false, fin_periodo_gratis: null }, hoy).estado_membresia).toBe('vencida');
  });

  it('el resumen suma bien y calcula el estado de cada comercio', async () => {
    const res = await e.app.inject({ method: 'GET', url: '/api/red/resumen', headers: bearer(tokenRed) });
    expect(res.statusCode).toBe(200);
    const resumen: ResumenRed = res.json();
    const por = Object.fromEntries(resumen.comercios.map((c) => [c.id, c]));
    expect(por.grimuca).toMatchObject({ tiendas: 3, estado_membresia: 'activa', dias_gratis_restantes: null, membresia_usd: null });
    expect(por['aliado-lara']).toMatchObject({ tiendas: 1, hogares: 1, estado_membresia: 'periodo_gratis', dias_gratis_restantes: 70 });
    expect(por['aliado-aragua']).toMatchObject({ tiendas: 1, hogares: 0, estado_membresia: 'vencida', pedidos_mes: 0 });

    // Cuenta directa en la base, para comparar.
    const hogares = Number((await e.bd.query('SELECT count(*) AS n FROM hogares')).rows[0].n);
    const pedidos = Number((await e.bd.query('SELECT count(*) AS n FROM pedidos')).rows[0].n);
    const pendientes = Number((await e.bd.query("SELECT count(*) AS n FROM pedidos WHERE estado = 'pendiente'")).rows[0].n);
    const suma = (campo: keyof ComercioEnRed) => resumen.comercios.reduce((t, c) => t + Number(c[campo]), 0);
    expect(resumen.totales).toEqual({
      comercios: resumen.comercios.length,
      estados_cubiertos: new Set(resumen.comercios.map((c) => c.estado_pais)).size,
      tiendas: suma('tiendas'),
      hogares: suma('hogares'),
      mediciones_mes: suma('mediciones_mes'),
      pedidos_mes: suma('pedidos_mes'),
      pedidos_pendientes: suma('pedidos_pendientes'),
    });
    expect(resumen.totales.hogares).toBe(hogares);
    expect(resumen.totales.pedidos_mes).toBe(pedidos);
    expect(resumen.totales.pedidos_pendientes).toBe(pendientes);
    expect(por['aliado-lara'].pedidos_mes).toBe(1);
  });

  it('da de alta un comercio con su primera tienda y un id sin acentos y único', async () => {
    const datos = {
      nombre: 'Ferretería Ñandú Médica',
      estado_pais: 'Zulia',
      ciudad: 'Maracaibo',
      plan: 'basico',
      meses_gratis: 2,
      tienda_nombre: 'Ñandú Centro',
      tienda_direccion: 'Calle 5 (dato de prueba)',
    };
    const res = await e.app.inject({ method: 'POST', url: '/api/red/comercios', headers: bearer(tokenRed), payload: datos });
    expect(res.statusCode).toBe(201);
    const comercio: ComercioEnRed = res.json();
    expect(comercio).toMatchObject({
      id: 'ferreteria-nandu-medica',
      nombre: 'Ferretería Ñandú Médica',
      plan: 'basico',
      membresia_usd: null,
      fin_periodo_gratis: sumarMeses(hoyEnVenezuela(), 2),
      activo: true,
      tiendas: 1,
      hogares: 0,
      estado_membresia: 'periodo_gratis',
    });
    const tiendas = await e.bd.query("SELECT id, nombre, comercio_id FROM tiendas WHERE comercio_id = 'ferreteria-nandu-medica'");
    expect(tiendas.rows).toEqual([{ id: 'nandu-centro', nombre: 'Ñandú Centro', comercio_id: 'ferreteria-nandu-medica' }]);

    const otra = await e.app.inject({ method: 'POST', url: '/api/red/comercios', headers: bearer(tokenRed), payload: { ...datos, meses_gratis: 0 } });
    expect(otra.statusCode).toBe(201);
    expect(otra.json()).toMatchObject({ id: 'ferreteria-nandu-medica-2', fin_periodo_gratis: null, estado_membresia: 'activa' });

    const malo = await e.app.inject({ method: 'POST', url: '/api/red/comercios', headers: bearer(tokenRed), payload: { ...datos, meses_gratis: 4 } });
    expect(malo.statusCode).toBe(400);
    const sinPermiso = await e.app.inject({ method: 'POST', url: '/api/red/comercios', headers: bearer(tokenGrimuca), payload: datos });
    expect(sinPermiso.statusCode).toBe(403);
  });

  it('el id de un comercio sale del nombre en kebab, sin acentos', () => {
    expect(aKebab('  Ferretería El Tornillo, C.A. ')).toBe('ferreteria-el-tornillo-c-a');
    expect(aKebab('¡¡¡')).toBe('comercio');
    expect(sumarMeses('2026-01-31', 1)).toBe('2026-02-28');
  });
});

describe('técnico', () => {
  let servicio: Pedido;
  let deLara: Pedido;

  beforeAll(async () => {
    servicio = await crearServicio(hogarGrimuca);
    deLara = await crearServicio(hogarLara, 'lara-1');
  });

  it('lista solo los servicios pendientes de su comercio', async () => {
    const res = await e.app.inject({ method: 'GET', url: '/api/tecnico/servicios?estado=pendiente', headers: bearer(tokenTecnico) });
    const lista: ServicioConReporte[] = res.json();
    expect(lista.map((s) => s.id)).toContain(servicio.id);
    expect(lista.map((s) => s.id)).not.toContain(deLara.id);
    expect(lista.every((s) => s.tipo === 'servicio' && s.reporte === null && s.hogar_nombre)).toBe(true);
  });

  it('atiende con foto y nota: deja el pedido despachado, guarda el reporte y avisa', async () => {
    const antes = e.emitidos.length;
    const foto = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5]);
    const formulario = formularioFoto({ nota: 'Quedó listo, sin fugas.' }, { nombre: 'listo.jpg', tipo: 'image/jpeg', datos: foto });
    const res = await e.app.inject({
      method: 'POST',
      url: `/api/tecnico/servicios/${servicio.id}/atender`,
      headers: { ...bearer(tokenTecnico), ...formulario.headers },
      payload: formulario.payload,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      id: servicio.id,
      estado: 'despachado',
      reporte: { nota: 'Quedó listo, sin fugas.', tiene_foto: true, fecha_visita: expect.any(String) },
    });
    const avisos = e.emitidos.slice(antes);
    expect(avisos).toEqual([expect.objectContaining({ tipo: 'pedido_despachado', datos: expect.objectContaining({ id: servicio.id }) })]);

    // El comercio dueño ve el reporte y la foto; el técnico y la red, también.
    const reportes: ServicioConReporte[] = (
      await e.app.inject({ method: 'GET', url: '/api/operador/reportes', headers: bearer(tokenGrimuca) })
    ).json();
    expect(reportes.find((r) => r.id === servicio.id)?.reporte).toMatchObject({ tiene_foto: true });
    for (const token of [tokenGrimuca, tokenTecnico, tokenRed]) {
      const verFoto = await e.app.inject({ method: 'GET', url: `/api/servicios/${servicio.id}/foto?token=${encodeURIComponent(token)}` });
      expect(verFoto.statusCode).toBe(200);
      expect(verFoto.headers['content-type']).toBe('image/jpeg');
      expect(Buffer.compare(verFoto.rawPayload, foto)).toBe(0);
    }

    // Otro comercio no ve ni el reporte ni la foto.
    const deOtro: ServicioConReporte[] = (
      await e.app.inject({ method: 'GET', url: '/api/operador/reportes', headers: bearer(tokenLara) })
    ).json();
    expect(deOtro.map((r) => r.id)).not.toContain(servicio.id);
    const fotoAjena = await e.app.inject({ method: 'GET', url: `/api/servicios/${servicio.id}/foto?token=${encodeURIComponent(tokenLara)}` });
    expect(fotoAjena.statusCode).toBe(404);
    expect((await e.app.inject({ method: 'GET', url: `/api/servicios/${servicio.id}/foto` })).statusCode).toBe(401);
  });

  it('no atiende servicios de otro comercio ni acepta fotos que no son imagen', async () => {
    const ajeno = await e.app.inject({
      method: 'POST',
      url: `/api/tecnico/servicios/${deLara.id}/atender`,
      headers: bearer(tokenTecnico),
      payload: { nota: 'no' },
    });
    expect(ajeno.statusCode).toBe(404);
    const otro = await crearServicio(hogarGrimuca);
    const formulario = formularioFoto({}, { nombre: 'nota.txt', tipo: 'text/plain', datos: Buffer.from('hola') });
    const res = await e.app.inject({
      method: 'POST',
      url: `/api/tecnico/servicios/${otro.id}/atender`,
      headers: { ...bearer(tokenTecnico), ...formulario.headers },
      payload: formulario.payload,
    });
    expect(res.statusCode).toBe(415);
  });

  it('la foto se guarda en hexadecimal y se lee en binario, venga como venga de la base', () => {
    const jpg = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x5c, 0x78]);
    expect(aHexBytea(jpg)).toBe('\\xffd8ff005c78');
    expect(aBinario(jpg)).toEqual(jpg); // Postgres real devuelve el binario
    expect(aBinario(Buffer.from('\\xffd8ff005c78', 'latin1'))).toEqual(jpg); // base en memoria
    expect(aBinario(null)).toBeNull();
  });

  it('atiende sin foto (solo nota) y el reporte queda sin foto', async () => {
    const otro = await crearServicio(hogarGrimuca);
    const res = await e.app.inject({
      method: 'POST',
      url: `/api/tecnico/servicios/${otro.id}/atender`,
      headers: bearer(tokenTecnico),
      payload: { nota: 'Cliente no estaba; se dejó aviso.' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().reporte).toMatchObject({ tiene_foto: false, nota: 'Cliente no estaba; se dejó aviso.' });
    const foto = await e.app.inject({ method: 'GET', url: `/api/servicios/${otro.id}/foto?token=${encodeURIComponent(tokenGrimuca)}` });
    expect(foto.statusCode).toBe(404);
  });
});

describe('productos del comercio', () => {
  const nuevo = {
    codigo: 'LARA-SED-10',
    nombre: 'Cartucho de sedimentos de Lara',
    categoria: 'cartucho',
    corrige: ['sedimentos', 'cloro_libre'],
    existencias: { 'lara-1': 7 },
  };

  it('da de alta un producto propio con sus existencias y entra al catálogo', async () => {
    const res = await e.app.inject({ method: 'POST', url: '/api/operador/productos', headers: bearer(tokenLara), payload: nuevo });
    expect(res.statusCode).toBe(201);
    const producto: ProductoComercio = res.json();
    expect(producto).toMatchObject({
      codigo: 'LARA-SED-10',
      propio: true,
      corrige: ['sedimentos', 'cloro_libre'],
      disponible: true,
      precio_usd: null,
      existencias: [{ tienda_id: 'lara-1', tienda_nombre: expect.any(String), cantidad: 7 }],
    });
    expect(producto).not.toHaveProperty('recomendable');

    const deLara: ProductoComercio[] = (await e.app.inject({ method: 'GET', url: '/api/operador/productos', headers: bearer(tokenLara) })).json();
    expect(deLara.find((p) => p.codigo === 'LARA-SED-10')?.propio).toBe(true);
    expect(deLara.find((p) => p.codigo === 'PR-SED')).toMatchObject({ propio: false });
    const deGrimuca: ProductoComercio[] = (
      await e.app.inject({ method: 'GET', url: '/api/operador/productos', headers: bearer(tokenGrimuca) })
    ).json();
    expect(deGrimuca.some((p) => p.codigo === 'LARA-SED-10')).toBe(false);
    expect(deGrimuca[0].existencias.map((x) => x.tienda_id).sort()).toEqual(['biglow', 'cem', 'manongo']);

    // El producto propio solo lo ven los clientes de Lara; sin hogar, solo el catálogo general.
    const tiene = async (url: string) =>
      (await e.app.inject({ method: 'GET', url })).json().some((c: { codigo: string }) => c.codigo === 'LARA-SED-10');
    expect(await tiene('/api/cartuchos')).toBe(false);
    expect(await tiene(`/api/cartuchos?hogar_id=${hogarLara}`)).toBe(true);
    expect(await tiene(`/api/cartuchos?hogar_id=${hogarGrimuca}`)).toBe(false);
    expect(await tiene('/api/cartuchos?hogar_id=7f3c2a8e-0000-4000-8000-000000000000')).toBe(false);
    expect((await e.app.inject({ method: 'GET', url: '/api/cartuchos?hogar_id=x' })).statusCode).toBe(400);
  });

  it('los sugeridos de una medición solo traen productos propios del comercio del hogar', async () => {
    const sugeridosDe = async (hogar: string) => {
      await e.app.inject({ method: 'PATCH', url: `/api/hogares/${hogar}`, payload: { agua_turbia: true } });
      const res = await e.app.inject({ method: 'POST', url: '/api/mediciones/manual', payload: { hogar_id: hogar, valores: { nitrato: 10 } } });
      expect(res.statusCode).toBe(201);
      return res.json().sugeridos.map((c: { codigo: string }) => c.codigo) as string[];
    };
    expect(await sugeridosDe(hogarGrimuca)).not.toContain('LARA-SED-10');
    expect(await sugeridosDe(hogarLara)).toContain('LARA-SED-10');
  });

  it('rechaza un código repetido, claves de "corrige" desconocidas y tiendas de otro comercio', async () => {
    const repetido = await e.app.inject({ method: 'POST', url: '/api/operador/productos', headers: bearer(tokenGrimuca), payload: nuevo });
    expect(repetido.statusCode).toBe(409);
    const conPrueba = await e.app.inject({
      method: 'POST',
      url: '/api/operador/productos',
      headers: bearer(tokenGrimuca),
      payload: { ...nuevo, codigo: 'PR-SED' },
    });
    expect(conPrueba.statusCode).toBe(409);
    const claveMala = await e.app.inject({
      method: 'POST',
      url: '/api/operador/productos',
      headers: bearer(tokenLara),
      payload: { ...nuevo, codigo: 'OTRO-1', corrige: ['magia'] },
    });
    expect(claveMala.statusCode).toBe(400);
    const tiendaAjena = await e.app.inject({
      method: 'POST',
      url: '/api/operador/productos',
      headers: bearer(tokenLara),
      payload: { ...nuevo, codigo: 'OTRO-2', existencias: { manongo: 3 } },
    });
    expect(tiendaAjena.statusCode).toBe(400);
    const sinSesion = await e.app.inject({ method: 'POST', url: '/api/operador/productos', payload: { ...nuevo, codigo: 'OTRO-3' } });
    expect(sinSesion.statusCode).toBe(401);
  });
});
