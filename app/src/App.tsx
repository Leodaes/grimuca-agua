import { lazy, Suspense, type ReactNode } from 'react';
import { useRoutes, type RouteObject } from 'react-router-dom';
import { Cargando } from './components/grimuca';
import { Marco } from './Marco';
import { rutasAlta } from './features/alta/rutas';
import { rutasMedicion } from './features/medicion/rutas';
import { rutasResultado } from './features/resultado/rutas';
import { rutasPedido } from './features/pedido/rutas';
import { rutasFiltro } from './features/filtro/rutas';
import { rutasCatalogo } from './features/catalogo/rutas';
import { rutasTutoriales } from './features/tutoriales/rutas';
import { PaginaModulos } from './features/red/PaginaModulos';

// Los paneles del comercio, la red y el técnico se descargan solo cuando se abren:
// así el teléfono del cliente no baja el mapa ni el código del lado empresa.
const PanelOperador = lazy(() => import('./features/operador/PanelOperador').then((m) => ({ default: m.PanelOperador })));
const PaginaRed = lazy(() => import('./features/red/PaginaRed').then((m) => ({ default: m.PaginaRed })));
const PaginaTecnico = lazy(() => import('./features/tecnico/PaginaTecnico').then((m) => ({ default: m.PaginaTecnico })));

function Diferido({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <main id="contenido" className="g-pantalla__contenido">
          <Cargando texto="Abriendo el panel…" />
        </main>
      }
    >
      {children}
    </Suspense>
  );
}

function NoEncontrada() {
  return (
    <main id="contenido" className="g-pantalla__contenido">
      <h1 className="g-h1">Página no encontrada</h1>
      <p>
        <a href="/">Volver al inicio</a>
      </p>
    </main>
  );
}

const rutas: RouteObject[] = [
  // Mismas direcciones que features/operador, red y tecnico/rutas.tsx.
  { path: '/comercio/*', element: <Diferido><PanelOperador base="/comercio" /></Diferido> },
  { path: '/operador/*', element: <Diferido><PanelOperador base="/operador" /></Diferido> },
  { path: '/red/*', element: <Diferido><PaginaRed /></Diferido> },
  { path: '/modulos', element: <PaginaModulos /> },
  { path: '/tecnico/*', element: <Diferido><PaginaTecnico /></Diferido> },
  {
    element: <Marco />,
    children: [...rutasAlta, ...rutasMedicion, ...rutasResultado, ...rutasPedido, ...rutasFiltro, ...rutasCatalogo, ...rutasTutoriales, { path: '*', element: <NoEncontrada /> }],
  },
];

export function App() {
  return useRoutes(rutas);
}
