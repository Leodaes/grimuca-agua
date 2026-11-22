import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { agregarALista, hogarId, lista } from '../../lib/sesion';
import type { Cartucho, CartuchoSugerido, Medicion } from '../../lib/tipos';
import {
  Aviso,
  Boton,
  Campo,
  Cargando,
  Chip,
  EstadoVacio,
  Icono,
  Insignia,
  Toast,
} from '../../components/grimuca';
import { mensajeCotizarSimple, mensajeError, traducirCorrige } from '../resultado/textos';
import { ChipsAtiende, CotizarWhatsApp, FotoProducto } from '../resultado/Producto';
import {
  GRUPOS_PARA,
  GRUPOS_TIPO,
  LINEA_LAMPARA_UV,
  filtrarCatalogo,
  leerPara,
  leerTipo,
} from './filtros';
import type { GrupoPara, GrupoTipo } from './filtros';
import './catalogo.css';

const POR_PAGINA = 12;
const MAX_RECOMENDADOS = 4;

type EstadoCatalogo =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'listo'; productos: Cartucho[] };

/** Última medición del hogar (o null si no hay hogar, no hay mediciones o falla la consulta). */
async function cargarUltimaMedicion(): Promise<Medicion | null> {
  const hogar = hogarId();
  if (!hogar) return null;
  try {
    const mediciones = await api.medicionesDeHogar(hogar);
    return mediciones[0] ?? null;
  } catch {
    return null;
  }
}

function codigosEnLista(): Set<string> {
  try {
    return new Set(lista().map((articulo) => articulo.codigo));
  } catch {
    return new Set();
  }
}

