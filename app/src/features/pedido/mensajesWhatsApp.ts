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

/** Mensaje de la tienda al recibir el pedido. `producto`: lo que lleva (cartucho). */
export function mensajeRecibido(pedido: Pedido, nombre: string | null | undefined, tienda: string, producto: string): string {
  const hola = saludo(nombre);
  if (pedido.tipo === 'servicio') {
    const fecha = fechaServicio(pedido);
    return `${hola} Recibimos tu solicitud de servicio técnico${fecha ? ` para el ${fecha}` : ''}. Un técnico te confirmará la hora.`;
  }
  const que = pedido.tipo === 'sobre' ? 'tu sobre de medición' : producto;
  const aviso =
    pedido.modalidad === 'retiro'
      ? `Te avisamos por aquí cuando esté listo para retirar en Grimuca ${tienda}.`
      : `Te avisamos por aquí cuando salga de Grimuca ${tienda}.`;
  return `${hola} Recibimos tu pedido N.º ${pedido.id}: ${que}. ${aviso}`;
}

/** Segundo mensaje, cuando la tienda marcó el pedido como despachado (o el servicio como atendido). */
export function mensajeDespachadoCliente(pedido: Pedido, tienda: string): string {
  if (pedido.tipo === 'servicio') return 'El técnico marcó tu servicio como atendido.';
  return pedido.modalidad === 'retiro'
    ? `Tu pedido está listo para retirar en Grimuca ${tienda}.`
    : `Tu pedido salió de Grimuca ${tienda}.`;
}

/** Vista previa que ve el comercio al pulsar "Despachado" o "Atendido". */
export function mensajeDespachoComercio(pedido: Pedido, tienda: string): string {
  const hola = saludo(pedido.hogar_nombre);
  if (pedido.tipo === 'servicio') {
    return `${hola} El técnico de Grimuca ${tienda} atendió tu servicio (pedido N.º ${pedido.id}). ¡Gracias por confiar en nosotros!`;
  }
  return pedido.modalidad === 'retiro'
    ? `${hola} Tu pedido N.º ${pedido.id} está listo para retirar en Grimuca ${tienda}.`
    : `${hola} Tu pedido N.º ${pedido.id} salió de Grimuca ${tienda}. Va en camino a tu dirección.`;
}
