import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Boton,
  Campo,
  Cargando,
  Chip,
  EstadoVacio,
  FilaPedido,
  Insignia,
  ListaPedidos,
  TarjetaTienda,
} from '../../components/grimuca';
import type { Pedido } from '../../lib/tipos';
import { TIENDAS_OPERADOR, horaDe } from './estadoPedidos';
import { ZONAS_OPERADOR } from './datosZonas';
import type { PedidosEnVivo } from './usePedidosEnVivo';
import { nombreServicio, textoFechaPreferida } from '../tutoriales/contenido';

function queLleva(p: Pedido): string {
  if (p.tipo === 'sobre') return 'Sobre de medición';
  if (p.tipo === 'servicio') return nombreServicio(p.servicio);
  const nombre = p.cartucho_nombre ?? p.cartucho_codigo ?? 'Cartucho';
  return p.cantidad > 1 ? `${nombre} × ${p.cantidad}` : nombre;
}

export function Despacho({ envivo }: { envivo: PedidosEnVivo }) {
  const [parametros] = useSearchParams();
  const [tienda, setTienda] = useState<string>(parametros.get('tienda') ?? 'todas');
  const [zona, setZona] = useState<string>('todas');
  const { pendientes, nuevos, carga, conexion } = envivo;

  const tiendasVisibles = TIENDAS_OPERADOR.filter((t) => tienda === 'todas' || t.id === tienda);
  const filtrados = pendientes.filter((p) => zona === 'todas' || p.zona === zona);
  const totalVisibles = filtrados.filter((p) => tiendasVisibles.some((t) => t.id === p.tienda_id)).length;

  return (
    <div className="g-pila g-pila--amplia">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="g-h1">Despacho</h1>
          <p>Sobres, cartuchos y servicios técnicos por atender, por tienda y zona.</p>
        </div>
        <Insignia tono="azul">{totalVisibles} por despachar</Insignia>
        <Insignia tono={envivo.contadorNuevos > 0 ? 'oscuro' : 'neutro'}>Nuevos: {envivo.contadorNuevos}</Insignia>
        {envivo.contadorNuevos > 0 && (
          <Boton variante="secundario" onClick={envivo.reiniciarNuevos}>
            Marcar vistos
          </Boton>
        )}
      </div>

      {conexion === 'reconectando' && (
        <p role="status" style={{ color: 'var(--tinta-2)' }}>
          Sin conexión en vivo. Actualizando cada 5 segundos.
        </p>
      )}

      <div className="flex flex-wrap items-end gap-4">
        <fieldset className="g-grupo">
          <legend>Tienda</legend>
          <div className="g-chips">
            <Chip activo={tienda === 'todas'} onClick={() => setTienda('todas')}>
              Todas las tiendas
            </Chip>
            {TIENDAS_OPERADOR.map((t) => (
              <Chip key={t.id} activo={tienda === t.id} onClick={() => setTienda(t.id)}>
                {t.nombre}
              </Chip>
            ))}
          </div>
        </fieldset>
        <Campo
          como="select"
          etiqueta="Zona"
          value={zona}
          onChange={(e) => setZona(e.target.value)}
          opciones={[{ valor: 'todas', etiqueta: 'Todas las zonas' }, ...ZONAS_OPERADOR.map((z) => ({ valor: z, etiqueta: z }))]}
        />
      </div>

      {carga === 'cargando' && <Cargando variante="esqueleto" lineas={4} texto="Cargando pedidos…" />}
      {carga === 'error' && (
        <EstadoVacio
          tono="error"
          titulo="No se pudieron cargar los pedidos."
          accion={
            <Boton variante="secundario" onClick={() => void envivo.recargar()}>
              Reintentar
            </Boton>
          }
        />
      )}
      {carga === 'listo' && (
        <div className="g-rejilla-tiendas">
          {tiendasVisibles.map((t) => {
            const deTienda = filtrados.filter((p) => p.tienda_id === t.id);
            return (
              <TarjetaTienda
                key={t.id}
                nombre={t.nombre}
                extra={<Insignia tono="azul">{deTienda.length} pendientes</Insignia>}
              >
                {deTienda.length === 0 ? (
                  <p style={{ color: 'var(--apagado)' }}>No hay nada por despachar en {t.nombre}.</p>
                ) : (
                  <ListaPedidos etiqueta={`Pedidos de ${t.nombre}`}>
                    {deTienda.map((p) => (
                      <FilaPedido
                        key={p.id}
                        tipo={p.tipo}
                        descripcion={`${queLleva(p)} · ${p.hogar_nombre ?? 'Hogar'}`}
                        fechaPreferida={
                          p.tipo === 'servicio' ? textoFechaPreferida(p.fecha_preferida, p.momento) || undefined : undefined
                        }
                        zona={p.zona ?? '—'}
                        modalidad={p.modalidad}
                        direccion={p.direccion ?? undefined}
                        hora={horaDe(p.fecha)}
                        nuevo={Boolean(nuevos[p.id])}
                        alDespachar={() => void envivo.marcarDespachado(p)}
                      />
                    ))}
                  </ListaPedidos>
                )}
              </TarjetaTienda>
            );
          })}
        </div>
      )}
    </div>
  );
}
