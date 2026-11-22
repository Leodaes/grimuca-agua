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

/** Dónde se tocó "Agregar a mi lista": el aviso "quedó en tu lista" sale junto a ese botón. */
type LugarAgregado = 'paso' | 'sugeridos';

interface EstadoLista {
  enLista: Set<string>;
  agregado: { nombre: string; lugar: LugarAgregado } | null;
  agregar: (cartucho: CartuchoSugerido, lugar: LugarAgregado) => void;
}

/** Mi lista compartida entre el paso 3 de "Qué hacer hoy" y las tarjetas de "Lo que te recomendamos". */
function useListaResultado(): EstadoLista {
  const [enLista, setEnLista] = useState<Set<string>>(() => {
    try {
      return new Set(lista().map((articulo) => articulo.codigo));
    } catch {
      return new Set();
    }
  });
  const [agregado, setAgregado] = useState<EstadoLista['agregado']>(null);
  function agregar(cartucho: CartuchoSugerido, lugar: LugarAgregado) {
    agregarALista({ codigo: cartucho.codigo, nombre: cartucho.nombre, cantidad: 1 });
    setEnLista((previo) => new Set(previo).add(cartucho.codigo));
    setAgregado({ nombre: cartucho.nombre, lugar });
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
    <main id="contenido" className="g-pantalla__contenido g-pila" tabIndex={-1}>
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

  return (
    <>
      <div className="g-pila">
        <p className="g-apagado">
          Medición del {formatearFecha(medicion.fecha)} ·{' '}
          {medicion.origen === 'foto' ? 'con foto' : 'anotada a mano'}
        </p>
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

      <AvisoTira />
      <p className="g-apagado">{PIE_ORIENTACION}</p>

      {consecuencias.length > 0 && <SiNoHacesNada consecuencias={consecuencias} />}

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
                recomendado={sugeridos[0]}
                datos={datos}
                estadoLista={estadoLista}
                hogar={hogar}
                fechaMedicion={medicion.fecha}
              />
            ),
          }))}
        />
      </section>

      <section className="g-pila" aria-labelledby="titulo-casillas">
        <h2 className="g-h3" id="titulo-casillas">
          Tu agua, casilla por casilla
        </h2>
        <ListaParametros>
          {parametros.map((parametro) => (
            <FilaResultado key={parametro.clave} parametro={parametro} />
          ))}
        </ListaParametros>
      </section>

      {aviso && (
        <AvisoRecambio
          dias={evaluacion.diasParaRecambio}
          ultimoCambio={hogar?.ultimo_cambio}
          destino="#titulo-sugeridos"
          etiqueta={sugeridos.length > 0 ? 'Ver productos sugeridos' : 'Cotizar el recambio'}
        />
      )}

      <LineaFiltro />
      <Sugeridos
        sugeridos={sugeridos}
        datos={datos}
        tieneFiltro={hogar?.tiene_filtro === true}
        estadoLista={estadoLista}
      />

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

      <nav className="g-pila" aria-label="Cambiar el cartucho" style={{ gap: 'var(--s2)' }}>
        <Link className="g-enlace" to="/tutoriales" style={ESTILO_ENLACE}>
          Aprende a cambiar tu cartucho
        </Link>
        <Link className="g-enlace" to="/experto" style={ESTILO_ENLACE}>
          ¿No sabes hacerlo? Contrata a un experto
        </Link>
      </nav>

      <nav className="g-pila" aria-label="Qué hacer ahora">
        <Link className="g-enlace" to="/bacterias" style={ESTILO_ENLACE}>
          Reportar mi prueba de bacterias
        </Link>
        <Boton variante="secundario" a="/medir" anchoCompleto>
          Medir otra vez
        </Boton>
      </nav>
    </>
  );
}

/** "(OMS, EPA)" al final de la frase, antes del punto. */
function conFuente(consecuencia: Consecuencia): string {
  if (!consecuencia.fuente) return consecuencia.texto;
  return `${consecuencia.texto.replace(/\.$/, '')} (${consecuencia.fuente}).`;
}

/** "Si no haces nada": una línea por casilla en rojo o amarillo, de la más grave a la menos grave. */
function SiNoHacesNada({ consecuencias }: { consecuencias: Consecuencia[] }) {
  return (
    <section className="g-pila" aria-labelledby="titulo-si-no-haces-nada">
      <h2 className="g-h3" id="titulo-si-no-haces-nada">
        Si no haces nada
      </h2>
      <ul className="resultado-consecuencias">
        {consecuencias.map((c) => (
          <li className="resultado-consecuencia" key={c.clave}>
            <p className="resultado-consecuencia__cabeza">
              <span className="resultado-consecuencia__nombre">{c.nombre}</span>
              <Semaforo nivel={c.nivel} palabra={PALABRA_NIVEL[c.nivel]} />
            </p>
            <p className="resultado-consecuencia__texto">{conFuente(c)}</p>
            {c.nota && <p className="resultado-consecuencia__nota">{c.nota}</p>}
          </li>
        ))}
      </ul>
      <p className="g-apagado">{LINEA_FIJA_CONSECUENCIAS}</p>
    </section>
  );
}

