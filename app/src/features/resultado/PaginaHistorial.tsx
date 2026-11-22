import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { hogarId } from '../../lib/sesion';
import type { Medicion } from '../../lib/tipos';
import { AvisoTira, Boton, Cargando, EstadoVacio, Semaforo } from '../../components/grimuca';
import { PALABRA_NIVEL, formatearFecha, mensajeError } from './textos';
import './resultado.css';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'sin_hogar' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'listo'; mediciones: Medicion[] };

function useMediciones(intento: number): Estado {
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  useEffect(() => {
    const hogar = hogarId();
    if (!hogar) {
      setEstado({ tipo: 'sin_hogar' });
      return;
    }
    let vigente = true;
    setEstado({ tipo: 'cargando' });
    api
      .medicionesDeHogar(hogar)
      .then((mediciones) => vigente && setEstado({ tipo: 'listo', mediciones }))
      .catch((error: unknown) => vigente && setEstado({ tipo: 'error', mensaje: mensajeError(error) }));
    return () => {
      vigente = false;
    };
  }, [intento]);
  return estado;
}

/** /resultados: historial de mediciones del hogar. */
export function PaginaHistorial() {
  const [intento, setIntento] = useState(0);
  const estado = useMediciones(intento);

  return (
    <main id="contenido" className="g-pantalla__contenido g-pila resultado-pagina" tabIndex={-1}>
      <h1 className="g-h1">Mis resultados</h1>
      {estado.tipo === 'cargando' && <Cargando texto="Un momento…" variante="esqueleto" lineas={4} />}
      {estado.tipo === 'sin_hogar' && (
        <EstadoVacio titulo="Primero cuéntanos de tu casa" accion={<Boton a="/perfil">Llenar mi perfil</Boton>}>
          Es un minuto.
        </EstadoVacio>
      )}
      {estado.tipo === 'error' && (
        <EstadoVacio
          tono="error"
          titulo="No pudimos cargar tus resultados"
          accion={
            <Boton variante="secundario" onClick={() => setIntento((n) => n + 1)}>
              Intentar otra vez
            </Boton>
          }
        >
          {estado.mensaje}
        </EstadoVacio>
      )}
      {estado.tipo === 'listo' && estado.mediciones.length === 0 && (
        <EstadoVacio titulo="Todavía no has medido tu agua" accion={<Boton a="/medir">Medir mi agua</Boton>}>
          Cuando lo hagas, aquí queda guardado.
        </EstadoVacio>
      )}
      {estado.tipo === 'listo' && estado.mediciones.length > 0 && (
        <>
          <ul className="g-pila" aria-label="Mediciones">
            {estado.mediciones.map((medicion) => (
              <li
                key={medicion.id}
                style={{
                  borderBottom: '1px solid var(--linea)',
                  padding: 'var(--s3) 0',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 'var(--s2) var(--s3)',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div className="g-pila" style={{ gap: 'var(--s1)' }}>
                  <span>{formatearFecha(medicion.fecha)}</span>
                  <Semaforo
                    nivel={medicion.evaluacion.semaforo}
                    palabra={PALABRA_NIVEL[medicion.evaluacion.semaforo]}
                  />
                </div>
                <Link
                  className="g-enlace"
                  to={`/resultado/${medicion.id}`}
                  style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center' }}
                  aria-label={`Ver resultado del ${formatearFecha(medicion.fecha)}`}
                >
                  Ver resultado
                </Link>
              </li>
            ))}
          </ul>
          <Boton a="/medir" anchoCompleto>
            Medir otra vez
          </Boton>
          <AvisoTira />
        </>
      )}
    </main>
  );
}

/** /resultado/ultimo: lleva a la medición más reciente del hogar o al historial. */
export function RedireccionUltimo() {
  const navegar = useNavigate();
  useEffect(() => {
    const hogar = hogarId();
    if (!hogar) {
      navegar('/resultados', { replace: true });
      return;
    }
    let vigente = true;
    api
      .medicionesDeHogar(hogar)
      .then((mediciones) => {
        if (!vigente) return;
        const ultima = mediciones[0];
        navegar(ultima ? `/resultado/${ultima.id}` : '/resultados', { replace: true });
      })
      .catch(() => vigente && navegar('/resultados', { replace: true }));
    return () => {
      vigente = false;
    };
  }, [navegar]);

  return (
    <main id="contenido" className="g-pantalla__contenido g-pila resultado-pagina" tabIndex={-1}>
      <h1 className="g-h1">Tu resultado</h1>
      <Cargando texto="Buscando tu última medición…" />
    </main>
  );
}
