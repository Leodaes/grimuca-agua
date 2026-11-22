// /modulos: punto de partida de la demo, con los cuatro módulos de la plataforma.
import { Link } from 'react-router-dom';
import { Encabezado, Pantalla } from '../../components/grimuca';
import './red.css';

export const MODULOS = [
  {
    nombre: 'Cliente',
    ruta: '/',
    frase: 'El hogar mide su agua con la tira, ve qué le conviene y pide en su ferretería.',
  },
  {
    nombre: 'Comercio',
    ruta: '/comercio',
    frase: 'La ferretería despacha pedidos, revisa su inventario y carga sus propios productos.',
  },
  {
    nombre: 'Técnico',
    ruta: '/tecnico',
    frase: 'El técnico ve sus servicios asignados y deja la foto de cómo quedó el trabajo.',
  },
  {
    nombre: 'Red',
    ruta: '/red',
    frase: 'Grimuca ve todos los comercios de la red, sus cifras por estado y da de alta uno nuevo.',
  },
] as const;

export function PaginaModulos() {
  return (
    <Pantalla ancho="operador" encabezado={<Encabezado variante="operador" rutaInicio="/modulos" titulo="Módulos" />}>
      <div className="g-pila g-pila--amplia">
        <div>
          <p className="g-kicker">Plataforma para ferreterías</p>
          <h1 className="g-h1">Grimuca Agua: cuatro módulos</h1>
          <p>Cada módulo tiene su propia dirección. Elige uno para abrir la demostración.</p>
        </div>
        <ul className="mod-rejilla" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {MODULOS.map((m) => (
            <li key={m.ruta}>
              <Link to={m.ruta} className="mod-tarjeta" aria-label={`${m.nombre}: ${m.frase}`}>
                <span className="mod-tarjeta__nombre">{m.nombre}</span>
                <span>{m.frase}</span>
                <span className="mod-tarjeta__ruta">{m.ruta}</span>
                <span className="mod-tarjeta__abrir">Abrir {m.nombre.toLowerCase()}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Pantalla>
  );
}
