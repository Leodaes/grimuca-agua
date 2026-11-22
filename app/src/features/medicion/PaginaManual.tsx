import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
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

/** /medir/manual: un grupo de chips por casilla de la tira en uso. */
export function PaginaManual() {
  const navegar = useNavigate();
  const hogar = hogarId();
  const [carga, setCarga] = useState<Carga>({ fase: 'cargando' });
  const [elecciones, setElecciones] = useState<Elecciones>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    let vigente = true;
    setCarga({ fase: 'cargando' });
    api
      .configTira()
      .then((tira) => {
        if (vigente) setCarga({ fase: 'lista', tira });
      })
      .catch((fallo: unknown) => {
        if (vigente) setCarga({ fase: 'error', mensaje: fallo instanceof ErrorApi ? fallo.mensaje : MENSAJE_FALLA });
      });
    return () => {
      vigente = false;
    };
  }, []);

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

  function elegir(clave: ClaveParametro, valor: number | null) {
    setElecciones((previas) => ({ ...previas, [clave]: valor }));
    setError(null);
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!hogar || enviando) return;
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
          <h1 className="g-h1">Carga los colores a mano</h1>
          <p>Compara cada casilla de la tira con la tabla de colores y toca el valor que más se parezca.</p>
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
            Ver mi resultado
          </Boton>
        </div>
      </form>
    </main>
  );
}
