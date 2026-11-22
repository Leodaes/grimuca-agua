import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { agregarALista, hogarId, lista } from '../../lib/sesion';
import { LineaFiltro } from '../filtro/LineaFiltro';
import type { CartuchoSugerido, Hogar, Medicion, Nivel, ResultadoParametro, Tienda, UltimoCambio } from '../../lib/tipos';
import {
  Aviso,
  AvisoTira,
  Boton,
  BotonRecordatorio,
  Cargando,
  EstadoVacio,
  Icono,
  Insignia,
  ListaParametros,
  Pasos,
  Semaforo,
  WhatsAppSimulado,
  eventoProximaMedicion,
  mensajeRecordatorioMedicion,
  remitenteTienda,
} from '../../components/grimuca';
import { ChipsAtiende, CotizarWhatsApp, FotoProducto } from './Producto';
import {
  LINEA_FIJA_CONSECUENCIAS,
  armarConclusion,
  fraseCorta,
  pasosQueHacerHoy,
  siNoHacesNada,
  type Consecuencia,
  type PasoHoy,
} from './consecuencias';
import {
  PALABRA_NIVEL,
  PIE_ORIENTACION,
  QUE_MIDE,
  RESUMEN_NIVEL,
  SUGERIDO_EJEMPLO,
  TEXTO_PRECIO_WHATSAPP,
  avisoDeRecambio,
  datosDelHogar,
  formatearFecha,
  mensajeCotizar,
  mensajeError,
  mensajePreguntarFiltros,
  mensajeRecambio,
  traducirCorrige,
  type DatosMensaje,
} from './textos';

const ORDEN_NIVEL: Record<Nivel, number> = { rojo: 0, amarillo: 1, verde: 2, sin_dato: 3 };
const ESTILO_ENLACE = { minHeight: 44, display: 'inline-flex', alignItems: 'center' } as const;

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'sin_mediciones' }
  | { tipo: 'listo'; medicion: Medicion };

async function cargarMedicion(id: string): Promise<Medicion | null> {
  if (id !== 'ultimo') return api.medicion(id);
  const hogar = hogarId();
  if (!hogar) return null;
  const mediciones = await api.medicionesDeHogar(hogar);
  return mediciones[0] ?? null;
}

/** Hogar y tienda para personalizar los mensajes; si fallan, la pantalla sigue sin ellos. */
function useHogarYTienda(idHogar: string | null): { hogar: Hogar | null; tienda: string | null } {
  const [hogar, setHogar] = useState<Hogar | null>(null);
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  useEffect(() => {
    if (!idHogar) return undefined;
    let vigente = true;
    Promise.resolve()
      .then(() => api.obtenerHogar(idHogar))
      .then((datos) => {
        if (vigente && datos) setHogar(datos);
      })
      .catch(() => undefined);
    Promise.resolve()
      .then(() => api.tiendas())
      .then((lista) => {
        if (vigente && Array.isArray(lista)) setTiendas(lista);
      })
      .catch(() => undefined);
    return () => {
      vigente = false;
    };
  }, [idHogar]);
  const tienda = hogar?.tienda_id ? (tiendas.find((t) => t.id === hogar.tienda_id)?.nombre ?? null) : null;
  return { hogar, tienda };
}

interface EstadoLista {
  enLista: Set<string>;
  agregado: { nombre: string } | null;
  agregar: (cartucho: CartuchoSugerido) => void;
}

/** "Mi lista" de las tarjetas de "Lo que te recomendamos". */
function useListaResultado(): EstadoLista {
  const [enLista, setEnLista] = useState<Set<string>>(() => {
    try {
      return new Set(lista().map((articulo) => articulo.codigo));
    } catch {
      return new Set();
    }
  });
  const [agregado, setAgregado] = useState<EstadoLista['agregado']>(null);
  function agregar(cartucho: CartuchoSugerido) {
    agregarALista({ codigo: cartucho.codigo, nombre: cartucho.nombre, cantidad: 1 });
    setEnLista((previo) => new Set(previo).add(cartucho.codigo));
    setAgregado({ nombre: cartucho.nombre });
  }
  return { enLista, agregado, agregar };
}

