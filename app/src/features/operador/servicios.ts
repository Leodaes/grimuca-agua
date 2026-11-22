// Implementación real de los servicios del panel, sobre `lib/` (Plataforma).
import { api } from '../../lib/api';
import { suscribirEventos } from '../../lib/eventos';
import { guardarTokenOperador, tokenOperador } from '../../lib/sesion';
import type { ServiciosOperador } from './contexto';

export const serviciosReales: ServiciosOperador = {
  leerToken: () => tokenOperador(),
  guardarToken: (token) => guardarTokenOperador(token),
  entrar: async (pin) => (await api.operadorEntrar(pin)).token,
  pedidosPendientes: (token) => api.operadorPedidos('pendiente', token),
  despachar: (token, id) => api.despachar(id, token),
  resumen: (token) => api.resumen(token),
  inventario: (token) => api.inventario(token),
  zonas: (token) => api.zonas(token),
  mapa: (token) => api.mapa(token),
  yo: (token) => api.yo(token),
  productos: (token) => api.productosComercio(token),
  crearProducto: (token, datos) => api.crearProducto(datos, token),
  reportes: (token) => api.reportes(token),
  urlFoto: (token, pedidoId) => api.urlFotoServicio(pedidoId, token),
  enVivo: (token, m) =>
    suscribirEventos(token, {
      pedido_nuevo: m.pedidoNuevo,
      pedido_despachado: m.pedidoDespachado,
      medicion_nueva: () => m.otroCambio(),
      pedidos: m.listaPedidos,
      conexion: m.conexion,
      sinPermiso: m.sinPermiso,
    }),
};
