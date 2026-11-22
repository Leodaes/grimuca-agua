// Pestaña "Rutas" del comercio: una ruta por tienda que agrupa las entregas pendientes por urbanización.
// Mapa real con las tiendas, una línea por tienda (color y trazo distintos) y las paradas numeradas;
// al lado (debajo en pantallas angostas) la hoja de ruta, que es el equivalente en lista del mapa.
// Se recalcula sola al llegar un pedido nuevo o un despacho (cambia `version`).
import { useMemo, useState } from 'react';
import { BandaCifras, Boton, Cargando, Chip, EstadoVacio, Insignia } from '../../components/grimuca';
import type { TonoInsignia } from '../../components/grimuca/Insignia';
import type { ParadaRuta, PedidoEnParada, RutaTienda, RutasDespacho as DatosRutas } from '../../lib/tipos';
import { useServicios } from './contexto';
import { MapaReal, escaparHtml, type LineaMapa, type MarcaMapa } from './mapa-real/MapaReal';
import { useRutasPorCalles } from './mapa-real/rutasPorCalles';
import { useDatos } from './useDatos';
import './rutas-despacho.css';

interface Props {
  token: string;
  version: number;
  alNoAutorizado: () => void;
}

export const NOTA_DISTANCIAS =
  'Distancias aproximadas en línea recta con un factor de calle. La ruta es una propuesta para agrupar entregas.';

const NOMBRE_TIPO: Record<PedidoEnParada['tipo'], string> = {
  sobre: 'Sobre',
  cartucho: 'Cartucho',
  servicio: 'Servicio técnico',
};
const TONO_TIPO: Record<PedidoEnParada['tipo'], TonoInsignia> = { sobre: 'azul', cartucho: 'neutro', servicio: 'aviso' };
/** Nombre del trazo de cada ruta (va junto al color: nada se distingue solo por color). */
const TRAZO = ['línea continua', 'línea de guiones', 'línea de puntos', 'línea de guion y punto', 'línea de guiones cortos'];

/** 51.9 → "51,9" */
export function km(valor: number): string {
  return valor.toFixed(1).replace('.', ',');
}

