// Página pública de un centro de llenado: sus resultados, sin sesión. Se publica todo, también lo que sale
// fuera de rango; Grimuca no dice si el agua es buena o mala (decisión de Leonardo, 22 nov).
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Aviso, Boton, Cargando, Insignia } from '../../components/grimuca';
import { api, ErrorApi } from '../../lib/api';
import type { DetalleCentro } from '../../lib/tipos';
import { MedicionPublicada } from './TarjetaCentro';
import { AVISO_CENTRO, NOMBRE_CENTRO, TEXTO_DEMOSTRACION, TEXTO_VENCIDA } from './textos';
import './centros.css';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'listo'; centro: DetalleCentro }
  | { tipo: 'no_existe' }
  | { tipo: 'error'; mensaje: string };

export function PaginaCentro() {
  const { tiendaId = '' } = useParams();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [intento, setIntento] = useState(0);
  const reintentar = useCallback(() => setIntento((n) => n + 1), []);

  useEffect(() => {
    let vigente = true;
    setEstado({ tipo: 'cargando' });
    Promise.resolve()
      .then(() => api.centro(tiendaId))
      .then((centro) => {
        if (vigente) setEstado({ tipo: 'listo', centro });
      })
      .catch((error: unknown) => {
        if (!vigente) return;
        if (error instanceof ErrorApi && error.estado === 404) setEstado({ tipo: 'no_existe' });
        else {
          const mensaje = error instanceof ErrorApi ? error.mensaje : 'No pudimos cargar los resultados. Intenta de nuevo.';
          setEstado({ tipo: 'error', mensaje });
        }
      });
    return () => {
      vigente = false;
    };
  }, [tiendaId, intento]);

  return (
    <main id="contenido" className="g-pantalla__contenido" lang="es-VE" tabIndex={-1}>
      <div className="g-pila c-pagina">
        <Link className="g-enlace" to="/">
          Volver al inicio
        </Link>
        <p className="g-kicker">{NOMBRE_CENTRO}</p>
        <Contenido estado={estado} alReintentar={reintentar} />
      </div>
    </main>
  );
}

function Contenido({ estado, alReintentar }: { estado: Estado; alReintentar: () => void }) {
  if (estado.tipo === 'cargando') return <Cargando texto="Buscando los resultados…" />;
  if (estado.tipo === 'no_existe') {
    return (
      <>
        <h1 className="g-h1">No encontramos este centro</h1>
        <p>Puede que ya no esté en la red de Grimuca Agua.</p>
      </>
    );
  }
  if (estado.tipo === 'error') {
    return (
      <>
        <h1 className="g-h1">Resultados del centro</h1>
        <Aviso tono="error" rol="alert">
          {estado.mensaje}
        </Aviso>
        <Boton variante="secundario" onClick={alReintentar}>
          Intentar de nuevo
        </Boton>
      </>
    );
  }

  const { centro } = estado;
  const [ultima, ...anteriores] = centro.historial;
  return (
    <>
      <h1 className="g-h1">{centro.nombre}</h1>
      {centro.es_demostracion && <Insignia tono="neutro">{TEXTO_DEMOSTRACION}</Insignia>}
      <dl className="c-datos">
        <div>
          <dt>Local</dt>
          <dd>{centro.local}</dd>
        </div>
        {centro.urbanizacion && (
          <div>
            <dt>Urbanización</dt>
            <dd>
              {centro.urbanizacion}
              {centro.zona ? `, ${centro.zona}` : ''}
            </dd>
          </div>
        )}
        {centro.direccion && (
          <div>
            <dt>Dirección</dt>
            <dd>{centro.direccion}</dd>
          </div>
        )}
        <div>
          <dt>Horario</dt>
          <dd>{centro.horario}</dd>
        </div>
      </dl>

      <p>
        Un técnico de Grimuca mide el agua del grifo de despacho una vez al mes, sin aviso, con la misma tira y el mismo
        frasco del sobre. Publicamos todos los resultados tal como salen.
      </p>
      <Aviso>{AVISO_CENTRO}</Aviso>

      {ultima ? (
        <section className="g-pila" aria-labelledby="c-ultima-titulo">
          <h2 className="g-h2" id="c-ultima-titulo">
            Medición más reciente
          </h2>
          {centro.vencida && (
            <Aviso tono="atencion" titulo={TEXTO_VENCIDA}>
              Todavía no hay una medición más reciente.
            </Aviso>
          )}
          <MedicionPublicada medicion={ultima} />
        </section>
      ) : (
        <p>Este centro todavía no tiene mediciones publicadas.</p>
      )}

      {anteriores.length > 0 && (
        <section className="g-pila" aria-labelledby="c-historial-titulo">
          <h2 className="g-h2" id="c-historial-titulo">
            Historial de mediciones
          </h2>
          <p className="g-apagado">Las mediciones no se borran: aquí están todas, de la más reciente a la más antigua.</p>
          <ol className="c-historial">
            {anteriores.map((medicion) => (
              <li key={medicion.id}>
                <MedicionPublicada medicion={medicion} />
              </li>
            ))}
          </ol>
        </section>
      )}

      <p className="g-apagado">{AVISO_CENTRO}</p>
    </>
  );
}
