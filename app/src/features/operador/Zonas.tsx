import { Aviso, Boton, Cargando, EstadoVacio } from '../../components/grimuca';
import { useServicios } from './contexto';
import { nombreTienda } from './estadoPedidos';
import { useDatos } from './useDatos';
import { nombreParametro, tiendaDeZona } from './datosZonas';

interface Props {
  token: string;
  version: number;
  alNoAutorizado: () => void;
}

export function Zonas({ token, version, alNoAutorizado }: Props) {
  const servicios = useServicios();
  const { datos, estado, reintentar } = useDatos(() => servicios.zonas(token), version, alNoAutorizado);
  const filas = [...(datos ?? [])].sort((a, b) => b.hogares_en_rojo_7_dias - a.hogares_en_rojo_7_dias);
  const alertas = filas.filter((z) => z.alerta);

  return (
    <div className="g-pila g-pila--amplia">
      <div>
        <h1 className="g-h1">Zonas</h1>
        <p>Dónde están saliendo mediciones en rojo.</p>
      </div>

      {estado === 'cargando' && !datos && <Cargando variante="esqueleto" lineas={4} texto="Cargando zonas…" />}
      {estado === 'error' && !datos && (
        <EstadoVacio
          tono="error"
          titulo="No se pudieron cargar las zonas."
          accion={
            <Boton variante="secundario" onClick={reintentar}>
              Reintentar
            </Boton>
          }
        />
      )}

      {datos && (
        <>
          {alertas.length === 0 ? (
            <Aviso tono="ok">Ninguna zona en alerta esta semana.</Aviso>
          ) : (
            alertas.map((z) => (
              <Aviso key={z.zona} tono="error" rol="alert" titulo={`Alerta en ${z.zona}: ${z.hogares_en_rojo_7_dias} hogares en rojo en los últimos 7 días.`}>
                <p>
                  Posible problema en la zona, conviene revisar.
                  {z.parametros.length > 0 && <> Lo que más se repite: {z.parametros.map(nombreParametro).join(', ')}.</>}
                </p>
                <p>Revisa el inventario de Grimuca {nombreTienda(tiendaDeZona(z.zona))}, que es la que atiende esa zona.</p>
                <Boton variante="secundario" a="/operador/inventario">
                  Ver inventario
                </Boton>
              </Aviso>
            ))
          )}

          {filas.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table className="g-tabla">
                <thead>
                  <tr>
                    <th scope="col">Zona</th>
                    <th scope="col" className="g-tabla__numero">En rojo (7 días)</th>
                    <th scope="col">Lo que más se repite</th>
                    <th scope="col">Tienda que la atiende</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((z) => (
                    <tr key={z.zona} style={z.alerta ? { color: 'var(--error)', fontWeight: 700 } : undefined}>
                      <td>{z.zona}</td>
                      <td className="g-tabla__numero">{z.hogares_en_rojo_7_dias}</td>
                      <td>{z.parametros.length > 0 ? z.parametros.map(nombreParametro).join(', ') : '—'}</td>
                      <td>{nombreTienda(tiendaDeZona(z.zona))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p style={{ color: 'var(--apagado)', fontSize: 'var(--t-1)' }}>
            Una zona entra en alerta con 3 o más hogares en rojo en 7 días. Es una señal para revisar, no un diagnóstico.
          </p>
        </>
      )}
    </div>
  );
}
