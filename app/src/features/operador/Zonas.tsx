import { useMemo, useState } from 'react';
import { Aviso, BandaCifras, Boton, Cargando, Chip, EstadoVacio, WhatsAppSimulado } from '../../components/grimuca';
import type { AlertaZona, UrbanizacionMapa } from '../../lib/tipos';
import { useServicios } from './contexto';
import { nombreTienda } from './estadoPedidos';
import { useDatos } from './useDatos';
import { usePanel } from './panel';
import { nombreParametro, tiendaDeZona } from './datosZonas';
import { MapaHexagonos, TrazoAlerta, TrazoTienda, type VistaMapa } from './MapaHexagonos';
import { LETRA_ESTADO, NOMBRE_ESTADO, RANGOS_CLIENTES, etiquetaAccesible, puntosHex, tonoClientes } from './mapaHex';
import { MapaReal, escaparHtml, type MarcaMapa } from './mapa-real/MapaReal';
import { UBICACION_TIENDAS } from './urbanizaciones';
import './zonas.css';

/** Mapa real (por defecto) o el tablero de hexágonos de siempre. */
type FormaMapa = 'mapa' | 'tablero';

const TRAZO_TIENDA =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 4h15L21 9.5H3L4.5 4z"/><path d="M4.5 9.5V20h15V9.5"/><path d="M10 20v-5.5h4V20"/></svg>';

/** Clase del círculo de una urbanización en el mapa real (mismos estados que el tablero). */
function claseCirculo(u: UrbanizacionMapa, vista: VistaMapa): string {
  if (u.estado === 'sin_clientes') return 'mr-urb--vacio';
  if (vista === 'clientes') return `mr-urb--azul-${tonoClientes(u.hogares) ?? 0}`;
  const base = u.estado === 'sin_medicion' ? 'mr-urb--sin-medicion' : `mr-urb--${u.estado}`;
  return u.alerta ? `${base} mr-urb--alerta` : base;
}

/** Diámetro según los hogares: las urbanizaciones sin clientes quedan chicas. */
function diametro(hogares: number): number {
  return hogares <= 0 ? 16 : 22 + Math.min(hogares, 8) * 3;
}

/** Muestra de la leyenda del mapa real: un círculo con la clase del estado. */
function MuestraCirculo({ clase, letra }: { clase: string; letra?: string }) {
  return (
    <span className={`mr-urb ${clase}`} style={{ width: 24, height: 24, display: 'inline-grid' }} aria-hidden="true">
      {letra}
    </span>
  );
}

interface Props {
  token: string;
  version: number;
  alNoAutorizado: () => void;
}

interface DatosZonas {
  alertas: AlertaZona[];
  mapa: UrbanizacionMapa[];
}

/** Muestra de la leyenda: un hexágono chico con la clase del estado. */
function MuestraHex({ clase, letra }: { clase: string; letra?: string }) {
  return (
    <svg width={26} height={28} viewBox="0 0 52 56" aria-hidden="true" className={`mapa-hex ${clase}`}>
      <polygon points={puntosHex(26, 28, 24)} className="mapa-hex__forma" />
      {letra && (
        <text x={26} y={34} textAnchor="middle" className="mapa-hex__letra" style={{ fontSize: 18 }}>
          {letra}
        </text>
      )}
    </svg>
  );
}

function MuestraIcono({ tipo }: { tipo: 'tienda' | 'alerta' }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" aria-hidden="true">
      {tipo === 'tienda' ? (
        <>
          <circle cx={12} cy={12} r={12} fill="var(--azul)" />
          <g transform="translate(4 4) scale(0.66)" fill="none" stroke="var(--blanco)" strokeWidth={2.2} strokeLinejoin="round">
            <TrazoTienda />
          </g>
        </>
      ) : (
        <g fill="none" stroke="var(--error)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <TrazoAlerta />
        </g>
      )}
    </svg>
  );
}

