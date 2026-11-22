import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Aviso, Boton, Campo, Cargando, Insignia, TarjetaTienda } from '../../components/grimuca';
import { api } from '../../lib/api';
import { hogarId } from '../../lib/sesion';
import type { Hogar, Tienda } from '../../lib/tipos';
import {
  Atras,
  borrarBorrador,
  ErrorConReintento,
  guardarBorrador,
  leerBorrador,
  mensajeDeError,
  nombreConMarca,
  OpcionesRadio,
  PaginaAlta,
  tiendaSugerida,
  useCarga,
} from './comun';
import { IndicadorPasos } from './portada/IndicadorPasos';

/** La API guarda una sola dirección: el punto de referencia va al final con esta marca. */
const MARCA_REFERENCIA = '. Referencia: ';

/** "Calle 3, casa 12" + "frente a la panadería" → "Calle 3, casa 12. Referencia: frente a la panadería". */
export function unirDireccion(direccion: string, referencia: string): string {
  const base = direccion.trim().replace(/[.\s]+$/, '');
  const ref = referencia.trim();
  return ref ? `${base}${MARCA_REFERENCIA}${ref}` : direccion.trim();
}

/** Lo contrario de `unirDireccion`, para precargar los dos campos. */
export function partirDireccion(guardada: string | null | undefined): { direccion: string; referencia: string } {
  const texto = String(guardada ?? '');
  const corte = texto.lastIndexOf(MARCA_REFERENCIA);
  if (corte < 0) return { direccion: texto, referencia: '' };
  return { direccion: texto.slice(0, corte), referencia: texto.slice(corte + MARCA_REFERENCIA.length) };
}

function validarDireccion(texto: string): string | undefined {
  const limpio = texto.trim();
  if (!limpio) return 'Este dato hace falta.';
  if (limpio.length < 10) return 'Falta detalle en la dirección. Agrega calle y número de casa o edificio.';
  return undefined;
}

interface Borrador {
  direccion: string;
  referencia: string;
  tiendaId: string;
}

