// "Registrar cambio de cartucho", "Crear recordatorio de cambio de cartucho" y
// "Recuérdame cuándo hacer mi próxima medición". Se usan en el tablero, en "Mi filtro" y en los tutoriales.
import { useEffect, useState, type FormEvent } from 'react';
import { Aviso, Boton, BotonRecordatorio, Campo, WhatsAppSimulado } from '../../components/grimuca';
import { api } from '../../lib/api';
import {
  diaDe,
  esDiaValido,
  eventoCambioCartucho,
  eventoProximaMedicion,
  fechaCorta,
  fechaEnPalabras,
  hoyLocal,
  mensajeCambioRegistrado,
  mensajeRecordatorioCambio,
  mensajeRecordatorioMedicion,
  remitenteTienda,
  sumarDias,
} from '../../lib/recordatorios';
import { hogarId } from '../../lib/sesion';
import type { CambiosHogar, Hogar } from '../../lib/tipos';

export const BOTON_REGISTRAR_CAMBIO = 'Registrar cambio de cartucho';
export const BOTON_RECORDATORIO_CAMBIO = 'Crear recordatorio de cambio de cartucho';
export const BOTON_RECORDATORIO_MEDICION = 'Recuérdame cuándo hacer mi próxima medición';
export const PEDIR_REGISTRAR_PRIMERO =
  'Para crear el recordatorio de cambio de cartucho, primero registra cuándo lo cambiaste.';

const MENSAJE_FALLA = 'Algo falló de nuestro lado. Intenta otra vez en un momento.';

function mensajeDe(error: unknown): string {
  if (error && typeof error === 'object' && 'mensaje' in error) {
    const mensaje = (error as { mensaje?: unknown }).mensaje;
    if (typeof mensaje === 'string' && mensaje) return mensaje;
  }
  return MENSAJE_FALLA;
}

type HogarParcial = Partial<Hogar> & Pick<Hogar, 'id'>;

/** WhatsApp simulado de la tienda (en la demo no se envía nada real: solo se muestra). */
export function MensajeTienda({ de, mensaje }: { de: string; mensaje: string }) {
  return <WhatsAppSimulado variante="tarjeta" de={de} mensaje={mensaje} />;
}

/** Línea "Tu próxima medición: …" y el botón "Recuérdame cuándo hacer mi próxima medición". */
export function RecordatorioMedicion({
  hogar,
  ultimaMedicion,
}: {
  hogar?: Pick<Partial<Hogar>, 'nombre' | 'tienda_id'> | null;
  /** Fecha de la última medición (ISO o AAAA-MM-DD); sin medición, hoy + 90 días. */
  ultimaMedicion?: string | null;
}) {
  const evento = eventoProximaMedicion(ultimaMedicion);
  return (
    <div className="g-pila" style={{ gap: 'var(--s2)' }}>
      <p style={{ margin: 0 }}>
        Tu próxima medición: <strong>{fechaEnPalabras(evento.fecha)}</strong>
      </p>
      <BotonRecordatorio
        texto={BOTON_RECORDATORIO_MEDICION}
        evento={evento}
        confirmacion={
          <MensajeTienda
            de={remitenteTienda(hogar?.tienda_id)}
            mensaje={mensajeRecordatorioMedicion(hogar?.nombre, evento.fecha)}
          />
        }
      />
    </div>
  );
}

/** "Crear recordatorio de cambio de cartucho" (o pide registrar el último cambio primero). */
export function RecordatorioCambio({ hogar, mostrarFecha = true }: { hogar: HogarParcial | null; mostrarFecha?: boolean }) {
  const evento = eventoCambioCartucho(hogar);
  if (!evento) {
    return (
      <p className="g-apagado" style={{ margin: 0 }}>
        {PEDIR_REGISTRAR_PRIMERO}
      </p>
    );
  }
  return (
    <div className="g-pila" style={{ gap: 'var(--s2)' }}>
      {mostrarFecha && (
        <p style={{ margin: 0 }}>
          Tu próximo cambio de cartucho: <strong>{fechaEnPalabras(evento.fecha)}</strong> (orientativo)
        </p>
      )}
      <BotonRecordatorio
        texto={BOTON_RECORDATORIO_CAMBIO}
        evento={evento}
        confirmacion={
          <MensajeTienda
            de={remitenteTienda(hogar?.tienda_id)}
            mensaje={mensajeRecordatorioCambio(hogar?.nombre, evento.fecha)}
          />
        }
      />
    </div>
  );
}

