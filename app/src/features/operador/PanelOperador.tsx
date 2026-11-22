import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Boton, Campo, Chip, Encabezado, Insignia, Pantalla, Toast } from '../../components/grimuca';
import { esNoAutorizado, mensajeDe, useServicios } from './contexto';
import { Despacho } from './Despacho';
import { nombreTienda } from './estadoPedidos';
import { Inventario } from './Inventario';
import { Resumen } from './Resumen';
import { usePedidosEnVivo } from './usePedidosEnVivo';
import { Zonas } from './Zonas';

function EntradaPin({ alEntrar }: { alEntrar: (token: string) => void }) {
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
    <Pantalla ancho="operador" encabezado={<Encabezado variante="operador" rutaInicio="/operador" titulo="Panel de tiendas" />}>
      <form onSubmit={enviar} className="g-pila" style={{ maxWidth: 360, margin: '48px auto', width: '100%' }} noValidate>
        <h1 className="g-h1">Panel de tiendas</h1>
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

function PanelConSesion({ token, alSalir }: { token: string; alSalir: () => void }) {
  const envivo = usePedidosEnVivo(token, alSalir);
  const ubicacion = useLocation();
  const navegar = useNavigate();
  const enDespacho = /\/operador\/?(despacho)?\/?$/.test(ubicacion.pathname);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (envivo.ultimoNuevo && !enDespacho) setToast(`Pedido nuevo en ${nombreTienda(envivo.ultimoNuevo.tienda_id)}`);
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

  return (
    <Pantalla
      ancho="operador"
      encabezado={
        <Encabezado
          variante="operador"
          rutaInicio="/operador/despacho"
          titulo="Panel de despacho"
          acciones={
            <>
              {conexion}
              <Boton variante="sobreAzul" onClick={alSalir}>
                Salir
              </Boton>
            </>
          }
        >
          <nav className="g-pestanas" aria-label="Secciones">
            <Chip a="/operador/despacho">
              Despacho{envivo.contadorNuevos > 0 ? ` (${envivo.contadorNuevos} nuevos)` : ''}
            </Chip>
            <Chip a="/operador/resumen">Resumen</Chip>
            <Chip a="/operador/inventario">Inventario</Chip>
            <Chip a="/operador/zonas">Zonas</Chip>
          </nav>
        </Encabezado>
      }
    >
      <div aria-live="polite" className="g-solo-lector" data-testid="aviso-en-vivo">
        {envivo.anuncio}
      </div>
      <Routes>
        <Route index element={<Navigate to="despacho" replace />} />
        <Route path="despacho" element={<Despacho envivo={envivo} />} />
        <Route path="resumen" element={<Resumen {...propsDatos} />} />
        <Route path="inventario" element={<Inventario {...propsDatos} />} />
        <Route path="zonas" element={<Zonas {...propsDatos} />} />
        <Route path="*" element={<Navigate to="despacho" replace />} />
      </Routes>
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
                  navegar('/operador/despacho');
                },
              }
            : undefined
        }
      />
    </Pantalla>
  );
}

export function PanelOperador() {
  const servicios = useServicios();
  const navegar = useNavigate();
  const [token, setToken] = useState<string | null>(() => servicios.leerToken());

  if (!token) {
    return (
      <EntradaPin
        alEntrar={(nuevo) => {
          servicios.guardarToken(nuevo);
          setToken(nuevo);
          navegar('/operador/despacho', { replace: true });
        }}
      />
    );
  }

  return (
    <PanelConSesion
      token={token}
      alSalir={() => {
        servicios.guardarToken(null);
        setToken(null);
        navegar('/operador', { replace: true });
      }}
    />
  );
}
