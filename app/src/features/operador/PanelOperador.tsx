import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Boton, Campo, Cargando, Chip, Encabezado, EstadoVacio, Insignia, Pantalla, Toast } from '../../components/grimuca';
import type { Yo } from '../../lib/tipos';
import { esNoAutorizado, mensajeDe, useServicios } from './contexto';
import { Despacho } from './Despacho';
import { TIENDAS_OPERADOR, nombreTienda } from './estadoPedidos';
import { Inventario } from './Inventario';
import { ContextoPanel, NOMBRE_PLAN } from './panel';
import type { DatosPanel } from './panel';
import { Productos } from './Productos';
import { Resumen } from './Resumen';
import { usePedidosEnVivo } from './usePedidosEnVivo';
import { Zonas } from './Zonas';
import './comercio.css';

function EntradaPin({ base, alEntrar }: { base: string; alEntrar: (token: string) => void }) {
  const servicios = useServicios();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!pin.trim()) {
      setError('Escribe el PIN.');
      return;
    }
    setEnviando(true);
    setError(undefined);
    try {
      alEntrar(await servicios.entrar(pin.trim()));
    } catch (e) {
      setError(
        esNoAutorizado(e)
          ? 'PIN incorrecto. Prueba otra vez.'
          : mensajeDe(e, 'No se pudo entrar. Revisa la conexión e intenta otra vez.'),
      );
      setEnviando(false);
    }
  }

  return (
    <Pantalla ancho="operador" encabezado={<Encabezado variante="operador" rutaInicio={base} titulo="Comercio" />}>
      <form onSubmit={enviar} className="g-pila" style={{ maxWidth: 360, margin: '48px auto', width: '100%' }} noValidate>
        <h1 className="g-h1">Panel del comercio</h1>
        <p>Entra con el PIN de tu ferretería.</p>
        <Campo
          etiqueta="PIN"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          pattern="[0-9]*"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          error={error}
          autoFocus
        />
        <Boton type="submit" cargando={enviando} anchoCompleto>
          Entrar
        </Boton>
      </form>
    </Pantalla>
  );
}

/** Ficha del comercio (`yo`). Sin la función en los servicios, vale Grimuca con sus tres tiendas. */
function useYo(token: string, alNoAutorizado: () => void) {
  const servicios = useServicios();
  const [yo, setYo] = useState<Yo | null>(null);
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>(servicios.yo ? 'cargando' : 'listo');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!servicios.yo) return;
    let activo = true;
    setEstado('cargando');
    servicios.yo(token).then(
      (datos) => {
        if (!activo) return;
        setYo(datos);
        setEstado('listo');
      },
      (error) => {
        if (!activo) return;
        if (esNoAutorizado(error)) alNoAutorizado();
        else setEstado('error');
      },
    );
    return () => {
      activo = false;
    };
    // alNoAutorizado cambia en cada render; basta con el token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicios, token, intento]);

  return { yo, estado, reintentar: () => setIntento((n) => n + 1) };
}

