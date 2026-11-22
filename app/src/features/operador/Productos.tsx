// Pestaña "Productos": catálogo del comercio con existencias por tienda y alta de un producto propio.
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Aviso, Boton, Campo, Cargando, Casilla, EstadoVacio, Icono, Insignia } from '../../components/grimuca';
import type { ProductoComercio } from '../../lib/tipos';
import { esNoAutorizado, mensajeDe, useServicios } from './contexto';
import { usePanel } from './panel';
import { useDatos } from './useDatos';

interface Props {
  token: string;
  version: number;
  alNoAutorizado: () => void;
}

export const CATEGORIAS_PRODUCTO = [
  { valor: 'cartucho', etiqueta: 'Cartucho' },
  { valor: 'filtro', etiqueta: 'Filtro' },
  { valor: 'sistema_osmosis_inversa', etiqueta: 'Sistema de ósmosis inversa' },
  { valor: 'lampara_uv', etiqueta: 'Lámpara UV' },
  { valor: 'repuesto', etiqueta: 'Repuesto' },
] as const;

/** "Pensado para": cada casilla se guarda con las claves reales que usa la recomendación. */
export const PENSADO_PARA = [
  { id: 'sedimentos', etiqueta: 'Sedimentos', claves: ['sedimentos'] },
  { id: 'cloro', etiqueta: 'Cloro y sabor', claves: ['cloro_libre', 'sabor_olor'] },
  { id: 'dureza', etiqueta: 'Dureza', claves: ['dureza'] },
  { id: 'nitrato', etiqueta: 'Nitrato y nitrito', claves: ['nitrato', 'nitrito'] },
  { id: 'plomo', etiqueta: 'Plomo y cobre', claves: ['plomo', 'cobre'] },
  { id: 'bacterias', etiqueta: 'Bacterias', claves: ['bacterias'] },
] as const;

function nombreCategoria(valor: string | null): string {
  return CATEGORIAS_PRODUCTO.find((c) => c.valor === valor)?.etiqueta ?? (valor ? valor.replace(/_/g, ' ') : '—');
}

type Orden = 'propios' | 'nombre' | 'mas' | 'menos' | 'tipo';

const ORDENES: { valor: Orden; etiqueta: string }[] = [
  { valor: 'propios', etiqueta: 'Los míos primero' },
  { valor: 'nombre', etiqueta: 'Nombre (A a Z)' },
  { valor: 'mas', etiqueta: 'Más existencias' },
  { valor: 'menos', etiqueta: 'Menos existencias' },
  { valor: 'tipo', etiqueta: 'Tipo' },
];

/** Para buscar sin importar mayúsculas ni acentos ("osmosis" encuentra "Ósmosis"). */
function sinAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function textoPensadoPara(corrige: string[]): string {
  const textos = PENSADO_PARA.filter((p) => p.claves.some((c) => corrige.includes(c))).map((p) => p.etiqueta);
  return textos.length > 0 ? textos.join(', ') : '—';
}

interface Errores {
  codigo?: string;
  nombre?: string;
  categoria?: string;
  pensado?: string;
  foto?: string;
  existencias?: string;
}