export function PaginaResultado() {
  const { id = 'ultimo' } = useParams();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setEstado({ tipo: 'cargando' });
    cargarMedicion(id)
      .then((medicion) => {
        if (!vigente) return;
        setEstado(medicion ? { tipo: 'listo', medicion } : { tipo: 'sin_mediciones' });
      })
      .catch((error: unknown) => {
        if (vigente) setEstado({ tipo: 'error', mensaje: mensajeError(error) });
      });
    return () => {
      vigente = false;
    };
  }, [id, intento]);

  return (
    <main
      id="contenido"
      className={estado.tipo === 'listo' ? 'g-pantalla__contenido g-pantalla__contenido--ancho g-pila resultado-pagina' : 'g-pantalla__contenido g-pila resultado-pagina'}
      tabIndex={-1}
    >
      {estado.tipo === 'cargando' && (
        <>
          <h1 className="g-h1">Tu resultado</h1>
          <Cargando texto="Un momento…" variante="esqueleto" lineas={5} />
        </>
      )}
      {estado.tipo === 'error' && (
        <>
          <h1 className="g-h1">Tu resultado</h1>
          <EstadoVacio
            tono="error"
            titulo="No pudimos cargar tu resultado"
            accion={
              <Boton variante="secundario" onClick={() => setIntento((n) => n + 1)}>
                Intentar otra vez
              </Boton>
            }
          >
            {estado.mensaje}
          </EstadoVacio>
        </>
      )}
      {estado.tipo === 'sin_mediciones' && (
        <>
          <h1 className="g-h1">Tu resultado</h1>
          <EstadoVacio
            titulo="Todavía no has medido tu agua"
            accion={<Boton a="/medir">Medir mi agua</Boton>}
          >
            Cuando lo hagas, aquí queda guardado.
          </EstadoVacio>
        </>
      )}
      {estado.tipo === 'listo' && <Resultado medicion={estado.medicion} />}
    </main>
  );
}

