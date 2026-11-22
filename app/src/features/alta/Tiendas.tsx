import { Cargando, TarjetaTienda } from '../../components/grimuca';
import { api } from '../../lib/api';
import { hogarId } from '../../lib/sesion';
import { ErrorConReintento, PaginaAlta, useCarga } from './comun';

export function Tiendas() {
  const carga = useCarga(() => api.tiendas());
  const conHogar = Boolean(hogarId());

  return (
    <PaginaAlta>
      <h1 className="g-h1">Nuestras tiendas</h1>
      <p>Retira tus cartuchos o pregunta lo que necesites en la tienda que te quede más cerca.</p>
      {carga.cargando && <Cargando variante="esqueleto" texto="Un momento…" lineas={6} />}
      {carga.error && <ErrorConReintento mensaje={carga.error} onReintentar={carga.reintentar} />}
      {carga.datos?.map((t) => (
        <TarjetaTienda
          key={t.id}
          nombre={t.nombre}
          horario={t.horario ? `Horario: ${t.horario}` : undefined}
          direccion={t.direccion ?? undefined}
        />
      ))}
      {!conHogar && carga.datos && (
        <p className="g-apagado">¿Quieres medir tu agua? Empieza desde el inicio.</p>
      )}
    </PaginaAlta>
  );
}
