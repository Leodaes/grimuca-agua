// Módulo Red (/red): superadmin de Grimuca. Comercios de la red, cifras, cobertura, actividad en vivo y alta.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Aviso,
  BandaCifras,
  Boton,
  Campo,
  Cargando,
  Encabezado,
  EstadoVacio,
  Insignia,
  Pantalla,
} from '../../components/grimuca';
import { api } from '../../lib/api';
import { guardarTokenRed, tokenRed } from '../../lib/sesion';
import type { ComercioEnRed, Pedido, PlanComercio, ResumenRed } from '../../lib/tipos';
import { EntradaConPin, dondeFue, esNoAutorizado, fechaLarga, hora, mensajeDe, queLleva } from './comun';
import { escucharEventos } from './enVivo';
import './red.css';

export const ESTADOS_VENEZUELA = [
  'Amazonas',
  'Anzoátegui',
  'Apure',
  'Aragua',
  'Barinas',
  'Bolívar',
  'Carabobo',
  'Cojedes',
  'Delta Amacuro',
  'Distrito Capital',
  'Falcón',
  'Guárico',
  'La Guaira',
  'Lara',
  'Mérida',
  'Miranda',
  'Monagas',
  'Nueva Esparta',
  'Portuguesa',
  'Sucre',
  'Táchira',
  'Trujillo',
  'Yaracuy',
  'Zulia',
] as const;

const NOMBRE_PLAN: Record<PlanComercio, string> = { basico: 'Básico', premium: 'Premium' };
const REFRESCO_MS = 30_000;
const MAX_ACTIVIDAD = 8;

function ordenar(comercios: ComercioEnRed[]): ComercioEnRed[] {
  return [...comercios].sort(
    (a, b) =>
      Number(b.id === 'grimuca') - Number(a.id === 'grimuca') ||
      Date.parse(a.fecha_alta) - Date.parse(b.fecha_alta) ||
      a.nombre.localeCompare(b.nombre, 'es'),
  );
}

function Membresia({ c }: { c: ComercioEnRed }) {
  if (c.estado_membresia === 'periodo_gratis') {
    const n = c.dias_gratis_restantes ?? 0;
    return <Insignia tono="aviso">{`Periodo gratis: quedan ${n} ${n === 1 ? 'día' : 'días'}`}</Insignia>;
  }
  if (c.estado_membresia === 'activa') return <Insignia tono="ok">Activa</Insignia>;
  return <Insignia tono="error">Vencida</Insignia>;
}

