// Mapa real (Leaflet + teselas de OpenStreetMap) para las pestañas Rutas y Zonas.
// - Sin los iconos de marcador por defecto de Leaflet (fallan con Vite): marcas con L.divIcon y HTML propio.
// - Colores por clase CSS (los tokens no sirven como atributo SVG): `clase` en cada línea y en cada marca.
// - Respaldo sin internet: si las teselas fallan (o el navegador está sin conexión) queda el fondo liso
//   y se siguen viendo los puntos y las rutas.
// - Las posiciones son aproximadas; la lista que acompaña al mapa es su equivalente accesible.
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './mapa-real.css';

export interface MarcaMapa {
  id: string;
  lat: number;
  lng: number;
  /** HTML de la marca (se escribe con `escaparHtml` para los textos). */
  html: string;
  /** Ancho y alto en px; el ancla queda en el centro. */
  tamano: [number, number];
  /** Nombre para el lector de pantalla y el tooltip. */
  etiqueta: string;
  /** Clase extra del contenedor de la marca. */
  clase?: string;
  /** Marcas encima de otras (tiendas sobre paradas). */
  encima?: boolean;
  /** Sin acción, la marca no se puede enfocar ni pulsar. */
  alElegir?: () => void;
}

export interface LineaMapa {
  id: string;
  puntos: Array<[number, number]>;
  /** Clase CSS con el color y el estilo del trazo. */
  clase: string;
}

export interface PropsMapaReal {
  marcas: MarcaMapa[];
  lineas?: LineaMapa[];
  /** Nombre del mapa para el lector de pantalla. */
  etiqueta: string;
  /** Cuando cambia, el mapa vuelve a encajar los límites a los puntos. */
  claveEncaje?: string;
  /** Puntos que debe abarcar el encaje (si no, todas las marcas). */
  encajarEn?: Array<[number, number]>;
}

/** Valencia, Naguanagua y San Diego (por si no hay puntos). */
const LIMITES_POR_DEFECTO: L.LatLngBoundsExpression = [
  [10.18, -68.05],
  [10.3, -67.94],
];
// Teselas de CARTO (Voyager), hechas con datos de OpenStreetMap. Las de tile.openstreetmap.org bloquean
// las peticiones sin Referer, y el sitio manda Referrer-Policy: same-origin.
const TESELAS = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const ATRIBUCION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>';
/** Con este número de teselas fallidas se pasa al fondo liso. */
const MAXIMO_FALLAS = 4;
export const AVISO_SIN_FONDO = 'Sin mapa de fondo: se muestran solo los puntos y las rutas';

export function escaparHtml(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
}

/** Encaja la vista a los puntos (si el contenedor todavía no tiene tamaño, no hace nada). */
function encajar(mapa: L.Map, puntos: Array<[number, number]>): void {
  try {
    if (puntos.length > 1) mapa.fitBounds(L.latLngBounds(puntos), { padding: [16, 16], maxZoom: 15 });
    else if (puntos.length === 1) mapa.setView(puntos[0], 14);
  } catch {
    // Sin tamaño (pruebas o contenedor oculto): se queda con la vista por defecto.
  }
}