export function PaginaCatalogo() {
  const [parametros, setParametros] = useSearchParams();
  const tipo = leerTipo(parametros.get('tipo'));
  const para = leerPara(parametros.get('para'));
  const [busqueda, setBusqueda] = useState('');
  const [visibles, setVisibles] = useState(POR_PAGINA);
  const [estado, setEstado] = useState<EstadoCatalogo>({ tipo: 'cargando' });
  const [intento, setIntento] = useState(0);
  const [medicion, setMedicion] = useState<Medicion | null | undefined>(undefined);
  const [enLista, setEnLista] = useState<Set<string>>(codigosEnLista);
  const [agregado, setAgregado] = useState<string | null>(null);
  const navegar = useNavigate();

  useEffect(() => {
    let vigente = true;
    setEstado({ tipo: 'cargando' });
    api
      .cartuchos()
      .then((productos) => {
        if (vigente) setEstado({ tipo: 'listo', productos });
      })
      .catch((error: unknown) => {
        if (vigente) setEstado({ tipo: 'error', mensaje: mensajeError(error) });
      });
    return () => {
      vigente = false;
    };
  }, [intento]);

  useEffect(() => {
    let vigente = true;
    cargarUltimaMedicion().then((m) => {
      if (vigente) setMedicion(m);
    });
    return () => {
      vigente = false;
    };
  }, []);

  useEffect(() => {
    setVisibles(POR_PAGINA);
  }, [tipo, para, busqueda]);

  const recomendados = useMemo(() => (medicion?.sugeridos ?? []).slice(0, MAX_RECOMENDADOS), [medicion]);
  const codigosRecomendados = useMemo(() => new Set(recomendados.map((c) => c.codigo)), [recomendados]);

  const filtrados = useMemo(
    () => (estado.tipo === 'listo' ? filtrarCatalogo(estado.productos, { tipo, para, busqueda }) : []),
    [estado, tipo, para, busqueda],
  );

  function cambiarFiltro(clave: 'tipo' | 'para', valor: GrupoTipo | GrupoPara) {
    const siguientes = new URLSearchParams(parametros);
    if (valor === 'todos') siguientes.delete(clave);
    else siguientes.set(clave, valor);
    setParametros(siguientes, { replace: true });
  }

  function agregar(producto: Cartucho) {
    agregarALista({ codigo: producto.codigo, nombre: producto.nombre, cantidad: 1 });
    setEnLista((previo) => new Set(previo).add(producto.codigo));
    setAgregado(producto.nombre);
  }

  return (
    <main id="contenido" className="g-pantalla__contenido g-pila g-pila--amplia" tabIndex={-1}>
      <div className="g-pila">
        <h1 className="g-h1">Productos de la tienda</h1>
        <p className="g-apagado">Mira todo lo que tenemos y cotízalo por WhatsApp.</p>
      </div>

      {medicion !== undefined && (
        <Recomendados medicion={medicion} recomendados={recomendados} />
      )}

      <section className="g-pila" aria-labelledby="titulo-catalogo">
        <h2 className="g-h3" id="titulo-catalogo">
          Todo el catálogo
        </h2>

        <Campo
          etiqueta="Buscar por nombre o código"
          type="search"
          inputMode="search"
          autoComplete="off"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <fieldset className="catalogo-grupo">
          <legend>Tipo de producto</legend>
          <div className="catalogo-chips">
            {GRUPOS_TIPO.map((g) => (
              <Chip key={g.valor} activo={tipo === g.valor} onClick={() => cambiarFiltro('tipo', g.valor)}>
                {g.etiqueta}
              </Chip>
            ))}
          </div>
        </fieldset>

        <fieldset className="catalogo-grupo">
          <legend>Pensado para</legend>
          <div className="catalogo-chips">
            {GRUPOS_PARA.map((g) => (
              <Chip key={g.valor} activo={para === g.valor} onClick={() => cambiarFiltro('para', g.valor)}>
                {g.etiqueta}
              </Chip>
            ))}
          </div>
        </fieldset>

        {estado.tipo === 'cargando' && <Cargando texto="Cargando productos…" variante="esqueleto" lineas={6} />}

        {estado.tipo === 'error' && (
          <EstadoVacio
            tono="error"
            titulo="No pudimos cargar los productos"
            accion={
              <Boton variante="secundario" onClick={() => setIntento((n) => n + 1)}>
                Intentar otra vez
              </Boton>
            }
          >
            {estado.mensaje}
          </EstadoVacio>
        )}

        {estado.tipo === 'listo' && (
          <>
            <p className="g-apagado" role="status" aria-live="polite">
              {filtrados.length} {filtrados.length === 1 ? 'producto' : 'productos'}
            </p>
            {filtrados.length === 0 ? (
              <EstadoVacio titulo="No encontramos productos con ese filtro">
                Prueba con otro tipo o borra la búsqueda.
              </EstadoVacio>
            ) : (
              <ul className="catalogo-rejilla">
                {filtrados.slice(0, visibles).map((producto) => (
                  <li key={producto.codigo}>
                    <TarjetaCatalogo
                      producto={producto}
                      recomendado={codigosRecomendados.has(producto.codigo)}
                      enLista={enLista.has(producto.codigo)}
                      alAgregar={() => agregar(producto)}
                    />
                  </li>
                ))}
              </ul>
            )}
            {filtrados.length > visibles && (
              <Boton variante="secundario" anchoCompleto onClick={() => setVisibles((n) => n + POR_PAGINA)}>
                Ver más ({filtrados.length - visibles} más)
              </Boton>
            )}
          </>
        )}
      </section>

      <p className="g-apagado">
        Catálogo de la marca Oasis disponible en Grimuca. Los precios los confirma la tienda.
      </p>

      <Toast
        visible={agregado !== null}
        mensaje={agregado ? `${agregado} quedó en tu lista` : ''}
        alCerrar={() => setAgregado(null)}
        accion={{ etiqueta: 'Ver mi lista', alPulsar: () => navegar('/lista') }}
      />
    </main>
  );
}