function Resultado({ medicion }: { medicion: Medicion }) {
  const { evaluacion } = medicion;
  const sugeridos = (medicion.sugeridos ?? []) as CartuchoSugerido[];
  const resumen = RESUMEN_NIVEL[evaluacion.semaforo];
  const parametros = [...evaluacion.porParametro].sort(
    (a, b) => ORDEN_NIVEL[a.nivel] - ORDEN_NIVEL[b.nivel],
  );
  const { hogar, tienda } = useHogarYTienda(medicion.hogar_id || hogarId());
  const datos = datosDelHogar(hogar, { fecha: medicion.fecha, porParametro: evaluacion.porParametro, tienda });
  const aviso = hogar?.tiene_filtro === false ? null : avisoDeRecambio(evaluacion.diasParaRecambio, hogar?.ultimo_cambio);
  const estadoLista = useListaResultado();

  const entrada = { porParametro: evaluacion.porParametro, hogar, diasParaRecambio: evaluacion.diasParaRecambio };
  const conclusion = armarConclusion(entrada);
  const consecuencias = siNoHacesNada(evaluacion.porParametro);
  const pasos = pasosQueHacerHoy({ ...entrada, hayRecomendado: sugeridos.length > 0 });

  // Hilo de la página: primero el agua (conclusión → casilla por casilla → si no haces nada → aviso), después
  // qué hacer y al final la venta ("Lo que te recomendamos").
  // En computadora, "Lo que te recomendamos" pasa a la columna derecha (resultado.css); el orden del documento no cambia.
  return (
    <div className="g-pila resultado-cuerpo">
      <div className="g-pila resultado-encabezado">
        <p className="g-apagado">
          Medición del {formatearFecha(medicion.fecha)} ·{' '}
          {medicion.origen === 'foto' ? 'con foto' : 'anotada a mano'}
        </p>
        {medicion.origen === 'foto' && (
          <p style={{ margin: 0 }}>
            ¿No coincide con lo que ves en tu tira?{' '}
            <Link className="g-enlace" to={`/medir/manual?desde=${encodeURIComponent(medicion.id)}`} style={ESTILO_ENLACE}>
              Corrígela a mano
            </Link>
          </p>
        )}
        <Semaforo nivel={evaluacion.semaforo} palabra={PALABRA_NIVEL[evaluacion.semaforo]} tamano="grande" />
        <h1 className="g-h1">{resumen.titulo}</h1>
        <p>{resumen.frase}</p>
        <ResumenNiveles porParametro={evaluacion.porParametro} />
      </div>

      <section
        className={`resultado-conclusion resultado-conclusion--${evaluacion.semaforo}`}
        aria-labelledby="titulo-conclusion"
      >
        <h2 className="resultado-conclusion__titulo" id="titulo-conclusion">
          Tu conclusión
        </h2>
        <p className="resultado-conclusion__texto">{conclusion}</p>
      </section>

      {/* Primero la información del agua (pedido de Leonardo, 22 nov): casillas y qué pasa si no se hace nada. */}
      <Casillas parametros={parametros} medicionId={medicion.id} />

      {consecuencias.length > 0 && <SiNoHacesNada consecuencias={consecuencias} />}

      <AvisoTira />

      <section className="g-pila" aria-labelledby="titulo-que-hacer-hoy">
        <h2 className="g-h3" id="titulo-que-hacer-hoy">
          Qué hacer hoy
        </h2>
        <Pasos
          etiqueta="Qué hacer hoy"
          pasos={pasos.map((paso) => ({
            titulo: paso.titulo,
            detalle: paso.detalle,
            contenido: (
              <ContenidoDelPaso
                paso={paso}
                hayRecomendado={sugeridos.length > 0}
                hogar={hogar}
                fechaMedicion={medicion.fecha}
              />
            ),
          }))}
        />
      </section>

      <div className="resultado-lateral">
        <Sugeridos
          sugeridos={sugeridos}
          datos={datos}
          tieneFiltro={hogar?.tiene_filtro === true}
          estadoLista={estadoLista}
        />
      </div>

      {hogar?.tiene_filtro === false && (
        <section className="g-pila" aria-labelledby="titulo-sin-filtro">
          <h2 className="g-h3" id="titulo-sin-filtro">
            ¿Todavía no tienes filtro?
          </h2>
          <p>
            Pregunta en la tienda qué filtro se ajusta a tu casa. Te contamos las opciones según lo que midió tu tira y
            cuántos son en casa.
          </p>
          <CotizarWhatsApp etiqueta="Preguntar por filtros por WhatsApp" mensaje={mensajePreguntarFiltros(datos)} />
        </section>
      )}

      <p className="g-apagado">{PIE_ORIENTACION}</p>

      {aviso && (
        <AvisoRecambio
          dias={evaluacion.diasParaRecambio}
          ultimoCambio={hogar?.ultimo_cambio}
          destino="#titulo-sugeridos"
          etiqueta={sugeridos.length > 0 ? 'Ver productos sugeridos' : 'Cotizar el recambio'}
        />
      )}

      <nav className="resultado-enlaces" aria-label="Cambiar el cartucho">
        <EnlaceCatalogo />
        <Link className="g-enlace" to="/tutoriales" style={ESTILO_ENLACE}>
          Aprende a cambiar tu cartucho
        </Link>
        <Link className="g-enlace" to="/experto" style={ESTILO_ENLACE}>
          ¿No sabes hacerlo? Contrata a un experto
        </Link>
      </nav>

      <nav className="resultado-enlaces" aria-label="Qué hacer ahora">
        <Link className="g-enlace" to="/bacterias" style={ESTILO_ENLACE}>
          Reportar mi prueba de bacterias
        </Link>
        <Boton variante="secundario" a="/medir" anchoCompleto>
          Medir otra vez
        </Boton>
      </nav>
    </div>
  );
}

/** "(OMS, EPA)" al final de la frase, antes del punto. */
function conFuente(consecuencia: Consecuencia): string {
  if (!consecuencia.fuente) return consecuencia.texto;
  return `${consecuencia.texto.replace(/\.$/, '')} (${consecuencia.fuente}).`;
}

/** Cuántas líneas de "Si no haces nada" se ven sin abrir "Ver todas". */
const CONSECUENCIAS_VISIBLES = 4;

function LineaConsecuencia({ c }: { c: Consecuencia }) {
  return (
    <li className="resultado-consecuencia">
      <p className="resultado-consecuencia__texto">
        <span className="resultado-consecuencia__nombre">{c.nombre}</span>{' '}
        <Semaforo nivel={c.nivel} palabra={PALABRA_NIVEL[c.nivel]} className="resultado-consecuencia__semaforo" />{' '}
        {conFuente(c)}
        {c.nota && (
          <>
            {' '}
            <span className="resultado-consecuencia__nota">{c.nota}</span>
          </>
        )}
      </p>
    </li>
  );
}

