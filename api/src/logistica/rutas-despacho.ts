// Rutas de despacho (pestaña "Rutas" del comercio): una ruta por tienda que agrupa las entregas pendientes
// por urbanización, contra la cuenta de ir y volver a cada hogar por separado.
//
// - Entran los pedidos pendientes con modalidad `envio` y los servicios técnicos pendientes (no los de retiro).
// - Una parada por urbanización. Orden: vecino más cercano desde la tienda (ida y vuelta) mejorado con 2-opt.
// - Distancia APROXIMADA: línea recta (haversine) por un factor de calle de 1,3, en km con un decimal.
// - El hogar se ubica en el centro de su urbanización con un desplazamiento pequeño y determinista según su id;
//   la ruta pasa por cada hogar de la parada, así nunca es más larga que los viajes sueltos.
// - Sin urbanización conocida: no entra a la ruta y se cuenta en `sin_ubicacion`.
// `calcularRutas` es puro (se prueba sin base); `rutasDespacho` solo hace la consulta.
import type { Pool } from 'pg';
import type { ParadaRuta, PedidoEnParada, RutaTienda, RutasDespacho } from '../tipos';
import { leerTiendas, type FilaTienda } from './demanda';
import { URBANIZACIONES, UBICACION_TIENDAS, normalizarNombre, type Coordenada, type Urbanizacion } from './urbanizaciones';

/** Las calles no van en línea recta: se multiplica la distancia por este factor. */
export const FACTOR_CALLE = 1.3;
const RADIO_TIERRA_KM = 6371;
export const MOTIVO_SIN_UBICACION = 'Esta tienda todavía no tiene ubicación en el mapa de Carabobo.';

export interface PedidoParaRuta {
  id: number;
  tipo: 'sobre' | 'cartucho' | 'servicio';
  tienda_id: string;
  hogar_id: string;
  hogar_nombre: string;
  zona: string;
  urbanizacion: string | null;
  detalle: string;
}

const enRadianes = (grados: number) => (grados * Math.PI) / 180;

