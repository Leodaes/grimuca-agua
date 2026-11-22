// Pestaña "Resultados públicos" (solo para un centro de llenado): lo que Grimuca publica de su grifo de despacho.
// Decisión de Leonardo (22 nov): se publica todo, también lo que sale fuera de rango, sin calificar el agua.
import { Aviso, Boton, Cargando, EstadoVacio, Insignia } from '../../components/grimuca';
import type { TonoInsignia } from '../../components/grimuca';
import type { CasillaCentro, MedicionCentro, Nivel, PanelCentro, ResultadoBacteriasCentro } from '../../lib/tipos';
import { useServicios } from './contexto';
import { useDatos } from './useDatos';

interface Props {
  token: string;
  version: number;
  alNoAutorizado: () => void;
}

export const AVISO_MEDICION_CENTRO = 'Medición orientativa con tira, no es un análisis de laboratorio.';

export const TEXTO_NIVEL: Record<Nivel, { texto: string; tono: TonoInsignia }> = {
  verde: { texto: 'En rango', tono: 'ok' },
  amarillo: { texto: 'Para vigilar', tono: 'aviso' },
  rojo: { texto: 'Fuera de rango', tono: 'error' },
  sin_dato: { texto: 'Sin dato', tono: 'neutro' },
};

export const TEXTO_FRASCO: Record<ResultadoBacteriasCentro, string> = {
  cambio: 'El frasco cambió de color: posible presencia de bacterias coliformes en la muestra.',
  sin_cambio: 'La prueba no detectó bacterias coliformes en esta muestra. Esto no certifica el agua.',
  pendiente: 'El frasco se lee a las 48 horas.',
};

function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });
}

function numero(valor: number): string {
  return valor.toLocaleString('es-VE', { maximumFractionDigits: 2 });
}

function conUnidad(valor: number, unidad: string): string {
  return unidad ? `${numero(valor)} ${unidad}` : numero(valor);
}

/** "de 6,5 a 8,5", "hasta 10 mg/L", "desde 6,5"; vacío si la referencia no tiene límites. */
export function textoReferencia(c: Pick<CasillaCentro, 'referencia_desde' | 'referencia_hasta' | 'unidad'>): string {
  const { referencia_desde: desde, referencia_hasta: hasta, unidad } = c;
  if (desde !== null && hasta !== null) return `de ${numero(desde)} a ${conUnidad(hasta, unidad)}`;
  if (hasta !== null) return `hasta ${conUnidad(hasta, unidad)}`;
  if (desde !== null) return `desde ${conUnidad(desde, unidad)}`;
  return '';
}

function Casillas({ medicion }: { medicion: MedicionCentro }) {
  return (
    <ul className="op-centro__casillas" aria-label={`Casillas de la medición del ${fecha(medicion.fecha)}`}>
      {medicion.casillas.map((c) => {
        const nivel = TEXTO_NIVEL[c.nivel];
        const referencia = textoReferencia(c);
        return (
          <li key={c.clave} className="op-centro__casilla">
            <span className="op-centro__parametro">
              <strong>{c.nombre}</strong>
              {c.orientativo && <span className="g-apagado"> (orientativo)</span>}
            </span>
            <span className="g-cifra">{c.valor === null ? '—' : conUnidad(c.valor, c.unidad)}</span>
            <Insignia tono={nivel.tono}>{nivel.texto}</Insignia>
            {referencia && <span className="g-apagado op-centro__referencia">Referencia en rango: {referencia}</span>}
          </li>
        );
      })}
    </ul>
  );
}

function Medicion({ medicion, titulo }: { medicion: MedicionCentro; titulo: string }) {
  return (
    <div className="op-centro__medicion g-pila">
      <h4 className="op-centro__fecha">
        {titulo}: {fecha(medicion.fecha)}
      </h4>
      <p style={{ margin: 0 }}>
        <strong>
          {medicion.casillas_en_rango} de {medicion.casillas_leidas} casillas en rango
        </strong>{' '}
        · Medido por {medicion.medido_por}
      </p>
      <Casillas medicion={medicion} />
      <p style={{ margin: 0 }}>{TEXTO_FRASCO[medicion.bacterias]}</p>
      {medicion.nota && <p className="g-apagado" style={{ margin: 0 }}>Nota: {medicion.nota}</p>}
    </div>
  );
}

function Local({ centro }: { centro: PanelCentro['centros'][number] }) {
  const [ultima, ...anteriores] = centro.historial;
  const clientes = centro.clientes_cercanos;
  return (
    <section className="op-centro g-tarjeta g-pila" aria-labelledby={`centro-${centro.tienda_id}`}>
      <header className="op-centro__cabecera">
        <h3 className="g-h3" id={`centro-${centro.tienda_id}`}>
          {centro.local}
        </h3>
        {centro.urbanizacion && <span className="g-apagado">{centro.urbanizacion}</span>}
        {centro.vencida && <Insignia tono="aviso">Medición vencida</Insignia>}
      </header>
      <p style={{ margin: 0 }} data-testid={`clientes-${centro.tienda_id}`}>
        <strong className="g-cifra">{clientes}</strong>{' '}
        {clientes === 1
          ? 'cliente te tiene como el centro con resultados públicos más cercano.'
          : 'clientes te tienen como el centro con resultados públicos más cercano.'}
      </p>
      {ultima ? (
        <Medicion medicion={ultima} titulo="Medición más reciente" />
      ) : (
        <p style={{ margin: 0 }}>Todavía no hay mediciones publicadas. El técnico de Grimuca pasará a medir tu grifo.</p>
      )}
      {anteriores.length > 0 && (
        <details className="op-centro__historial">
          <summary>Historial ({anteriores.length} {anteriores.length === 1 ? 'medición anterior' : 'mediciones anteriores'})</summary>
          <div className="g-pila">
            {anteriores.map((m) => (
              <Medicion key={m.id} medicion={m} titulo="Medición" />
            ))}
          </div>
        </details>
      )}
      <p style={{ margin: 0 }}>
        <a className="g-enlace" href={`/centros/${encodeURIComponent(centro.tienda_id)}`} target="_blank" rel="noreferrer">
          Ver tu página pública
        </a>
      </p>
    </section>
  );
}

export function ResultadosCentro({ token, version, alNoAutorizado }: Props) {
  const servicios = useServicios();
  const { datos, estado, reintentar } = useDatos<PanelCentro>(
    () => (servicios.panelCentro ? servicios.panelCentro(token) : Promise.resolve({ centros: [] })),
    version,
    alNoAutorizado,
  );

  return (
    <div className="g-pila g-pila--amplia">
      <div className="g-pila">
        <h2 className="g-h2">Resultados públicos</h2>
        <p style={{ margin: 0 }}>
          Grimuca mide tu grifo de despacho cada mes y publica el resultado tal cual, también si algo sale fuera de rango.
        </p>
        <Aviso>{AVISO_MEDICION_CENTRO}</Aviso>
      </div>
      {estado === 'cargando' && <Cargando variante="esqueleto" lineas={4} texto="Cargando tus resultados…" />}
      {estado === 'error' && (
        <EstadoVacio
          tono="error"
          titulo="No se pudieron cargar tus resultados."
          accion={
            <Boton variante="secundario" onClick={reintentar}>
              Reintentar
            </Boton>
          }
        />
      )}
      {estado === 'listo' && datos && datos.centros.length === 0 && (
        <EstadoVacio titulo="Este comercio no tiene locales de llenado registrados." />
      )}
      {estado === 'listo' && datos?.centros.map((centro) => <Local key={centro.tienda_id} centro={centro} />)}
    </div>
  );
}
