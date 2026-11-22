import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { agregarALista, hogarId, lista } from '../../lib/sesion';
import type { Cartucho, Medicion, Nivel, ResultadoParametro } from '../../lib/tipos';
import {
  Aviso,
  AvisoTira,
  Boton,
  Cargando,
  EstadoVacio,
  Icono,
  Insignia,
  ListaParametros,
  Semaforo,
} from '../../components/grimuca';
import {
  PALABRA_NIVEL,
  RESUMEN_NIVEL,
  SUGERIDO_EJEMPLO,
  enlaceCotizar,
  formatearFecha,
  mensajeError,
  traducirCorrige,
} from './textos';

const ORDEN_NIVEL: Record<Nivel, number> = { rojo: 0, amarillo: 1, verde: 2, sin_dato: 3 };

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'sin_mediciones' }
  | { tipo: 'listo'; medicion: Medicion };

async function cargarMedicion(id: string): Promise<Medicion | null> {
  if (id !== 'ultimo') return api.medicion(id);
  const hogar = hogarId();
  if (!hogar) return null;
  const mediciones = await api.medicionesDeHogar(hogar);
  return mediciones[0] ?? null;
}

export function PaginaResultado() {
  const { id = 'ultimo' } = useParams();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setEstado({ tipo: 'cargando' });
    cargarMedicion(id)
      .then((medicion) => {
        if (!vigente) return;
        setEstado(medicion ? { tipo: 'listo', medicion } : { tipo: 'sin_mediciones' });
      })
      .catch((error: unknown) => {
        if (vigente) setEstado({ tipo: 'error', mensaje: mensajeError(error) });
      });
    return () => {
      vigente = false;
    };
  }, [id, intento]);

  return (
    <main id="contenido" className="g-pantalla__contenido g-pila" tabIndex={-1}>
      {estado.tipo === 'cargando' && (
        <>
          <h1 className="g-h1">Tu resultado</h1>
          <Cargando texto="Un momento…" variante="esqueleto" lineas={5} />
        </>
      )}
      {estado.tipo === 'error' && (
        <>
          <h1 className="g-h1">Tu resultado</h1>
          <EstadoVacio
            tono="error"
            titulo="No pudimos cargar tu resultado"
            accion={
              <Boton variante="secundario" onClick={() => setIntento((n) => n + 1)}>
                Intentar otra vez
              </Boton>
            }
          >
            {estado.mensaje}
          </EstadoVacio>
        </>
      )}
      {estado.tipo === 'sin_mediciones' && (
        <>
          <h1 className="g-h1">Tu resultado</h1>
          <EstadoVacio
            titulo="Todavía no has medido tu agua"
            accion={<Boton a="/medir">Medir mi agua</Boton>}
          >
            Cuando lo hagas, aquí queda guardado.
          </EstadoVacio>
        </>
      )}
      {estado.tipo === 'listo' && <Resultado medicion={estado.medicion} />}
    </main>
  );
}

function Resultado({ medicion }: { medicion: Medicion }) {
  const { evaluacion, sugeridos } = medicion;
  const resumen = RESUMEN_NIVEL[evaluacion.semaforo];
  const parametros = [...evaluacion.porParametro].sort(
    (a, b) => ORDEN_NIVEL[a.nivel] - ORDEN_NIVEL[b.nivel],
  );

  return (
    <>
      <div className="g-pila">
        <p className="g-apagado">
          Medición del {formatearFecha(medicion.fecha)} ·{' '}
          {medicion.origen === 'foto' ? 'con foto' : 'anotada a mano'}
        </p>
        <Semaforo nivel={evaluacion.semaforo} palabra={PALABRA_NIVEL[evaluacion.semaforo]} tamano="grande" />
        <h1 className="g-h1">{resumen.titulo}</h1>
        <p>{resumen.frase}</p>
      </div>

      <AvisoTira />

      <section className="g-pila" aria-labelledby="titulo-casillas">
        <h2 className="g-h3" id="titulo-casillas">
          Tu agua, casilla por casilla
        </h2>
        <ListaParametros>
          {parametros.map((parametro) => (
            <FilaResultado key={parametro.clave} parametro={parametro} />
          ))}
        </ListaParametros>
      </section>

      {evaluacion.hallazgos.length > 0 && (
        <section className="g-pila" aria-labelledby="titulo-hallazgos">
          <h2 className="g-h3" id="titulo-hallazgos">
            Qué encontramos
          </h2>
          <ul className="g-pila" style={{ paddingLeft: '1.25rem', listStyle: 'disc' }}>
            {evaluacion.hallazgos.map((hallazgo) => (
              <li key={hallazgo}>{hallazgo}</li>
            ))}
          </ul>
        </section>
      )}

      {evaluacion.diasParaRecambio !== null && (
        <Aviso titulo="Tu cartucho">
          {evaluacion.diasParaRecambio <= 0
            ? 'Ya te toca cambiar el cartucho.'
            : `Te toca cambiar el cartucho en unos ${evaluacion.diasParaRecambio} días.`}
        </Aviso>
      )}

      <Sugeridos sugeridos={sugeridos} />

      <nav className="g-pila" aria-label="Qué hacer ahora">
        <Link className="g-enlace" to="/bacterias" style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>
          Reportar mi prueba de bacterias
        </Link>
        <Boton variante="secundario" a="/medir" anchoCompleto>
          Medir otra vez
        </Boton>
      </nav>
    </>
  );
}