function PanelConSesion({ base, token, alSalir }: { base: string; token: string; alSalir: () => void }) {
  const envivo = usePedidosEnVivo(token, alSalir);
  const { yo, estado: estadoYo, reintentar } = useYo(token, alSalir);
  const ubicacion = useLocation();
  const navegar = useNavigate();
  const enDespacho = new RegExp(`^${base}/?(despacho)?/?$`).test(ubicacion.pathname);
  const [toast, setToast] = useState<string | null>(null);

  const panel = useMemo<DatosPanel>(
    () => ({
      base,
      token,
      comercio: yo?.comercio ?? null,
      tiendas: yo ? yo.tiendas.map((t) => ({ id: t.id, nombre: t.nombre })) : TIENDAS_OPERADOR,
    }),
    [base, token, yo],
  );

  useEffect(() => {
    const p = envivo.ultimoNuevo;
    if (!p || enDespacho) return;
    const tienda = p.tienda_nombre ?? panel.tiendas.find((t) => t.id === p.tienda_id)?.nombre ?? nombreTienda(p.tienda_id);
    setToast(`Pedido nuevo en ${tienda}`);
    // Solo cuando llega un pedido nuevo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envivo.ultimoNuevo]);

  useEffect(() => {
    if (envivo.errorDespacho) setToast(envivo.errorDespacho);
  }, [envivo.errorDespacho]);

  const conexion =
    envivo.conexion === 'en_vivo' ? (
      <Insignia tono="ok" punto>
        En vivo
      </Insignia>
    ) : (
      <Insignia tono="aviso" punto>
        {envivo.conexion === 'conectando' ? 'Conectando…' : 'Reconectando…'}
      </Insignia>
    );

  const propsDatos = { token, version: envivo.version, alNoAutorizado: alSalir };
  const esAvisoNuevo = toast?.startsWith('Pedido nuevo') ?? false;
  const comercio = panel.comercio;

  return (
    <ContextoPanel.Provider value={panel}>
      <Pantalla
        ancho="operador"
        encabezado={
          <Encabezado
            variante="operador"
            rutaInicio={`${base}/despacho`}
            titulo="Comercio"
            acciones={
              <>
                {conexion}
                <Boton variante="sobreAzul" onClick={alSalir}>
                  Salir
                </Boton>
              </>
            }
          >
            {comercio && (
              <div className="op-comercio" data-testid="ficha-comercio">
                <strong className="op-comercio__nombre">{comercio.nombre}</strong>
                <span>
                  {comercio.ciudad}, {comercio.estado_pais}
                </span>
                <Insignia tono="azul">{NOMBRE_PLAN[comercio.plan] ?? comercio.plan}</Insignia>
                {comercio.es_demostracion && <Insignia tono="aviso">Demostración</Insignia>}
              </div>
            )}
            <nav className="g-pestanas" aria-label="Secciones">
              <Chip a={`${base}/despacho`}>
                Despacho{envivo.contadorNuevos > 0 ? ` (${envivo.contadorNuevos} nuevos)` : ''}
              </Chip>
              <Chip a={`${base}/resumen`}>Resumen</Chip>
              <Chip a={`${base}/inventario`}>Inventario</Chip>
              <Chip a={`${base}/productos`}>Productos</Chip>
              <Chip a={`${base}/zonas`}>Zonas</Chip>
            </nav>
          </Encabezado>
        }
      >
        <div aria-live="polite" className="g-solo-lector" data-testid="aviso-en-vivo">
          {envivo.anuncio}
        </div>
        {estadoYo === 'cargando' && <Cargando variante="esqueleto" lineas={4} texto="Cargando tu comercio…" />}
        {estadoYo === 'error' && (
          <EstadoVacio
            tono="error"
            titulo="No se pudieron cargar los datos de tu comercio."
            accion={
              <Boton variante="secundario" onClick={reintentar}>
                Reintentar
              </Boton>
            }
          />
        )}
        {estadoYo === 'listo' && (
          <Routes>
            <Route index element={<Navigate to="despacho" replace />} />
            <Route path="despacho" element={<Despacho envivo={envivo} />} />
            <Route path="resumen" element={<Resumen {...propsDatos} />} />
            <Route path="inventario" element={<Inventario {...propsDatos} />} />
            <Route path="productos" element={<Productos {...propsDatos} />} />
            <Route path="zonas" element={<Zonas {...propsDatos} />} />
            <Route path="*" element={<Navigate to="despacho" replace />} />
          </Routes>
        )}
        <Toast
          visible={toast !== null}
          mensaje={toast ?? ''}
          alCerrar={() => {
            setToast(null);
            envivo.limpiarError();
          }}
          accion={
            esAvisoNuevo
              ? {
                  etiqueta: 'Ver despacho',
                  alPulsar: () => {
                    setToast(null);
                    navegar(`${base}/despacho`);
                  },
                }
              : undefined
          }
        />
      </Pantalla>
    </ContextoPanel.Provider>
  );
}

/** Panel del comercio. `base`: '/comercio' (dirección principal) u '/operador' (la de siempre). */
export function PanelOperador({ base = '/operador' }: { base?: string }) {
  const servicios = useServicios();
  const navegar = useNavigate();
  const [token, setToken] = useState<string | null>(() => servicios.leerToken());

  if (!token) {
    return (
      <EntradaPin
        base={base}
        alEntrar={(nuevo) => {
          servicios.guardarToken(nuevo);
          setToken(nuevo);
          navegar(`${base}/despacho`, { replace: true });
        }}
      />
    );
  }

  return (
    <PanelConSesion
      base={base}
      token={token}
      alSalir={() => {
        servicios.guardarToken(null);
        setToken(null);
        navegar(base, { replace: true });
      }}
    />
  );
}
