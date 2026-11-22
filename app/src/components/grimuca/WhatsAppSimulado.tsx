import { useEffect, useRef, useState } from 'react';
import { Icono } from './Icono';
import { unir } from './utilidades';
import './WhatsAppSimulado.css';

/** Rótulo visible en toda vista de WhatsApp simulado (decisión del dueño para la demo). */
export const TEXTO_SIMULACION_WA = 'Simulación: en la demo no se envía un WhatsApp real.';

export interface PropsWhatsAppSimulado {
  /** Quién envía: "Grimuca Mañongo". */
  de: string;
  /** Destinatario (opcional). Si viene, la cabecera lo muestra y la burbuja sale como enviada. */
  para?: string;
  /** Texto del mensaje; con una lista, una burbuja por elemento. */
  mensaje: string | string[];
  /** Hora de la burbuja: texto ya listo ("09:42") o fecha. Por defecto, ahora. */
  hora?: string | Date;
  /** 'tarjeta' (en la página) o 'toast' (flotante, se cierra solo). */
  variante?: 'tarjeta' | 'toast';
  /** Solo toast: título arriba de la vista previa ("WhatsApp simulado enviado a Ana"). */
  titulo?: string;
  /** Solo toast: se llama al pulsar "Cerrar" o al vencer `duracionMs`. */
  alCerrar?: () => void;
  /** Solo toast: milisegundos antes de cerrarse solo (por defecto 6000; 0 para no cerrar). */
  duracionMs?: number;
  className?: string;
}

/** "09:42" a partir de una fecha (hora local, 24 h). */
export function horaWhatsApp(fecha: Date): string {
  if (Number.isNaN(fecha.getTime())) return '';
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
}

function DobleCheck() {
  return (
    <svg className="g-wa__check" width="18" height="12" viewBox="0 0 18 12" aria-hidden="true" focusable="false">
      <path d="M1 6.5l3.2 3.2L11 2.5M7.5 9.2l.6.5L15.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Vista de un chat de WhatsApp que NO envía nada: solo muestra el mensaje que se habría enviado.
 * Siempre lleva el rótulo de simulación en texto visible.
 */
export function WhatsAppSimulado({
  de,
  para,
  mensaje,
  hora,
  variante = 'tarjeta',
  titulo,
  alCerrar,
  duracionMs = 6000,
  className,
}: PropsWhatsAppSimulado) {
  const [ahora] = useState(() => new Date());
  const textoHora = typeof hora === 'string' ? hora : horaWhatsApp(hora ?? ahora);
  const burbujas = (Array.isArray(mensaje) ? mensaje : [mensaje]).filter(Boolean);
  const enviado = Boolean(para);
  const esToast = variante === 'toast';

  const refCerrar = useRef(alCerrar);
  useEffect(() => {
    refCerrar.current = alCerrar;
  });
  useEffect(() => {
    if (!esToast || duracionMs <= 0) return undefined;
    const espera = window.setTimeout(() => refCerrar.current?.(), duracionMs);
    return () => window.clearTimeout(espera);
  }, [esToast, duracionMs, mensaje]);

  return (
    <section
      className={unir('g-wa', esToast && 'g-wa--toast', className)}
      role="status"
      aria-live="polite"
      aria-label={titulo ?? `WhatsApp simulado de ${de}`}
    >
      {esToast && (titulo || alCerrar) && (
        <div className="g-wa__barra">
          {titulo && <p className="g-wa__titulo">{titulo}</p>}
          {alCerrar && (
            <button type="button" className="g-wa__cerrar" onClick={alCerrar}>
              Cerrar
            </button>
          )}
        </div>
      )}
      <div className="g-wa__cabecera">
        <Icono nombre="whatsapp" tamano={24} />
        <p className="g-wa__nombre">{para ?? de}</p>
      </div>
      <p className="g-wa__simulacion">
        <strong>Simulación:</strong> en la demo no se envía un WhatsApp real.
      </p>
      <ol className="g-wa__chat" aria-label={enviado ? `Mensajes de ${de} para ${para}` : `Mensajes de ${de}`}>
        {burbujas.map((texto, i) => (
          <li key={i} className={unir('g-wa__burbuja', enviado && 'g-wa__burbuja--enviada')}>
            <span className="g-wa__texto">{texto}</span>
            <span className="g-wa__meta">
              {textoHora && <time>{textoHora}</time>}
              <DobleCheck />
              <span className="g-solo-lector">Entregado</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
