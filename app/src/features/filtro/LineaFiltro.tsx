import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { hogarId } from '../../lib/sesion';
import type { Hogar } from '../../lib/tipos';
import { resumenFiltro } from './textos';

const ESTILO_ENLACE = { minHeight: 44, display: 'inline-flex', alignItems: 'center' } as const;

/** Línea sobre los sugeridos del resultado: para qué filtro se eligieron, o invitación a registrarlo. */
export function LineaFiltro() {
  const [hogar, setHogar] = useState<Hogar | null>(null);

  useEffect(() => {
    const id = hogarId();
    if (!id) return undefined;
    let vigente = true;
    Promise.resolve()
      .then(() => api.obtenerHogar(id))
      .then((datos) => {
        if (vigente && datos) setHogar(datos);
      })
      .catch(() => undefined);
    return () => {
      vigente = false;
    };
  }, []);

  if (!hogar?.tiene_filtro) return null;
  if (hogar.filtro) {
    return (
      <p>
        Elegidos para tu filtro: {resumenFiltro(hogar.filtro)}.{' '}
        <Link className="g-enlace" to="/mi-filtro" style={ESTILO_ENLACE}>
          Cambiar mi filtro
        </Link>
      </p>
    );
  }
  return (
    <p>
      <Link className="g-enlace" to="/mi-filtro" style={ESTILO_ENLACE}>
        Dinos qué filtro tienes para afinar la recomendación
      </Link>
    </p>
  );
}
