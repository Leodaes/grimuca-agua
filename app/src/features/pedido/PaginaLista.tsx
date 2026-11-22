import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { cambiarCantidad as fijarCantidad, hogarId, lista, quitarDeLista, vaciarLista } from '../../lib/sesion';
import type { Hogar, Tienda } from '../../lib/tipos';
import { Aviso, Boton, Campo, Chip, EstadoVacio, ListaArticulos } from '../../components/grimuca';
import { TEXTO_SIN_COBRO, mensajeError } from '../resultado/textos';

interface Articulo {
  codigo: string;
  nombre: string;
  cantidad: number;
}

type Modalidad = 'retiro' | 'envio';

const TIENDA_POR_DEFECTO = 'cem';

function leerLista(): Articulo[] {
  try {
    return (lista() as Articulo[]).filter((a) => a && a.codigo);
  } catch {
    return [];
  }
}


function EnlaceSeguirViendo() {
  return (
    <Link className="g-enlace" to="/catalogo" style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>
      Seguir viendo productos
    </Link>
  );
}

/** /lista: Mi lista → retiro o envío → hacer pedido. */
export function PaginaLista() {
  const navegar = useNavigate();
  const [articulos, setArticulos] = useState<Articulo[]>(leerLista);
  const [modalidad, setModalidad] = useState<Modalidad>('retiro');
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [hogar, setHogar] = useState<Hogar | null>(null);
  const [tiendaId, setTiendaId] = useState('');
  const [direccion, setDireccion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idHogar = hogarId();
  // Hasta que llega el hogar no sabemos su tienda: pedir antes mandaría el pedido a la tienda por defecto.
  const [hogarListo, setHogarListo] = useState(!idHogar);

  useEffect(() => {
    let vigente = true;
    api
      .tiendas()
      .then((lista) => {
        if (!vigente) return;
        setTiendas(lista);
        setTiendaId((actual) => actual || lista[0]?.id || '');
      })
      .catch(() => undefined);
    if (idHogar) {
      api
        .obtenerHogar(idHogar)
        .then((datos) => {
          if (!vigente) return;
          setHogar(datos);
          if (datos.tienda_id) setTiendaId(datos.tienda_id);
          if (datos.direccion) setDireccion((actual) => actual || datos.direccion || '');
          setHogarListo(true);
        })
        .catch(() => {
          if (vigente) setHogarListo(true);
        });
    }
    return () => {
      vigente = false;
    };
  }, [idHogar]);

  function cambiarCantidad(codigo: string, cantidad: number) {
    const nuevos = articulos.map((a) => (a.codigo === codigo ? { ...a, cantidad } : a));
    setArticulos(nuevos);
    fijarCantidad(codigo, cantidad);
  }

  function quitar(codigo: string) {
    quitarDeLista(codigo);
    setArticulos((previos) => previos.filter((a) => a.codigo !== codigo));
  }

  async function hacerPedido() {
    setError(null);
    if (!idHogar) {
      setError('Primero cuéntanos de tu casa en tu perfil.');
      return;
    }
    const direccionLimpia = direccion.trim();
    if (modalidad === 'envio' && direccionLimpia.length < 5) {
      setError('Falta detalle en la dirección. Agrega calle y número de casa o edificio.');
      return;
    }
    if (!hogarListo) return;
    const tienda = (modalidad === 'retiro' ? tiendaId : hogar?.tienda_id || tiendaId) || TIENDA_POR_DEFECTO;
    setEnviando(true);
    try {
      const pedidos = [];
      for (const articulo of articulos) {
        pedidos.push(
          await api.crearPedido({
            hogar_id: idHogar,
            tipo: 'cartucho',
            cartucho_codigo: articulo.codigo,
            cantidad: articulo.cantidad,
            modalidad,
            direccion: modalidad === 'envio' ? direccionLimpia : null,
            tienda_id: tienda,
          }),
        );
      }
      vaciarLista();
      const ids = pedidos.map((p) => p.id);
      const otros = ids.slice(1);
      navegar(`/pedido/${ids[0]}${otros.length ? `?otros=${otros.join(',')}` : ''}`, { state: { ids } });
    } catch (e) {
      setError(`No se pudo enviar el pedido. Tu lista sigue ahí; intenta otra vez. ${mensajeError(e)}`);
      setEnviando(false);
    }
  }

  if (articulos.length === 0) {
    return (
      <main id="contenido" className="g-pantalla__contenido g-pila" tabIndex={-1}>
        <h1 className="g-h1">Mi lista</h1>
        <EstadoVacio titulo="Tu lista está vacía" accion={<Boton a="/resultados">Ver mis resultados</Boton>}>
          Mide tu agua y te decimos qué cartucho te sirve.
        </EstadoVacio>
        <EnlaceSeguirViendo />
      </main>
    );
  }

  const tiendaElegida = tiendas.find((t) => t.id === tiendaId);

  return (
    <main id="contenido" className="g-pantalla__contenido g-pila" tabIndex={-1}>
      <h1 className="g-h1">Mi lista</h1>
      <p>Lo que vas a pedir a la tienda.</p>

      <ListaArticulos
        articulos={articulos.map((a) => ({ id: a.codigo, nombre: a.nombre, detalle: a.codigo, cantidad: a.cantidad }))}
        alCambiarCantidad={cambiarCantidad}
        alQuitar={quitar}
      />
      <EnlaceSeguirViendo />

      <section className="g-pila" aria-labelledby="titulo-modalidad">
        <h2 className="g-h3" id="titulo-modalidad">
          ¿Cómo lo quieres?
        </h2>
        <div className="g-chips" role="group" aria-labelledby="titulo-modalidad">
          <Chip activo={modalidad === 'retiro'} onClick={() => setModalidad('retiro')}>
            Retiro en tienda
          </Chip>
          <Chip activo={modalidad === 'envio'} onClick={() => setModalidad('envio')}>
            Envío a mi dirección
          </Chip>
        </div>

        {modalidad === 'retiro' ? (
          <>
            <Campo
              como="select"
              etiqueta="Tienda"
              value={tiendaId}
              onChange={(e) => setTiendaId(e.target.value)}
              opciones={tiendas.map((t) => ({ valor: t.id, etiqueta: `Grimuca ${t.nombre}` }))}
              marcador={tiendas.length === 0 ? 'Cargando tiendas…' : undefined}
            />
            {tiendaElegida?.horario && <p className="g-apagado">Horario: {tiendaElegida.horario}</p>}
          </>
        ) : (
          <Campo
            como="textarea"
            etiqueta="Dirección de entrega"
            ayuda="Urbanización, calle, casa o edificio y apartamento."
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
          />
        )}
      </section>

      <Aviso>{TEXTO_SIN_COBRO}</Aviso>

      {error && (
        <Aviso tono="error" rol="alert">
          {error}
        </Aviso>
      )}

      <Boton
        anchoCompleto
        cargando={enviando || !hogarListo}
        textoCargando={enviando ? 'Enviando tu pedido…' : 'Cargando tu perfil…'}
        onClick={hacerPedido}
      >
        Hacer pedido
      </Boton>
    </main>
  );
}
