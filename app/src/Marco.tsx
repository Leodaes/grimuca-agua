import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Aviso, BarraInferior, Encabezado } from './components/grimuca';
import { api } from './lib/api';
import { EVENTO_HOGAR, EVENTO_PERFIL_PERDIDO, TEXTO_AVISO_PERFIL_PERDIDO } from './lib/avisosSesion';
import { hogarId } from './lib/sesion';

/**
 * Marco de las pantallas del cliente: encabezado azul arriba y barra de accesos abajo. Cada página pone su propio <main>.
 * En la portada sin hogar en sesión no va la barra de accesos: la portada pone su propia barra fija de compra.
 *
 * Si el hogar guardado en este teléfono ya no existe en el servidor (`lib/api` lo olvida y emite
 * `EVENTO_PERFIL_PERDIDO`), lleva a `/perfil?ya=1` (que al guardar sigue a `/medir`) con un aviso arriba,
 * que se cierra solo cuando se guarda el perfil nuevo.
 */
export function Marco() {
  const { pathname } = useLocation();
  const navegar = useNavigate();
  const [perfilPerdido, setPerfilPerdido] = useState(false);
  // Cambia al perder el perfil para montar de nuevo la pantalla (sin estados de error ni el id viejo).
  const [vuelta, setVuelta] = useState(0);
  const validado = useRef(false);

  useEffect(() => {
    const alPerder = () => {
      setPerfilPerdido(true);
      setVuelta((n) => n + 1);
      navegar('/perfil?ya=1', { replace: true });
    };
    const alGuardar = (evento: Event) => {
      if ((evento as CustomEvent<string | null>).detail) setPerfilPerdido(false);
    };
    window.addEventListener(EVENTO_PERFIL_PERDIDO, alPerder);
    window.addEventListener(EVENTO_HOGAR, alGuardar);
    return () => {
      window.removeEventListener(EVENTO_PERFIL_PERDIDO, alPerder);
      window.removeEventListener(EVENTO_HOGAR, alGuardar);
    };
  }, [navegar]);

  // Una vez por carga: confirma en segundo plano que el hogar de la sesión sigue existiendo.
  // Si no existe, `lib/api` lo olvida y emite el evento de arriba; cualquier otro error se ignora.
  useEffect(() => {
    if (validado.current) return;
    validado.current = true;
    const id = hogarId();
    if (id) Promise.resolve().then(() => api.obtenerHogar(id)).catch(() => undefined);
  }, []);

  const portadaDeVenta = pathname === '/' && !hogarId();
  return (
    <div className={portadaDeVenta ? 'g-pantalla' : 'g-pantalla g-pantalla--con-barra'}>
      <a className="g-pantalla__salto" href="#contenido">
        Saltar al contenido
      </a>
      <Encabezado variante="cliente" />
      {perfilPerdido && (
        <div className="g-marco__aviso">
          <Aviso tono="atencion" rol="alert">
            {TEXTO_AVISO_PERFIL_PERDIDO}
          </Aviso>
        </div>
      )}
      <Outlet key={vuelta} />
      {!portadaDeVenta && <BarraInferior />}
    </div>
  );
}