function Leyenda({ vista, forma }: { vista: VistaMapa; forma: FormaMapa }) {
  if (forma === 'mapa') {
    return (
      <ul className="mapa-leyenda" aria-label="Leyenda del mapa">
        {vista === 'calidad' ? (
          <>
            <li><MuestraCirculo clase="mr-urb--verde" letra="V" /> Verde (V)</li>
            <li><MuestraCirculo clase="mr-urb--amarillo" letra="A" /> Amarillo (A)</li>
            <li><MuestraCirculo clase="mr-urb--rojo" letra="R" /> Rojo (R)</li>
            <li><MuestraCirculo clase="mr-urb--sin-medicion" letra="–" /> Sin medición en 30 días (–)</li>
            <li><MuestraCirculo clase="mr-urb--rojo mr-urb--alerta" letra="!" /> Alerta: 3 o más hogares en rojo en 7 días (!)</li>
          </>
        ) : (
          RANGOS_CLIENTES.map((rango, i) => (
            <li key={rango}><MuestraCirculo clase={`mr-urb--azul-${i}`} /> {rango}</li>
          ))
        )}
        <li><MuestraCirculo clase="mr-urb--vacio" /> Por captar (sin clientes)</li>
        <li><MuestraIcono tipo="tienda" /> Tienda Grimuca</li>
        <li>El tamaño del círculo crece con los hogares</li>
      </ul>
    );
  }
  return (
    <ul className="mapa-leyenda" aria-label="Leyenda del mapa">
      {vista === 'calidad' ? (
        <>
          <li><MuestraHex clase="mapa-hex--verde" letra="V" /> Verde (V)</li>
          <li><MuestraHex clase="mapa-hex--amarillo" letra="A" /> Amarillo (A)</li>
          <li><MuestraHex clase="mapa-hex--rojo" letra="R" /> Rojo (R)</li>
          <li><MuestraHex clase="mapa-hex--sin-medicion" letra="–" /> Sin medición en 30 días (–)</li>
          <li><MuestraHex clase="mapa-hex--rojo mapa-hex--alerta" /> <MuestraIcono tipo="alerta" /> Alerta: 3 o más hogares en rojo en 7 días</li>
        </>
      ) : (
        RANGOS_CLIENTES.map((rango, i) => (
          <li key={rango}><MuestraHex clase={`mapa-hex--azul-${i}`} /> {rango}</li>
        ))
      )}
      <li><MuestraHex clase="mapa-hex--vacio" /> Por captar (sin clientes)</li>
      <li><MuestraIcono tipo="tienda" /> Tienda Grimuca</li>
    </ul>
  );
}

/** "nitrato", "nitrato y plomo", "nitrato, cloro libre y plomo". */
function enumerar(lista: string[]): string {
  if (lista.length <= 1) return lista.join('');
  return `${lista.slice(0, -1).join(', ')} y ${lista[lista.length - 1]}`;
}

/**
 * Aviso a vecinos en dos burbujas (aprobado por Leonardo, 22 nov; revisado contra docs/legal/riesgos.md M3):
 * no nombra hogares, no dice "contaminada", aclara que no dice nada de la casa de quien lo recibe y trae la baja.
 */
export function mensajesAvisoVecinos(zona: string, tienda: string, parametros: string[]): [string, string] {
  const cuales = parametros.length > 0 ? `, sobre todo en ${enumerar(parametros)}.` : '.';
  return [
    `Hola, vecina o vecino de ${zona}. Te escribe Grimuca ${tienda}, la ferretería de tu zona. Esta semana varios hogares de ${zona} midieron su agua con nosotros y en algunos salió fuera de rango${cuales}`,
    'Eso no dice nada de tu casa: para saberlo hay que medir. El sobre cuesta $9 con envío y tienes el resultado de la tira en 5 minutos. ¿Te apartamos uno esta semana? Responde SÍ. (Para no recibir más avisos, responde BAJA.)',
  ];
}

