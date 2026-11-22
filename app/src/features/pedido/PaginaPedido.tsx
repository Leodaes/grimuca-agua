import { useEffect, useState } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import type { Cartucho, Pedido, Tienda } from '../../lib/tipos';
import { Aviso, Boton, Cargando, EstadoVacio, Insignia } from '../../components/grimuca';
import { TEXTO_SIN_COBRO, mensajeError } from '../resultado/textos';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'listo'; pedidos: Pedido[]; tiendas: Tienda[]; cartuchos: Cartucho[] };

function idsDelPedido(id: string, estado: unknown, otros: string | null): string[] {
  const deEstado = (estado as { ids?: Array<string | number> } | null)?.ids;
  const ids = deEstado?.length ? deEstado.map(String) : [id, ...(otros ? otros.split(',') : [])];
  return Array.from(new Set(ids.filter(Boolean)));
}

/** /pedido/:id: confirmación del pedido (y de los demás hechos en la misma tanda). */
export function PaginaPedido() {
  const { id = '' } = useParams();
  const ubicacion = useLocation();
  const [parametros] = useSearchParams();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const clave = idsDelPedido(id, ubicacion.state, parametros.get('otros')).join(',');

  useEffect(() => {
    let vigente = true;
    setEstado({ tipo: 'cargando' });
    const ids = clave.split(',');
    Promise.all([
      Promise.all(ids.map((uno) => api.pedido(uno))),
      api.tiendas().catch(() => [] as Tienda[]),
      api.cartuchos().catch(() => [] as Cartucho[]),
    ])
      .then(([pedidos, tiendas, cartuchos]) => vigente && setEstado({ tipo: 'listo', pedidos, tiendas, cartuchos }))
      .catch((error: unknown) => vigente && setEstado({ tipo: 'error', mensaje: mensajeError(error) }));
    return () => {
      vigente = false;
    };
  }, [clave]);

  if (estado.tipo === 'cargando') {
    return (
      <main id="contenido" className="g-pantalla__contenido g-pila" tabIndex={-1}>
        <h1 className="g-h1">Tu pedido</h1>
        <Cargando texto="Un momento…" variante="esqueleto" lineas={4} />
      </main>
    );
  }

  if (estado.tipo === 'error') {
    return (
      <main id="contenido" className="g-pantalla__contenido g-pila" tabIndex={-1}>
        <h1 className="g-h1">Tu pedido</h1>
        <EstadoVacio tono="error" titulo="No encontramos ese pedido" accion={<Boton a="/lista">Ir a Mi lista</Boton>}>
          {estado.mensaje}
        </EstadoVacio>
      </main>
    );
  }

  const nombreTienda = (tiendaId: string) => estado.tiendas.find((t) => t.id === tiendaId)?.nombre ?? tiendaId;
  const nombreProducto = (pedido: Pedido) =>
    pedido.cartucho_nombre ??
    estado.cartuchos.find((c) => c.codigo === pedido.cartucho_codigo)?.nombre ??
    pedido.cartucho_codigo ??
    'Sobre de medición';
  const primero = estado.pedidos[0];
  const tiendaPrimero = primero ? nombreTienda(primero.tienda_id) : '';
  const horario = estado.tiendas.find((t) => t.id === primero?.tienda_id)?.horario;

  return (
    <main id="contenido" className="g-pantalla__contenido g-pila" tabIndex={-1}>
      <Insignia tono="ok" punto>
        Pedido recibido
      </Insignia>
      <h1 className="g-h1">Listo, tu pedido ya está en la tienda</h1>
      {primero && (
        <p>
          {primero.modalidad === 'retiro'
            ? `Pasa por Grimuca ${tiendaPrimero} y da tu nombre en el mostrador.`
            : `Sale de Grimuca ${tiendaPrimero} hacia ${primero.direccion ?? 'tu dirección'}.`}
        </p>
      )}
      {horario && <p className="g-apagado">Horario: {horario}</p>}

      <ul className="g-pila" aria-label="Pedidos">
        {estado.pedidos.map((pedido) => (
          <li
            key={pedido.id}
            className="g-pila"
            style={{ border: '1px solid var(--linea)', padding: 'var(--s4)', gap: 'var(--s2)' }}
          >
            <p className="g-h4">Pedido N.º {pedido.id}</p>
            <p>
              {nombreProducto(pedido)} × {pedido.cantidad}
            </p>
            <p>
              {pedido.modalidad === 'retiro' ? 'Retiro en tienda' : 'Envío a mi dirección'} · Grimuca{' '}
              {nombreTienda(pedido.tienda_id)}
            </p>
            {pedido.modalidad === 'envio' && pedido.direccion && <p className="g-apagado">{pedido.direccion}</p>}
            <div>
              {pedido.estado === 'despachado' ? (
                <Insignia tono="ok" punto>
                  Despachado
                </Insignia>
              ) : (
                <Insignia tono="aviso" punto>
                  En preparación
                </Insignia>
              )}
            </div>
          </li>
        ))}
      </ul>

      <Aviso>{TEXTO_SIN_COBRO}</Aviso>

      <Boton a="/resultados" anchoCompleto>
        Volver a mis resultados
      </Boton>
      <Boton a="/" variante="secundario" anchoCompleto>
        Ir al inicio
      </Boton>
    </main>
  );
}
