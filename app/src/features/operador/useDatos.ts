// Carga de datos con estados de carga, error y reintento. Se vuelve a pedir cuando cambia `version`.
import { useCallback, useEffect, useRef, useState } from 'react';
import { esNoAutorizado } from './contexto';

export function useDatos<T>(cargar: () => Promise<T>, version: number, alNoAutorizado: () => void) {
  const [datos, setDatos] = useState<T | null>(null);
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const refCargar = useRef(cargar);
  refCargar.current = cargar;
  const refNoAutorizado = useRef(alNoAutorizado);
  refNoAutorizado.current = alNoAutorizado;

  const pedir = useCallback(async (vivo: { activo: boolean }) => {
    try {
      const resultado = await refCargar.current();
      if (!vivo.activo) return;
      setDatos(resultado);
      setEstado('listo');
    } catch (error) {
      if (!vivo.activo) return;
      if (esNoAutorizado(error)) refNoAutorizado.current();
      // Si ya había datos, un refresco fallido no borra lo que se ve.
      else setEstado((e) => (e === 'listo' ? e : 'error'));
    }
  }, []);

  useEffect(() => {
    const vivo = { activo: true };
    void pedir(vivo);
    return () => {
      vivo.activo = false;
    };
  }, [pedir, version]);

  const reintentar = () => {
    setEstado('cargando');
    void pedir({ activo: true });
  };

  return { datos, estado, reintentar };
}
