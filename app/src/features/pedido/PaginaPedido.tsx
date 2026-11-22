import { useEffect, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { hogarId } from '../../lib/sesion';
import type { Cartucho, Pedido, Tienda } from '../../lib/tipos';
import { Aviso, Boton, Cargando, EstadoVacio, Insignia, WhatsAppSimulado } from '../../components/grimuca';
import { TEXTO_SIN_COBRO, mensajeError } from '../resultado/textos';
import { nombreServicio, textoFechaPreferida } from '../tutoriales/contenido';
import { mensajeDespachadoCliente, mensajeRecibido } from './mensajesWhatsApp';

const ESTILO_ENLACE = { minHeight: 44, display: 'inline-flex', alignItems: 'center' } as const;

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'listo'; pedidos: Pedido[]; tiendas: Tienda[]; cartuchos: Cartucho[]; nombre: string | null };

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
    const hogar = hogarId();
    Promise.all([
      Promise.all(ids.map((uno) => api.pedido(uno))),
      api.tiendas().catch(() => [] as Tienda[]),
      api.cartuchos(hogar).catch(() => [] as Cartucho[]),
      hogar ? api.obtenerHogar(hogar).then((h) => h.nombre, () => null) : Promise.resolve(null),
    ])
      .then(
        ([pedidos, tiendas, cartuchos, nombre]) =>
          vigente && setEstado({ tipo: 'listo', pedidos, tiendas, cartuchos, nombre }),
      )
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
    (pedido.tipo === 'servicio' ? `Servicio técnico: ${nombreServicio(pedido.servicio).toLowerCase()}` : null) ??
    pedido.cartucho_nombre ??
    estado.cartuchos.find((c) => c.codigo === pedido.cartucho_codigo)?.nombre ??
    pedido.cartucho_codigo ??
    'Sobre de medición';
  const primero = estado.pedidos[0];
  const tiendaPrimero = primero ? nombreTienda(primero.tienda_id) : '';
  const horario = estado.tiendas.find((t) => t.id === primero?.tienda_id)?.horario;
  const mensajesWa = [
    ...estado.pedidos.map((p) => mensajeRecibido(p, estado.nombre, nombreTienda(p.tienda_id), nombreProducto(p))),
    ...estado.pedidos
      .filter((p) => p.estado === 'despachado')
      .map((p) => mensajeDespachadoCliente(p, nombreTienda(p.tienda_id))),
  ];

  return (
    <main id="contenido" className="g-pantalla__contenido g-pila" tabIndex={-1}>
      <Insignia tono="ok" punto>
        Pedido recibido
      </Insignia>
      <h1 className="g-h1">Listo, tu pedido ya está en la tienda</h1>
      {primero && (
        <p>
          {primero.tipo === 'servicio'
            ? `Grimuca ${tiendaPrimero} te contactará para confirmar el costo y la fecha de la visita.`
            : primero.modalidad === 'retiro'
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
              {nombreProducto(pedido)}
              {pedido.tipo !== 'servicio' && ` × ${pedido.cantidad}`}
            </p>
            {pedido.tipo === 'servicio' && pedido.fecha_preferida && (
              <p>Fecha preferida: {textoFechaPreferida(pedido.fecha_preferida, pedido.momento)}</p>
            )}
            <p>
              {pedido.tipo === 'servicio'
                ? 'Visita a domicilio'
                : pedido.modalidad === 'retiro'
                  ? 'Retiro en tienda'
                  : 'Envío a mi dirección'}{' '}
              · Grimuca {nombreTienda(pedido.tienda_id)}
            </p>
            {pedido.modalidad === 'envio' && pedido.direccion && <p className="g-apagado">{pedido.direccion}</p>}
            {pedido.tipo === 'servicio' && pedido.nota && <p className="g-apagado">Nota: {pedido.nota}</p>}
            <div>
              {pedido.estado === 'despachado' ? (
                <Insignia tono="ok" punto>
                  {pedido.tipo === 'servicio' ? 'Atendido' : 'Despachado'}
                </Insignia>
              ) : (
                <Insignia tono="aviso" punto>
                  {pedido.tipo === 'servicio' ? 'Por confirmar' : 'En preparación'}
                </Insignia>
              )}
            </div>
          </li>
        ))}
      </ul>

      {primero && (
        <section className="g-pila" aria-labelledby="titulo-whatsapp" style={{ gap: 'var(--s3)' }}>
          <h2 id="titulo-whatsapp" className="g-h3">
            Te escribimos por WhatsApp
          </h2>
          <WhatsAppSimulado de={`Grimuca ${tiendaPrimero}`} mensaje={mensajesWa} hora={new Date(primero.fecha)} />
        </section>
      )}

      <Aviso>{TEXTO_SIN_COBRO}</Aviso>

      {estado.pedidos.some((p) => p.tipo === 'cartucho') && (
        <nav className="g-pila" aria-label="Cambiar el cartucho" style={{ gap: 'var(--s2)' }}>
          <Link className="g-enlace" to="/tutoriales" style={ESTILO_ENLACE}>
            Cuando lo tengas, mira cómo cambiarlo
          </Link>
          <Link className="g-enlace" to="/experto?servicio=cambio" style={ESTILO_ENLACE}>
            ¿No sabes hacerlo? Contrata a un experto
          </Link>
        </nav>
      )}

      <Boton a="/resultados" anchoCompleto>
        Volver a mis resultados
      </Boton>
      <Boton a="/" variante="secundario" anchoCompleto>
        Ir al inicio
      </Boton>
    </main>
  );
}
