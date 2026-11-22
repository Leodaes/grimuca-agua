// Módulo Técnico (/tecnico): pensado para teléfono. Servicios asignados, "Ya fui" y foto de cómo quedó.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import {
  Aviso,
  Boton,
  Campo,
  Cargando,
  Chip,
  Encabezado,
  EstadoVacio,
  Insignia,
  Pantalla,
  Toast,
} from '../../components/grimuca';
import { api } from '../../lib/api';
import { guardarTokenTecnico, tokenTecnico } from '../../lib/sesion';
import type { Pedido, ServicioConReporte } from '../../lib/tipos';
import { reducirImagen } from '../medicion/reducirImagen';
import { EntradaConPin, esNoAutorizado, fechaLarga, hora, mensajeDe } from '../red/comun';
import { escucharEventos } from '../red/enVivo';
import { nombreServicio, textoFechaPreferida } from '../tutoriales/contenido';
import { CentrosDeLlenado } from './CentrosTecnico';
import './tecnico.css';

const REFRESCO_MS = 30_000;

function crearUrl(archivo: Blob): string | null {
  try {
    return typeof URL.createObjectURL === 'function' ? URL.createObjectURL(archivo) : null;
  } catch {
    return null;
  }
}

function soltarUrl(url: string | null) {
  if (url && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(url);
}

function Datos({ s }: { s: ServicioConReporte }) {
  const cuando = textoFechaPreferida(s.fecha_preferida, s.momento);
  return (
    <dl className="tec-datos">
      <dt>Hogar</dt>
      <dd>{s.hogar_nombre ?? 'Hogar'}</dd>
      <dt>Dónde</dt>
      <dd>{[s.zona, s.direccion].filter(Boolean).join(' · ') || '—'}</dd>
      {cuando && (
        <>
          <dt>Cuándo</dt>
          <dd>{cuando}</dd>
        </>
      )}
      {s.nota?.trim() && (
        <>
          <dt>Nota del cliente</dt>
          <dd>{s.nota}</dd>
        </>
      )}
      <dt>Coordina</dt>
      <dd>{s.tienda_nombre ?? s.tienda_id}</dd>
    </dl>
  );
}

function Cierre({
  s,
  token,
  alGuardar,
  alCancelar,
  alNoAutorizado,
}: {
  s: ServicioConReporte;
  token: string;
  alGuardar: (hecho: ServicioConReporte, vistaPrevia: string | null) => void;
  alCancelar: () => void;
  alNoAutorizado: () => void;
}) {
  const [foto, setFoto] = useState<File | null>(null);
  const [vista, setVista] = useState<string | null>(null);
  const [preparando, setPreparando] = useState(false);
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refVista = useRef<string | null>(null);
  const entregada = useRef(false);

  useEffect(
    () => () => {
      if (!entregada.current) soltarUrl(refVista.current);
    },
    [],
  );

  async function elegir(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;
    setPreparando(true);
    setError(null);
    const reducida = await reducirImagen(archivo);
    const final = reducida === archivo ? archivo : new File([reducida], 'servicio.jpg', { type: reducida.type });
    soltarUrl(refVista.current);
    const url = crearUrl(final);
    refVista.current = url;
    setVista(url);
    setFoto(final);
    setPreparando(false);
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      const hecho = await api.atenderServicio(s.id, { foto, nota: nota.trim() || null }, token);
      entregada.current = true;
      alGuardar(hecho, refVista.current);
    } catch (e) {
      if (esNoAutorizado(e)) alNoAutorizado();
      else setError(mensajeDe(e, 'No se pudo guardar el reporte. Intenta otra vez.'));
      setGuardando(false);
    }
  }

  const idFoto = `foto-servicio-${s.id}`;
  return (
    <form className="tec-cierre g-pila" onSubmit={guardar} noValidate aria-label={`Cierre del servicio de ${s.hogar_nombre ?? 'el hogar'}`}>
      <label htmlFor={idFoto} className="tec-foto">
        <span className="tec-foto__texto">{foto ? 'Cambiar la foto' : 'Sube una foto de cómo quedó'}</span>
        <input
          id={idFoto}
          className="g-solo-lector"
          type="file"
          accept="image/*"
          capture="environment"
          aria-label="Sube una foto de cómo quedó"
          onChange={(e) => void elegir(e)}
        />
      </label>
      {preparando && <Cargando texto="Preparando la foto…" />}
      {vista && <img className="tec-vista" src={vista} alt="Vista previa de la foto del trabajo" />}
      {foto && !vista && <p className="g-apagado">Foto lista para subir.</p>}
      {!foto && !preparando && (
        <Aviso tono="atencion">Sin foto no queda evidencia del trabajo.</Aviso>
      )}
      <Campo
        como="textarea"
        etiqueta="Nota"
        opcional
        rows={3}
        placeholder="Cambié el cartucho de sedimentos…"
        value={nota}
        onChange={(e) => setNota(e.target.value)}
      />
      {error && (
        <Aviso tono="error" rol="alert">
          {error}
        </Aviso>
      )}
      <Boton type="submit" cargando={guardando} disabled={preparando} anchoCompleto>
        Guardar reporte
      </Boton>
      <Boton variante="secundario" onClick={alCancelar} anchoCompleto>
        Cancelar
      </Boton>
    </form>
  );
}

