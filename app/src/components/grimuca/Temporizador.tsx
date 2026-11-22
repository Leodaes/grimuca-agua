import { useEffect, useRef, useState } from 'react';
import { Boton } from './Boton';
import { Icono } from './Icono';
import { unir } from './utilidades';

export type FaseTemporizador = 'detenido' | 'esperando' | 'listo' | 'vencido';

export interface PropsTemporizador {
  /** Segundos de espera antes de leer la tira (por defecto 30). */
  espera?: number;
  /** Segundos que dura el momento bueno para la foto (por defecto 30). */
  ventana?: number;
  /** Arranca la cuenta al aparecer. */
  autoIniciar?: boolean;
  /** Avisa cada cambio de fase: detenido, esperando, listo o vencido. */
  alCambiarFase?: (fase: FaseTemporizador) => void;
  /** Clases extra. */
  className?: string;
}

function formatoReloj(segundos: number): string {
  const seguros = Math.max(0, segundos);
  const minutos = Math.floor(seguros / 60);
  const resto = String(seguros % 60).padStart(2, '0');
  return `${minutos}:${resto}`;
}

/** Cuenta regresiva para leer la tira: espera, momento de la foto y tiempo pasado. */
export function Temporizador({
  espera = 30,
  ventana = 30,
  autoIniciar = false,
  alCambiarFase,
  className,
}: PropsTemporizador) {
  const [inicio, setInicio] = useState<number | null>(() => (autoIniciar ? Date.now() : null));
  const [ahora, setAhora] = useState<number>(() => Date.now());

  const transcurrido = inicio === null ? 0 : Math.max(0, Math.floor((ahora - inicio) / 1000));
  const total = espera + ventana;

  let fase: FaseTemporizador = 'detenido';
  if (inicio !== null) {
    if (transcurrido < espera) {
      fase = 'esperando';
    } else if (transcurrido < total) {
      fase = 'listo';
    } else {
      fase = 'vencido';
    }
  }

  const enMarcha = fase === 'esperando' || fase === 'listo';

  useEffect(() => {
    if (!enMarcha) {
      return undefined;
    }
    const intervalo = window.setInterval(() => setAhora(Date.now()), 250);
    return () => window.clearInterval(intervalo);
  }, [enMarcha]);

  const refAviso = useRef(alCambiarFase);
  useEffect(() => {
    refAviso.current = alCambiarFase;
  });
  useEffect(() => {
    refAviso.current?.(fase);
  }, [fase]);

  function iniciar() {
    const momento = Date.now();
    setAhora(momento);
    setInicio(momento);
  }

  let restante = espera;
  let estado = `Cuando mojes la tira, empieza a contar ${espera} segundos.`;
  let anuncio = '';
  let avance = 0;

  if (fase === 'esperando') {
    restante = espera - transcurrido;
    estado = 'Espera. Todavía no tomes la foto.';
    anuncio =
      restante <= 10 && espera > 10
        ? 'Faltan 10 segundos.'
        : `Cuenta iniciada. Espera ${espera} segundos.`;
    avance = espera > 0 ? (transcurrido / espera) * 100 : 100;
  } else if (fase === 'listo') {
    restante = total - transcurrido;
    estado = 'Ya. Toma la foto ahora.';
    anuncio = 'Listo. Toma la foto ahora.';
    avance = 100;
  } else if (fase === 'vencido') {
    restante = 0;
    estado = 'Ya pasó el minuto. Toma la foto de una vez: mientras más tarde, menos exacta sale.';
    anuncio = estado;
    avance = 100;
  }

  return (
    <div className={unir('g-temporizador', `g-temporizador--${fase}`, className)}>
      <p className="g-temporizador__estado">{estado}</p>
      <div
        className="g-temporizador__reloj"
        role="timer"
        aria-label={`Tiempo restante: ${restante} segundos`}
      >
        {formatoReloj(restante)}
      </div>
      <div className="g-temporizador__barra" aria-hidden="true">
        <div className="g-temporizador__avance" style={{ width: `${Math.min(100, avance)}%` }} />
      </div>
      <p className="g-solo-lector" aria-live="polite">
        {anuncio}
      </p>
      <Boton variante="secundario" icono={<Icono nombre="reloj" tamano={20} />} onClick={iniciar}>
        {fase === 'detenido' ? 'Empezar a contar' : 'Volver a contar'}
      </Boton>
    </div>
  );
}
