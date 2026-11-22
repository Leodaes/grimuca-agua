import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Aviso, Boton, Campo, Cargando, EstadoVacio } from '../../components/grimuca';
import { api } from '../../lib/api';
import { hogarId } from '../../lib/sesion';
import { tiendaSugerida, type MomentoDia, type Pedido, type ServicioTecnico, type Tienda } from '../../lib/tipos';
import { OpcionesRadio } from '../alta/comun';
import { mensajeError } from '../resultado/textos';
import { NOMBRE_MOMENTO, OPCIONES_SERVICIO, TEXTO_PRECIOS_SERVICIO } from './contenido';

const TIENDA_POR_DEFECTO = 'manongo';

/** Fecha local de mañana como AAAA-MM-DD. */
export function manana(desde = new Date()): string {
  const fecha = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + 1);
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

function servicioDeLaRuta(valor: string | null): ServicioTecnico {
  return valor === 'instalacion' || valor === 'instalacion_filtro' ? 'instalacion_filtro' : 'cambio_cartucho';
}

type Errores = Partial<Record<'fecha' | 'direccion' | 'envio', string>>;

/** /experto: pedir que un técnico de la tienda haga el cambio o la instalación. */
export function PaginaExperto() {
  const idHogar = hogarId();
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const [servicio, setServicio] = useState<ServicioTecnico>(() => servicioDeLaRuta(parametros.get('servicio')));
  const [fecha, setFecha] = useState(() => manana());
  const [momento, setMomento] = useState<MomentoDia>('manana');
  const [direccion, setDireccion] = useState('');
  const [tiendaId, setTiendaId] = useState(TIENDA_POR_DEFECTO);
  const [nota, setNota] = useState('');
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [nombreTienda, setNombreTienda] = useState<string | null>(null);
  const [cargando, setCargando] = useState(Boolean(idHogar));
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Errores>({});
  const minimo = manana();

  useEffect(() => {
    if (!idHogar) return;
    let vigente = true;
    const conRespaldo = <T,>(pedir: () => Promise<T>, siFalla: T) =>
      Promise.resolve()
        .then(pedir)
        .catch(() => siFalla);
    Promise.all([
      conRespaldo(() => api.obtenerHogar(idHogar), null),
      conRespaldo(() => api.tiendas(), [] as Tienda[]),
      conRespaldo(() => api.pedidosDeHogar(idHogar), [] as Pedido[]),
    ])
      .then(([hogar, lista, pedidos]) => {
        if (!vigente) return;
        setTiendas(Array.isArray(lista) ? lista : []);
        // Dirección: la guardada en el hogar; si no hay, la del último pedido con envío (la de "Mi lista").
        // Sin ninguna, el campo queda vacío y es obligatorio.
        const ultimoEnvio = (Array.isArray(pedidos) ? pedidos : []).find((p) => p.modalidad === 'envio' && p.direccion);
        const guardada = hogar?.direccion?.trim() || ultimoEnvio?.direccion?.trim() || '';
        if (guardada) setDireccion(guardada);
        // Tienda: la del hogar; si no tiene, la del último pedido o la sugerida por su zona.
        const tienda = hogar?.tienda_id ?? ultimoEnvio?.tienda_id ?? (hogar?.zona ? tiendaSugerida(hogar.zona) : null);
        if (tienda) setTiendaId(tienda);
        if (ultimoEnvio?.tienda_id === tienda && ultimoEnvio?.tienda_nombre) setNombreTienda(ultimoEnvio.tienda_nombre);
      })
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [idHogar]);

  if (!idHogar) {
    return (
      <main id="contenido" className="g-pantalla__contenido g-pila" tabIndex={-1}>
        <h1 className="g-h1">Un experto lo hace por ti</h1>
        <EstadoVacio
          titulo="Primero cuéntanos de tu casa"
          accion={<Boton a="/perfil?ya=1">Llenar mis datos</Boton>}
        >
          Así sabemos a dónde ir y qué tienda te queda más cerca.
        </EstadoVacio>
      </main>
    );
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const nuevos: Errores = {};
    if (!fecha || fecha < minimo) nuevos.fecha = 'Elige una fecha a partir de mañana.';
    if (!direccion.trim()) nuevos.direccion = 'Escribe la dirección donde vamos a hacer el servicio.';
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0 || !idHogar) return;

    setEnviando(true);
    try {
      const pedido = await api.crearPedido({
        hogar_id: idHogar,
        tipo: 'servicio',
        servicio,
        fecha_preferida: fecha,
        momento,
        nota: nota.trim() || null,
        cartucho_codigo: null,
        modalidad: 'envio',
        direccion: direccion.trim(),
        tienda_id: tiendaId,
      });
      navegar(`/pedido/${pedido.id}`);
    } catch (error) {
      setErrores({ envio: mensajeError(error) });
      setEnviando(false);
    }
  }

  // La tienda del hogar siempre está entre las opciones (aunque no sea de la lista de Grimuca).
  const opcionesTienda = tiendas.some((t) => t.id === tiendaId)
    ? tiendas.map((t) => ({ valor: t.id, etiqueta: `Grimuca ${t.nombre}` }))
    : [
        { valor: tiendaId, etiqueta: nombreTienda ?? (tiendas.length > 0 ? 'Tu tienda' : 'Grimuca (la de tu zona)') },
        ...tiendas.map((t) => ({ valor: t.id, etiqueta: `Grimuca ${t.nombre}` })),
      ];

  return (
    <main id="contenido" className="g-pantalla__contenido g-pila" tabIndex={-1}>
      <h1 className="g-h1">Un experto lo hace por ti</h1>
      <p>Un técnico de la tienda va a tu casa y deja el filtro listo.</p>

      {cargando ? (
        <Cargando variante="esqueleto" texto="Un momento…" lineas={5} />
      ) : (
        <form className="g-pila" onSubmit={(e) => void enviar(e)} noValidate>
          <OpcionesRadio
            pregunta="¿Qué necesitas?"
            nombre="servicio"
            opciones={OPCIONES_SERVICIO.map((o) => ({ valor: o.valor, etiqueta: o.etiqueta, ayuda: o.precio }))}
            valor={servicio}
            onCambio={(valor) => setServicio(valor as ServicioTecnico)}
          />
          <Campo
            etiqueta="Fecha preferida"
            type="date"
            min={minimo}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            error={errores.fecha}
            required
          />
          <OpcionesRadio
            pregunta="¿En qué momento del día?"
            nombre="momento"
            opciones={[
              { valor: 'manana', etiqueta: NOMBRE_MOMENTO.manana },
              { valor: 'tarde', etiqueta: NOMBRE_MOMENTO.tarde },
            ]}
            valor={momento}
            onCambio={(valor) => setMomento(valor as MomentoDia)}
          />
          <Campo
            etiqueta="Dirección"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            error={errores.direccion}
            autoComplete="street-address"
            required
          />
          <Campo
            como="select"
            etiqueta="Tienda que coordina"
            value={tiendaId}
            onChange={(e) => setTiendaId(e.target.value)}
            opciones={opcionesTienda}
          />
          <Campo
            como="textarea"
            etiqueta="Nota para el técnico"
            opcional
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            maxLength={300}
            rows={3}
          />

          <Aviso>{TEXTO_PRECIOS_SERVICIO}</Aviso>
          {errores.envio && (
            <Aviso tono="error" rol="alert">
              {errores.envio}
            </Aviso>
          )}
          <Boton type="submit" anchoCompleto cargando={enviando} textoCargando="Enviando…">
            Pedir el servicio
          </Boton>
        </form>
      )}
    </main>
  );
}
