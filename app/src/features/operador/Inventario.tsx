import { useState } from 'react';
import { Boton, Cargando, Chip, EstadoVacio, Insignia } from '../../components/grimuca';
import { useServicios } from './contexto';
import { usePanel } from './panel';
import { useDatos } from './useDatos';

interface Props {
  token: string;
  version: number;
  alNoAutorizado: () => void;
}

export function Inventario({ token, version, alNoAutorizado }: Props) {
  const servicios = useServicios();
  const { tiendas } = usePanel();
  const { datos, estado, reintentar } = useDatos(() => servicios.inventario(token), version, alNoAutorizado);
  const [tienda, setTienda] = useState('todas');

  const filas = (datos ?? [])
    .filter((f) => tienda === 'todas' || f.tienda_id === tienda)
    .sort(
      (a, b) =>
        b.faltante - a.faltante ||
        a.tienda_nombre.localeCompare(b.tienda_nombre, 'es') ||
        a.cartucho_nombre.localeCompare(b.cartucho_nombre, 'es'),
    );

  const faltantesPorTienda = tiendas.map((t) => ({
    ...t,
    faltan: filas.filter((f) => f.tienda_id === t.id).reduce((n, f) => n + f.faltante, 0),
  })).filter((t) => t.faltan > 0);

  return (
    <div className="g-pila g-pila--amplia">
      <div>
        <h1 className="g-h1">Inventario</h1>
        <p>Lo que hay contra lo que se va a pedir en 30 días.</p>
      </div>
      <fieldset className="g-grupo">
        <legend>Tienda</legend>
        <div className="g-chips">
          <Chip activo={tienda === 'todas'} onClick={() => setTienda('todas')}>
            Todas las tiendas
          </Chip>
          {tiendas.map((t) => (
            <Chip key={t.id} activo={tienda === t.id} onClick={() => setTienda(t.id)}>
              {t.nombre}
            </Chip>
          ))}
        </div>
      </fieldset>

      {estado === 'cargando' && !datos && <Cargando variante="esqueleto" lineas={5} texto="Cargando inventario…" />}
      {estado === 'error' && !datos && (
        <EstadoVacio
          tono="error"
          titulo="No se pudo cargar el inventario."
          accion={
            <Boton variante="secundario" onClick={reintentar}>
              Reintentar
            </Boton>
          }
        />
      )}
      {datos && filas.length === 0 && <EstadoVacio titulo="No hay cartuchos cargados." />}
      {datos && filas.length > 0 && (
        <>
          {faltantesPorTienda.length === 0 ? (
            <p>Hay inventario para cubrir los próximos 30 días.</p>
          ) : (
            <ul className="inv-tarjetas" aria-label="Faltantes por tienda">
              {faltantesPorTienda.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className={tienda === t.id ? 'inv-tarjeta inv-tarjeta--activa' : 'inv-tarjeta'}
                    aria-pressed={tienda === t.id}
                    onClick={() => setTienda(t.id)}
                  >
                    <span className="inv-tarjeta__numero" aria-hidden="true">
                      {t.faltan}
                    </span>
                    <span>Faltan {t.faltan} cartuchos en {t.nombre} para cubrir los próximos 30 días.</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table className="g-tabla inv-tabla">
              <thead>
                <tr>
                  {tienda === 'todas' && <th scope="col">Tienda</th>}
                  <th scope="col">Cartucho</th>
                  <th scope="col" className="g-tabla__numero">Hay</th>
                  <th scope="col" className="g-tabla__numero">Se van a pedir (30 días)</th>
                  <th scope="col">Faltan</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => {
                  const falta = f.faltante > 0;
                  // Cobertura: qué parte de lo que se va a pedir en 30 días ya está en la tienda.
                  const cobertura = f.demanda_30_dias > 0 ? Math.min(1, f.stock / f.demanda_30_dias) : 1;
                  return (
                    <tr key={`${f.tienda_id}-${f.cartucho_codigo}`} className={falta ? 'inv-falta' : undefined}>
                      {tienda === 'todas' && <td>{f.tienda_nombre}</td>}
                      <td>{f.cartucho_nombre}</td>
                      <td className="g-tabla__numero">
                        {f.stock}
                        <span className="inv-cobertura" aria-hidden="true">
                          <span
                            className={falta ? 'inv-cobertura__barra inv-cobertura__barra--falta' : 'inv-cobertura__barra'}
                            style={{ width: `${Math.round(cobertura * 100)}%` }}
                          />
                        </span>
                      </td>
                      <td className="g-tabla__numero">{f.demanda_30_dias}</td>
                      <td>
                        {falta ? (
                          <Insignia tono="error">Faltan {f.faltante}</Insignia>
                        ) : (
                          <Insignia tono="ok">Alcanza</Insignia>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
