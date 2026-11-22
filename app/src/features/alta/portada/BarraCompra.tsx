import { useEffect, useState } from 'react';
import { Boton } from '../../../components/grimuca';

export interface PropsBarraCompra {
  /** "pedir" (por defecto) o "ya" cuando la persona llegó desde el QR del sobre. */
  principal?: 'pedir' | 'ya';
}

/**
 * Barra fija inferior de compra de la portada (sin hogar en sesión).
 * Solo aparece cuando no se ve ningún bloque con el botón principal ([data-p-cta]),
 * así nunca hay dos botones de acción a la vez en pantalla.
 */
export function BarraCompra({ principal = 'pedir' }: PropsBarraCompra) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    const zonas = Array.from(document.querySelectorAll('[data-p-cta]'));
    const enPantalla = new Set<Element>();
    const observador = new IntersectionObserver((entradas) => {
      for (const entrada of entradas) {
        if (entrada.isIntersecting) enPantalla.add(entrada.target);
        else enPantalla.delete(entrada.target);
      }
      setVisible(enPantalla.size === 0);
    });
    zonas.forEach((zona) => observador.observe(zona));
    return () => observador.disconnect();
  }, []);

  const ya = principal === 'ya';
  return (
    <aside
      className={`p-barra${visible ? ' p-barra--visible' : ''}`}
      aria-label="Comprar el sobre"
      aria-hidden={visible ? undefined : true}
    >
      <div className="p-barra__contenido">
        <p className="p-barra__texto">
          {ya ? (
            <>
              <span>¿Ya tienes tu sobre?</span>
              <strong>Empieza a medir</strong>
            </>
          ) : (
            <>
              <span>Sobre de medición</span>
              <strong>$9</strong>
            </>
          )}
        </p>
        <Boton a={ya ? '/perfil?ya=1' : '/perfil'}>{ya ? 'Ya tengo mi sobre' : 'Pedir el sobre'}</Boton>
      </div>
    </aside>
  );
}