function Recomendados({ medicion, recomendados }: { medicion: Medicion | null; recomendados: CartuchoSugerido[] }) {
  if (!medicion) {
    return (
      <Aviso tono="info">
        Mide tu agua y te decimos cuáles van con tu casa.{' '}
        <Link className="g-enlace" to="/medir">
          Medir mi agua
        </Link>
      </Aviso>
    );
  }
  if (recomendados.length === 0) return null;

  return (
    <section className="g-pila" aria-labelledby="titulo-recomendados">
      <h2 className="g-h3" id="titulo-recomendados">
        Recomendados para ti
      </h2>
      <ul className="catalogo-rejilla">
        {recomendados.map((producto) => {
          const lineaCodigo = [producto.marca, producto.codigo].filter(Boolean).join(' · ');
          return (
            <li key={producto.codigo}>
              <article className="g-tarjeta-producto catalogo-compacta">
                <FotoProducto url={producto.foto_url} compacta />
                <div className="g-tarjeta-producto__cuerpo">
                  <h3 className="g-tarjeta-producto__nombre">{producto.nombre}</h3>
                  {lineaCodigo && <p className="g-tarjeta-producto__codigo">{lineaCodigo}</p>}
                  <div className="g-tarjeta-producto__etiquetas">
                    <Insignia tono="azul">Recomendado para ti</Insignia>
                  </div>
                </div>
                {producto.motivo && (
                  <div className="producto-porque" style={{ gridColumn: '1 / -1' }}>
                    <h4 className="producto-porque__titulo">Por qué te lo recomendamos</h4>
                    <p className="producto-porque__frase">{producto.motivo}</p>
                    <ChipsAtiende atiende={producto.atiende} />
                  </div>
                )}
                <div className="g-tarjeta-producto__acciones">
                  <Link className="g-enlace catalogo-enlace" to={`/resultado/${medicion.id}`}>
                    Ver mi resultado
                  </Link>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function TarjetaCatalogo({
  producto,
  recomendado,
  enLista,
  alAgregar,
}: {
  producto: Cartucho;
  recomendado: boolean;
  enLista: boolean;
  alAgregar: () => void;
}) {
  const lineaCodigo = [producto.marca, producto.codigo].filter(Boolean).join(' · ');

  return (
    <article className={recomendado ? 'g-tarjeta-producto g-tarjeta-producto--destacado' : 'g-tarjeta-producto'}>
      <FotoProducto url={producto.foto_url} />
      <div className="g-tarjeta-producto__cuerpo">
        <h3 className="g-tarjeta-producto__nombre">{producto.nombre}</h3>
        {producto.categoria === 'lampara_uv' && <p className="catalogo-nota">{LINEA_LAMPARA_UV}</p>}
        {lineaCodigo && <p className="g-tarjeta-producto__codigo">{lineaCodigo}</p>}
        {producto.corrige.length > 0 && (
          <p className="g-tarjeta-producto__motivo">Pensado para: {traducirCorrige(producto.corrige)}.</p>
        )}
        <div className="g-tarjeta-producto__etiquetas">
          {recomendado && <Insignia tono="azul">Recomendado para ti</Insignia>}
          {producto.disponible ? (
            <Insignia tono="ok" punto>
              Disponible
            </Insignia>
          ) : (
            <Insignia tono="neutro">Consulta disponibilidad</Insignia>
          )}
        </div>
      </div>
      <div className="g-tarjeta-producto__acciones">
        <Boton
          variante="secundario"
          anchoCompleto
          disabled={enLista}
          icono={<Icono nombre={enLista ? 'check' : 'mas'} tamano={20} />}
          onClick={alAgregar}
          aria-label={enLista ? `${producto.nombre}: agregado` : `Agregar ${producto.nombre} a mi lista`}
        >
          {enLista ? 'Agregado' : 'Agregar a mi lista'}
        </Boton>
        <CotizarWhatsApp mensaje={mensajeCotizarSimple(producto.nombre, producto.codigo)} conLineaPrecio />
      </div>
    </article>
  );
}