function sinConexion(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export function MapaReal({ marcas, lineas = [], etiqueta, claveEncaje, encajarEn }: PropsMapaReal) {
  const refContenedor = useRef<HTMLDivElement>(null);
  const refMapa = useRef<L.Map | null>(null);
  const refCapa = useRef<L.LayerGroup | null>(null);
  const refEncaje = useRef<string | null>(null);
  /** Puntos del último encaje: se vuelve a encajar si cambia el tamaño del contenedor. */
  const refPuntos = useRef<Array<[number, number]>>([]);
  const [sinFondo, setSinFondo] = useState(sinConexion);

  // Crear el mapa una sola vez y limpiarlo al desmontar.
  useEffect(() => {
    const contenedor = refContenedor.current;
    if (!contenedor) return;
    let mapa: L.Map;
    try {
      mapa = L.map(contenedor, { scrollWheelZoom: false, attributionControl: true });
    } catch {
      setSinFondo(true);
      return;
    }
    mapa.attributionControl.setPrefix(false);
    try {
      mapa.fitBounds(LIMITES_POR_DEFECTO);
    } catch {
      mapa.setView([10.235, -67.995], 12);
    }
    refMapa.current = mapa;
    refCapa.current = L.layerGroup().addTo(mapa);

    let teselas: L.TileLayer | null = null;
    if (!sinConexion()) {
      let fallas = 0;
      teselas = L.tileLayer(TESELAS, {
        attribution: ATRIBUCION,
        subdomains: 'abcd',
        maxZoom: 19,
        crossOrigin: true,
        referrerPolicy: 'strict-origin-when-cross-origin',
      });
      teselas.on('tileerror', () => {
        fallas += 1;
        if (fallas >= MAXIMO_FALLAS) {
          setSinFondo(true);
          if (teselas) mapa.removeLayer(teselas);
        }
      });
      teselas.addTo(mapa);
    } else {
      // Sin teselas, la atribución igual queda visible (los puntos se ubican sobre coordenadas de OSM).
      mapa.attributionControl.addAttribution(ATRIBUCION);
    }
    const alCaerse = () => setSinFondo(true);
    window.addEventListener('offline', alCaerse);
    // Si el contenedor cambia de tamaño (la página termina de acomodarse, se gira el teléfono), Leaflet lo
    // tiene que saber; y se vuelve a encajar a los puntos.
    const observador =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            mapa.invalidateSize();
            encajar(mapa, refPuntos.current);
          });
    observador?.observe(contenedor);
    return () => {
      observador?.disconnect();
      window.removeEventListener('offline', alCaerse);
      teselas?.off();
      mapa.remove();
      refMapa.current = null;
      refCapa.current = null;
      refEncaje.current = null;
    };
  }, []);

  // Marcas y líneas: se vuelven a dibujar cuando cambian.
  useEffect(() => {
    const mapa = refMapa.current;
    const capa = refCapa.current;
    if (!mapa || !capa) return;
    // Si una marca tenía el foco (teclado), se le devuelve después de redibujar.
    const activo = document.activeElement;
    const enfocada = activo && refContenedor.current?.contains(activo) ? activo.getAttribute('data-id') : null;
    capa.clearLayers();
    // Sin SVG (navegadores muy viejos o las pruebas) no hay líneas; los puntos y la hoja de ruta siguen.
    const puedeDibujar = L.Browser.svg;
    for (const linea of puedeDibujar ? lineas : []) {
      if (linea.puntos.length < 2) continue;
      L.polyline(linea.puntos, { className: `mapa-real__linea ${linea.clase}`, interactive: false }).addTo(capa);
    }
    for (const m of marcas) {
      const marca = L.marker([m.lat, m.lng], {
        icon: L.divIcon({
          html: m.html,
          className: `mapa-real__marca ${m.clase ?? ''}`.trim(),
          iconSize: m.tamano,
          iconAnchor: [m.tamano[0] / 2, m.tamano[1] / 2],
        }),
        keyboard: Boolean(m.alElegir),
        interactive: Boolean(m.alElegir),
        title: m.etiqueta,
        zIndexOffset: m.encima ? 1000 : 0,
        riseOnHover: true,
      }).addTo(capa);
      const elemento = marca.getElement();
      if (elemento) {
        elemento.setAttribute('aria-label', m.etiqueta);
        elemento.setAttribute('data-id', m.id);
        if (m.alElegir) elemento.setAttribute('role', 'button');
        else elemento.setAttribute('aria-hidden', 'true');
      }
      if (m.alElegir) marca.on('click', m.alElegir);
      if (enfocada && enfocada === m.id) elemento?.focus();
    }
    const clave = claveEncaje ?? marcas.map((m) => m.id).join('|');
    if (refEncaje.current !== clave) {
      refEncaje.current = clave;
      refPuntos.current = encajarEn ?? marcas.map((m) => [m.lat, m.lng] as [number, number]);
      encajar(mapa, refPuntos.current);
    }
  }, [marcas, lineas, claveEncaje, encajarEn]);

  return (
    <div className={`mapa-real${sinFondo ? ' mapa-real--sin-fondo' : ''}`}>
      {sinFondo && (
        <p className="mapa-real__aviso" role="status">
          {AVISO_SIN_FONDO}
        </p>
      )}
      <div ref={refContenedor} className="mapa-real__lienzo" role="region" aria-label={etiqueta} data-testid="mapa-real" />
    </div>
  );
}