/** Cambios que manda "Registrar cambio de cartucho" para una fecha y un cartucho (opcional). */
export function cambiosDeRegistro(fecha: string, cartucho: string | null, hoy: string = hoyLocal()): CambiosHogar {
  const reciente = fecha >= sumarDias(hoy, -30);
  const antiguo = fecha < sumarDias(hoy, -90);
  const cambios: CambiosHogar = {
    tiene_filtro: true,
    fecha_ultimo_cambio: fecha,
    // Con fecha explícita la API la respeta; entre 1 y 3 meses no hay respuesta cerrada que calce.
    ultimo_cambio: reciente ? 'menos_de_un_mes' : antiguo ? 'mas_de_tres_meses' : null,
  };
  const texto = cartucho?.trim();
  if (texto) cambios.ultimo_cartucho = texto.slice(0, 120);
  return cambios;
}

const OTRO = '__otro__';

/** Botón "Registrar cambio de cartucho" → mini formulario (fecha y, opcional, cuál cartucho) → confirmación. */
export function RegistrarCambioCartucho({
  hogar,
  alGuardar,
}: {
  hogar: HogarParcial;
  alGuardar?: (hogar: Hogar) => void;
}) {
  const hoy = hoyLocal();
  const [abierto, setAbierto] = useState(false);
  const [fecha, setFecha] = useState(hoy);
  const [eleccion, setEleccion] = useState('');
  const [texto, setTexto] = useState('');
  const [compatibles, setCompatibles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState<{ fecha: string; hogar: HogarParcial } | null>(null);

  useEffect(() => {
    if (!abierto) return;
    let vigente = true;
    Promise.resolve()
      .then(() => api.filtroDeHogar(hogar.id))
      .then((respuesta) => {
        const nombres = (respuesta?.cartuchos ?? []).map((c) => c.nombre).filter(Boolean);
        if (vigente) setCompatibles([...new Set(nombres)]);
      })
      .catch(() => undefined);
    return () => {
      vigente = false;
    };
  }, [abierto, hogar.id]);

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    if (!esDiaValido(fecha)) return setError('Escribe la fecha en que cambiaste el cartucho.');
    if (fecha > hoy) return setError('La fecha no puede ser después de hoy.');
    setError(null);
    setGuardando(true);
    const cartucho = compatibles.length > 0 && eleccion !== OTRO ? eleccion : texto;
    try {
      const actualizado = await api.actualizarHogar(hogar.id, cambiosDeRegistro(fecha, cartucho || null, hoy));
      const nuevo: HogarParcial = { ...hogar, ...(actualizado ?? {}), fecha_ultimo_cambio: fecha, tiene_filtro: true };
      setGuardado({ fecha, hogar: nuevo });
      setAbierto(false);
      alGuardar?.(nuevo as Hogar);
    } catch (falla) {
      setError(mensajeDe(falla));
    } finally {
      setGuardando(false);
    }
  }

  if (guardado && !abierto) {
    return (
      <div className="g-pila" style={{ gap: 'var(--s3)' }}>
        <Aviso tono="ok" rol="status">
          Listo. Registramos el cambio del {fechaCorta(guardado.fecha)}.
        </Aviso>
        <MensajeTienda de={remitenteTienda(guardado.hogar.tienda_id)} mensaje={mensajeCambioRegistrado(guardado.fecha)} />
        <RecordatorioCambio hogar={guardado.hogar} />
      </div>
    );
  }

  if (!abierto) {
    return (
      <Boton variante="secundario" anchoCompleto onClick={() => setAbierto(true)}>
        {BOTON_REGISTRAR_CAMBIO}
      </Boton>
    );
  }

  const ultimo = hogar.fecha_ultimo_cambio ? diaDe(hogar.fecha_ultimo_cambio) : null;
  return (
    <form className="g-pila g-recordatorio__panel" onSubmit={(e) => void guardar(e)} noValidate aria-label={BOTON_REGISTRAR_CAMBIO}>
      <h3 className="g-h4" style={{ margin: 0 }}>
        {BOTON_REGISTRAR_CAMBIO}
      </h3>
      {ultimo && <p className="g-apagado" style={{ margin: 0 }}>El último que tenemos anotado: {fechaCorta(ultimo)}.</p>}
      <Campo
        etiqueta="¿Qué día lo cambiaste?"
        type="date"
        value={fecha}
        max={hoy}
        required
        onChange={(e) => setFecha(e.target.value)}
        error={error ?? undefined}
      />
      {compatibles.length > 0 ? (
        <>
          <Campo
            como="select"
            etiqueta="¿Cuál cartucho cambiaste?"
            opcional
            marcador="No lo sé o prefiero no decirlo"
            opciones={[
              ...compatibles.map((nombre) => ({ valor: nombre, etiqueta: nombre })),
              { valor: OTRO, etiqueta: 'Otro (lo escribo)' },
            ]}
            value={eleccion}
            onChange={(e) => setEleccion(e.target.value)}
          />
          {eleccion === OTRO && (
            <Campo
              etiqueta="Escribe cuál cartucho"
              value={texto}
              maxLength={120}
              onChange={(e) => setTexto(e.target.value)}
            />
          )}
        </>
      ) : (
        <Campo
          etiqueta="¿Cuál cartucho cambiaste?"
          opcional
          ayuda="Por ejemplo: sedimentos, carbón o el nombre que trae la caja."
          value={texto}
          maxLength={120}
          onChange={(e) => setTexto(e.target.value)}
        />
      )}
      <Boton variante="secundario" type="submit" anchoCompleto cargando={guardando} textoCargando="Guardando…">
        Guardar el cambio
      </Boton>
      <Boton variante="secundario" anchoCompleto onClick={() => setAbierto(false)} disabled={guardando}>
        Cancelar
      </Boton>
    </form>
  );
}

