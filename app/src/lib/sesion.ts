// Lo que el navegador recuerda: el hogar, "Mi lista" y la sesión del operador.
// No hay cuentas: el hogar se identifica con un UUID guardado en localStorage.
import type { ItemLista } from './tipos';

export const CLAVE_HOGAR = 'agua.hogar_id';
export const CLAVE_LISTA = 'agua.lista';
export const CLAVE_TOKEN_OPERADOR = 'agua.token_operador';

/** Evento de `window` que se emite cada vez que cambia "Mi lista" (para el contador de la barra inferior). */
export const EVENTO_LISTA = 'agua:lista';

function leer(clave: string): string | null {
  try {
    return window.localStorage.getItem(clave);
  } catch {
    return null; // navegación privada o almacenamiento bloqueado
  }
}

function escribir(clave: string, valor: string | null): void {
  try {
    if (valor === null) window.localStorage.removeItem(clave);
    else window.localStorage.setItem(clave, valor);
  } catch {
    // sin almacenamiento: la app sigue, pero no recuerda entre visitas
  }
}

// ---------- Hogar ----------

export function hogarId(): string | null {
  return leer(CLAVE_HOGAR) || null;
}

/** Pasa `null` para olvidar el hogar en este navegador. */
export function guardarHogarId(id: string | null): void {
  escribir(CLAVE_HOGAR, id);
}

// ---------- Mi lista ----------

function esItem(valor: unknown): valor is ItemLista {
  if (typeof valor !== 'object' || valor === null) return false;
  const item = valor as Record<string, unknown>;
  return (
    typeof item.codigo === 'string' &&
    typeof item.nombre === 'string' &&
    typeof item.cantidad === 'number' &&
    Number.isInteger(item.cantidad) &&
    item.cantidad > 0
  );
}

export function lista(): ItemLista[] {
  const texto = leer(CLAVE_LISTA);
  if (!texto) return [];
  try {
    const dato: unknown = JSON.parse(texto);
    return Array.isArray(dato) ? dato.filter(esItem) : [];
  } catch {
    return [];
  }
}

function guardarLista(items: ItemLista[]): ItemLista[] {
  escribir(CLAVE_LISTA, items.length > 0 ? JSON.stringify(items) : null);
  try {
    window.dispatchEvent(new CustomEvent(EVENTO_LISTA, { detail: items }));
  } catch {
    // sin window (pruebas fuera del navegador)
  }
  return items;
}

/** Agrega un producto; si ya estaba, suma la cantidad (por defecto 1). Devuelve la lista nueva. */
export function agregarALista(item: { codigo: string; nombre: string; cantidad?: number }): ItemLista[] {
  const cantidad = Math.max(1, Math.floor(item.cantidad ?? 1));
  const actual = lista();
  const existente = actual.find((otro) => otro.codigo === item.codigo);
  if (existente) {
    existente.cantidad += cantidad;
    existente.nombre = item.nombre;
    return guardarLista(actual);
  }
  return guardarLista([...actual, { codigo: item.codigo, nombre: item.nombre, cantidad }]);
}

/** Fija la cantidad de un producto; con 0 o menos lo quita. Devuelve la lista nueva. */
export function cambiarCantidad(codigo: string, cantidad: number): ItemLista[] {
  const entera = Math.floor(cantidad);
  if (entera <= 0) return quitarDeLista(codigo);
  return guardarLista(lista().map((item) => (item.codigo === codigo ? { ...item, cantidad: entera } : item)));
}

/** Quita un producto. Devuelve la lista nueva. */
export function quitarDeLista(codigo: string): ItemLista[] {
  return guardarLista(lista().filter((item) => item.codigo !== codigo));
}

export function vaciarLista(): void {
  guardarLista([]);
}

/** Total de unidades en la lista. */
export function cantidadEnLista(): number {
  return lista().reduce((total, item) => total + item.cantidad, 0);
}

/** Avisa cuando cambia la lista (en esta pestaña o en otra). Devuelve la función para dejar de escuchar. */
export function alCambiarLista(manejador: (items: ItemLista[]) => void): () => void {
  const propio = () => manejador(lista());
  const deOtraPestana = (evento: StorageEvent) => {
    if (evento.key === null || evento.key === CLAVE_LISTA) manejador(lista());
  };
  window.addEventListener(EVENTO_LISTA, propio);
  window.addEventListener('storage', deOtraPestana);
  return () => {
    window.removeEventListener(EVENTO_LISTA, propio);
    window.removeEventListener('storage', deOtraPestana);
  };
}

// ---------- Operador ----------

export function tokenOperador(): string | null {
  return leer(CLAVE_TOKEN_OPERADOR) || null;
}

/** Pasa `null` para cerrar la sesión del operador. */
export function guardarTokenOperador(token: string | null): void {
  escribir(CLAVE_TOKEN_OPERADOR, token);
}
