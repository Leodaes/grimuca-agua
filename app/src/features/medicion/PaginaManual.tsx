import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Aviso, Boton, Cargando, Chip, EstadoVacio } from '../../components/grimuca';
import { api, ErrorApi } from '../../lib/api';
import { hogarId } from '../../lib/sesion';
import type { ClaveParametro, ParametroTira, ValoresMedicion } from '../../lib/tipos';
import { QUE_MIDE } from '../resultado/textos';
import { SinHogar } from './SinHogar';
import './medicion.css';

type Carga =
  | { fase: 'cargando' }
  | { fase: 'error'; mensaje: string }
  | { fase: 'lista'; tira: ParametroTira[] };

/** Lo que eligió la persona por casilla: un nivel, `null` ("no la tiene / no se ve") o nada todavía. */
type Elecciones = Partial<Record<ClaveParametro, number | null>>;

const MENSAJE_FALLA = 'Algo falló de nuestro lado. Intenta otra vez en un momento.';
const ERROR_VACIO = 'Marca al menos una casilla para poder darte un resultado.';

/** Los niveles se muestran como en la tabla impresa, con coma decimal. */
export function textoNivel(nivel: number): string {
  return String(nivel).replace('.', ',');
}

/**
 * /medir/manual: un grupo de chips por casilla de la tira en uso.
 * Con `?desde=<id de medición>` (desde el resultado de una foto) llega con lo que leyó la foto ya marcado,
 * para corregir solo lo que no coincide con la tira; al enviar se guarda como una medición nueva, a mano.
 */
