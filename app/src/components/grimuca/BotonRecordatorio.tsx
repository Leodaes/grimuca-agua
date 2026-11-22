import { useEffect, useId, useState, type ReactNode } from 'react';
import {
  NOMBRE_ARCHIVO_ICS,
  TEXTO_PRUDENCIA_RECORDATORIO,
  enlaceGoogleCalendar,
  fechaEnPalabras,
  urlArchivoIcs,
  type EventoRecordatorio,
} from '../../lib/recordatorios';
import { Boton } from './Boton';
import { Icono } from './Icono';
import './BotonRecordatorio.css';
import { unir } from './utilidades';

export interface PropsBotonRecordatorio {
  /** Texto del botón, p. ej. "Recuérdame cuándo hacer mi próxima medición". */
  texto: string;
  /** Evento de día completo: título, descripción, fecha AAAA-MM-DD y enlace a la app. */
  evento: EventoRecordatorio;
  /**
   * Lo que aparece después de elegir Google Calendar o el .ics: p. ej. el WhatsApp simulado de la tienda
   * (`<WhatsAppSimulado … />` con `mensajeRecordatorioMedicion` o `mensajeRecordatorioCambio`).
   */
  confirmacion?: ReactNode;
  /** Se llama al elegir una de las dos opciones. */
  alCrear?: (opcion: 'google' | 'ics') => void;
  /** Ocupa todo el ancho (por defecto, sí). */
  anchoCompleto?: boolean;
  className?: string;
}

/**
 * Botón secundario que abre un panel con dos opciones para guardar el recordatorio:
 * Google Calendar (pestaña nueva) o el calendario del teléfono (.ics).
 */
export function BotonRecordatorio({
  texto,
  evento,
  confirmacion,
  alCrear,
  anchoCompleto = true,
  className,
}: PropsBotonRecordatorio) {
  const [abierto, setAbierto] = useState(false);
  const [creado, setCreado] = useState(false);
  const [urlIcs, setUrlIcs] = useState<string | null>(null);
  const idPanel = useId();

  useEffect(() => {
    if (!abierto) return;
    const { url, liberar } = urlArchivoIcs(evento);
    setUrlIcs(url);
    return () => {
      liberar();
      setUrlIcs(null);
    };
  }, [abierto, evento]);

  function elegir(opcion: 'google' | 'ics') {
    setCreado(true);
    alCrear?.(opcion);
  }

  return (
    <div className={unir('g-recordatorio', className)}>
      <Boton
        variante="secundario"
        anchoCompleto={anchoCompleto}
        icono={<Icono nombre="reloj" tamano={20} />}
        aria-expanded={abierto}
        aria-controls={idPanel}
        onClick={() => setAbierto((valor) => !valor)}
      >
        {texto}
      </Boton>
      {abierto && (
        <div className="g-recordatorio__panel" id={idPanel} role="group" aria-label="Dónde guardar el recordatorio">
          <p style={{ margin: 0 }}>
            Te lo recordamos <strong>{fechaEnPalabras(evento.fecha)}</strong>.
          </p>
          <Boton variante="secundario" anchoCompleto href={enlaceGoogleCalendar(evento)} onClick={() => elegir('google')}>
            Google Calendar
          </Boton>
          <a
            className="g-boton g-boton--secundario g-boton--ancho"
            href={urlIcs ?? undefined}
            download={NOMBRE_ARCHIVO_ICS}
            type="text/calendar"
            onClick={() => elegir('ics')}
          >
            <span>Calendario del teléfono (.ics)</span>
          </a>
          <p className="g-apagado" style={{ margin: 0 }}>
            {TEXTO_PRUDENCIA_RECORDATORIO}
          </p>
          {creado && confirmacion && <div role="status">{confirmacion}</div>}
        </div>
      )}
    </div>
  );
}