/** Distancia en línea recta sobre la Tierra, en km. */
export function haversineKm(a: Coordenada, b: Coordenada): number {
  const dLat = enRadianes(b.lat - a.lat);
  const dLng = enRadianes(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(enRadianes(a.lat)) * Math.cos(enRadianes(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Distancia aproximada por calle: línea recta × factor de calle. */
export function distanciaKm(a: Coordenada, b: Coordenada): number {
  return haversineKm(a, b) * FACTOR_CALLE;
}

const unDecimal = (km: number) => Math.round(km * 10) / 10;

/** Número estable a partir de un texto (FNV-1a de 32 bits). */
function resumenTexto(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Urbanización de la lista que corresponde al hogar (debe ser de su misma zona, como en el mapa). */
export function urbanizacionDelHogar(
  urbanizacion: string | null,
  zona: string,
  lista: readonly Urbanizacion[] = URBANIZACIONES,
): Urbanizacion | undefined {
  if (!urbanizacion) return undefined;
  const clave = normalizarNombre(urbanizacion);
  const u = lista.find((x) => normalizarNombre(x.nombre) === clave || x.id === urbanizacion.trim());
  return u && u.zona === zona ? u : undefined;
}

/**
 * Punto del hogar: el centro de su urbanización desplazado entre unos 40 y 150 m, siempre igual para el mismo id
 * (no es su dirección: es para no apilar los puntos y para contar los viajes sueltos).
 */
export function ubicacionDelHogar(hogarId: string, u: Pick<Urbanizacion, 'lat' | 'lng'>): Coordenada {
  const h = resumenTexto(hogarId);
  const angulo = ((h % 360) * Math.PI) / 180;
  const radio = 0.0004 + (((h >>> 9) % 1000) / 1000) * 0.001;
  return { lat: u.lat + radio * Math.sin(angulo), lng: u.lng + radio * Math.cos(angulo) };
}

/** Largo de ida y vuelta: origen → puntos en orden → origen. */
function largoCircuito(origen: Coordenada, puntos: Coordenada[]): number {
  let total = 0;
  let previo = origen;
  for (const p of puntos) {
    total += distanciaKm(previo, p);
    previo = p;
  }
  return total + distanciaKm(previo, origen);
}

/**
 * Orden de visita: vecino más cercano desde el origen y luego 2-opt (invierte tramos mientras acorte el circuito).
 * Devuelve los índices de `puntos` en orden. Los empates se resuelven por `claves` (determinista).
 */
export function ordenarParadas(origen: Coordenada, puntos: Coordenada[], claves: string[] = puntos.map((_, i) => String(i))): number[] {
  const restantes = puntos.map((_, i) => i);
  const orden: number[] = [];
  let actual = origen;
  while (restantes.length > 0) {
    let mejor = 0;
    for (let k = 1; k < restantes.length; k++) {
      const dk = distanciaKm(actual, puntos[restantes[k]]);
      const dm = distanciaKm(actual, puntos[restantes[mejor]]);
      if (dk < dm - 1e-12 || (Math.abs(dk - dm) <= 1e-12 && claves[restantes[k]] < claves[restantes[mejor]])) mejor = k;
    }
    const [elegido] = restantes.splice(mejor, 1);
    orden.push(elegido);
    actual = puntos[elegido];
  }
  // 2-opt sobre el circuito [origen, ...orden, origen].
  const punto = (i: number) => (i < 0 || i >= orden.length ? origen : puntos[orden[i]]);
  let mejoro = true;
  let vueltas = 0;
  while (mejoro && vueltas < 100) {
    mejoro = false;
    vueltas += 1;
    for (let i = 0; i < orden.length - 1; i++) {
      for (let j = i + 1; j < orden.length; j++) {
        const antes = distanciaKm(punto(i - 1), punto(i)) + distanciaKm(punto(j), punto(j + 1));
        const despues = distanciaKm(punto(i - 1), punto(j)) + distanciaKm(punto(i), punto(j + 1));
        if (despues < antes - 1e-9) {
          orden.splice(i, j - i + 1, ...orden.slice(i, j + 1).reverse());
          mejoro = true;
        }
      }
    }
  }
  return orden;
}

/** La ruta y sus distancias sin redondear (para sumar los totales sin acumular redondeos). */
interface RutaCalculada {
  ruta: RutaTienda;
  recorrido: number;
  sueltos: number;
}

interface ParadaArmada {
  u: Urbanizacion;
  pedidos: PedidoParaRuta[];
}

function rutaDeTienda(
  tienda: FilaTienda,
  origen: Coordenada | null,
  pedidos: PedidoParaRuta[],
  urbanizaciones: readonly Urbanizacion[],
): RutaCalculada {
  const vacia = (sinUbicacion: number, motivo?: string): RutaCalculada => ({
    recorrido: 0,
    sueltos: 0,
    ruta: {
      tienda_id: tienda.id,
      tienda_nombre: tienda.nombre,
      origen,
      paradas: [],
      entregas: 0,
      distancia_ruta_km: 0,
      distancia_viajes_sueltos_km: 0,
      ahorro_km: 0,
      ahorro_porcentaje: 0,
      sin_ubicacion: sinUbicacion,
      ...(motivo ? { motivo } : {}),
    },
  });
  if (!origen) return vacia(pedidos.length, MOTIVO_SIN_UBICACION);

  const porUrbanizacion = new Map<string, ParadaArmada>();
  let sinUbicacion = 0;
  for (const p of pedidos) {
    const u = urbanizacionDelHogar(p.urbanizacion, p.zona, urbanizaciones);
    if (!u) {
      sinUbicacion += 1;
      continue;
    }
    const parada = porUrbanizacion.get(u.id) ?? { u, pedidos: [] };
    parada.pedidos.push(p);
    porUrbanizacion.set(u.id, parada);
  }
  const armadas = [...porUrbanizacion.values()].sort((a, b) => a.u.id.localeCompare(b.u.id));
  if (armadas.length === 0) return vacia(sinUbicacion);

  const orden = ordenarParadas(
    origen,
    armadas.map((a) => ({ lat: a.u.lat, lng: a.u.lng })),
    armadas.map((a) => a.u.id),
  );

  let previo = origen;
  let recorrido = 0;
  let sueltos = 0;
  const paradas: ParadaRuta[] = orden.map((indice, n) => {
    const { u, pedidos: dePedidos } = armadas[indice];
    const ordenados = [...dePedidos].sort((a, b) => a.id - b.id);
    // Dentro de la parada se pasa por cada hogar (una vez), del más cercano al que se viene.
    const hogares = [...new Set(ordenados.map((p) => p.hogar_id))].sort();
    const puntos = new Map(hogares.map((id) => [id, ubicacionDelHogar(id, u)]));
    let tramo = 0;
    const porVisitar = [...hogares];
    while (porVisitar.length > 0) {
      let mejor = 0;
      for (let k = 1; k < porVisitar.length; k++) {
        if (distanciaKm(previo, puntos.get(porVisitar[k])!) < distanciaKm(previo, puntos.get(porVisitar[mejor])!) - 1e-12) mejor = k;
      }
      const [id] = porVisitar.splice(mejor, 1);
      const punto = puntos.get(id)!;
      tramo += distanciaKm(previo, punto);
      previo = punto;
    }
    recorrido += tramo;
    for (const p of ordenados) sueltos += 2 * distanciaKm(origen, puntos.get(p.hogar_id)!);
    const lista: PedidoEnParada[] = ordenados.map((p) => ({
      id: p.id,
      tipo: p.tipo,
      hogar_nombre: p.hogar_nombre,
      detalle: p.detalle,
    }));
    return {
      orden: n + 1,
      urbanizacion: u.nombre,
      lat: u.lat,
      lng: u.lng,
      pedidos: lista,
      distancia_desde_anterior_km: unDecimal(tramo),
    };
  });
  recorrido += distanciaKm(previo, origen);
  const ahorro = Math.max(0, sueltos - recorrido);
  const ruta: RutaTienda = {
    tienda_id: tienda.id,
    tienda_nombre: tienda.nombre,
    origen,
    paradas,
    entregas: paradas.reduce((n, p) => n + p.pedidos.length, 0),
    distancia_ruta_km: unDecimal(recorrido),
    distancia_viajes_sueltos_km: unDecimal(sueltos),
    ahorro_km: unDecimal(ahorro),
    ahorro_porcentaje: sueltos > 0 ? Math.round((ahorro / sueltos) * 100) : 0,
    sin_ubicacion: sinUbicacion,
  };
  return { ruta, recorrido, sueltos };
}

/** Rutas de las tiendas dadas (en su orden) con los pedidos que les tocan. */
export function calcularRutas(
  tiendas: FilaTienda[],
  pedidos: PedidoParaRuta[],
  ubicaciones: Readonly<Record<string, Coordenada>> = UBICACION_TIENDAS,
  urbanizaciones: readonly Urbanizacion[] = URBANIZACIONES,
): RutasDespacho {
  let recorrido = 0;
  let sueltos = 0;
  const rutas = tiendas.map((t) => {
    const ubicacion = ubicaciones[t.id];
    const origen = ubicacion ? { lat: ubicacion.lat, lng: ubicacion.lng } : null;
    const calculada = rutaDeTienda(t, origen, pedidos.filter((p) => p.tienda_id === t.id), urbanizaciones);
    recorrido += calculada.recorrido;
    sueltos += calculada.sueltos;
    return calculada.ruta;
  });
  const ahorro = Math.max(0, sueltos - recorrido);
  return {
    rutas,
    totales: {
      entregas: rutas.reduce((n, r) => n + r.entregas, 0),
      paradas: rutas.reduce((n, r) => n + r.paradas.length, 0),
      distancia_ruta_km: unDecimal(recorrido),
      distancia_viajes_sueltos_km: unDecimal(sueltos),
      ahorro_km: unDecimal(ahorro),
      ahorro_porcentaje: sueltos > 0 ? Math.round((ahorro / sueltos) * 100) : 0,
    },
  };
}

// --- Consulta ---

const NOMBRE_SERVICIO: Record<string, string> = {
  cambio_cartucho: 'Servicio técnico: cambio de cartucho',
  instalacion_filtro: 'Servicio técnico: instalación de filtro',
};

/** Qué se lleva en el pedido, en palabras del panel. */
export function detalleDePedido(fila: {
  tipo: string;
  cantidad?: unknown;
  cartucho_nombre?: unknown;
  cartucho_codigo?: unknown;
  servicio?: unknown;
}): string {
  if (fila.tipo === 'sobre') return 'Sobre de prueba de agua';
  if (fila.tipo === 'servicio') return NOMBRE_SERVICIO[String(fila.servicio)] ?? 'Servicio técnico';
  const nombre = String(fila.cartucho_nombre ?? fila.cartucho_codigo ?? 'Cartucho');
  const cantidad = Number(fila.cantidad ?? 1);
  return cantidad > 1 ? `${cantidad} × ${nombre}` : nombre;
}

/** Pedidos que entran a las rutas: pendientes con envío y servicios técnicos pendientes, de las tiendas del comercio. */
export async function leerPedidosParaRuta(bd: Pick<Pool, 'query'>, comercioId: string, soloServicios = false): Promise<PedidoParaRuta[]> {
  const { rows } = await bd.query(
    `SELECT p.id, p.tipo, p.tienda_id, p.hogar_id, p.cantidad, p.cartucho_codigo, p.servicio,
            h.nombre AS hogar_nombre, h.zona AS zona, h.urbanizacion AS urbanizacion, c.nombre AS cartucho_nombre
       FROM pedidos p
       JOIN hogares h ON h.id = p.hogar_id
       JOIN tiendas t ON t.id = p.tienda_id
       LEFT JOIN cartuchos c ON c.codigo = p.cartucho_codigo
      WHERE p.estado = 'pendiente' AND t.comercio_id = $1
        AND (p.tipo = 'servicio' OR p.modalidad = 'envio')
      ORDER BY p.id`,
    [comercioId],
  );
  return rows
    .filter((f) => !soloServicios || f.tipo === 'servicio')
    .map((f) => ({
      id: Number(f.id),
      tipo: f.tipo as PedidoParaRuta['tipo'],
      tienda_id: String(f.tienda_id),
      hogar_id: String(f.hogar_id),
      hogar_nombre: String(f.hogar_nombre ?? ''),
      zona: String(f.zona ?? ''),
      urbanizacion: (f.urbanizacion as string | null) ?? null,
      detalle: detalleDePedido(f),
    }));
}

/** GET /api/operador/rutas: las rutas de las tiendas del comercio. */
export async function rutasDespacho(bd: Pool, comercioId: string): Promise<RutasDespacho> {
  const [tiendas, pedidos] = await Promise.all([leerTiendas(bd, comercioId), leerPedidosParaRuta(bd, comercioId)]);
  return calcularRutas(tiendas, pedidos);
}

/**
 * Número de parada de cada servicio técnico pendiente del comercio (ruta solo con los servicios, tienda por tienda,
 * numerada de corrido). Los que no tienen ubicación no aparecen.
 */
export async function ordenServicios(
  bd: Pool,
  comercioId: string,
): Promise<Map<number, { orden: number; destino: { lat: number; lng: number } }>> {
  const [tiendas, pedidos] = await Promise.all([
    leerTiendas(bd, comercioId),
    leerPedidosParaRuta(bd, comercioId, true),
  ]);
  const { rutas } = calcularRutas(tiendas, pedidos);
  const orden = new Map<number, { orden: number; destino: { lat: number; lng: number } }>();
  let n = 0;
  for (const ruta of rutas) {
    for (const parada of ruta.paradas) {
      n += 1;
      for (const p of parada.pedidos) orden.set(p.id, { orden: n, destino: { lat: parada.lat, lng: parada.lng } });
    }
  }
  return orden;
}