/** "Si no haces nada": una línea por casilla en rojo o amarillo, de la más grave a la menos grave (4 a la vista). */
function SiNoHacesNada({ consecuencias }: { consecuencias: Consecuencia[] }) {
  const visibles = consecuencias.slice(0, CONSECUENCIAS_VISIBLES);
  const resto = consecuencias.slice(CONSECUENCIAS_VISIBLES);
  return (
    <section className="g-pila" aria-labelledby="titulo-si-no-haces-nada">
      <h2 className="g-h3" id="titulo-si-no-haces-nada">
        Si no haces nada
      </h2>
      <ul className="resultado-consecuencias">
        {visibles.map((c) => (
          <LineaConsecuencia c={c} key={c.clave} />
        ))}
      </ul>
      {resto.length > 0 && (
        <details className="resultado-detalle resultado-plegable">
          <summary>Ver todas</summary>
          <ul className="resultado-consecuencias">
            {resto.map((c) => (
              <LineaConsecuencia c={c} key={c.clave} />
            ))}
          </ul>
        </details>
      )}
      <p className="g-apagado">{LINEA_FIJA_CONSECUENCIAS}</p>
    </section>
  );
}

/** Enlace corto al ancla de "Lo que te recomendamos" (paso 3 y filas en rojo o amarillo). */
function EnlaceRecomendado() {
  return (
    <a className="g-enlace g-enlace--tactil resultado-ver-recomendado" href="#titulo-sugeridos">
      Ver qué te recomendamos
    </a>
  );
}

/** Lo que va debajo del texto de cada paso: el enlace a la recomendación, a la tienda o al catálogo. */
function ContenidoDelPaso({
  paso,
  hayRecomendado,
  hogar,
  fechaMedicion,
}: {
  paso: PasoHoy;
  hayRecomendado: boolean;
  hogar: Hogar | null;
  fechaMedicion: string;
}): ReactNode {
  if (paso.id === 'volver_a_medir' || paso.id === 'completar') {
    return <RecordatorioProximaMedicion hogar={hogar} fechaMedicion={fechaMedicion} />;
  }
  if (paso.id === 'solucion') {
    if (!hayRecomendado) {
      return (
        <Link className="g-enlace" to="/tiendas" style={ESTILO_ENLACE}>
          Ver las tiendas
        </Link>
      );
    }
    return <EnlaceRecomendado />;
  }
  if (paso.id === 'productos') {
    return (
      <Link className="g-enlace" to="/catalogo" style={ESTILO_ENLACE}>
        Ir al catálogo
      </Link>
    );
  }
  if (paso.id === 'preguntar_tienda' || paso.id === 'confirmar') {
    return (
      <Link className="g-enlace" to="/tiendas" style={ESTILO_ENLACE}>
        Ver las tiendas
      </Link>
    );
  }
  return null;
}

/**
 * "Recuérdame cuándo hacer mi próxima medición": evento de calendario a esta medición + 90 días
 * ("Medir el agua de mi casa (Grimuca Agua)", enlace a /medir) y el WhatsApp simulado de la tienda.
 */
function RecordatorioProximaMedicion({ hogar, fechaMedicion }: { hogar: Hogar | null; fechaMedicion: string }) {
  const evento = eventoProximaMedicion(fechaMedicion);
  return (
    <div className="resultado-paso-producto">
      <BotonRecordatorio
        texto="Recuérdame cuándo hacer mi próxima medición"
        evento={evento}
        confirmacion={
          <WhatsAppSimulado
            variante="tarjeta"
            de={remitenteTienda(hogar?.tienda_id)}
            mensaje={mensajeRecordatorioMedicion(hogar?.nombre, evento.fecha)}
          />
        }
      />
    </div>
  );
}

function AvisoAgregado({ nombre }: { nombre: string }) {
  return (
    <Aviso tono="ok" rol="status">
      {nombre} quedó en tu lista.{' '}
      <Link className="g-enlace" to="/lista">
        Ver mi lista
      </Link>
    </Aviso>
  );
}

