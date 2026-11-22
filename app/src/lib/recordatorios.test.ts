import { describe, expect, it } from 'vitest';
import {
  NOMBRE_ARCHIVO_ICS,
  TITULO_CAMBIO,
  TITULO_MEDICION,
  archivoIcs,
  diaDe,
  enlaceGoogleCalendar,
  eventoCambioCartucho,
  eventoProximaMedicion,
  fechaEnPalabras,
  fechaProximaMedicion,
  fechaProximoCambio,
  mensajeCambioRegistrado,
  mensajeRecordatorioCambio,
  mensajeRecordatorioMedicion,
  remitenteTienda,
  sumarDias,
  vidaUtilDias,
} from './recordatorios';

const evento = {
  titulo: TITULO_MEDICION,
  descripcion: 'Toca medir, otra vez; con la tira.',
  fecha: '2027-02-22',
  url: 'https://agua.oydo.app/medir',
};

describe('fechas', () => {
  it('suma días cruzando meses y años, y dice la fecha en palabras', () => {
    expect(sumarDias('2026-11-24', 90)).toBe('2027-02-22');
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(sumarDias('2024-02-28', 1)).toBe('2024-02-29');
    expect(fechaEnPalabras('2027-02-22')).toBe('el lunes 22 de febrero de 2027');
    expect(fechaEnPalabras('2026-11-22')).toBe('el domingo 22 de noviembre de 2026');
    expect(diaDe('2026-11-20')).toBe('2026-11-20');
    expect(diaDe('no es fecha')).toBeNull();
  });
});

describe('próxima medición', () => {
  it('es la última medición + 90 días; sin medición, hoy + 90; nunca antes de hoy', () => {
    expect(fechaProximaMedicion('2026-11-24', '2026-11-25')).toBe('2027-02-22');
    expect(fechaProximaMedicion(null, '2026-11-24')).toBe('2027-02-22');
    expect(fechaProximaMedicion('2026-01-01', '2026-11-22')).toBe('2026-11-22');
    const e = eventoProximaMedicion(null, '2026-11-24');
    expect(e).toMatchObject({ titulo: 'Medir el agua de mi casa (Grimuca Agua)', url: 'https://agua.oydo.app/medir', fecha: '2027-02-22' });
  });
});

describe('próximo cambio de cartucho', () => {
  it('usa la misma vida útil que la API: 3 meses por defecto, la mitad con agua turbia, × 0,75 con 5 personas', () => {
    expect(vidaUtilDias()).toBe(90);
    expect(vidaUtilDias({ etapas_filtro: 1 })).toBe(180);
    expect(vidaUtilDias({ etapas_filtro: 3, agua_turbia: true })).toBe(45);
    expect(vidaUtilDias({ personas: 5 })).toBe(68);
  });

  it('es la fecha del último cambio + vida útil; sin fecha, null', () => {
    expect(fechaProximoCambio({ fecha_ultimo_cambio: '2026-11-01' }, '2026-11-22')).toBe('2027-01-30');
    expect(fechaProximoCambio({ fecha_ultimo_cambio: '2026-01-01' }, '2026-11-22')).toBe('2026-11-22');
    expect(fechaProximoCambio({ fecha_ultimo_cambio: null }, '2026-11-22')).toBeNull();
    expect(eventoCambioCartucho({ fecha_ultimo_cambio: null })).toBeNull();
    expect(eventoCambioCartucho({ fecha_ultimo_cambio: '2026-11-01' }, '2026-11-22')).toMatchObject({
      titulo: 'Cambiar el cartucho de mi filtro (Grimuca Agua)',
      url: 'https://agua.oydo.app/tutoriales',
      fecha: '2027-01-30',
    });
  });
});

describe('Google Calendar', () => {
  it('arma un evento de día completo con el título, la fecha y el enlace', () => {
    const enlace = new URL(enlaceGoogleCalendar(evento));
    expect(enlace.origin + enlace.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(enlace.searchParams.get('action')).toBe('TEMPLATE');
    expect(enlace.searchParams.get('text')).toBe(TITULO_MEDICION);
    expect(enlace.searchParams.get('dates')).toBe('20270222/20270223');
    expect(enlace.searchParams.get('details')).toContain('https://agua.oydo.app/medir');
  });
});

describe('.ics', () => {
  const ics = archivoIcs({ ...evento, titulo: TITULO_CAMBIO }, new Date('2026-11-22T13:05:09.123Z'));
  const lineas = ics.split('\r\n');

  it('es un VCALENDAR válido con CRLF y un VEVENT de día completo', () => {
    expect(ics.endsWith('\r\n')).toBe(true);
    expect(lineas[0]).toBe('BEGIN:VCALENDAR');
    expect(lineas).toContain('VERSION:2.0');
    expect(lineas).toContain('BEGIN:VEVENT');
    expect(lineas).toContain('DTSTAMP:20261122T130509Z');
    expect(lineas).toContain('DTSTART;VALUE=DATE:20270222');
    expect(lineas).toContain('DTEND;VALUE=DATE:20270223');
    expect(lineas).toContain('SUMMARY:Cambiar el cartucho de mi filtro (Grimuca Agua)');
    expect(lineas).toContain('URL:https://agua.oydo.app/medir');
    expect(lineas.some((l) => /^UID:.+@agua\.oydo\.app$/.test(l))).toBe(true);
    expect(lineas.filter((l) => l === 'END:VEVENT')).toHaveLength(1);
    expect(lineas.at(-2)).toBe('END:VCALENDAR');
  });

  it('trae una alarma un día antes y escapa comas y punto y coma', () => {
    const alarma = lineas.slice(lineas.indexOf('BEGIN:VALARM'), lineas.indexOf('END:VALARM') + 1);
    expect(alarma).toContain('TRIGGER:-P1D');
    expect(alarma).toContain('ACTION:DISPLAY');
    const descripcion = ics.replace(/\r\n /g, '');
    expect(descripcion).toContain(String.raw`DESCRIPTION:Toca medir\, otra vez\; con la tira.\n\nhttps://agua.oydo.app/medir`);
  });

  it('dobla las líneas largas a 75 bytes como máximo', () => {
    const largo = archivoIcs({ ...evento, descripcion: 'Ñandú '.repeat(40) });
    for (const linea of largo.split('\r\n')) expect(new TextEncoder().encode(linea).length).toBeLessThanOrEqual(75);
    expect(NOMBRE_ARCHIVO_ICS).toBe('recordatorio-grimuca-agua.ics');
  });
});

describe('WhatsApp simulado', () => {
  it('arma los mensajes de la tienda', () => {
    expect(mensajeRecordatorioMedicion('Ana', '2027-02-22')).toBe(
      'Hola, Ana. Listo: te escribiremos el lunes 22 de febrero de 2027 para recordarte tu próxima medición.',
    );
    expect(mensajeRecordatorioCambio('Ana', '2027-02-22')).toContain('para recordarte el cambio de cartucho.');
    expect(mensajeCambioRegistrado('2026-11-22')).toBe(
      'Registramos el cambio de cartucho del 22 de noviembre de 2026. Te avisamos cuando toque el próximo.',
    );
    expect(remitenteTienda('manongo')).toBe('Grimuca Mañongo');
    expect(remitenteTienda(null)).toBe('Grimuca Agua');
  });
});