/** Aviso a los vecinos de una zona en alerta: en la demo solo muestra el WhatsApp simulado, no envía nada. */
function AvisarVecinos({ zona, parametros }: { zona: string; parametros: string[] }) {
  const tienda = nombreTienda(tiendaDeZona(zona));
  const [enviado, setEnviado] = useState(false);
  if (!enviado) {
    return (
      <Boton variante="secundario" onClick={() => setEnviado(true)}>
        Avisar a los vecinos de la zona
      </Boton>
    );
  }
  return (
    <div className="g-pila" role="status">
      <WhatsAppSimulado
        de={`Grimuca ${tienda}`}
        para={`Vecinos de ${zona}`}
        mensaje={mensajesAvisoVecinos(zona, tienda, parametros.map(nombreParametro))}
      />
      <p>
        <strong>Enviado (simulado)</strong> solo a los hogares de {zona} que aceptaron recibir avisos. No se nombra a ningún hogar.
      </p>
    </div>
  );
}

function Detalle({ u }: { u: UrbanizacionMapa | undefined }) {
  if (!u) {
    return (
      <aside className="mapa-detalle" aria-live="polite">
        <p className="g-apagado">Toca o enfoca una urbanización del mapa para ver su detalle.</p>
      </aside>
    );
  }
  return (
    <aside className="mapa-detalle" aria-live="polite" aria-label={`Detalle de ${u.nombre}`}>
      <h2 className="g-h3" style={{ margin: 0 }}>{u.nombre}</h2>
      {u.alerta && (
        <Aviso tono="error" titulo="Varios hogares de la zona reportaron resultados fuera de rango.">
          Conviene revisar y avisar a los hogares.
        </Aviso>
      )}
      <dl>
        <dt>Zona</dt>
        <dd>{u.zona}</dd>
        <dt>Estado</dt>
        <dd>{NOMBRE_ESTADO[u.estado]}</dd>
        <dt>Hogares</dt>
        <dd className="g-cifra">{u.hogares}</dd>
        <dt>Con medición (30 días)</dt>
        <dd className="g-cifra">{u.hogares_con_medicion_30_dias}</dd>
        <dt>En rojo (7 días)</dt>
        <dd className="g-cifra">{u.hogares_en_rojo_7_dias}</dd>
        <dt>Lo que más se repite</dt>
        <dd>{u.parametros.length > 0 ? u.parametros.map(nombreParametro).join(', ') : '—'}</dd>
        <dt>Pedidos pendientes</dt>
        <dd className="g-cifra">{u.pedidos_pendientes}</dd>
        <dt>Tienda que despacha</dt>
        <dd>Grimuca {nombreTienda(tiendaDeZona(u.zona))}</dd>
        {u.tiendas.length > 0 && (
          <>
            <dt>Aquí queda</dt>
            <dd>{u.tiendas.map((t) => `Grimuca ${nombreTienda(t)}`).join(' y ')}</dd>
          </>
        )}
      </dl>
      {u.estado === 'sin_clientes' && <p className="g-apagado">Todavía no hay hogares registrados aquí: zona por captar.</p>}
    </aside>
  );
}

