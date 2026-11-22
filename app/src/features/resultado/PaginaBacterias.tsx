import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { hogarId } from '../../lib/sesion';
import type { Cartucho, PruebaBacterias } from '../../lib/tipos';
import { Aviso, AvisoTira, Boton, Cargando, EstadoVacio } from '../../components/grimuca';
import {
  BACTERIAS_ANTES,
  BACTERIAS_CAMBIO,
  BACTERIAS_SIN_CAMBIO,
  BACTERIAS_TITULO,
  enlaceCotizar,
  formatearFecha,
  mensajeError,
} from './textos';

/** LITERAL (aprobado por legal). */
const TEXTO_UV =
  'Opción para consultar en tienda: lámpara UV, pensada para reducir bacterias según el fabricante. No significa que el agua quede apta para tomar. Sigue hirviendo el agua y confirma con un laboratorio.';

const HORAS_48 = 48 * 60 * 60 * 1000;

type Prueba = PruebaBacterias & { sugeridos?: Cartucho[] };

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'sin_hogar' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'listo'; prueba: Prueba | null };

function esNoEncontrado(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { estado?: unknown; status?: unknown; codigo?: unknown };
  return e.estado === 404 || e.status === 404 || e.codigo === 404;
}

export function PaginaBacterias() {
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const hogar = hogarId();

  useEffect(() => {
    if (!hogar) {
      setEstado({ tipo: 'sin_hogar' });
      return;
    }
    let vigente = true;
    setEstado({ tipo: 'cargando' });
    Promise.resolve(api.bacterias(hogar))
      .then((prueba) => vigente && setEstado({ tipo: 'listo', prueba: (prueba as Prueba | null) ?? null }))
      .catch((error: unknown) => {
        if (!vigente) return;
        if (esNoEncontrado(error)) setEstado({ tipo: 'listo', prueba: null });
        else setEstado({ tipo: 'error', mensaje: mensajeError(error) });
      });
    return () => {
      vigente = false;
    };
  }, [hogar, intento]);

  async function ejecutar(accion: () => Promise<unknown>) {
    setEnviando(true);
    setFalla(null);
    try {
      const prueba = (await accion()) as Prueba;
      setEstado({ tipo: 'listo', prueba });
    } catch (error) {
      setFalla(mensajeError(error));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main id="contenido" className="g-pantalla__contenido g-pila" tabIndex={-1}>
      <h1 className="g-h1">{BACTERIAS_TITULO}</h1>

      {estado.tipo === 'cargando' && <Cargando texto="Un momento…" />}
      {estado.tipo === 'sin_hogar' && (
        <EstadoVacio titulo="Primero cuéntanos de tu casa" accion={<Boton a="/perfil">Llenar mi perfil</Boton>}>
          Es un minuto.
        </EstadoVacio>
      )}
      {estado.tipo === 'error' && (
        <EstadoVacio
          tono="error"
          titulo="No pudimos cargar tu prueba"
          accion={
            <Boton variante="secundario" onClick={() => setIntento((n) => n + 1)}>
              Intentar otra vez
            </Boton>
          }
        >
          {estado.mensaje}
        </EstadoVacio>
      )}

      {estado.tipo === 'listo' && hogar && estado.prueba === null && (
        <>
          <p>Llena el frasco, tápalo y déjalo quieto 48 horas. Después vuelve y cuéntanos cómo quedó.</p>
          <p className="g-apagado">Déjalo quieto, tapado y lejos del sol.</p>
          <Boton anchoCompleto cargando={enviando} onClick={() => ejecutar(() => api.iniciarBacterias(hogar))}>
            Ya llené el frasco
          </Boton>
        </>
      )}

      {estado.tipo === 'listo' && hogar && estado.prueba?.resultado === 'pendiente' && (
        <Pendiente
          prueba={estado.prueba}
          enviando={enviando}
          alReportar={(resultado) => ejecutar(() => api.reportarBacterias(hogar, resultado))}
        />
      )}

      {estado.tipo === 'listo' && estado.prueba && estado.prueba.resultado !== 'pendiente' && (
        <Reportada prueba={estado.prueba} />
      )}

      {falla && (
        <Aviso tono="error" rol="alert">
          {falla}
        </Aviso>
      )}

      <Link className="g-enlace" to="/resultados" style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>
        Ver mis resultados
      </Link>
    </main>
  );
}

function Pendiente({
  prueba,
  enviando,
  alReportar,
}: {
  prueba: Prueba;
  enviando: boolean;
  alReportar: (resultado: 'cambio' | 'sin_cambio') => void;
}) {
  const cumple = new Date(new Date(prueba.fecha_inicio).getTime() + HORAS_48);
  const yaPasaron = Date.now() >= cumple.getTime();

  return (
    <>
      <Aviso titulo={yaPasaron ? 'Ya pasaron 48 horas. Mira el frasco.' : 'Todavía no se cumplen las 48 horas'}>
        Llenaste el frasco el {formatearFecha(prueba.fecha_inicio, true)}. Las 48 horas se cumplen el{' '}
        {formatearFecha(cumple.toISOString(), true)}.
      </Aviso>
      <p>{BACTERIAS_ANTES}</p>
      <h2 className="g-h3">¿Cómo está el frasco?</h2>
      <div className="g-pila">
        <Boton variante="secundario" anchoCompleto disabled={enviando} onClick={() => alReportar('cambio')}>
          Cambió de color
        </Boton>
        <Boton variante="secundario" anchoCompleto disabled={enviando} onClick={() => alReportar('sin_cambio')}>
          Sigue igual
        </Boton>
      </div>
    </>
  );
}

function Reportada({ prueba }: { prueba: Prueba }) {
  const cambio = prueba.resultado === 'cambio';
  const sugeridos = prueba.sugeridos ?? [];

  return (
    <>
      <section aria-labelledby="titulo-bacterias-resultado" className="g-pila">
        <h2 className="g-h3" id="titulo-bacterias-resultado">
          {cambio ? 'El frasco cambió de color' : 'El frasco sigue igual'}
        </h2>
        {/* "Sigue igual" va en azul neutro (tono info), nunca verde. */}
        <Aviso tono={cambio ? 'atencion' : 'info'} rol="status">
          {cambio ? BACTERIAS_CAMBIO : BACTERIAS_SIN_CAMBIO}
        </Aviso>
        {prueba.fecha_reporte && (
          <p className="g-apagado">Prueba reportada el {formatearFecha(prueba.fecha_reporte)}. Gracias.</p>
        )}
      </section>

      <AvisoTira />

      {sugeridos.length > 0 && (
        <section className="g-tarjeta-producto" aria-label="Opción para consultar en tienda" style={{ display: 'block' }}>
          <div className="g-tarjeta-producto__cuerpo g-pila">
            <p>{TEXTO_UV}</p>
            <ul className="g-pila">
              {sugeridos.map((cartucho) => {
                const cotizar = enlaceCotizar(cartucho.nombre);
                return (
                  <li key={cartucho.codigo}>
                    <p className="g-tarjeta-producto__nombre">{cartucho.nombre}</p>
                    <p className="g-tarjeta-producto__codigo">
                      {[cartucho.marca, cartucho.codigo].filter(Boolean).join(' · ')}
                    </p>
                    {cotizar.interno ? (
                      <Link className="g-enlace" to={cotizar.destino}>
                        Cotizar por WhatsApp
                      </Link>
                    ) : (
                      <a className="g-enlace" href={cotizar.destino} target="_blank" rel="noopener noreferrer">
                        Cotizar por WhatsApp
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
