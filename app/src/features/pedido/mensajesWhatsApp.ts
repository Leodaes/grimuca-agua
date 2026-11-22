// Textos de los WhatsApp simulados de un pedido (la demo no envía WhatsApp reales).
import type { Pedido } from '../../lib/tipos';
import { NOMBRE_MOMENTO, formatearDia } from '../tutoriales/contenido';

/** Primer nombre para el saludo ("María Pérez" → "María"). */
export function primerNombre(nombre: string | null | undefined): string {
  return (nombre ?? '').trim().split(/\s+/)[0] ?? '';
}

function saludo(nombre: string | null | undefined): string {
  const primero = primerNombre(nombre);
  return primero ? `Hola, ${primero}.` : 'Hola.';
}

/** "lunes, 23 de noviembre, en la tarde". */
function fechaServicio(pedido: Pedido): string {
  const dia = formatearDia(pedido.fecha_preferida);
  const momento = pedido.momento ? NOMBRE_MOMENTO[pedido.momento].toLowerCase() : '';
  return [dia, momento].filter(Boolean).join(', ');
}

/** "Ósmosis inversa" → "ósmosis inversa", para ir en medio de la frase. */
function enMinuscula(texto: string): string {
  return texto ? texto.charAt(0).toLowerCase() + texto.slice(1) : texto;
}

/**
 * Mensaje de la tienda al recibir el pedido. `producto`: lo que lleva (cartucho).
 * `tipoFiltro`: el tipo del filtro registrado del hogar ("Ósmosis inversa"); si no hay, esa parte no va.
 */
export function mensajeRecibido(
  pedido: Pedido,
  nombre: string | null | undefined,
  tienda: string,
  producto: string,
  tipoFiltro?: string | null,
): string {
  const hola = saludo(nombre);
  if (pedido.tipo === 'servicio') {
    const fecha = fechaServicio(pedido);
    return `${hola} Recibimos tu solicitud de servicio técnico${fecha ? ` para el ${fecha}` : ''}. Un técnico te confirmará la hora.`;
  }
  if (pedido.tipo === 'sobre') {
    const aviso =
      pedido.modalidad === 'retiro'
        ? `Te avisamos por aquí cuando esté listo para retirar en Grimuca ${tienda}.`
        : `Te avisamos por aquí cuando salga de Grimuca ${tienda}.`;
    return `${hola} Recibimos tu pedido N.º ${pedido.id}: tu sobre de medición. ${aviso}`;
  }
  const filtro = tipoFiltro ? `, el que le corresponde a tu filtro de ${enMinuscula(tipoFiltro)}` : '';
  return `${hola} Ya tenemos tu pedido N.º ${pedido.id} en Grimuca ${tienda}: ${producto}${filtro}. Lo preparamos hoy. ¿Lo instalas tú o prefieres que vaya nuestro técnico?`;
}

/** Servicio atendido: el mismo texto en el teléfono del cliente y en la vista previa del comercio. */
function mensajeServicioAtendido(nombre: string | null | undefined): string {
  return `${saludo(nombre)} Nuestro técnico ya dejó listo tu filtro; en la app ves la foto de cómo quedó. Del 1 al 5, ¿cómo te atendimos?`;
}

/** Pedido despachado (envío) o listo para retirar: el mismo texto en el cliente y en el comercio. */
function mensajeDespachado(pedido: Pedido, nombre: string | null | undefined, tienda: string): string {
  const hola = saludo(nombre);
  if (pedido.tipo === 'servicio') return mensajeServicioAtendido(nombre);
  return pedido.modalidad === 'retiro'
    ? `${hola} Tu pedido N.º ${pedido.id} está listo en Grimuca ${tienda}. ¿Pasas hoy o mañana?`
    : `${hola} Tu pedido N.º ${pedido.id} salió de Grimuca ${tienda} y va camino a tu casa. ¿Te mandamos el video de 2 minutos para cambiar el cartucho tú mismo?`;
}

/** Segundo mensaje, cuando la tienda marcó el pedido como despachado (o el servicio como atendido). */
export function mensajeDespachadoCliente(pedido: Pedido, tienda: string, nombre?: string | null): string {
  return mensajeDespachado(pedido, nombre ?? pedido.hogar_nombre, tienda);
}

/** Vista previa que ve el comercio al pulsar "Despachado" o "Atendido". */
export function mensajeDespachoComercio(pedido: Pedido, tienda: string): string {
  return mensajeDespachado(pedido, pedido.hogar_nombre, tienda);
}