/**
 * Bloque "Tu cartucho": recordatorio del próximo cambio + "Registrar cambio de cartucho".
 * Sin `hogar`, lo carga con el de la sesión (así se usa en "Mi filtro").
 */
export function SeccionCartucho({ hogar: dado, alCambiar }: { hogar?: Hogar | null; alCambiar?: (hogar: Hogar) => void }) {
  const id = hogarId();
  const [cargado, setCargado] = useState<Hogar | null>(null);
  const [recienRegistrado, setRecienRegistrado] = useState(false);

  useEffect(() => {
    if (dado || !id) return;
    let vigente = true;
    Promise.resolve()
      .then(() => api.obtenerHogar(id))
      .then((datos) => {
        if (vigente && datos) setCargado(datos);
      })
      .catch(() => undefined);
    return () => {
      vigente = false;
    };
  }, [dado, id]);

  const hogar = dado ?? cargado;
  if (!hogar?.id) return null;

  return (
    <section className="g-pila" aria-labelledby="titulo-tu-cartucho" style={{ gap: 'var(--s3)' }}>
      <h2 className="g-h3" id="titulo-tu-cartucho">
        Tu cartucho
      </h2>
      {!recienRegistrado && <RecordatorioCambio hogar={hogar} />}
      <RegistrarCambioCartucho
        hogar={hogar}
        alGuardar={(nuevo) => {
          setRecienRegistrado(true);
          setCargado(nuevo);
          alCambiar?.(nuevo);
        }}
      />
    </section>
  );
}
