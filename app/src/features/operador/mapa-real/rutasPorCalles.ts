// Trazo de las rutas por las calles con OSRM (enrutador de código abierto sobre datos de OpenStreetMap).
// Si OSRM no responde a tiempo, la ruta se queda con las líneas rectas entre paradas: el mapa nunca se rompe.
import { useEffect, useState } from 'react';
import type { LineaMapa } from './MapaReal';

const OSRM = 'https://router.project-osrm.org/route/v1/driving/';
const ESPERA_MS = 6000;
const cache = new Map<string, Array<[number, number]>>();

function clave(puntos: Array<[number, number]>): string {
  return puntos.map(([lat, lng]) => `${lng.toFixed(5)},${lat.toFixed(5)}`).join(';');
}

async function trazarPorCalles(puntos: Array<[number, number]>): Promise<Array<[number, number]> | null> {
  if (puntos.length < 2) return null;
  const k = clave(puntos);
  const guardada = cache.get(k);
  if (guardada) return guardada;
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), ESPERA_MS);
  try {
    const respuesta = await fetch(`${OSRM}${k}?overview=full&geometries=geojson`, { signal: control.signal });
    if (!respuesta.ok) return null;
    const datos = (await respuesta.json()) as { code?: string; routes?: Array<{ geometry?: { coordinates?: number[][] } }> };
    const coordenadas = datos.code === 'Ok' ? datos.routes?.[0]?.geometry?.coordinates : undefined;
    if (!coordenadas || coordenadas.length < 2) return null;
    const trazo = coordenadas.map(([lng, lat]) => [lat, lng] as [number, number]);
    cache.set(k, trazo);
    return trazo;
  } catch {
    return null;
  } finally {
    clearTimeout(reloj);
  }
}

/** Devuelve las mismas líneas, con el trazo por las calles en cuanto OSRM lo entrega (rectas mientras tanto). */
export function useRutasPorCalles(lineas: LineaMapa[]): LineaMapa[] {
  const [trazos, setTrazos] = useState<Record<string, Array<[number, number]>>>({});
  const firma = lineas.map((l) => `${l.id}:${clave(l.puntos)}`).join('|');

  useEffect(() => {
    // En las pruebas no se llama a un servicio de afuera.
    if (import.meta.env.MODE === 'test' || typeof fetch !== 'function') return;
    let vigente = true;
    for (const linea of lineas) {
      trazarPorCalles(linea.puntos).then((trazo) => {
        if (vigente && trazo) setTrazos((previos) => ({ ...previos, [`${linea.id}:${clave(linea.puntos)}`]: trazo }));
      });
    }
    return () => {
      vigente = false;
    };
    // `firma` resume las líneas: cambia solo si cambian sus puntos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firma]);

  return lineas.map((l) => {
    const trazo = trazos[`${l.id}:${clave(l.puntos)}`];
    return trazo ? { ...l, puntos: trazo } : l;
  });
}