export function enlaceComoLlegar(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

const TRAZO_TIENDA =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 4h15L21 9.5H3L4.5 4z"/><path d="M4.5 9.5V20h15V9.5"/><path d="M10 20v-5.5h4V20"/></svg>';

/** Muestra del color y el trazo de una ruta (leyenda y chips). */
function MuestraTrazo({ indice }: { indice: number }) {
  return (
    <svg width={34} height={10} viewBox="0 0 34 10" aria-hidden="true" className={`mr-muestra mr-ruta--${indice % 5}`}>
      <line x1={3} y1={5} x2={31} y2={5} className={`mr-ruta--${indice % 5}`} />
    </svg>
  );
}

function regresoKm(ruta: RutaTienda): number {
  const tramos = ruta.paradas.reduce((n, p) => n + p.distancia_desde_anterior_km, 0);
  return Math.max(0, Math.round((ruta.distancia_ruta_km - tramos) * 10) / 10);
}

function ListaPedidos({ pedidos }: { pedidos: PedidoEnParada[] }) {
  return (
    <ul className="rutas-pedidos">
      {pedidos.map((p) => (
        <li key={p.id}>
          <Insignia tono={TONO_TIPO[p.tipo]}>{NOMBRE_TIPO[p.tipo]}</Insignia>
          <span>
            <strong>{p.hogar_nombre}</strong> · {p.detalle} <span className="g-apagado">(N.º {p.id})</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

interface Elegida {
  tienda: string;
  orden: number;
}

function HojaDeRuta({
  ruta,
  indice,
  elegida,
  alElegir,
}: {
  ruta: RutaTienda;
  indice: number;
  elegida: Elegida | null;
  alElegir: (e: Elegida) => void;
}) {
  return (
    <section className="rutas-hoja__tienda" aria-labelledby={`hoja-${ruta.tienda_id}`}>
      <h3 className="g-h3 rutas-hoja__titulo" id={`hoja-${ruta.tienda_id}`}>
        <MuestraTrazo indice={indice} /> Desde {ruta.tienda_nombre}
      </h3>
      {ruta.motivo ? (
        <p className="g-apagado">{ruta.motivo}</p>
      ) : ruta.paradas.length === 0 ? (
        <p className="g-apagado">Sin entregas con envío pendientes.</p>
      ) : (
        <>
          <p className="rutas-hoja__resumen">
            {ruta.paradas.length} {ruta.paradas.length === 1 ? 'parada' : 'paradas'}, {ruta.entregas}{' '}
            {ruta.entregas === 1 ? 'entrega' : 'entregas'} · {km(ruta.distancia_ruta_km)} km en ruta contra{' '}
            {km(ruta.distancia_viajes_sueltos_km)} km en viajes sueltos ({TRAZO[indice % 5]})
          </p>
          <ol className="rutas-paradas">
            {ruta.paradas.map((p) => {
              const activa = elegida?.tienda === ruta.tienda_id && elegida.orden === p.orden;
              return (
                <li key={p.orden} className={activa ? 'rutas-parada rutas-parada--elegida' : 'rutas-parada'}>
                  <div className="rutas-parada__cabeza">
                    <button
                      type="button"
                      className={`rutas-parada__numero mr-ruta--${indice % 5}`}
                      aria-label={`Parada ${p.orden}: ${p.urbanizacion}. Ver en el mapa`}
                      aria-pressed={activa}
                      onClick={() => alElegir({ tienda: ruta.tienda_id, orden: p.orden })}
                    >
                      <span>{p.orden}</span>
                    </button>
                    <div>
                      <strong>{p.urbanizacion}</strong>
                      <div className="g-apagado rutas-parada__dist">
                        {km(p.distancia_desde_anterior_km)} km desde {p.orden === 1 ? 'la tienda' : 'la parada anterior'}
                      </div>
                    </div>
                    <a
                      className="rutas-parada__llegar"
                      href={enlaceComoLlegar(p.lat, p.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Cómo llegar<span className="g-solo-lector"> a {p.urbanizacion} (abre otra pestaña)</span>
                    </a>
                  </div>
                  <ListaPedidos pedidos={p.pedidos} />
                </li>
              );
            })}
          </ol>
          <p className="rutas-hoja__total">
            Regreso a la tienda: {km(regresoKm(ruta))} km. <strong>Total de la ruta: {km(ruta.distancia_ruta_km)} km</strong>
          </p>
        </>
      )}
      {ruta.sin_ubicacion > 0 && (
        <p className="g-apagado">
          {ruta.sin_ubicacion} {ruta.sin_ubicacion === 1 ? 'pedido' : 'pedidos'} sin urbanización conocida: no{' '}
          {ruta.sin_ubicacion === 1 ? 'entra' : 'entran'} a la ruta (ver Despacho).
        </p>
      )}
    </section>
  );
}

function DetalleParada({ ruta, parada }: { ruta: RutaTienda; parada: ParadaRuta }) {
  return (
    <aside className="rutas-detalle" aria-live="polite" aria-label={`Parada ${parada.orden} de ${ruta.tienda_nombre}`}>
      <h3 className="g-h3" style={{ margin: 0 }}>
        Parada {parada.orden} desde {ruta.tienda_nombre}: {parada.urbanizacion}
      </h3>
      <ListaPedidos pedidos={parada.pedidos} />
      <a href={enlaceComoLlegar(parada.lat, parada.lng)} target="_blank" rel="noopener noreferrer">
        Cómo llegar<span className="g-solo-lector"> a {parada.urbanizacion} (abre otra pestaña)</span>
      </a>
    </aside>
  );
}

export function RutasDespacho({ token, version, alNoAutorizado }: Props) {
  const servicios = useServicios();
  const { datos, estado, reintentar } = useDatos<DatosRutas>(
    () =>
      servicios.rutas
        ? servicios.rutas(token)
        : Promise.resolve({
            rutas: [],
            totales: { entregas: 0, paradas: 0, distancia_ruta_km: 0, distancia_viajes_sueltos_km: 0, ahorro_km: 0, ahorro_porcentaje: 0 },
          }),
    version,
    alNoAutorizado,
  );
  const [tienda, setTienda] = useState<string | null>(null);
  const [elegida, setElegida] = useState<Elegida | null>(null);

  const rutas = useMemo(() => datos?.rutas ?? [], [datos]);
  const indiceDe = useMemo(() => new Map(rutas.map((r, i) => [r.tienda_id, i])), [rutas]);
  const conMapa = rutas.filter((r) => r.origen);
  // En la hoja y en los chips, primero las rutas con más paradas (el color de cada tienda no cambia).
  const ordenadas = [...rutas].sort((a, b) => b.paradas.length - a.paradas.length || a.tienda_nombre.localeCompare(b.tienda_nombre, 'es'));
  const visibles = tienda ? ordenadas.filter((r) => r.tienda_id === tienda) : ordenadas;
  const rutaElegida = elegida ? rutas.find((r) => r.tienda_id === elegida.tienda) : undefined;
  const paradaElegida = rutaElegida?.paradas.find((p) => p.orden === elegida?.orden);

  const { marcas, lineas, encaje } = useMemo(() => {
    const marcas: MarcaMapa[] = [];
    const lineas: LineaMapa[] = [];
    const encaje: Array<[number, number]> = [];
    rutas.forEach((r, i) => {
      if (!r.origen) return;
      const clase = `mr-ruta--${i % 5}`;
      const atenuada = tienda !== null && tienda !== r.tienda_id;
      const enfocada = tienda === null || tienda === r.tienda_id;
      marcas.push({
        id: `tienda-${r.tienda_id}`,
        lat: r.origen.lat,
        lng: r.origen.lng,
        html: `<span class="mr-tienda"><span class="mr-tienda__icono">${TRAZO_TIENDA}</span><span class="mr-tienda__nombre">${escaparHtml(r.tienda_nombre)}</span></span>`,
        tamano: [30, 30],
        etiqueta: `Tienda ${r.tienda_nombre}`,
        clase: 'mr-marca-tienda',
      });
      if (enfocada) encaje.push([r.origen.lat, r.origen.lng]);
      if (r.paradas.length > 0) {
        lineas.push({
          id: r.tienda_id,
          puntos: [[r.origen.lat, r.origen.lng], ...r.paradas.map((p) => [p.lat, p.lng] as [number, number]), [r.origen.lat, r.origen.lng]],
          clase: `${clase}${atenuada ? ' mr-ruta--atenuada' : ''}`,
        });
      }
      for (const p of r.paradas) {
        if (enfocada) encaje.push([p.lat, p.lng]);
        if (atenuada) continue;
        const activa = elegida?.tienda === r.tienda_id && elegida.orden === p.orden;
        const n = p.pedidos.length;
        marcas.push({
          id: `parada-${r.tienda_id}-${p.orden}`,
          lat: p.lat,
          lng: p.lng,
          html: `<span class="mr-parada ${clase}${activa ? ' mr-parada--elegida' : ''}"><span>${p.orden}</span></span>`,
          tamano: [28, 28],
          etiqueta: `Parada ${p.orden} desde ${r.tienda_nombre}: ${p.urbanizacion}, ${n} ${n === 1 ? 'pedido' : 'pedidos'}`,
          encima: true,
          alElegir: () => setElegida({ tienda: r.tienda_id, orden: p.orden }),
        });
      }
    });
    return { marcas, lineas, encaje };
  }, [rutas, tienda, elegida]);
  // Por las calles (OSRM) en cuanto llega el trazo; mientras tanto, o si no responde, líneas rectas.
  const lineasPorCalles = useRutasPorCalles(lineas);

  const t = datos?.totales;
  const rutasActivas = rutas.filter((r) => r.paradas.length > 0).length;

  return (
    <div className="g-pila g-pila--amplia">
      <div className="op-cabecera">
        <div className="op-cabecera__texto">
          <h1 className="g-h1 rutas-titulo">Rutas de despacho</h1>
          <p className="rutas-bajada">Una ruta por tienda que agrupa por urbanización los pedidos pendientes con envío y los servicios técnicos.</p>
        </div>
      </div>

      {estado === 'cargando' && !datos && <Cargando variante="esqueleto" lineas={4} texto="Calculando las rutas…" />}
      {estado === 'error' && !datos && (
        <EstadoVacio
          tono="error"
          titulo="No se pudieron calcular las rutas."
          accion={
            <Boton variante="secundario" onClick={reintentar}>
              Reintentar
            </Boton>
          }
        />
      )}

      {datos && t && conMapa.length === 0 && (
        <EstadoVacio titulo="Tus tiendas todavía no tienen ubicación en el mapa">
          Las rutas se arman desde la tienda. Cuando Grimuca cargue la ubicación de tus tiendas y las urbanizaciones de tu
          ciudad, tus entregas con envío aparecen aquí agrupadas en una ruta.
        </EstadoVacio>
      )}

      {datos && t && conMapa.length > 0 && (
        <>
          <BandaCifras
            etiqueta="Cifras de las rutas"
            className="rutas-banda"
            cifras={[
              { valor: t.entregas, etiqueta: 'Entregas con envío', detalle: 'incluye servicios técnicos' },
              { valor: t.paradas, etiqueta: 'Paradas' },
              {
                valor: rutasActivas,
                etiqueta: `${rutasActivas === 1 ? 'ruta' : 'rutas'} (una por tienda) contra ${t.entregas} ${t.entregas === 1 ? 'viaje suelto' : 'viajes sueltos'}`,
              },
              { valor: `${km(t.distancia_ruta_km)} km`, etiqueta: 'Km de la ruta' },
              { valor: `${km(t.distancia_viajes_sueltos_km)} km`, etiqueta: 'Km de viajes sueltos', detalle: 'ida y vuelta por pedido' },
              { valor: `${km(t.ahorro_km)} km`, etiqueta: `Ahorro (${t.ahorro_porcentaje} %)` },
            ]}
          />

          <div className="g-chips" role="group" aria-label="Tienda">
            <Chip activo={tienda === null} onClick={() => setTienda(null)}>
              Todas las tiendas
            </Chip>
            {ordenadas.map((r) => (
              <Chip
                key={r.tienda_id}
                activo={tienda === r.tienda_id}
                onClick={() => {
                  setTienda(r.tienda_id);
                  setElegida(null);
                }}
              >
                <MuestraTrazo indice={indiceDe.get(r.tienda_id) ?? 0} /> {r.tienda_nombre} ({r.paradas.length})
              </Chip>
            ))}
          </div>

          <div className="rutas-disposicion">
            <div className="g-pila">
              <MapaReal
                marcas={marcas}
                lineas={lineasPorCalles}
                etiqueta="Mapa de las rutas de despacho"
                claveEncaje={`${tienda ?? 'todas'}|${encaje.length}`}
                encajarEn={encaje}
              />
              {rutaElegida && paradaElegida ? (
                <DetalleParada ruta={rutaElegida} parada={paradaElegida} />
              ) : (
                <p className="g-apagado" style={{ margin: 0 }}>
                  Toca una parada del mapa (o su número en la hoja de ruta) para ver sus pedidos.
                </p>
              )}
            </div>
            <div className="rutas-hoja" role="region" aria-label="Hoja de ruta">
              <h2 className="g-h3 rutas-hoja__encabezado">Hoja de ruta</h2>
              {visibles.map((r) => (
                <HojaDeRuta
                  key={r.tienda_id}
                  ruta={r}
                  indice={indiceDe.get(r.tienda_id) ?? 0}
                  elegida={elegida}
                  alElegir={setElegida}
                />
              ))}
            </div>
          </div>
          <p className="rutas-nota">{NOTA_DISTANCIAS}</p>
        </>
      )}
    </div>
  );
}