/** Lo que va debajo del texto de cada paso: el primer producto, un enlace a la tienda o al catálogo. */
function ContenidoDelPaso({
  paso,
  recomendado,
  datos,
  estadoLista,
  hogar,
  fechaMedicion,
}: {
  paso: PasoHoy;
  recomendado: CartuchoSugerido | undefined;
  datos: DatosMensaje;
  estadoLista: EstadoLista;
  hogar: Hogar | null;
  fechaMedicion: string;
}): ReactNode {
  if (paso.id === 'volver_a_medir' || paso.id === 'completar') {
    return <RecordatorioProximaMedicion hogar={hogar} fechaMedicion={fechaMedicion} />;
  }
  if (paso.id === 'solucion') {
    if (!recomendado) {
      return (
        <Link className="g-enlace" to="/tiendas" style={ESTILO_ENLACE}>
          Ver las tiendas
        </Link>
      );
    }
    return <RecomendadoDelPaso cartucho={recomendado} datos={datos} estadoLista={estadoLista} />;
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

/** Paso 3: el primer producto con su porqué, "Agregar a mi lista" y "Cotizar por WhatsApp". */
function RecomendadoDelPaso({
  cartucho,
  datos,
  estadoLista,
}: {
  cartucho: CartuchoSugerido;
  datos: DatosMensaje;
  estadoLista: EstadoLista;
}) {
  const yaEsta = estadoLista.enLista.has(cartucho.codigo);
  return (
    <div className="resultado-paso-producto">
      <p className="resultado-paso-producto__nombre">{cartucho.nombre}</p>
      <PorQueTeLoRecomendamos sugerido={cartucho} />
      <Boton
        variante={yaEsta ? 'secundario' : 'primario'}
        anchoCompleto
        disabled={yaEsta}
        icono={<Icono nombre={yaEsta ? 'check' : 'mas'} tamano={20} />}
        onClick={() => estadoLista.agregar(cartucho, 'paso')}
      >
        {yaEsta ? 'Agregado' : 'Agregar a mi lista'}
      </Boton>
      <CotizarWhatsApp mensaje={mensajeCotizar(datos, cartucho)} />
      {estadoLista.agregado?.lugar === 'paso' && <AvisoAgregado nombre={estadoLista.agregado.nombre} />}
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

/** Fila de una casilla: nombre, valor, semáforo y una frase corta; lo largo va en "Qué mide y por qué importa". */
function FilaResultado({ parametro }: { parametro: ResultadoParametro }) {
  const hayValor = parametro.valor !== null && parametro.valor !== undefined;
  const corta = fraseCorta(parametro);
  const queMide = QUE_MIDE[parametro.clave];
  const fraseLarga = parametro.frase && parametro.frase !== corta ? parametro.frase : null;
  return (
    <li className="g-fila-parametro">
      <div>
        <p className="g-fila-parametro__nombre">
          {parametro.nombre}{' '}
          {parametro.orientativo && <Insignia tono="aviso">Orientativo</Insignia>}
        </p>
        <p className="g-fila-parametro__valor">
          {hayValor ? `${parametro.valor}${parametro.unidad ? ` ${parametro.unidad}` : ''}` : 'No se pudo leer'}
        </p>
      </div>
      <Semaforo nivel={parametro.nivel} palabra={PALABRA_NIVEL[parametro.nivel]} />
      <p className="g-fila-parametro__frase">{corta}</p>
      {(queMide || fraseLarga || parametro.orientativo) && (
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
  const { enLista, agregado, agregar } = estadoLista;

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
        <EnlaceCatalogo />
      </section>
    );
  }

  const hayEjemplo = sugeridos.some((cartucho) => cartucho.es_ejemplo);

  return (
    <section className="g-pila" aria-labelledby="titulo-sugeridos">
      <h2 className="g-h3" id="titulo-sugeridos">
        Lo que te recomendamos
      </h2>
      <p className="g-apagado">
        {hayEjemplo ? SUGERIDO_EJEMPLO : 'Según tu resultado y lo que nos contaste de tu casa.'}
      </p>
      {sugeridos.map((cartucho, indice) => {
        const yaEsta = enLista.has(cartucho.codigo);
        const lineaCodigo = [cartucho.marca, cartucho.codigo].filter(Boolean).join(' · ');
        const mejor = indice === 0;
        return (
          <article
            className={mejor ? 'g-tarjeta-producto g-tarjeta-producto--destacado' : 'g-tarjeta-producto'}
            key={cartucho.codigo}
            aria-label={mejor ? `La mejor opción para tu casa: ${cartucho.nombre}` : cartucho.nombre}
          >
            {mejor && (
              <p className="producto-mejor" style={{ margin: 0 }}>
                <Insignia tono="azul">La mejor opción para tu casa</Insignia>
              </p>
            )}
            <FotoProducto url={cartucho.foto_url} />
            <div className="g-tarjeta-producto__cuerpo">
              <h3 className="g-tarjeta-producto__nombre">{cartucho.nombre}</h3>
              {lineaCodigo && <p className="g-tarjeta-producto__codigo">{lineaCodigo}</p>}
              {cartucho.corrige.length > 0 && (
                <p className="g-tarjeta-producto__motivo">
                  Pensado para: {traducirCorrige(cartucho.corrige)}.
                </p>
              )}
              {cartucho.es_ejemplo && (
                <div className="g-tarjeta-producto__etiquetas">
                  <Insignia tono="aviso">Ejemplo</Insignia>
                </div>
              )}
            </div>
            <div className="g-tarjeta-producto__acciones">
              <PorQueTeLoRecomendamos sugerido={cartucho} />
              <Boton
                variante={mejor && !yaEsta ? 'primario' : 'secundario'}
                anchoCompleto
                disabled={yaEsta}
                icono={<Icono nombre={yaEsta ? 'check' : 'mas'} tamano={20} />}
                onClick={() => agregar(cartucho, 'sugeridos')}
              >
                {yaEsta ? 'Agregado' : 'Agregar a mi lista'}
              </Boton>
              <CotizarWhatsApp mensaje={mensajeCotizar(datos, cartucho)} conLineaPrecio />
            </div>
          </article>
        );
      })}
      {agregado?.lugar === 'sugeridos' && <AvisoAgregado nombre={agregado.nombre} />}
      <EnlaceCatalogo />
    </section>
  );
}
