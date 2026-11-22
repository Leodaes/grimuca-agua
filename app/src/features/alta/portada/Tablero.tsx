import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Boton, Cargando, Icono, Semaforo, TEXTO_AVISO_TIRA } from '../../../components/grimuca';
import type { NombreIcono } from '../../../components/grimuca';
import { api } from '../../../lib/api';
import { guardarHogarId, vaciarLista } from '../../../lib/sesion';
import type { Hogar, Medicion } from '../../../lib/tipos';
import { AvisoRecambio } from '../../resultado/PaginaResultado';
import { PALABRA_NIVEL, formatearFecha } from '../../resultado/textos';
import { RecordatorioMedicion, SeccionCartucho } from '../../tutoriales/CambioCartucho';
import { PaginaAlta } from '../comun';
import { BOTON_PEDIR, LEMA } from './Banners';
import './portada.css';

interface DatosTablero {
  cargando: boolean;
  hogar: Hogar | null;
  setHogar: (hogar: Hogar) => void;
  ultima: Medicion | null;
  errorMediciones: boolean;
}

/** Hogar y última medición. Si algo falla, el tablero sigue con lo que tenga. */
function useTablero(id: string): DatosTablero {
  const [hogar, setHogar] = useState<Hogar | null>(null);
  const [ultima, setUltima] = useState<Medicion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorMediciones, setErrorMediciones] = useState(false);

  useEffect(() => {
    let vigente = true;
    Promise.resolve()
      .then(() => api.obtenerHogar(id))
      .then((datos) => {
        if (vigente && datos) setHogar(datos);
      })
      .catch(() => undefined);
    Promise.resolve()
      .then(() => api.medicionesDeHogar(id))
      .then((mediciones) => {
        if (vigente) setUltima(Array.isArray(mediciones) ? (mediciones[0] ?? null) : null);
      })
      .catch(() => {
        if (vigente) setErrorMediciones(true);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [id]);

  return { cargando, hogar, setHogar, ultima, errorMediciones };
}

const ACCESOS: { etiqueta: string; a: string; icono: NombreIcono }[] = [
  { etiqueta: 'Ver mis resultados', a: '/resultados', icono: 'resultados' },
  { etiqueta: 'Mi filtro', a: '/mi-filtro', icono: 'cartucho' },
  { etiqueta: 'Productos de la tienda', a: '/catalogo', icono: 'tienda' },
  { etiqueta: 'Tutoriales para cambiar tu cartucho', a: '/tutoriales', icono: 'info' },
  { etiqueta: BOTON_PEDIR, a: '/perfil', icono: 'sobre' },
];

/** Portada para quien ya tiene hogar en este teléfono: su último resultado y accesos grandes. */
/** Olvida el perfil en este teléfono. Las mediciones y pedidos siguen en el servidor. */
function CerrarSesion() {
  const [confirmando, setConfirmando] = useState(false);
  const refConfirmacion = useRef<HTMLDivElement>(null);

  // El botón queda al final del tablero: en una pantalla de escritorio la confirmación podía quedar debajo del
  // borde y parecía que no pasaba nada. Al pedirla, se centra en pantalla y el foco va a "Sí, cerrar sesión".
  useEffect(() => {
    if (!confirmando) return;
    const caja = refConfirmacion.current;
    if (!caja) return;
    if (typeof caja.scrollIntoView === 'function') caja.scrollIntoView({ block: 'center' });
    caja.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
  }, [confirmando]);

  function cerrar() {
    guardarHogarId(null);
    vaciarLista();
    window.location.assign('/');
  }

  return (
    <section className="g-pila" aria-labelledby="p-cerrar-titulo">
      <h2 className="g-h4" id="p-cerrar-titulo">
        ¿No eres tú o quieres empezar de nuevo?
      </h2>
      {confirmando ? (
        <div ref={refConfirmacion} className="g-pila" role="group" aria-label="Confirmar cierre de sesión">
          <p>
            Se borra tu perfil de este teléfono y se vacía tu lista. Tus mediciones y pedidos no se pierden, pero para
            volver a verlos aquí tendrás que llenar el perfil otra vez.
          </p>
          <Boton variante="secundario" anchoCompleto onClick={cerrar}>
            Sí, cerrar sesión
          </Boton>
          <Boton variante="secundario" anchoCompleto onClick={() => setConfirmando(false)}>
            Cancelar
          </Boton>
        </div>
      ) : (
        <Boton variante="secundario" anchoCompleto onClick={() => setConfirmando(true)}>
          Cerrar sesión
        </Boton>
      )}
    </section>
  );
}

export function Tablero({ id }: { id: string }) {
  const { cargando, hogar, setHogar, ultima, errorMediciones } = useTablero(id);
  const nombre = hogar?.nombre?.trim();
  const dias = ultima?.evaluacion?.diasParaRecambio ?? null;
  const ultimoCambio = hogar?.ultimo_cambio ?? null;
  const hayAvisoRecambio = hogar?.tiene_filtro !== false && (dias !== null || (Boolean(hogar?.tiene_filtro) && ultimoCambio !== null));

  return (
    <PaginaAlta>
      <p className="g-kicker">Grimuca Agua</p>
      <h1 className="g-h1">{nombre ? `Hola, ${nombre}` : 'Tu agua en casa'}</h1>

      <section className="p-tarjeta-resultado" aria-labelledby="p-ultimo-titulo">
        <h2 className="p-tarjeta-resultado__titulo" id="p-ultimo-titulo">
          Tu último resultado
        </h2>
        {cargando ? (
          <Cargando texto="Un momento…" />
        ) : ultima ? (
          <>
            <Semaforo
              nivel={ultima.evaluacion.semaforo}
              palabra={PALABRA_NIVEL[ultima.evaluacion.semaforo]}
              tamano="grande"
            />
            <p className="g-apagado">Medición del {formatearFecha(ultima.fecha)}</p>
            <Link className="g-enlace p-enlace-44" to={`/resultado/${ultima.id}`}>
              Ver el detalle casilla por casilla
            </Link>
          </>
        ) : errorMediciones ? (
          <p>No pudimos cargar tu último resultado. Lo encuentras en "Ver mis resultados".</p>
        ) : (
          <>
            <p className="p-tarjeta-resultado__vacio">Aún no has medido</p>
            <p className="g-apagado">Cuando tengas el sobre, mide en unos minutos y tu resultado queda aquí.</p>
          </>
        )}
        {!cargando && !errorMediciones && <RecordatorioMedicion hogar={hogar} ultimaMedicion={ultima?.fecha ?? null} />}
      </section>

      {hayAvisoRecambio && (
        <AvisoRecambio dias={dias} ultimoCambio={ultimoCambio} destino="/resultado/ultimo" etiqueta="Ver productos sugeridos" />
      )}

      {hogar?.tiene_filtro && <SeccionCartucho hogar={hogar} alCambiar={setHogar} />}

      <Boton a="/medir" anchoCompleto icono={<Icono nombre="gota" />}>
        Medir mi agua
      </Boton>

      <nav aria-label="Accesos">
        <ul className="p-accesos">
          {ACCESOS.map((acceso) => (
            <li key={acceso.a}>
              <Link to={acceso.a} className="p-acceso">
                <Icono nombre={acceso.icono} tamano={28} />
                <span>{acceso.etiqueta}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <CerrarSesion />

      <p className="g-apagado p-pie-tablero">
        {LEMA}. Medición orientativa con tira. No es un análisis de laboratorio.
      </p>
      <p className="g-apagado p-pie-tablero">{TEXTO_AVISO_TIRA}</p>
      <p className="p-pie-tablero">
        <Link className="g-enlace" to="/tiendas">
          Grimuca · Mañongo · Big Low · CC CEM
        </Link>{' '}
        ·{' '}
        <Link className="g-enlace" to="/privacidad">
          Aviso de privacidad
        </Link>{' '}
        ·{' '}
        <Link className="g-enlace" to="/terminos">
          Términos de uso
        </Link>
      </p>
    </PaginaAlta>
  );
}
