// Piezas de las tarjetas de producto (resultado, catálogo y bacterias): foto, cotizar por WhatsApp y chips del motivo.
import { useEffect, useId, useState } from 'react';
import { Boton, Insignia } from '../../components/grimuca';
import type { TonoInsignia } from '../../components/grimuca';
import type { MotivoAtendido, Nivel } from '../../lib/tipos';
import { PALABRA_NIVEL, TEXTO_PRECIO_WHATSAPP, enlaceWhatsApp } from './textos';
import './resultado.css';

/** Foto del producto: carga diferida, contenida sobre fondo papel y "Foto no disponible" si falta o falla. */
export function FotoProducto({ url, compacta = false }: { url: string | null | undefined; compacta?: boolean }) {
  const [fallo, setFallo] = useState(false);
  useEffect(() => setFallo(false), [url]);
  return (
    <div className={compacta ? 'g-tarjeta-producto__foto producto-foto producto-foto--compacta' : 'g-tarjeta-producto__foto producto-foto'}>
      {url && !fallo ? (
        <img
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFallo(true)}
        />
      ) : (
        <span className="producto-foto__falta">Foto no disponible</span>
      )}
    </div>
  );
}

const TONO_NIVEL: Record<Nivel, TonoInsignia> = { rojo: 'error', amarillo: 'aviso', verde: 'ok', sin_dato: 'neutro' };

/** Chips de lo que atiende un sugerido: "Nitrato · Rojo", "Agua turbia"… */
export function ChipsAtiende({ atiende }: { atiende: MotivoAtendido[] | undefined }) {
  if (!atiende || atiende.length === 0) return null;
  return (
    <ul className="producto-chips" aria-label="Lo que atiende">
      {atiende.map((a) => (
        <li key={`${a.clave}-${a.nombre}`}>
          <Insignia tono={a.nivel ? TONO_NIVEL[a.nivel] : 'azul'}>
            {a.nivel ? `${a.nombre} · ${PALABRA_NIVEL[a.nivel]}` : a.nombre}
          </Insignia>
        </li>
      ))}
    </ul>
  );
}

/**
 * Botón secundario (44 px) que abre WhatsApp con el mensaje ya escrito. El cliente puede ver y editar el mensaje
 * antes de enviarlo ("Ver o editar el mensaje"); el enlace usa lo que quede escrito.
 */
export function CotizarWhatsApp({
  mensaje,
  etiqueta = 'Cotizar por WhatsApp',
  conLineaPrecio = false,
}: {
  mensaje: string;
  etiqueta?: string;
  conLineaPrecio?: boolean;
}) {
  const [texto, setTexto] = useState(mensaje);
  const idCampo = useId();
  useEffect(() => setTexto(mensaje), [mensaje]);
  const enlace = enlaceWhatsApp(texto.trim() || mensaje);

  return (
    <div className="producto-cotizar">
      {enlace.interno ? (
        <Boton variante="secundario" anchoCompleto a={enlace.destino}>
          {etiqueta}
        </Boton>
      ) : (
        <Boton variante="secundario" anchoCompleto href={enlace.destino}>
          {etiqueta}
        </Boton>
      )}
      {conLineaPrecio && <p className="producto-cotizar__nota">{TEXTO_PRECIO_WHATSAPP}</p>}
      {!enlace.interno && (
        <details className="producto-cotizar__mensaje">
          <summary>Ver o editar el mensaje</summary>
          <label className="producto-cotizar__etiqueta" htmlFor={idCampo}>
            Tu mensaje para la tienda
          </label>
          <textarea
            id={idCampo}
            className="g-control producto-cotizar__texto"
            rows={5}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
        </details>
      )}
    </div>
  );
}
