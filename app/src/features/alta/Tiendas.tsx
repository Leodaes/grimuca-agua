import { Cargando, TarjetaTienda } from '../../components/grimuca';
import { api } from '../../lib/api';
import { hogarId } from '../../lib/sesion';
import { WHATSAPP_TIENDA, WHATSAPP_TIENDA_VISIBLE } from '../resultado/textos';
import { ErrorConReintento, PaginaAlta, useCarga } from './comun';

export function Tiendas() {
  const carga = useCarga(() => api.tiendas());
  const conHogar = Boolean(hogarId());

  return (
    <PaginaAlta ancho>
      <h1 className="g-h1">Nuestras tiendas</h1>
      <p>Retira tus cartuchos o pregunta lo que necesites en la tienda que te quede más cerca.</p>
      <p>
        WhatsApp de las tiendas:{' '}
        <a
          className="g-enlace"
          href={`https://wa.me/${WHATSAPP_TIENDA}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {WHATSAPP_TIENDA_VISIBLE}
        </a>
      </p>
      {carga.cargando && <Cargando variante="esqueleto" texto="Un momento…" lineas={6} />}
      {carga.error && <ErrorConReintento mensaje={carga.error} onReintentar={carga.reintentar} />}
      {carga.datos && (
        <div className="g-rejilla alta-tiendas">
          {carga.datos.map((t) => (
        <TarjetaTienda
          key={t.id}
          nombre={t.nombre}
          horario={t.horario ? `Horario: ${t.horario}` : undefined}
          direccion={t.direccion ?? undefined}
        />
          ))}
        </div>
      )}
      {!conHogar && carga.datos && (
        <p className="g-apagado">¿Quieres medir tu agua? Empieza desde el inicio.</p>
      )}
    </PaginaAlta>
  );
}