export function Envio() {
  const id = hogarId();
  const navegar = useNavigate();
  const claveBorrador = `agua.alta.envio.${id ?? ''}`;
  const carga = useCarga<{ hogar: Hogar; tiendas: Tienda[] }>(async () => {
    const hogar = await api.obtenerHogar(id as string);
    // Si fallan las tiendas, se sigue con la sugerida por zona (sin datos inventados).
    const tiendas = await api.tiendas().catch(() => [] as Tienda[]);
    return { hogar, tiendas };
  }, Boolean(id));

  const [direccion, setDireccion] = useState('');
  const [referencia, setReferencia] = useState('');
  const [tiendaId, setTiendaId] = useState('');
  const [cambiarTienda, setCambiarTienda] = useState(false);
  const [errorDireccion, setErrorDireccion] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const listo = useRef(false);

  useEffect(() => {
    if (!carga.datos) return;
    const { hogar } = carga.datos;
    const guardada = partirDireccion(hogar.direccion);
    // Lo que escribió y no guardó todavía gana sobre lo guardado.
    const borrador = leerBorrador<Borrador>(claveBorrador);
    setDireccion(borrador?.direccion ?? guardada.direccion);
    setReferencia(borrador?.referencia ?? guardada.referencia);
    setTiendaId(borrador?.tiendaId || hogar.tienda_id || tiendaSugerida(hogar.zona));
    listo.current = true;
  }, [carga.datos, claveBorrador]);

  useEffect(() => {
    if (!listo.current) return;
    guardarBorrador(claveBorrador, { direccion, referencia, tiendaId });
  }, [direccion, referencia, tiendaId, claveBorrador]);

  if (!id) return <Navigate to="/perfil" replace />;

  const cabecera = (
    <>
      <Atras a="/perfil" />
      <IndicadorPasos actual={2} total={3} nombre="a dónde va" />
      <h1 className="g-h1">¿A dónde te mandamos el sobre?</h1>
    </>
  );

  if (carga.cargando || (!carga.datos && !carga.error)) {
    return (
      <PaginaAlta>
        {cabecera}
        <Cargando variante="esqueleto" texto="Un momento…" />
      </PaginaAlta>
    );
  }

  if (carga.error || !carga.datos) {
    return (
      <PaginaAlta>
        {cabecera}
        <ErrorConReintento mensaje={carga.error ?? 'No se pudo cargar.'} onReintentar={carga.reintentar} />
      </PaginaAlta>
    );
  }

  const { hogar, tiendas } = carga.datos;
  const sugerida = tiendaSugerida(hogar.zona);
  const elegida = tiendas.find((t) => t.id === tiendaId);
  const masCercana = tiendas.find((t) => t.id === sugerida);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const error = validarDireccion(direccion);
    setErrorDireccion(error);
    if (error) {
      document.getElementById('envio-direccion')?.focus();
      return;
    }
    setEnviando(true);
    setErrorEnvio(null);
    try {
      await api.actualizarHogar(id as string, {
        direccion: unirDireccion(direccion, referencia),
        tienda_id: tiendaId || sugerida,
      });
      borrarBorrador(claveBorrador);
      navegar('/pago');
    } catch (e) {
      setErrorEnvio(mensajeDeError(e, 'No se pudo guardar. Intenta otra vez. Lo que escribiste no se pierde.'));
    } finally {
      setEnviando(false);
    }
  }

  let lineaTienda = 'Lo enviamos desde la tienda Grimuca más cercana a tu zona.';
  if (elegida && elegida.id === sugerida) {
    lineaTienda = `Lo enviamos desde ${nombreConMarca(elegida.nombre)}, la más cercana a tu zona; puedes cambiarla.`;
  } else if (elegida) {
    lineaTienda = `Lo enviamos desde ${nombreConMarca(elegida.nombre)}.${
      masCercana ? ` La más cercana a tu zona es ${nombreConMarca(masCercana.nombre)}.` : ''
    }`;
  }

  return (
    <PaginaAlta>
      {cabecera}
      <p>Escribe la dirección como se la dirías a un motorizado.</p>

      <form className="g-pila g-pila--amplia" noValidate onSubmit={enviar}>
        <section className="alta-bloque" aria-labelledby="bloque-direccion">
          <h2 className="alta-bloque__titulo" id="bloque-direccion">
            Dirección
          </h2>
          <Campo
            como="textarea"
            id="envio-direccion"
            etiqueta="Dirección de entrega"
            ayuda="Urbanización, calle, casa o edificio y apartamento. Ejemplo: Urb. El Retobo, calle 3, casa 12."
            name="direccion"
            autoComplete="street-address"
            rows={2}
            value={direccion}
            onChange={(e) => {
              setDireccion(e.target.value);
              setErrorDireccion(undefined);
            }}
            onBlur={() => {
              if (direccion.trim()) setErrorDireccion(validarDireccion(direccion));
            }}
            error={errorDireccion}
          />
          <Campo
            id="envio-referencia"
            etiqueta="Punto de referencia"
            opcional
            ayuda="Ejemplo: frente a la panadería, portón negro."
            name="referencia"
            autoComplete="off"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
          />
        </section>

        <section className="alta-bloque" aria-labelledby="bloque-tienda">
          <h2 className="alta-bloque__titulo" id="bloque-tienda">
            Tienda que lo envía
          </h2>
          <p style={{ margin: 0 }}>{lineaTienda}</p>
          {elegida && (
            <TarjetaTienda
              nombre={elegida.nombre}
              horario={elegida.horario ? `Horario: ${elegida.horario}` : undefined}
              direccion={elegida.direccion ?? undefined}
              seleccionada
              extra={elegida.id === sugerida ? <Insignia tono="azul">Más cercana</Insignia> : undefined}
            />
          )}

          {tiendas.length > 1 && (
            <div className="alta-tienda">
              <Boton
                variante="secundario"
                anchoCompleto
                aria-expanded={cambiarTienda}
                aria-controls="envio-tiendas"
                onClick={() => setCambiarTienda((v) => !v)}
              >
                {cambiarTienda ? 'Ocultar las tiendas' : 'Cambiar tienda'}
              </Boton>
              {cambiarTienda && (
                <div id="envio-tiendas">
                  <OpcionesRadio
                    pregunta="Tienda de donde sale tu sobre"
                    nombre="tienda_id"
                    opciones={tiendas.map((t) => ({
                      valor: t.id,
                      etiqueta: t.id === sugerida ? `${t.nombre} (más cercana)` : t.nombre,
                      ayuda: t.direccion ?? undefined,
                    }))}
                    valor={tiendaId}
                    onCambio={setTiendaId}
                  />
                </div>
              )}
            </div>
          )}
        </section>

        <div className="alta-cierre">
          {errorEnvio && (
            <Aviso tono="error" rol="alert">
              {errorEnvio}
            </Aviso>
          )}
          <Boton type="submit" anchoCompleto cargando={enviando} textoCargando="Guardando…">
            Continuar al pago
          </Boton>
        </div>
      </form>
    </PaginaAlta>
  );
}