export function Zonas({ token, version, alNoAutorizado }: Props) {
  const servicios = useServicios();
  const { base, tiendas } = usePanel();
  const { datos, estado, reintentar } = useDatos<DatosZonas>(
    async () => {
      const [alertas, mapa] = await Promise.all([
        servicios.zonas(token),
        servicios.mapa ? servicios.mapa(token) : Promise.resolve([]),
      ]);
      return { alertas, mapa };
    },
    version,
    alNoAutorizado,
  );
  const [vista, setVista] = useState<VistaMapa>('calidad');
  const [forma, setForma] = useState<FormaMapa>('mapa');
  const [elegida, setElegida] = useState<string | null>(null);

  const filas = [...(datos?.alertas ?? [])].sort((a, b) => b.hogares_en_rojo_7_dias - a.hogares_en_rojo_7_dias);
  const alertas = filas.filter((z) => z.alerta);
  const mapa = useMemo(() => datos?.mapa ?? [], [datos]);
  const tablero = useMemo(() => mapa.filter((u) => u.en_tablero), [mapa]);
  const otras = mapa.filter((u) => !u.en_tablero);
  const conClientes = tablero.filter((u) => u.hogares > 0).length;
  const enAlerta = mapa.filter((u) => u.alerta).length;
  const porCaptar = tablero.filter((u) => u.estado === 'sin_clientes').length;
  const detalle = mapa.find((u) => u.id === elegida);
  const sinHogares = mapa.every((u) => u.hogares === 0);

  // Mapa real: un círculo por urbanización (color, letra y tamaño) y las tiendas del comercio en Carabobo.
  const marcas = useMemo<MarcaMapa[]>(() => {
    const lista: MarcaMapa[] = [];
    for (const u of tablero) {
      if (u.lat === null || u.lng === null) continue;
      const d = diametro(u.hogares);
      const letra = vista === 'calidad' ? (u.alerta ? '!' : LETRA_ESTADO[u.estado]) : u.hogares > 0 ? String(u.hogares) : '';
      lista.push({
        id: u.id,
        lat: u.lat,
        lng: u.lng,
        html: `<span class="mr-urb ${claseCirculo(u, vista)}${elegida === u.id ? ' mr-urb--elegida' : ''}">${escaparHtml(letra)}</span>`,
        tamano: [d, d],
        etiqueta: etiquetaAccesible(u),
        alElegir: () => setElegida(u.id),
      });
    }
    for (const t of tiendas) {
      const ubicacion = UBICACION_TIENDAS[t.id];
      if (!ubicacion) continue;
      lista.push({
        id: `tienda-${t.id}`,
        lat: ubicacion.lat,
        lng: ubicacion.lng,
        html: `<span class="mr-tienda"><span class="mr-tienda__icono">${TRAZO_TIENDA}</span><span class="mr-tienda__nombre">${escaparHtml(t.nombre)}</span></span>`,
        tamano: [30, 30],
        etiqueta: `Tienda ${t.nombre}`,
        encima: true,
      });
    }
    return lista;
  }, [tablero, tiendas, vista, elegida]);
  const encaje = useMemo(() => marcas.map((m) => [m.lat, m.lng] as [number, number]), [marcas]);

  return (
    <div className="g-pila g-pila--amplia">
      <div>
        <h1 className="g-h1">Zonas</h1>
        <p>Resultados de la tira por urbanización y dónde hay (o no hay) clientes.</p>
      </div>

      {estado === 'cargando' && !datos && <Cargando variante="esqueleto" lineas={4} texto="Cargando zonas…" />}
      {estado === 'error' && !datos && (
        <EstadoVacio
          tono="error"
          titulo="No se pudieron cargar las zonas."
          accion={
            <Boton variante="secundario" onClick={reintentar}>
              Reintentar
            </Boton>
          }
        />
      )}

      {datos && (
        <>
          {sinHogares && (
            <EstadoVacio titulo="Este comercio todavía no tiene hogares en el mapa de Carabobo">
              Cuando sus clientes se registren y midan, sus urbanizaciones aparecen aquí.
            </EstadoVacio>
          )}
          {!sinHogares && tablero.length > 0 && (
            <>
              <BandaCifras
                etiqueta="Cifras del mapa"
                cifras={[
                  { valor: conClientes, etiqueta: 'Urbanizaciones con clientes' },
                  { valor: enAlerta, etiqueta: 'Urbanizaciones en alerta' },
                  { valor: porCaptar, etiqueta: 'Urbanizaciones por captar' },
                ]}
              />

              <div className="zonas-controles">
              <div className="g-chips" role="group" aria-label="Forma del mapa">
                <Chip activo={forma === 'mapa'} onClick={() => setForma('mapa')}>
                  Mapa
                </Chip>
                <Chip activo={forma === 'tablero'} onClick={() => setForma('tablero')}>
                  Tablero
                </Chip>
              </div>

              <div className="g-chips" role="group" aria-label="Vista del mapa">
                <Chip activo={vista === 'calidad'} onClick={() => setVista('calidad')}>
                  Resultados de la tira
                </Chip>
                <Chip activo={vista === 'clientes'} onClick={() => setVista('clientes')}>
                  Clientes
                </Chip>
              </div>
              </div>

              <Leyenda vista={vista} forma={forma} />

              <div className="mapa-disposicion">
                {forma === 'mapa' ? (
                  <MapaReal
                    marcas={marcas}
                    etiqueta={vista === 'calidad' ? 'Mapa de resultados de la tira por urbanización' : 'Mapa de clientes por urbanización'}
                    claveEncaje={`${tablero.length}|${tiendas.length}`}
                    encajarEn={encaje}
                  />
                ) : (
                  <div className="mapa-lienzo">
                    <MapaHexagonos urbanizaciones={tablero} vista={vista} elegida={elegida} alElegir={setElegida} />
                  </div>
                )}
                <Detalle u={detalle} />
              </div>

              {otras.length > 0 && (
                <div className="g-pila">
                  <p className="g-apagado" style={{ margin: 0 }}>
                    Fuera del mapa (hogares sin urbanización o con una que no está en la lista):
                  </p>
                  <div className="mapa-otras">
                    {otras.map((u) => (
                      <Chip key={u.id} activo={elegida === u.id} onClick={() => setElegida(u.id)}>
                        {u.nombre}: {u.hogares} {u.hogares === 1 ? 'hogar' : 'hogares'}, {NOMBRE_ESTADO[u.estado]}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <h2 className="g-h3" style={{ margin: 0 }}>Alertas por zona</h2>
          {alertas.length === 0 ? (
            <Aviso tono="ok">Ninguna zona en alerta esta semana.</Aviso>
          ) : (
            alertas.map((z) => (
              <Aviso key={z.zona} tono="error" rol="alert" titulo={`Alerta en ${z.zona}: ${z.hogares_en_rojo_7_dias} hogares en rojo en los últimos 7 días.`}>
                <p>
                  Posible problema en la zona, conviene revisar.
                  {z.parametros.length > 0 && <> Lo que más se repite: {z.parametros.map(nombreParametro).join(', ')}.</>}
                </p>
                <p>Revisa el inventario de Grimuca {nombreTienda(tiendaDeZona(z.zona))}, que es la que atiende esa zona.</p>
                <Boton variante="secundario" a={`${base}/inventario`}>
                  Ver inventario
                </Boton>
                <AvisarVecinos key={z.zona} zona={z.zona} parametros={z.parametros} />
              </Aviso>
            ))
          )}

          {filas.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table className="g-tabla">
                <thead>
                  <tr>
                    <th scope="col">Zona</th>
                    <th scope="col" className="g-tabla__numero">En rojo (7 días)</th>
                    <th scope="col">Lo que más se repite</th>
                    <th scope="col">Tienda que la atiende</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((z) => (
                    <tr key={z.zona} style={z.alerta ? { color: 'var(--error)', fontWeight: 700 } : undefined}>
                      <td>{z.zona}</td>
                      <td className="g-tabla__numero">{z.hogares_en_rojo_7_dias}</td>
                      <td>{z.parametros.length > 0 ? z.parametros.map(nombreParametro).join(', ') : '—'}</td>
                      <td>{nombreTienda(tiendaDeZona(z.zona))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p style={{ color: 'var(--apagado)', fontSize: 'var(--t-1)' }}>
            Una zona o urbanización entra en alerta con 3 o más hogares en rojo en 7 días. Es una señal para revisar, no un
            diagnóstico. Las posiciones del mapa son aproximadas.
          </p>
        </>
      )}
    </div>
  );
}
