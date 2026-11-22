// "Reportes del técnico": servicios atendidos con su reporte (nota, fecha y foto si la hay).
import { useState } from 'react';
import { Boton, Cargando, Insignia } from '../../components/grimuca';
import type { ServicioConReporte } from '../../lib/tipos';
import { nombreServicio } from '../tutoriales/contenido';
import { useServicios } from './contexto';
import { usePanel } from './panel';
import { useDatos } from './useDatos';

const formatoFecha = new Intl.DateTimeFormat('es-VE', {
  day: 'numeric',
  month: 'long',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/Caracas',
});

export function fechaHora(fecha: string | null | undefined): string {
  if (!fecha) return '';
  const d = new Date(fecha);
  return Number.isNaN(d.getTime()) ? '' : formatoFecha.format(d);
}

function Reporte({ s, urlFoto }: { s: ServicioConReporte; urlFoto?: string }) {
  const [abierto, setAbierto] = useState(false);
  const r = s.reporte;
  return (
    <li className="op-reporte">
      <div className="op-reporte__fila">
        <Insignia tono="ok">Atendido</Insignia>
        <strong>
          {nombreServicio(s.servicio)} · {s.hogar_nombre ?? 'Hogar'}
        </strong>
        <span className="g-apagado">
          {s.zona ?? ''}
          {s.tienda_nombre ? ` · ${s.tienda_nombre}` : ''}
        </span>
        {r && (
          <Boton
            variante="secundario"
            aria-expanded={abierto}
            aria-label={`${abierto ? 'Ocultar' : 'Ver'} reporte de ${s.hogar_nombre ?? `N.º ${s.id}`}`}
            onClick={() => setAbierto((v) => !v)}
          >
            {abierto ? 'Ocultar reporte' : 'Ver reporte'}
          </Boton>
        )}
      </div>
      {r && abierto && (
        <div className="g-pila">
          <p style={{ margin: 0 }}>
            <strong>Visita:</strong> {fechaHora(r.fecha_visita) || '—'}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Nota del técnico:</strong> {r.nota?.trim() ? r.nota : 'Sin nota.'}
          </p>
          {r.tiene_foto && urlFoto ? (
            <img className="op-reporte__foto" src={urlFoto} alt={`Foto del trabajo en ${s.hogar_nombre ?? 'el hogar'}`} />
          ) : (
            <p className="g-apagado" style={{ margin: 0 }}>
              Sin foto: no queda evidencia del trabajo.
            </p>
          )}
        </div>
      )}
    </li>
  );
}

export function ReportesTecnico({ version }: { version: number }) {
  const servicios = useServicios();
  const { token } = usePanel();
  const hayReportes = Boolean(servicios.reportes && token);
  const { datos, estado, reintentar } = useDatos<ServicioConReporte[]>(
    () => (servicios.reportes && token ? servicios.reportes(token) : Promise.resolve([])),
    version,
    () => undefined,
  );
  if (!hayReportes) return null;

  const lista = [...(datos ?? [])].sort(
    (a, b) =>
      Date.parse(b.reporte?.fecha_visita ?? b.fecha_despacho ?? b.fecha) -
      Date.parse(a.reporte?.fecha_visita ?? a.fecha_despacho ?? a.fecha),
  );

  return (
    <details className="op-reportes">
      <summary>
        Reportes del técnico <Insignia tono="neutro">{lista.length}</Insignia>
      </summary>
      <div className="op-reportes__lista">
        {estado === 'cargando' && !datos && <Cargando texto="Cargando reportes…" />}
        {estado === 'error' && !datos && (
          <p>
            No se pudieron cargar los reportes.{' '}
            <Boton variante="secundario" onClick={reintentar}>
              Reintentar
            </Boton>
          </p>
        )}
        {datos && lista.length === 0 && <p className="g-apagado">Todavía no hay servicios atendidos.</p>}
        {lista.length > 0 && (
          <ul aria-label="Servicios atendidos" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {lista.map((s) => (
              <Reporte key={s.id} s={s} urlFoto={token && servicios.urlFoto ? servicios.urlFoto(token, s.id) : undefined} />
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