function TablaComercios({ comercios, resaltado }: { comercios: ComercioEnRed[]; resaltado: string | null }) {
  return (
    <div className="red-tabla">
      <table className="g-tabla" aria-label="Comercios de la red">
        <thead>
          <tr>
            <th scope="col">Comercio</th>
            <th scope="col">Ubicación</th>
            <th scope="col">Plan</th>
            <th scope="col">Membresía</th>
            <th scope="col" className="g-tabla__numero">Tiendas</th>
            <th scope="col" className="g-tabla__numero">Hogares</th>
            <th scope="col" className="g-tabla__numero">Pedidos pendientes</th>
            <th scope="col" className="g-tabla__numero">Pedidos del mes</th>
            <th scope="col" className="g-tabla__numero">Productos propios</th>
            <th scope="col">Alta</th>
          </tr>
        </thead>
        <tbody>
          {comercios.map((c) => (
            <tr key={c.id} data-id={c.id} className={resaltado === c.id ? 'red-fila--nueva' : undefined}>
              <th scope="row" className="red-tabla__comercio">
                {c.nombre}
                {c.es_demostracion && (
                  <>
                    {' '}
                    <Insignia tono="neutro">Demostración</Insignia>
                  </>
                )}
              </th>
              <td>
                {c.ciudad}, {c.estado_pais}
              </td>
              <td>{NOMBRE_PLAN[c.plan] ?? c.plan}</td>
              <td>
                <Membresia c={c} />
              </td>
              <td className="g-tabla__numero">{c.tiendas}</td>
              <td className="g-tabla__numero">{c.hogares}</td>
              <td className="g-tabla__numero" data-campo="pendientes">{c.pedidos_pendientes}</td>
              <td className="g-tabla__numero" data-campo="pedidos_mes">{c.pedidos_mes}</td>
              <td className="g-tabla__numero">{c.productos_propios}</td>
              <td>{fechaLarga(c.fecha_alta)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cobertura({ comercios }: { comercios: ComercioEnRed[] }) {
  const porEstado = new Map<string, string[]>();
  for (const c of comercios) porEstado.set(c.estado_pais, [...(porEstado.get(c.estado_pais) ?? []), c.nombre]);
  return (
    <section className="red-bloque" aria-labelledby="titulo-cobertura">
      <h2 className="g-h3" id="titulo-cobertura">
        Cobertura por estado
      </h2>
      <ul className="red-cobertura">
        {[...porEstado.entries()].map(([estado, nombres]) => (
          <li key={estado}>
            <strong>{estado}:</strong> {nombres.join(', ')}
          </li>
        ))}
      </ul>
      <p className="g-apagado">Con una ferretería por estado, ese estado queda cubierto.</p>
    </section>
  );
}

interface LineaActividad {
  id: string;
  texto: string;
  hora: string;
}

function Actividad({ lineas }: { lineas: LineaActividad[] }) {
  return (
    <section className="red-bloque" aria-labelledby="titulo-actividad">
      <h2 className="g-h3" id="titulo-actividad">
        Actividad de la red
      </h2>
      {lineas.length === 0 ? (
        <p className="g-apagado">Los pedidos y servicios de toda la red aparecen aquí apenas entran.</p>
      ) : (
        <ol className="red-actividad" aria-label="Actividad de la red" aria-live="polite">
          {lineas.map((l) => (
            <li key={l.id}>
              <span className="red-actividad__hora">{l.hora}</span> {l.texto}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

interface ErroresAlta {
  nombre?: string;
  estado?: string;
  ciudad?: string;
  tienda?: string;
}

function FormularioAlta({
  token,
  alCrear,
  alNoAutorizado,
}: {
  token: string;
  alCrear: (c: ComercioEnRed) => void;
  alNoAutorizado: () => void;
}) {
  const [nombre, setNombre] = useState('');
  const [estado, setEstado] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [plan, setPlan] = useState<PlanComercio>('basico');
  const [meses, setMeses] = useState('3');
  const [tienda, setTienda] = useState('');
  const [direccion, setDireccion] = useState('');
  const [errores, setErrores] = useState<ErroresAlta>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const e: ErroresAlta = {};
    if (!nombre.trim()) e.nombre = 'Escribe el nombre del comercio.';
    if (!estado) e.estado = 'Elige el estado.';
    if (!ciudad.trim()) e.ciudad = 'Escribe la ciudad.';
    if (!tienda.trim()) e.tienda = 'Escribe el nombre de su primera tienda.';
    setErrores(e);
    setErrorGeneral(null);
    if (Object.keys(e).length > 0) return;
    setGuardando(true);
    try {
      const creado = await api.crearComercio(
        {
          nombre: nombre.trim(),
          estado_pais: estado,
          ciudad: ciudad.trim(),
          plan,
          meses_gratis: Number(meses),
          tienda_nombre: tienda.trim(),
          tienda_direccion: direccion.trim() || null,
        },
        token,
      );
      alCrear(creado);
      setNombre('');
      setEstado('');
      setCiudad('');
      setPlan('basico');
      setMeses('3');
      setTienda('');
      setDireccion('');
    } catch (error) {
      if (esNoAutorizado(error)) alNoAutorizado();
      else setErrorGeneral(mensajeDe(error, 'No se pudo dar de alta el comercio. Intenta otra vez.'));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="red-bloque g-pila" onSubmit={enviar} noValidate aria-labelledby="titulo-alta">
      <h2 className="g-h3" id="titulo-alta">
        Dar de alta un comercio
      </h2>
      <Campo etiqueta="Nombre del comercio" value={nombre} onChange={(e) => setNombre(e.target.value)} error={errores.nombre} />
      <div className="red-dos">
        <Campo
          como="select"
          etiqueta="Estado"
          marcador="Elige el estado"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          opciones={ESTADOS_VENEZUELA.map((n) => ({ valor: n, etiqueta: n }))}
          error={errores.estado}
        />
        <Campo etiqueta="Ciudad" value={ciudad} onChange={(e) => setCiudad(e.target.value)} error={errores.ciudad} />
      </div>
      <div className="red-dos">
        <Campo
          como="select"
          etiqueta="Plan"
          value={plan}
          onChange={(e) => setPlan(e.target.value as PlanComercio)}
          opciones={[
            { valor: 'basico', etiqueta: 'Básico' },
            { valor: 'premium', etiqueta: 'Premium' },
          ]}
        />
        <Campo
          como="select"
          etiqueta="Meses gratis"
          value={meses}
          onChange={(e) => setMeses(e.target.value)}
          opciones={['0', '1', '2', '3'].map((n) => ({ valor: n, etiqueta: n === '1' ? '1 mes' : `${n} meses` }))}
        />
      </div>
      <Campo
        etiqueta="Nombre de su primera tienda"
        value={tienda}
        onChange={(e) => setTienda(e.target.value)}
        error={errores.tienda}
      />
      <Campo
        etiqueta="Dirección de la tienda"
        opcional
        value={direccion}
        onChange={(e) => setDireccion(e.target.value)}
      />
      {errorGeneral && (
        <Aviso tono="error" rol="alert">
          {errorGeneral}
        </Aviso>
      )}
      <Boton type="submit" cargando={guardando} anchoCompleto>
        Dar de alta
      </Boton>
    </form>
  );
}

function coincide(c: ComercioEnRed, p: Pedido): boolean {
  const id = (p as Pedido & { comercio_id?: string }).comercio_id;
  if (id) return c.id === id;
  return Boolean(p.comercio_nombre) && c.nombre === p.comercio_nombre;
}

function RedConSesion({ token, alSalir }: { token: string; alSalir: () => void }) {
  const [resumen, setResumen] = useState<ResumenRed | null>(null);
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [actividad, setActividad] = useState<LineaActividad[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [resaltado, setResaltado] = useState<string | null>(null);
  const [enVivo, setEnVivo] = useState(false);
  const refSalir = useRef(alSalir);
  refSalir.current = alSalir;

  const cargar = useCallback(async () => {
    try {
      const datos = await api.redResumen(token);
      setResumen(datos);
      setEstado('listo');
    } catch (error) {
      if (esNoAutorizado(error)) refSalir.current();
      else setEstado((e) => (e === 'listo' ? e : 'error'));
    }
  }, [token]);

  useEffect(() => {
    void cargar();
    const intervalo = window.setInterval(() => void cargar(), REFRESCO_MS);
    let n = 0;
    const anotar = (texto: string) =>
      setActividad((a) => [{ id: `${Date.now()}-${n++}`, texto, hora: hora(new Date()) }, ...a].slice(0, MAX_ACTIVIDAD));
    const quitar = escucharEventos(token, {
      conexion: setEnVivo,
      pedidoNuevo: (p) => {
        anotar(`Pedido nuevo en ${dondeFue(p)} · ${queLleva(p)}`);
        setResumen((r) => {
          if (!r) return r;
          const comercios = r.comercios.map((c) =>
            coincide(c, p) ? { ...c, pedidos_pendientes: c.pedidos_pendientes + 1, pedidos_mes: c.pedidos_mes + 1 } : c,
          );
          return {
            comercios,
            totales: { ...r.totales, pedidos_mes: r.totales.pedidos_mes + 1, pedidos_pendientes: r.totales.pedidos_pendientes + 1 },
          };
        });
      },
      pedidoDespachado: (p) => {
        anotar(`${p.tipo === 'servicio' ? 'Servicio atendido' : 'Pedido despachado'} en ${dondeFue(p)} · ${queLleva(p)}`);
        setResumen((r) =>
          r
            ? {
                comercios: r.comercios.map((c) =>
                  coincide(c, p) ? { ...c, pedidos_pendientes: Math.max(0, c.pedidos_pendientes - 1) } : c,
                ),
                totales: { ...r.totales, pedidos_pendientes: Math.max(0, r.totales.pedidos_pendientes - 1) },
              }
            : r,
        );
      },
      medicionNueva: (d) => {
        anotar(`Medición nueva en ${d.zona}`);
        setResumen((r) => (r ? { ...r, totales: { ...r.totales, mediciones_mes: r.totales.mediciones_mes + 1 } } : r));
      },
    });
    return () => {
      window.clearInterval(intervalo);
      quitar();
    };
  }, [token, cargar]);

  const comercios = ordenar(resumen?.comercios ?? []);
  const t = resumen?.totales;

  return (
    <Pantalla
      ancho="operador"
      encabezado={
        <Encabezado
          variante="operador"
          rutaInicio="/red"
          titulo="Red de comercios"
          acciones={
            <>
              {enVivo ? (
                <Insignia tono="ok" punto>
                  En vivo
                </Insignia>
              ) : (
                <Insignia tono="aviso" punto>
                  Actualiza cada 30 s
                </Insignia>
              )}
              <Boton variante="sobreAzul" onClick={alSalir}>
                Salir
              </Boton>
            </>
          }
        />
      }
    >
      <div className="g-pila g-pila--amplia">
        <div>
          <p className="g-kicker">Red</p>
          <h1 className="g-h1">Comercios de la red Grimuca Agua</h1>
        </div>

        {estado === 'cargando' && !resumen && <Cargando variante="esqueleto" lineas={5} texto="Cargando la red…" />}
        {estado === 'error' && !resumen && (
          <EstadoVacio
            tono="error"
            titulo="No se pudo cargar la red."
            accion={
              <Boton variante="secundario" onClick={() => void cargar()}>
                Reintentar
              </Boton>
            }
          />
        )}

        {resumen && t && (
          <>
            <BandaCifras
              etiqueta="Cifras de la red"
              cifras={[
                { valor: t.comercios, etiqueta: 'Comercios en la red' },
                { valor: t.estados_cubiertos, etiqueta: 'Estados cubiertos' },
                { valor: t.tiendas, etiqueta: 'Tiendas' },
                { valor: t.hogares, etiqueta: 'Hogares' },
                { valor: t.mediciones_mes, etiqueta: 'Mediciones del mes' },
                { valor: t.pedidos_mes, etiqueta: 'Pedidos del mes' },
              ]}
            />

            <div role="status" aria-live="polite">
              {aviso && <Aviso tono="ok">{aviso}</Aviso>}
            </div>

            {comercios.length === 0 ? (
              <EstadoVacio titulo="Todavía no hay comercios en la red." />
            ) : (
              <TablaComercios comercios={comercios} resaltado={resaltado} />
            )}

            <div className="red-columnas">
              <Cobertura comercios={comercios} />
              <Actividad lineas={actividad} />
              <FormularioAlta
                token={token}
                alNoAutorizado={alSalir}
                alCrear={(c) => {
                  setResumen((r) => {
                    if (!r) return r;
                    const lista = [...r.comercios.filter((x) => x.id !== c.id), c];
                    return {
                      comercios: lista,
                      totales: {
                        ...r.totales,
                        comercios: lista.length,
                        estados_cubiertos: new Set(lista.map((x) => x.estado_pais)).size,
                        tiendas: r.totales.tiendas + c.tiendas,
                      },
                    };
                  });
                  setResaltado(c.id);
                  setAviso(
                    c.fin_periodo_gratis
                      ? `Comercio dado de alta. Periodo gratis hasta el ${fechaLarga(c.fin_periodo_gratis)}.`
                      : 'Comercio dado de alta. Sin periodo gratis.',
                  );
                }}
              />
            </div>
          </>
        )}

        <p className="g-apagado red-pie">Membresía y cobros: fuera de esta demostración.</p>
      </div>
    </Pantalla>
  );
}

export function PaginaRed() {
  const [token, setToken] = useState<string | null>(() => tokenRed());

  if (!token) {
    return (
      <EntradaConPin
        modulo="Red"
        titulo="Red Grimuca Agua"
        texto="Entra con el PIN de administración."
        rutaInicio="/red"
        ancho="operador"
        entrar={async (pin) => {
          const { token: nuevo } = await api.redEntrar(pin);
          guardarTokenRed(nuevo);
          setToken(nuevo);
        }}
      />
    );
  }

  return (
    <RedConSesion
      token={token}
      alSalir={() => {
        guardarTokenRed(null);
        setToken(null);
      }}
    />
  );
}
