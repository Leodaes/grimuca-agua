// Pedidos pendientes al día: carga inicial + eventos en vivo (o sondeo de respaldo) + despacho optimista.
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { Pedido } from '../../lib/tipos';
import { esNoAutorizado, useServicios } from './contexto';
import type { EstadoConexion } from './contexto';
import { ESTADO_INICIAL, nombreTienda, pendientesVisibles, reducirPedidos } from './estadoPedidos';

/** Cuánto dura el resaltado de un pedido recién llegado. */
export const DURACION_NUEVO_MS = 6000;

export function usePedidosEnVivo(token: string, alNoAutorizado: () => void) {
  const servicios = useServicios();
  const [estado, despachar] = useReducer(reducirPedidos, ESTADO_INICIAL);
  const [carga, setCarga] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [conexion, setConexion] = useState<EstadoConexion>('conectando');
  const [version, setVersion] = useState(0);
  const [contadorNuevos, setContadorNuevos] = useState(0);
  const [ultimoNuevo, setUltimoNuevo] = useState<Pedido | null>(null);
  const [anuncio, setAnuncio] = useState('');
  const [errorDespacho, setErrorDespacho] = useState<string | null>(null);
  const temporizadores = useRef(new Set<number>());
  const refNoAutorizado = useRef(alNoAutorizado);
  refNoAutorizado.current = alNoAutorizado;

  const recargar = useCallback(async () => {
    try {
      const lista = await servicios.pedidosPendientes(token);
      despachar({ tipo: 'cargar', pedidos: lista });
      setCarga('listo');
    } catch (error) {
      if (esNoAutorizado(error)) refNoAutorizado.current();
      else setCarga((c) => (c === 'listo' ? c : 'error'));
    }
  }, [servicios, token]);

  useEffect(() => {
    void recargar();
    const tiempos = temporizadores.current;
    const quitar = servicios.enVivo(token, {
      pedidoNuevo: (pedido) => {
        despachar({ tipo: 'llego', pedido });
        setContadorNuevos((n) => n + 1);
        setUltimoNuevo(pedido);
        setAnuncio(`Pedido nuevo en ${pedido.tienda_nombre ?? nombreTienda(pedido.tienda_id)}`);
        setVersion((v) => v + 1);
        const t = window.setTimeout(() => {
          tiempos.delete(t);
          despachar({ tipo: 'quitarNuevo', id: pedido.id });
        }, DURACION_NUEVO_MS);
        tiempos.add(t);
      },
      pedidoDespachado: (pedido) => {
        despachar({ tipo: 'despachado', id: pedido.id });
        setVersion((v) => v + 1);
      },
      otroCambio: () => setVersion((v) => v + 1),
      listaPedidos: (lista) => {
        despachar({ tipo: 'cargar', pedidos: lista });
        setCarga('listo');
      },
      conexion: setConexion,
      sinPermiso: () => refNoAutorizado.current(),
    });
    return () => {
      quitar();
      for (const t of tiempos) window.clearTimeout(t);
      tiempos.clear();
    };
  }, [servicios, token, recargar]);

  const marcarDespachado = useCallback(
    async (pedido: Pedido) => {
      setErrorDespacho(null);
      despachar({ tipo: 'ocultar', id: pedido.id });
      try {
        await servicios.despachar(token, pedido.id);
        despachar({ tipo: 'despachado', id: pedido.id });
        setAnuncio(`Pedido N.º ${pedido.id} despachado`);
        setVersion((v) => v + 1);
      } catch (error) {
        despachar({ tipo: 'mostrar', id: pedido.id });
        if (esNoAutorizado(error)) refNoAutorizado.current();
        else setErrorDespacho('No se pudo marcar como despachado. Intenta otra vez.');
      }
    },
    [servicios, token],
  );

  return {
    pendientes: pendientesVisibles(estado),
    nuevos: estado.nuevos,
    carga,
    conexion,
    version,
    contadorNuevos,
    reiniciarNuevos: () => setContadorNuevos(0),
    ultimoNuevo,
    anuncio,
    errorDespacho,
    limpiarError: () => setErrorDespacho(null),
    recargar,
    marcarDespachado,
  };
}

export type PedidosEnVivo = ReturnType<typeof usePedidosEnVivo>;