function FormularioProducto({
  token,
  existentes,
  alCrear,
  alNoAutorizado,
}: {
  token: string;
  existentes: ProductoComercio[];
  alCrear: (p: ProductoComercio) => void;
  alNoAutorizado: () => void;
}) {
  const servicios = useServicios();
  const { tiendas } = usePanel();
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [pensado, setPensado] = useState<string[]>([]);
  const [foto, setFoto] = useState('');
  const [existencias, setExistencias] = useState<Record<string, string>>({});
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function validar(): Errores {
    const e: Errores = {};
    const cod = codigo.trim().toUpperCase();
    if (!cod) e.codigo = 'Escribe el código del producto.';
    else if (existentes.some((p) => p.codigo.toUpperCase() === cod))
      e.codigo = 'Ese código ya está en el catálogo. Usa otro.';
    if (!nombre.trim()) e.nombre = 'Escribe el nombre del producto.';
    if (!categoria) e.categoria = 'Elige el tipo de producto.';
    if (pensado.length === 0) e.pensado = 'Marca al menos una cosa que corrige.';
    if (foto.trim() && !/^https?:\/\/\S+$/i.test(foto.trim())) e.foto = 'El enlace debe empezar por http:// o https://';
    const malas = tiendas.filter((t) => {
      const v = (existencias[t.id] ?? '').trim();
      return v !== '' && !/^\d+$/.test(v);
    });
    if (malas.length > 0) e.existencias = 'Las existencias son números enteros, de 0 en adelante.';
    return e;
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const e = validar();
    setErrores(e);
    setErrorGeneral(null);
    if (Object.keys(e).length > 0 || !servicios.crearProducto) return;
    setGuardando(true);
    try {
      const corrige = [...new Set(PENSADO_PARA.filter((p) => pensado.includes(p.id)).flatMap((p) => [...p.claves]))];
      const creado = await servicios.crearProducto(token, {
        codigo: codigo.trim().toUpperCase(),
        nombre: nombre.trim(),
        categoria,
        corrige,
        foto_url: foto.trim() || null,
        existencias: Object.fromEntries(tiendas.map((t) => [t.id, Number((existencias[t.id] ?? '').trim() || 0)])),
      });
      alCrear(creado);
      setCodigo('');
      setNombre('');
      setCategoria('');
      setPensado([]);
      setFoto('');
      setExistencias({});
    } catch (error) {
      if (esNoAutorizado(error)) {
        alNoAutorizado();
        return;
      }
      const estado = (error as { estado?: unknown }).estado;
      if (estado === 409) setErrores({ codigo: mensajeDe(error, 'Ese código ya está en el catálogo. Usa otro.') });
      else setErrorGeneral(mensajeDe(error, 'No se pudo guardar el producto. Intenta otra vez.'));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="op-formulario g-pila" onSubmit={enviar} noValidate aria-labelledby="titulo-agregar">
      <h2 className="g-h3" id="titulo-agregar" style={{ margin: 0 }}>
        Agregar un producto
      </h2>
      <Campo etiqueta="Código" value={codigo} onChange={(e) => setCodigo(e.target.value)} error={errores.codigo} autoComplete="off" />
      <Campo etiqueta="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} error={errores.nombre} />
      <Campo
        como="select"
        etiqueta="Tipo"
        marcador="Elige el tipo"
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
        opciones={CATEGORIAS_PRODUCTO.map((c) => ({ valor: c.valor, etiqueta: c.etiqueta }))}
        error={errores.categoria}
      />
      <fieldset className="g-grupo">
        <legend>Pensado para</legend>
        <div className="op-casillas">
          {PENSADO_PARA.map((p) => (
            <Casilla
              key={p.id}
              checked={pensado.includes(p.id)}
              onChange={(e) =>
                setPensado((actual) => (e.target.checked ? [...actual, p.id] : actual.filter((x) => x !== p.id)))
              }
            >
              {p.etiqueta}
            </Casilla>
          ))}
        </div>
        {errores.pensado && (
          <p className="g-campo__error" role="alert">
            {errores.pensado}
          </p>
        )}
      </fieldset>
      <Campo
        etiqueta="Enlace de la foto"
        opcional
        type="url"
        inputMode="url"
        value={foto}
        onChange={(e) => setFoto(e.target.value)}
        error={errores.foto}
        ayuda="Si no tienes foto, la tarjeta dice “Foto no disponible”."
      />
      <fieldset className="g-grupo">
        <legend>Existencias por tienda</legend>
        <div className="op-existencias">
          {tiendas.map((t) => (
            <Campo
              key={t.id}
              etiqueta={`Existencias en ${t.nombre}`}
              inputMode="numeric"
              value={existencias[t.id] ?? ''}
              placeholder="0"
              onChange={(e) => setExistencias((actual) => ({ ...actual, [t.id]: e.target.value }))}
            />
          ))}
        </div>
        {errores.existencias && (
          <p className="g-campo__error" role="alert">
            {errores.existencias}
          </p>
        )}
      </fieldset>
      {errorGeneral && (
        <Aviso tono="error" rol="alert">
          {errorGeneral}
        </Aviso>
      )}
      <Boton type="submit" cargando={guardando} anchoCompleto>
        Guardar producto
      </Boton>
    </form>
  );
}

/** Miniatura del producto en la tabla; si no hay foto o no carga, el ícono de cartucho. */
function FotoProducto({ url }: { url: string | null | undefined }) {
  const [fallo, setFallo] = useState(false);
  return (
    <span className="op-producto-foto">
      {url && !fallo ? (
        <img src={url} alt="" width={56} height={56} loading="lazy" referrerPolicy="no-referrer" onError={() => setFallo(true)} />
      ) : (
        <Icono nombre="cartucho" tamano={28} titulo="Foto no disponible" />
      )}
    </span>
  );
}

export function Productos({ token, version, alNoAutorizado }: Props) {
  const servicios = useServicios();
  const { tiendas } = usePanel();
  const { datos, estado, reintentar } = useDatos<ProductoComercio[]>(
    () => (servicios.productos ? servicios.productos(token) : Promise.resolve([])),
    version,
    alNoAutorizado,
  );
  const [agregados, setAgregados] = useState<ProductoComercio[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState('todos');
  const [existenciasFiltro, setExistenciasFiltro] = useState<'todas' | 'con' | 'sin'>('todas');
  const [orden, setOrden] = useState<Orden>('propios');

  const todos = [...agregados, ...(datos ?? []).filter((p) => !agregados.some((a) => a.codigo === p.codigo))];
  const cantidad = (p: ProductoComercio, tiendaId: string) =>
    p.existencias.find((e) => e.tienda_id === tiendaId)?.cantidad ?? 0;
  const total = (p: ProductoComercio) => tiendas.reduce((suma, t) => suma + cantidad(p, t.id), 0);
  const tiposPresentes = Array.from(new Set(todos.map((p) => p.categoria ?? ''))).filter(Boolean);

  const texto = sinAcentos(busqueda.trim());
  const lista = todos
    .filter((p) => !texto || sinAcentos(`${p.nombre} ${p.codigo} ${textoPensadoPara(p.corrige)}`).includes(texto))
    .filter((p) => tipo === 'todos' || (p.categoria ?? '') === tipo)
    .filter((p) => existenciasFiltro === 'todas' || (existenciasFiltro === 'con' ? total(p) > 0 : total(p) === 0))
    .sort((a, b) => {
      const porNombre = a.nombre.localeCompare(b.nombre, 'es');
      if (orden === 'nombre') return porNombre;
      if (orden === 'mas') return total(b) - total(a) || porNombre;
      if (orden === 'menos') return total(a) - total(b) || porNombre;
      if (orden === 'tipo') return nombreCategoria(a.categoria).localeCompare(nombreCategoria(b.categoria), 'es') || porNombre;
      return Number(b.propio) - Number(a.propio) || porNombre;
    });
  const hayFiltros = Boolean(texto) || tipo !== 'todos' || existenciasFiltro !== 'todas';

  return (
    <div className="g-pila g-pila--amplia">
      <div>
        <h1 className="g-h1">Productos</h1>
        <p>Tu catálogo con las existencias de cada tienda. Lo que cargues aquí entra en las recomendaciones de tus clientes.</p>
      </div>
      <div role="status" aria-live="polite">
        {aviso && <Aviso tono="ok">{aviso}</Aviso>}
      </div>
      <div className="op-productos">
        <div className="g-pila">
          {estado === 'cargando' && !datos && <Cargando variante="esqueleto" lineas={5} texto="Cargando productos…" />}
          {estado === 'error' && !datos && (
            <EstadoVacio
              tono="error"
              titulo="No se pudieron cargar los productos."
              accion={
                <Boton variante="secundario" onClick={reintentar}>
                  Reintentar
                </Boton>
              }
            />
          )}
          {todos.length > 0 && (
            <div className="op-productos-filtros" role="search" aria-label="Filtros de productos">
              <Campo
                etiqueta="Buscar"
                type="search"
                placeholder="Nombre, código o para qué sirve"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <Campo
                como="select"
                etiqueta="Filtrar por tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                opciones={[
                  { valor: 'todos', etiqueta: 'Todos los tipos' },
                  ...tiposPresentes.map((valor) => ({ valor, etiqueta: nombreCategoria(valor) })),
                ]}
              />
              <Campo
                como="select"
                etiqueta="Existencias"
                value={existenciasFiltro}
                onChange={(e) => setExistenciasFiltro(e.target.value as 'todas' | 'con' | 'sin')}
                opciones={[
                  { valor: 'todas', etiqueta: 'Todas' },
                  { valor: 'con', etiqueta: 'Con existencias' },
                  { valor: 'sin', etiqueta: 'Agotados' },
                ]}
              />
              <Campo
                como="select"
                etiqueta="Ordenar por"
                value={orden}
                onChange={(e) => setOrden(e.target.value as Orden)}
                opciones={ORDENES}
              />
            </div>
          )}
          {todos.length > 0 && (
            <p className="g-apagado" style={{ margin: 0 }} aria-live="polite">
              {lista.length === todos.length
                ? `${todos.length} productos`
                : `${lista.length} de ${todos.length} productos`}
            </p>
          )}
          {datos && todos.length === 0 && <EstadoVacio titulo="Todavía no hay productos en tu catálogo." />}
          {todos.length > 0 && lista.length === 0 && hayFiltros && (
            <EstadoVacio
              titulo="Ningún producto coincide con la búsqueda."
              accion={
                <Boton
                  variante="secundario"
                  onClick={() => {
                    setBusqueda('');
                    setTipo('todos');
                    setExistenciasFiltro('todas');
                  }}
                >
                  Quitar filtros
                </Boton>
              }
            />
          )}
          {lista.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table className="g-tabla" aria-label="Productos del comercio">
                <thead>
                  <tr>
                    <th scope="col">Producto</th>
                    <th scope="col">Tipo</th>
                    <th scope="col">Pensado para</th>
                    {tiendas.map((t) => (
                      <th key={t.id} scope="col" className="g-tabla__numero">
                        {t.nombre}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lista.map((p) => (
                    <tr key={p.codigo}>
                      <td>
                        <div className="op-producto-celda">
                          <FotoProducto url={p.foto_url} />
                          <div>
                            <strong>{p.nombre}</strong>
                            <br />
                            <span className="g-apagado">{p.codigo}</span>
                            {p.propio && (
                              <>
                                {' '}
                                <Insignia tono="azul">Cargado por ti</Insignia>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{nombreCategoria(p.categoria)}</td>
                      <td>{textoPensadoPara(p.corrige)}</td>
                      {tiendas.map((t) => (
                        <td key={t.id} className="g-tabla__numero">
                          {cantidad(p, t.id)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <FormularioProducto
          token={token}
          existentes={todos}
          alNoAutorizado={alNoAutorizado}
          alCrear={(p) => {
            setAgregados((actual) => [{ ...p, propio: true }, ...actual.filter((a) => a.codigo !== p.codigo)]);
            setAviso('Producto agregado. Ya entra en las recomendaciones.');
          }}
        />
      </div>
    </div>
  );
}