/** Resumen en una fila: cuántas casillas salieron en Rojo, Amarillo y Verde (y sin lectura, si hay). */
export function ResumenNiveles({ porParametro }: { porParametro: Pick<ResultadoParametro, 'nivel'>[] }) {
  const cuenta = (nivel: Nivel) => porParametro.filter((p) => p.nivel === nivel).length;
  const niveles: Nivel[] = ['rojo', 'amarillo', 'verde', 'sin_dato'];
  const filas = niveles.map((nivel) => ({ nivel, n: cuenta(nivel) })).filter((f) => f.nivel !== 'sin_dato' || f.n > 0);
  return (
    <ul
      aria-label="Resumen de casillas"
      style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s2)', margin: 0, padding: 0, listStyle: 'none' }}
    >
      {filas.map(({ nivel, n }) => (
        <li key={nivel}>
          <Semaforo
            nivel={nivel}
            palabra={nivel === 'sin_dato' ? `${n} sin lectura` : `${n} en ${PALABRA_NIVEL[nivel]}`}
          />
        </li>
      ))}
    </ul>
  );
}

/**
 * Recordatorio de recambio dentro de la app (sin mensajes por WhatsApp). El texto sale de `avisoDeRecambio`:
 * depende de la respuesta "¿Cuándo cambiaste el cartucho por última vez?" y, si no hay, de los días calculados.
 */
export function AvisoRecambio({
  dias,
  ultimoCambio,
  destino,
  etiqueta,
}: {
  dias: number | null | undefined;
  ultimoCambio?: UltimoCambio | null;
  destino: string;
  etiqueta: string;
}) {
  const aviso = avisoDeRecambio(dias, ultimoCambio);
  if (!aviso) return null;
  return (
    <Aviso titulo="Tu cartucho" tono={aviso.atencion ? 'atencion' : 'info'}>
      {aviso.texto}{' '}
      {destino.startsWith('#') ? (
        <a className="g-enlace g-enlace--tactil" href={destino}>
          {etiqueta}
        </a>
      ) : (
        <Link className="g-enlace g-enlace--tactil" to={destino}>
          {etiqueta}
        </Link>
      )}{' '}
      ·{' '}
      <Link className="g-enlace g-enlace--tactil" to="/tutoriales">
        Mira cómo cambiarlo
      </Link>
    </Aviso>
  );
}


/** "Cloro libre" → "cloro libre"; "pH" se queda igual. */
function enMinuscula(nombre: string): string {
  if (nombre.length > 1 && nombre.charAt(1) === nombre.charAt(1).toUpperCase() && /[A-Z]/.test(nombre.charAt(1))) return nombre;
  return `${nombre.charAt(0).toLowerCase()}${nombre.slice(1)}`;
}

function enumerarNombres(nombres: string[]): string {
  if (nombres.length <= 1) return nombres.join('');
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
}

/**
 * "Tu agua, casilla por casilla": las filas en rojo y amarillo a la vista; las verdes agrupadas en un
 * solo plegable; las que no se leyeron, en una línea con su enlace para completarlas.
 */
function Casillas({ parametros, medicionId }: { parametros: ResultadoParametro[]; medicionId: string }) {
  const marcadas = parametros.filter((p) => p.nivel === 'rojo' || p.nivel === 'amarillo');
  const verdes = parametros.filter((p) => p.nivel === 'verde');
  const sinLectura = parametros.filter((p) => p.nivel === 'sin_dato');
  const n = verdes.length;
  return (
    <section className="g-pila resultado-casillas" aria-labelledby="titulo-casillas">
      <h2 className="g-h3" id="titulo-casillas">
        Tu agua, casilla por casilla
      </h2>
      {marcadas.length > 0 && (
        <ListaParametros>
          {marcadas.map((parametro) => (
            <FilaResultado key={parametro.clave} parametro={parametro} conEnlace />
          ))}
        </ListaParametros>
      )}
      {n > 0 && (
        <details className="resultado-detalle resultado-plegable resultado-verdes">
          <summary>
            {n} {n === 1 ? 'casilla' : 'casillas'} en verde: {enumerarNombres(verdes.map((p) => enMinuscula(p.nombre)))}
          </summary>
          <ListaParametros>
            {verdes.map((parametro) => (
              <FilaResultado key={parametro.clave} parametro={parametro} />
            ))}
          </ListaParametros>
        </details>
      )}
      {sinLectura.length > 0 && (
        <p className="resultado-sin-lectura">
          Sin lectura: {enumerarNombres(sinLectura.map((p) => p.nombre))}.{' '}
          <Link className="g-enlace" to={`/medir/manual?desde=${encodeURIComponent(medicionId)}`} style={ESTILO_ENLACE}>
            Completarlas a mano
          </Link>
        </p>
      )}
    </section>
  );
}