export function PaginaManual() {
  const navegar = useNavigate();
  const hogar = hogarId();
  const [parametros] = useSearchParams();
  const desde = parametros.get('desde');
  // Recién leída la foto: la persona confirma o corrige antes de ver el resultado.
  const confirmar = parametros.get('confirmar') === '1';
  const [carga, setCarga] = useState<Carga>({ fase: 'cargando' });
  const [elecciones, setElecciones] = useState<Elecciones>({});
  /** Lo que leyó la foto, para saber si la persona cambió algo. */
  const [leido, setLeido] = useState<Elecciones | null>(null);
  const [corrigiendo, setCorrigiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    let vigente = true;
    setCarga({ fase: 'cargando' });
    const anterior = desde ? api.medicion(desde).catch(() => null) : Promise.resolve(null);
    Promise.all([api.configTira(), anterior])
      .then(([tira, medicion]) => {
        if (!vigente) return;
        if (medicion?.valores) {
          // Solo se marcan los valores que son un nivel de la tira; lo demás queda por elegir.
          const previas: Elecciones = {};
          for (const p of tira) {
            const valor = medicion.valores[p.clave];
            if (typeof valor === 'number' && p.niveles.includes(valor)) previas[p.clave] = valor;
          }
          setElecciones(previas);
          setLeido(previas);
          setCorrigiendo(true);
        }
        setCarga({ fase: 'lista', tira });
      })
      .catch((fallo: unknown) => {
        if (vigente) setCarga({ fase: 'error', mensaje: fallo instanceof ErrorApi ? fallo.mensaje : MENSAJE_FALLA });
      });
    return () => {
      vigente = false;
    };
  }, [desde]);

  useEffect(() => (hogar ? cargar() : undefined), [hogar, cargar]);

  if (!hogar) return <SinHogar />;

  if (carga.fase === 'cargando') {
    return (
      <main id="contenido" className="g-pantalla__contenido">
        <h1 className="g-h1">Carga los colores a mano</h1>
        <Cargando variante="esqueleto" lineas={6} texto="Cargando las casillas de la tira…" />
      </main>
    );
  }

  if (carga.fase === 'error') {
    return (
      <main id="contenido" className="g-pantalla__contenido">
        <h1 className="g-h1">Carga los colores a mano</h1>
        <EstadoVacio tono="error" titulo="No pudimos cargar las casillas" accion={<Boton onClick={cargar}>Intentar otra vez</Boton>}>
          {carga.mensaje}
        </EstadoVacio>
      </main>
    );
  }

  const { tira } = carga;
  const hechas = tira.filter((p) => elecciones[p.clave] !== undefined).length;
  const sinCambios = leido !== null && desde !== null && tira.every((p) => elecciones[p.clave] === leido[p.clave]);

  function elegir(clave: ClaveParametro, valor: number | null) {
    setElecciones((previas) => ({ ...previas, [clave]: valor }));
    setError(null);
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!hogar || enviando) return;
    // Confirmó lo que leyó la foto sin cambiar nada: se usa esa misma medición.
    if (sinCambios && desde) {
      navegar(`/resultado/${desde}`);
      return;
    }
    const valores: ValoresMedicion = {};
    for (const parametro of tira) valores[parametro.clave] = elecciones[parametro.clave] ?? null;
    if (!Object.values(valores).some((valor) => typeof valor === 'number')) {
      setError(ERROR_VACIO);
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const medicion = await api.medirManual(hogar, valores);
      navegar(`/resultado/${medicion.id}`);
    } catch (fallo) {
      setError(fallo instanceof ErrorApi ? fallo.mensaje : MENSAJE_FALLA);
      setEnviando(false);
    }
  }

  return (
    <main id="contenido" className="g-pantalla__contenido g-pantalla__contenido--ancho">
      <form className="g-pila g-pila--amplia" onSubmit={enviar} noValidate>
        <div className="g-pila medir-texto">
          <h1 className="g-h1">
            {corrigiendo && confirmar
              ? '¿Esto es lo que ves en tu tira?'
              : corrigiendo
                ? 'Corrige los colores a mano'
                : 'Carga los colores a mano'}
          </h1>
          {corrigiendo && confirmar ? (
            <>
              <p>
                Esto es lo que leímos en la foto. La lectura depende de la luz y del enfoque, así que compara cada casilla
                de tu tira con la tabla de colores.
              </p>
              <p>Si todo coincide, confírmalo. Si algo no, toca el valor que tú ves.</p>
            </>
          ) : corrigiendo ? (
            <p>
              Te dejamos marcado lo que leyó la foto. Compara cada casilla con la tabla de colores y cambia lo que no
              coincida con lo que ves en tu tira.
            </p>
          ) : (
            <p>Compara cada casilla de la tira con la tabla de colores y toca el valor que más se parezca.</p>
          )}
          <p className="g-apagado">Si quedas entre dos colores, marca el valor más alto.</p>
        </div>

        {/* En computadora, las casillas van en dos columnas (medicion.css). */}
        <div className="medir-casillas">
        {tira.map((parametro) => {
          const eleccion = elecciones[parametro.clave];
          return (
            <fieldset className="g-grupo" key={parametro.clave}>
              <legend>
                {parametro.nombre}
                {parametro.unidad ? <span className="g-apagado"> ({parametro.unidad})</span> : null}
              </legend>
              {leido && leido[parametro.clave] === undefined && (
                <p className="g-apagado" style={{ fontSize: '0.875em', margin: '0 0 8px' }}>
                  La foto no pudo leer esta casilla: márcala tú.
                </p>
              )}
              {QUE_MIDE[parametro.clave] && (
                <p className="g-apagado" style={{ fontSize: '0.875em', margin: '0 0 8px' }}>
                  {QUE_MIDE[parametro.clave]}
                </p>
              )}
              <div className="g-chips">
                {parametro.niveles.map((nivel) => (
                  <Chip
                    key={nivel}
                    className="min-w-[48px]"
                    activo={eleccion === nivel}
                    onClick={() => elegir(parametro.clave, nivel)}
                  >
                    {textoNivel(nivel)}
                  </Chip>
                ))}
                <Chip activo={eleccion === null} onClick={() => elegir(parametro.clave, null)}>
                  No la tiene / no se ve
                </Chip>
              </div>
            </fieldset>
          );
        })}
        </div>

        <div className="g-pila medir-enviar">
          <p className="g-apagado g-cifra" aria-live="polite">
            {hechas} de {tira.length} casillas
          </p>
          {error && (
            <Aviso tono="error" rol="alert">
              {error}
            </Aviso>
          )}
          <Boton type="submit" anchoCompleto cargando={enviando} textoCargando="Preparando tu resultado…">
            {corrigiendo && sinCambios ? 'Sí, coincide: ver mi resultado' : corrigiendo ? 'Guardar y ver mi resultado' : 'Ver mi resultado'}
          </Boton>
        </div>
      </form>
    </main>
  );
}
