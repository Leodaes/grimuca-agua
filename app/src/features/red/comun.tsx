// Piezas compartidas por los módulos Red y Técnico: entrada con PIN y textos.
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Boton, Campo, Encabezado, Pantalla } from '../../components/grimuca';
import { ErrorApi } from '../../lib/api';
import type { Pedido } from '../../lib/tipos';
import { nombreServicio } from '../tutoriales/contenido';

export function esNoAutorizado(error: unknown): boolean {
  return error instanceof ErrorApi ? error.estado === 401 : (error as { estado?: unknown } | null)?.estado === 401;
}

export function mensajeDe(error: unknown, porDefecto: string): string {
  const m = (error as { mensaje?: unknown } | null)?.mensaje;
  return typeof m === 'string' && m ? m : porDefecto;
}

/** Qué lleva un pedido, en palabras: "Sobre de medición", "Cambio de cartucho", "Cartucho de carbón × 2". */
export function queLleva(p: Pedido): string {
  if (p.tipo === 'sobre') return 'Sobre de medición';
  if (p.tipo === 'servicio') return nombreServicio(p.servicio);
  const nombre = p.cartucho_nombre ?? p.cartucho_codigo ?? 'Cartucho';
  return p.cantidad > 1 ? `${nombre} × ${p.cantidad}` : nombre;
}

/** "Grimuca Mañongo": comercio + tienda, sin repetir el comercio si la tienda ya lo trae. */
export function dondeFue(p: Pedido): string {
  const tienda = p.tienda_nombre ?? p.tienda_id;
  const comercio = p.comercio_nombre;
  if (!comercio || tienda.toLowerCase().startsWith(comercio.toLowerCase())) return tienda;
  return `${comercio} ${tienda}`;
}

/** "21 de febrero de 2027" a partir de AAAA-MM-DD o de una fecha ISO, sin correr el día. */
export function fechaLarga(fecha: string | null | undefined): string {
  if (!fecha) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  const d = m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)) : new Date(fecha);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('es-VE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: m ? 'UTC' : 'America/Caracas',
  }).format(d);
}

export function hora(fecha: string | Date): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('es-VE', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Caracas' }).format(d);
}

interface PropsEntrada {
  modulo: string;
  titulo: string;
  texto: string;
  rutaInicio: string;
  ancho: 'cliente' | 'operador';
  entrar: (pin: string) => Promise<void>;
  pie?: ReactNode;
}

/** Pantalla de PIN de un módulo. */
export function EntradaConPin({ modulo, titulo, texto, rutaInicio, ancho, entrar, pie }: PropsEntrada) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!pin.trim()) {
      setError('Escribe el PIN.');
      return;
    }
    setEnviando(true);
    setError(undefined);
    try {
      await entrar(pin.trim());
    } catch (e) {
      setError(
        esNoAutorizado(e)
          ? 'PIN incorrecto. Prueba otra vez.'
          : mensajeDe(e, 'No se pudo entrar. Revisa la conexión e intenta otra vez.'),
      );
      setEnviando(false);
    }
  }

  return (
    <Pantalla
      ancho={ancho}
      conBarra={false}
      encabezado={<Encabezado variante={ancho} rutaInicio={rutaInicio} titulo={modulo} />}
    >
      <form onSubmit={enviar} className="g-pila" style={{ maxWidth: 360, margin: '48px auto', width: '100%' }} noValidate>
        <h1 className="g-h1">{titulo}</h1>
        <p>{texto}</p>
        <Campo
          etiqueta="PIN"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          pattern="[0-9]*"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          error={error}
          autoFocus
        />
        <Boton type="submit" cargando={enviando} anchoCompleto>
          Entrar
        </Boton>
        {pie}
      </form>
    </Pantalla>
  );
}