/** Fila de una casilla: nombre, valor, semáforo y una frase corta; lo largo va en "Qué mide y por qué importa". */
function FilaResultado({ parametro, conEnlace = false }: { parametro: ResultadoParametro; conEnlace?: boolean }) {
  const hayValor = parametro.valor !== null && parametro.valor !== undefined;
  const corta = fraseCorta(parametro);
  const queMide = QUE_MIDE[parametro.clave];
  const fraseLarga = parametro.frase && parametro.frase !== corta ? parametro.frase : null;
  const hayDetalle = Boolean(queMide || fraseLarga || parametro.orientativo);
  return (
    <li className="g-fila-parametro resultado-fila">
      <p className="g-fila-parametro__nombre">
        {parametro.nombre}{' '}
        <span className="g-fila-parametro__valor resultado-fila__valor">
          {hayValor ? `${parametro.valor}${parametro.unidad ? ` ${parametro.unidad}` : ''}` : 'No se pudo leer'}
        </span>{' '}
        {parametro.orientativo && <Insignia tono="aviso">Orientativo</Insignia>}
      </p>
      <Semaforo nivel={parametro.nivel} palabra={PALABRA_NIVEL[parametro.nivel]} />
      <p className="g-fila-parametro__frase">
        {corta}
        {conEnlace && (
          <>
            {' '}
            <a className="g-enlace resultado-ver-recomendado" href="#titulo-sugeridos">
              Ver qué te recomendamos
            </a>
          </>
        )}
      </p>
      {hayDetalle && (
        <details className="resultado-detalle">
          <summary>Qué mide y por qué importa</summary>
          {queMide && <p>{queMide}</p>}
          {fraseLarga && <p>{fraseLarga}</p>}
          {parametro.orientativo && <p className="g-fila-parametro__nota">Una tira casera orienta, no confirma.</p>}
        </details>
      )}
    </li>
  );
}

function EnlaceCatalogo() {
  return (
    <Link className="g-enlace" to="/catalogo" style={ESTILO_ENLACE}>
      Ver todos los productos de la tienda
    </Link>
  );
}

/** Bloque "Por qué te lo recomendamos": la frase del servidor y los chips de lo que atiende. */
export function PorQueTeLoRecomendamos({ sugerido }: { sugerido: Partial<Pick<CartuchoSugerido, 'motivo' | 'atiende'>> }) {
  if (!sugerido.motivo) return null;
  return (
    <div className="producto-porque">
      <h4 className="producto-porque__titulo">Por qué te lo recomendamos</h4>
      <p className="producto-porque__frase">{sugerido.motivo}</p>
      <ChipsAtiende atiende={sugerido.atiende} />
    </div>
  );
}

/** Cuántos productos se ven sin abrir "Ver más opciones". */
const SUGERIDOS_VISIBLES = 3;