function FilaResultado({ parametro }: { parametro: ResultadoParametro }) {
  const hayValor = parametro.valor !== null && parametro.valor !== undefined;
  return (
    <li className="g-fila-parametro">
      <div>
        <p className="g-fila-parametro__nombre">
          {parametro.nombre}{' '}
          {parametro.orientativo && <Insignia tono="aviso">Orientativo</Insignia>}
        </p>
        <p className="g-fila-parametro__valor">
          {hayValor ? `${parametro.valor}${parametro.unidad ? ` ${parametro.unidad}` : ''}` : 'No se pudo leer'}
        </p>
      </div>
      <Semaforo nivel={parametro.nivel} palabra={PALABRA_NIVEL[parametro.nivel]} />
      {parametro.frase && <p className="g-fila-parametro__frase">{parametro.frase}</p>}
      {parametro.orientativo && (
        <p className="g-fila-parametro__nota">Una tira casera orienta, no confirma.</p>
      )}
    </li>
  );
}

function Sugeridos({ sugeridos }: { sugeridos: Cartucho[] }) {
  const [enLista, setEnLista] = useState<Set<string>>(() => {
    try {
      return new Set(lista().map((articulo) => articulo.codigo));
    } catch {
      return new Set();
    }
  });
  const [agregado, setAgregado] = useState<string | null>(null);

  function agregar(cartucho: Cartucho) {
    agregarALista({ codigo: cartucho.codigo, nombre: cartucho.nombre, cantidad: 1 });
    setEnLista((previo) => new Set(previo).add(cartucho.codigo));
    setAgregado(cartucho.nombre);
  }

  if (sugeridos.length === 0) {
    return (
      <section className="g-pila" aria-labelledby="titulo-sugeridos">
        <h2 className="g-h3" id="titulo-sugeridos">
          Productos sugeridos
        </h2>
        <p>Con esta medición no tenemos un cartucho que recomendarte.</p>
        <Link className="g-enlace" to="/tiendas">
          ¿Dudas? Pasa por la tienda y lo vemos contigo.
        </Link>
      </section>
    );
  }

  const hayEjemplo = sugeridos.some((cartucho) => cartucho.es_ejemplo);

  return (
    <section className="g-pila" aria-labelledby="titulo-sugeridos">
      <h2 className="g-h3" id="titulo-sugeridos">
        Productos sugeridos
      </h2>
      <p className="g-apagado">
        {hayEjemplo ? SUGERIDO_EJEMPLO : 'Sugerido según tu resultado y lo que nos contaste de tu casa.'}
      </p>
      {sugeridos.slice(0, 3).map((cartucho, indice) => {
        const yaEsta = enLista.has(cartucho.codigo);
        const cotizar = enlaceCotizar(cartucho.nombre);
        const lineaCodigo = [cartucho.marca, cartucho.codigo].filter(Boolean).join(' · ');
        return (
          <article className="g-tarjeta-producto" key={cartucho.codigo}>
            <div className="g-tarjeta-producto__foto">
              {cartucho.foto_url ? (
                <img src={cartucho.foto_url} alt="" loading="lazy" />
              ) : (
                <Icono nombre="cartucho" tamano={40} titulo="Foto no disponible" />
              )}
            </div>
            <div className="g-tarjeta-producto__cuerpo">
              <h3 className="g-tarjeta-producto__nombre">{cartucho.nombre}</h3>
              {lineaCodigo && <p className="g-tarjeta-producto__codigo">{lineaCodigo}</p>}
              {cartucho.corrige.length > 0 && (
                <p className="g-tarjeta-producto__motivo">
                  Pensado para: {traducirCorrige(cartucho.corrige)}.
                </p>
              )}
              {cotizar.interno ? (
                <Link className="g-enlace" to={cotizar.destino}>
                  Cotizar por WhatsApp
                </Link>
              ) : (
                <a className="g-enlace" href={cotizar.destino} target="_blank" rel="noopener noreferrer">
                  Cotizar por WhatsApp
                </a>
              )}
              {cartucho.es_ejemplo && (
                <div className="g-tarjeta-producto__etiquetas">
                  <Insignia tono="aviso">Ejemplo</Insignia>
                </div>
              )}
            </div>
            <div className="g-tarjeta-producto__acciones">
              <Boton
                variante={indice === 0 && !yaEsta ? 'primario' : 'secundario'}
                anchoCompleto
                disabled={yaEsta}
                icono={<Icono nombre={yaEsta ? 'check' : 'mas'} tamano={20} />}
                onClick={() => agregar(cartucho)}
              >
                {yaEsta ? 'Agregado' : 'Agregar a mi lista'}
              </Boton>
            </div>
          </article>
        );
      })}
      {agregado && (
        <Aviso tono="ok" rol="status">
          {agregado} quedó en tu lista.{' '}
          <Link className="g-enlace" to="/lista">
            Ver mi lista
          </Link>
        </Aviso>
      )}
    </section>
  );
}
