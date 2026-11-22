import { BandaCifras, Boton, Cargando, EstadoVacio, TarjetaTienda } from '../../components/grimuca';
import type { ResumenTienda } from '../../lib/tipos';
import { useServicios } from './contexto';
import { usePanel } from './panel';
import { useDatos } from './useDatos';

interface Props {
  token: string;
  version: number;
  alNoAutorizado: () => void;
}

function suma(filas: ResumenTienda[], campo: keyof Omit<ResumenTienda, 'tienda_id' | 'nombre'>): number {
  return filas.reduce((total, f) => total + (Number(f[campo]) || 0), 0);
}

export function Resumen({ token, version, alNoAutorizado }: Props) {
  const servicios = useServicios();
  const { base, tiendas } = usePanel();
  const { datos, estado, reintentar } = useDatos(() => servicios.resumen(token), version, alNoAutorizado);

  return (
    <div className="g-pila g-pila--amplia">
      <div className="op-cabecera">
        <div className="op-cabecera__texto">
          <h1 className="g-h1">Resumen por tienda</h1>
          <p>Cómo va cada tienda hoy.</p>
        </div>
      </div>
      {estado === 'cargando' && !datos && <Cargando variante="esqueleto" lineas={4} texto="Cargando resumen…" />}
      {estado === 'error' && !datos && (
        <EstadoVacio
          tono="error"
          titulo="No se pudo cargar el resumen."
          accion={
            <Boton variante="secundario" onClick={reintentar}>
              Reintentar
            </Boton>
          }
        />
      )}
      {datos && (
        <>
          <BandaCifras
            etiqueta={tiendas.length === 1 ? 'Totales de la tienda' : `Totales de las ${tiendas.length} tiendas`}
            cifras={[
              { valor: suma(datos, 'hogares'), etiqueta: 'Hogares' },
              { valor: suma(datos, 'pedidos_pendientes'), etiqueta: 'Pedidos pendientes' },
              { valor: suma(datos, 'recambios_7_dias'), etiqueta: 'Recambios en 7 días' },
              { valor: suma(datos, 'recambios_30_dias'), etiqueta: 'Recambios en 30 días' },
            ]}
          />
          <div className="g-rejilla-tiendas">
            {tiendas.map((t) => {
              const f = datos.find((d) => d.tienda_id === t.id);
              return (
                <TarjetaTienda
                  key={t.id}
                  nombre={f?.nombre ?? t.nombre}
                  cifras={[
                    { etiqueta: 'Hogares', valor: f?.hogares ?? 0 },
                    { etiqueta: 'Pedidos pendientes', valor: f?.pedidos_pendientes ?? 0 },
                    { etiqueta: 'Sobres por enviar', valor: f?.sobres_pendientes ?? 0 },
                    { etiqueta: 'Recambios en 7 días', valor: f?.recambios_7_dias ?? 0 },
                    { etiqueta: 'Recambios en 30 días', valor: f?.recambios_30_dias ?? 0 },
                  ]}
                  acciones={
                    <Boton variante="secundario" a={`${base}/despacho?tienda=${t.id}`}>
                      Ver despacho de {t.nombre}
                    </Boton>
                  }
                >
                  {(f?.hogares ?? 0) === 0 && (
                    <p style={{ color: 'var(--apagado)' }}>Todavía no hay hogares registrados en {t.nombre}.</p>
                  )}
                </TarjetaTienda>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
