// Tarjeta del centro de llenado con resultados públicos más cercano, y el bloque de una medición publicada.
// Se usa en el perfil (al elegir zona), en el tablero del cliente y en la página pública del centro.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Insignia, Semaforo } from '../../components/grimuca';
import { api } from '../../lib/api';
import type { CentroCercano, CentroPublico, MedicionCentro } from '../../lib/tipos';
import {
  AVISO_CENTRO,
  ETIQUETA_NIVEL_CENTRO,
  fechaCentro,
  NOMBRE_CENTRO,
  TEXTO_DEMOSTRACION,
  TEXTO_FRASCO,
  TEXTO_SIN_CENTROS,
  TEXTO_VENCIDA,
  textoConteo,
  textoDistancia,
  textoReferencia,
  textoValor,
} from './textos';
import './centros.css';

export type ConsultaCentros = { hogarId?: string | null; zona?: string | null; urbanizacion?: string | null };

/** Las casillas de una medición publicada: valor, nivel frente a la referencia y el rango; luego el frasco. */
export function MedicionPublicada({ medicion, titulo }: { medicion: MedicionCentro; titulo?: string }) {
  return (
    <div className="c-medicion">
      {titulo && <h3 className="g-h4 c-medicion__titulo">{titulo}</h3>}
      <p className="c-medicion__meta">
        <span>{fechaCentro(medicion.fecha)}</span> · <span>Medido por {medicion.medido_por}</span>
      </p>
      <p className="c-medicion__conteo">{textoConteo(medicion)}</p>
      <ul className="g-lista-parametros" aria-label="Casillas de la tira">
        {medicion.casillas.map((casilla) => {
          const referencia = textoReferencia(casilla);
          return (
            <li key={casilla.clave} className="g-fila-parametro c-casilla">
              <div>
                <p className="g-fila-parametro__nombre">{casilla.nombre}</p>
                <p className="g-fila-parametro__valor">{textoValor(casilla)}</p>
              </div>
              <Semaforo nivel={casilla.nivel} palabra={ETIQUETA_NIVEL_CENTRO[casilla.nivel]} />
              {referencia && <p className="g-fila-parametro__frase">Rango de referencia: {referencia}.</p>}
              {casilla.orientativo && (
                <p className="g-fila-parametro__nota">Lectura orientativa: para confirmar hace falta un laboratorio.</p>
              )}
            </li>
          );
        })}
      </ul>
      <p className="c-medicion__frasco">
        <strong>Prueba de bacterias (frasco): </strong>
        {TEXTO_FRASCO[medicion.bacterias]}
      </p>
      {medicion.nota && <p className="g-apagado c-medicion__nota">Nota del técnico: {medicion.nota}</p>}
    </div>
  );
}

/** Resumen de un centro: nombre, distancia, fecha y conteo de su medición más reciente, y enlace a sus resultados. */
export function TarjetaCentro({
  centro,
  titulo = `${NOMBRE_CENTRO} más cercano`,
}: {
  centro: CentroCercano | CentroPublico;
  titulo?: string;
}) {
  const distancia = 'distancia_km' in centro && centro.distancia_km !== null ? centro.distancia_km : null;
  const ultima = centro.ultima;
  return (
    <section className="c-tarjeta" aria-labelledby={`c-tarjeta-${centro.tienda_id}`}>
      <p className="c-tarjeta__kicker">{titulo}</p>
      <h2 className="c-tarjeta__nombre" id={`c-tarjeta-${centro.tienda_id}`}>
        {centro.nombre}
      </h2>
      <p className="c-tarjeta__lugar">
        {centro.local}
        {centro.urbanizacion ? ` · ${centro.urbanizacion}` : ''}
        {distancia !== null ? ` · ${textoDistancia(distancia)}` : ''}
      </p>
      {centro.es_demostracion && <Insignia tono="neutro">{TEXTO_DEMOSTRACION}</Insignia>}
      {ultima ? (
        <p className="c-tarjeta__ultima">
          Última medición: {fechaCentro(ultima.fecha)} · {textoConteo(ultima)}
        </p>
      ) : (
        <p className="c-tarjeta__ultima">Todavía no tiene mediciones publicadas.</p>
      )}
      {ultima && centro.vencida && <p className="c-tarjeta__vencida">{TEXTO_VENCIDA}</p>}
      <Link className="g-enlace c-tarjeta__enlace" to={`/centros/${encodeURIComponent(centro.tienda_id)}`}>
        Ver sus resultados públicos
      </Link>
      <p className="g-apagado c-tarjeta__aviso">{AVISO_CENTRO}</p>
    </section>
  );
}

type Estado = { tipo: 'cargando' } | { tipo: 'listo'; centro: CentroCercano | null } | { tipo: 'error' };

/**
 * El primero de la lista (la API ya la ordena), solo si de verdad queda cerca: con distancia calculada o en la
 * misma zona del cliente. Un centro de otra zona no se presenta como "el más cercano".
 */
export function elegirCercano(lista: CentroCercano[], zona?: string | null): CentroCercano | null {
  const primero = lista[0];
  if (!primero) return null;
  if (primero.distancia_km !== null) return primero;
  return zona && primero.zona === zona ? primero : null;
}

/**
 * Busca el centro con resultados públicos más cercano y muestra su tarjeta.
 * Si la búsqueda falla, no muestra nada (el resto de la pantalla sigue igual).
 */
export function CentroMasCercano({ consulta }: { consulta: ConsultaCentros }) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const { hogarId, zona, urbanizacion } = consulta;

  useEffect(() => {
    let vigente = true;
    setEstado({ tipo: 'cargando' });
    Promise.resolve()
      .then(() => api.centrosCercanos({ hogarId, zona, urbanizacion }))
      .then((lista) => {
        if (vigente) setEstado({ tipo: 'listo', centro: elegirCercano(Array.isArray(lista) ? lista : [], zona) });
      })
      .catch(() => {
        if (vigente) setEstado({ tipo: 'error' });
      });
    return () => {
      vigente = false;
    };
  }, [hogarId, zona, urbanizacion]);

  if (estado.tipo !== 'listo') return null;
  if (!estado.centro) {
    return (
      <section className="c-tarjeta c-tarjeta--vacia" aria-label={NOMBRE_CENTRO}>
        <p className="c-tarjeta__kicker">{NOMBRE_CENTRO} más cercano</p>
        <p className="c-tarjeta__ultima">{TEXTO_SIN_CENTROS}</p>
      </section>
    );
  }
  return <TarjetaCentro centro={estado.centro} />;
}