function TarjetaSugerido({
  cartucho,
  mejor,
  datos,
  estadoLista,
}: {
  cartucho: CartuchoSugerido;
  mejor: boolean;
  datos: DatosMensaje;
  estadoLista: EstadoLista;
}) {
  const yaEsta = estadoLista.enLista.has(cartucho.codigo);
  const lineaCodigo = [cartucho.marca, cartucho.codigo].filter(Boolean).join(' · ');
  return (
    <article
      className={mejor ? 'g-tarjeta-producto g-tarjeta-producto--destacado' : 'g-tarjeta-producto resultado-tarjeta-compacta'}
      aria-label={mejor ? `La mejor opción para tu casa: ${cartucho.nombre}` : cartucho.nombre}
    >
      {mejor && (
        <p className="producto-mejor" style={{ margin: 0 }}>
          <Insignia tono="azul">La mejor opción para tu casa</Insignia>
        </p>
      )}
      <FotoProducto url={cartucho.foto_url} compacta />
      <div className="g-tarjeta-producto__cuerpo">
        <h3 className="g-tarjeta-producto__nombre">{cartucho.nombre}</h3>
        {lineaCodigo && <p className="g-tarjeta-producto__codigo">{lineaCodigo}</p>}
        {cartucho.es_ejemplo && (
          <div className="g-tarjeta-producto__etiquetas">
            <Insignia tono="aviso">Ejemplo</Insignia>
          </div>
        )}
      </div>
      <div className="g-tarjeta-producto__acciones">
        {cartucho.corrige.length > 0 && (
          <p className="g-tarjeta-producto__motivo">Pensado para: {traducirCorrige(cartucho.corrige)}.</p>
        )}
        {mejor ? (
          <PorQueTeLoRecomendamos sugerido={cartucho} />
        ) : (
          cartucho.motivo && (
            <details className="resultado-detalle">
              <summary>Por qué te lo recomendamos</summary>
              <p>{cartucho.motivo}</p>
              <ChipsAtiende atiende={cartucho.atiende} />
            </details>
          )
        )}
        <div className={mejor ? 'resultado-tarjeta__botones' : 'resultado-tarjeta__botones resultado-tarjeta__botones--fila'}>
          <Boton
            variante={mejor && !yaEsta ? 'primario' : 'secundario'}
            anchoCompleto
            disabled={yaEsta}
            icono={<Icono nombre={yaEsta ? 'check' : 'mas'} tamano={20} />}
            onClick={() => estadoLista.agregar(cartucho)}
          >
            {yaEsta ? 'Agregado' : 'Agregar a mi lista'}
          </Boton>
          <CotizarWhatsApp mensaje={mensajeCotizar(datos, cartucho)} sinEditar={!mejor} />
        </div>
      </div>
    </article>
  );
}

function Sugeridos({
  sugeridos,
  datos,
  tieneFiltro,
  estadoLista,
}: {
  sugeridos: CartuchoSugerido[];
  datos: DatosMensaje;
  tieneFiltro: boolean;
  estadoLista: EstadoLista;
}) {
  const { agregado } = estadoLista;

  if (sugeridos.length === 0) {
    return (
      <section className="g-pila" aria-labelledby="titulo-sugeridos">
        <h2 className="g-h3" id="titulo-sugeridos">
          Lo que sigue
        </h2>
        <p>
          Con esta medición no tenemos un cartucho que recomendarte. Lo que toca ahora es cambiar el cartucho a tiempo y
          volver a medir cuando lo cambies.
        </p>
        {tieneFiltro && (
          <CotizarWhatsApp etiqueta="Cotizar el recambio de mi filtro por WhatsApp" mensaje={mensajeRecambio(datos)} />
        )}
        <Link className="g-enlace" to="/tiendas" style={ESTILO_ENLACE}>
          ¿Dudas? Pasa por la tienda y lo vemos contigo.
        </Link>
      </section>
    );
  }

  const hayEjemplo = sugeridos.some((cartucho) => cartucho.es_ejemplo);
  const visibles = sugeridos.slice(0, SUGERIDOS_VISIBLES);
  const resto = sugeridos.slice(SUGERIDOS_VISIBLES);
  const tarjeta = (cartucho: CartuchoSugerido, indice: number) => (
    <TarjetaSugerido key={cartucho.codigo} cartucho={cartucho} mejor={indice === 0} datos={datos} estadoLista={estadoLista} />
  );

  return (
    <section className="g-pila" aria-labelledby="titulo-sugeridos">
      <h2 className="g-h3" id="titulo-sugeridos">
        Lo que te recomendamos
      </h2>
      <p className="g-apagado">
        {hayEjemplo ? SUGERIDO_EJEMPLO : 'Según tu resultado y lo que nos contaste de tu casa.'}{' '}
        {TEXTO_PRECIO_WHATSAPP}
      </p>
      <LineaFiltro />
      {visibles.map(tarjeta)}
      {resto.length > 0 && (
        <details className="resultado-detalle resultado-plegable resultado-mas-opciones">
          <summary>Ver más opciones</summary>
          <div className="g-pila">{resto.map((cartucho, i) => tarjeta(cartucho, i + SUGERIDOS_VISIBLES))}</div>
        </details>
      )}
      {agregado && <AvisoAgregado nombre={agregado.nombre} />}
    </section>
  );
}