function TarjetaPendiente({
  s,
  abierto,
  children,
  alAbrir,
}: {
  s: ServicioConReporte;
  abierto: boolean;
  children: ReactNode;
  alAbrir: () => void;
}) {
  return (
    <li className="tec-tarjeta">
      <div className="tec-tarjeta__cabecera">
        <Insignia tono="azul">Pendiente</Insignia>
        {typeof s.orden_ruta === 'number' && <Insignia tono="oscuro">Parada {s.orden_ruta}</Insignia>}
        <span className="g-apagado">N.º {s.id}</span>
      </div>
      <h2 className="g-h3 tec-tarjeta__titulo">{nombreServicio(s.servicio)}</h2>
      <Datos s={s} />
      {s.destino_ruta && (
        <a
          className="tec-llegar"
          href={`https://www.google.com/maps/dir/?api=1&destination=${s.destino_ruta.lat},${s.destino_ruta.lng}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Cómo llegar<span className="g-solo-lector"> (abre otra pestaña)</span>
        </a>
      )}
      {abierto ? (
        children
      ) : (
        <Boton variante="secundario" anchoCompleto className="tec-ya-fui" aria-label={`Ya fui: ${s.hogar_nombre ?? `servicio N.º ${s.id}`}`} onClick={alAbrir}>
          Ya fui
        </Boton>
      )}
    </li>
  );
}

function TarjetaAtendida({ s, miniatura }: { s: ServicioConReporte; miniatura: string | null }) {
  const r = s.reporte;
  return (
    <li className="tec-tarjeta tec-tarjeta--atendida">
      <div className="tec-tarjeta__cabecera">
        <Insignia tono="ok">Atendido</Insignia>
        <span className="g-apagado">
          {r?.fecha_visita ? `${fechaLarga(r.fecha_visita)}, ${hora(r.fecha_visita)}` : `N.º ${s.id}`}
        </span>
      </div>
      <div className="tec-atendida">
        {miniatura ? (
          <img className="tec-miniatura" src={miniatura} alt={`Foto de cómo quedó en ${s.hogar_nombre ?? 'el hogar'}`} />
        ) : (
          <span className="tec-miniatura tec-miniatura--vacia">Sin foto</span>
        )}
        <div>
          <h2 className="g-h3 tec-tarjeta__titulo">{nombreServicio(s.servicio)}</h2>
          <p style={{ margin: 0 }}>
            {s.hogar_nombre ?? 'Hogar'}
            {s.zona ? ` · ${s.zona}` : ''}
          </p>
          {r?.nota && <p className="g-apagado" style={{ margin: 0 }}>{r.nota}</p>}
        </div>
      </div>
    </li>
  );
}

function aServicio(p: Pedido): ServicioConReporte {
  return { ...p, reporte: null };
}

function TecnicoConSesion({ token, alSalir }: { token: string; alSalir: () => void }) {
  const [servicios, setServicios] = useState<ServicioConReporte[] | null>(null);
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [vista, setVista] = useState<'pendientes' | 'atendidos' | 'centros'>('pendientes');
  const [abierto, setAbierto] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [miniaturas, setMiniaturas] = useState<Record<number, string>>({});
  const refSalir = useRef(alSalir);
  refSalir.current = alSalir;

  // Solo se aplica la respuesta del pedido más reciente (el refresco y un evento pueden cruzarse).
  const ultimaCarga = useRef(0);

  /** Pide la lista a la API (ya viene ordenada por ruta, con `orden_ruta` y `destino_ruta`). Devuelve si se pudo. */
  const cargar = useCallback(async (): Promise<boolean> => {
    const numero = ++ultimaCarga.current;
    try {
      const lista = await api.tecnicoServicios('todos', token);
      if (numero !== ultimaCarga.current) return true;
      setServicios(lista.filter((s) => s.tipo === 'servicio'));
      setEstado('listo');
      return true;
    } catch (error) {
      if (esNoAutorizado(error)) refSalir.current();
      else if (numero === ultimaCarga.current) setEstado((e) => (e === 'listo' ? e : 'error'));
      return false;
    }
  }, [token]);

  useEffect(() => {
    void cargar();
    const intervalo = window.setInterval(() => void cargar(), REFRESCO_MS);
    const quitar = escucharEventos(token, {
      pedidoNuevo: (p) => {
        if (p.tipo !== 'servicio') return;
        setToast('Servicio nuevo');
        // Se vuelve a pedir la lista para que el servicio nuevo llegue con su parada y "Cómo llegar".
        // Si la API no responde, se agrega tal cual para no perderlo hasta el próximo refresco.
        void cargar().then((ok) => {
          if (!ok) setServicios((lista) => (lista && !lista.some((s) => s.id === p.id) ? [aServicio(p), ...lista] : lista));
        });
      },
      pedidoDespachado: (p) => {
        if (p.tipo === 'servicio') void cargar();
      },
    });
    return () => {
      window.clearInterval(intervalo);
      quitar();
    };
  }, [token, cargar]);

  const nombreComercio = servicios?.find((s) => s.comercio_nombre)?.comercio_nombre;
  const pendientes = (servicios ?? [])
    .filter((s) => s.estado === 'pendiente')
    // En el orden de la ruta (Parada 1, 2…); los que no tienen parada, al final por fecha preferida.
    .sort(
      (a, b) =>
        (a.orden_ruta ?? Infinity) - (b.orden_ruta ?? Infinity) ||
        (a.fecha_preferida ?? '').localeCompare(b.fecha_preferida ?? '') ||
        a.id - b.id,
    );
  const atendidos = (servicios ?? [])
    // Solo los que cerró el técnico con su reporte; los que la tienda cerró desde Despacho no son de él.
    .filter((s) => s.estado !== 'pendiente' && s.reporte !== null)
    .sort((a, b) => Date.parse(b.reporte?.fecha_visita ?? b.fecha_despacho ?? b.fecha) - Date.parse(a.reporte?.fecha_visita ?? a.fecha_despacho ?? a.fecha));

  const miniaturaDe = (s: ServicioConReporte) =>
    miniaturas[s.id] ?? (s.reporte?.tiene_foto ? api.urlFotoServicio(s.id, token) : null);

  return (
    <Pantalla
      conBarra={false}
      encabezado={
        <Encabezado
          rutaInicio="/tecnico"
          titulo="Técnico"
          acciones={
            <Boton variante="sobreAzul" onClick={alSalir}>
              Salir
            </Boton>
          }
        />
      }
    >
      <div className="g-pila">
        <div>
          <h1 className="g-h1">Servicios asignados</h1>
          {nombreComercio && <p className="g-apagado" style={{ margin: 0 }}>Servicio técnico de {nombreComercio}</p>}
        </div>

        <div className="g-chips" role="group" aria-label="Qué servicios ver">
          <Chip activo={vista === 'pendientes'} onClick={() => setVista('pendientes')}>
            Pendientes ({pendientes.length})
          </Chip>
          <Chip activo={vista === 'atendidos'} onClick={() => setVista('atendidos')}>
            Atendidos ({atendidos.length})
          </Chip>
          <Chip activo={vista === 'centros'} onClick={() => setVista('centros')}>
            Centros de llenado
          </Chip>
        </div>

        {vista === 'centros' && <CentrosDeLlenado token={token} alNoAutorizado={alSalir} />}

        {vista !== 'centros' && estado === 'cargando' && !servicios && (
          <Cargando variante="esqueleto" lineas={4} texto="Cargando servicios…" />
        )}
        {vista !== 'centros' && estado === 'error' && !servicios && (
          <EstadoVacio
            tono="error"
            titulo="No se pudieron cargar los servicios."
            accion={
              <Boton variante="secundario" onClick={() => void cargar()}>
                Reintentar
              </Boton>
            }
          />
        )}

        {servicios && vista === 'pendientes' &&
          (pendientes.length === 0 ? (
            <EstadoVacio titulo="No tienes servicios pendientes.">Cuando la tienda te asigne uno, aparece aquí.</EstadoVacio>
          ) : (
            <ul className="tec-lista" aria-label="Servicios pendientes">
              {pendientes.map((s) => (
                <TarjetaPendiente key={s.id} s={s} abierto={abierto === s.id} alAbrir={() => setAbierto(s.id)}>
                  <Cierre
                    s={s}
                    token={token}
                    alNoAutorizado={alSalir}
                    alCancelar={() => setAbierto(null)}
                    alGuardar={(hecho, vistaPrevia) => {
                      setServicios((lista) =>
                        (lista ?? []).map((x) =>
                          x.id === s.id
                            ? {
                                ...x,
                                ...hecho,
                                estado: 'despachado',
                                reporte: hecho.reporte ?? { fecha_visita: new Date().toISOString(), nota: null, tiene_foto: Boolean(vistaPrevia) },
                              }
                            : x,
                        ),
                      );
                      if (vistaPrevia) setMiniaturas((m) => ({ ...m, [s.id]: vistaPrevia }));
                      setAbierto(null);
                      setVista('atendidos');
                      setToast('Reporte guardado');
                    }}
                  />
                </TarjetaPendiente>
              ))}
            </ul>
          ))}

        {servicios && vista === 'atendidos' &&
          (atendidos.length === 0 ? (
            <EstadoVacio titulo="Todavía no has cerrado servicios." />
          ) : (
            <ul className="tec-lista" aria-label="Servicios atendidos">
              {atendidos.map((s) => (
                <TarjetaAtendida key={s.id} s={s} miniatura={miniaturaDe(s)} />
              ))}
            </ul>
          ))}
      </div>
      <Toast visible={toast !== null} mensaje={toast ?? ''} alCerrar={() => setToast(null)} />
    </Pantalla>
  );
}

export function PaginaTecnico() {
  const [token, setToken] = useState<string | null>(() => tokenTecnico());

  if (!token) {
    return (
      <EntradaConPin
        modulo="Técnico"
        titulo="Servicio técnico"
        texto="Entra con tu PIN de técnico."
        rutaInicio="/tecnico"
        ancho="cliente"
        entrar={async (pin) => {
          const { token: nuevo } = await api.tecnicoEntrar(pin);
          guardarTokenTecnico(nuevo);
          setToken(nuevo);
        }}
      />
    );
  }

  return (
    <TecnicoConSesion
      token={token}
      alSalir={() => {
        guardarTokenTecnico(null);
        setToken(null);
      }}
    />
  );
}
