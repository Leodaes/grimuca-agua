import { Link } from 'react-router-dom';
import { Boton } from '../../components/grimuca';
import { hogarId } from '../../lib/sesion';
import { PaginaAlta } from './comun';

const BENEFICIOS = [
  { titulo: 'Mides en tu casa.', detalle: 'Una tira, una gota por casilla y una foto.' },
  { titulo: 'Te lo explicamos claro.', detalle: 'Verde, amarillo o rojo, casilla por casilla.' },
  {
    titulo: 'Te decimos qué cartucho va.',
    detalle: 'Y sale de la tienda Grimuca que te quede más cerca.',
  },
];

export function Bienvenida() {
  const conHogar = Boolean(hogarId());

  return (
    <PaginaAlta>
      <p className="g-kicker">Grimuca Agua</p>
      <h1 className="g-h1">Descubre la calidad del agua de tu casa</h1>
      <p>
        Te mandamos un sobre con la prueba, la haces tú mismo y en minutos te decimos qué está
        saliendo por tu chorro y qué hacer.
      </p>

      <ul className="g-pila" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {BENEFICIOS.map((b) => (
          <li
            key={b.titulo}
            style={{ borderLeft: '3px solid var(--azul)', padding: '4px 12px' }}
          >
            <strong>{b.titulo}</strong> {b.detalle}
          </li>
        ))}
      </ul>

      {conHogar ? (
        <div className="g-pila">
          <Boton a="/medir" anchoCompleto>
            Medir mi agua
          </Boton>
          <Boton a="/resultados" variante="secundario" anchoCompleto>
            Ver mis resultados
          </Boton>
          <Boton a="/perfil" variante="secundario" anchoCompleto>
            Empezar
          </Boton>
        </div>
      ) : (
        <div className="g-pila">
          <Boton a="/perfil" anchoCompleto>
            Empezar
          </Boton>
          <Link className="g-enlace" to="/perfil?ya=1">
            Ya me llegó el sobre
          </Link>
        </div>
      )}

      <p className="g-apagado" style={{ fontSize: '0.9em' }}>
        Medición orientativa con tira. No es un análisis de laboratorio.
      </p>
      <p className="g-apagado" style={{ fontSize: '0.9em' }}>
        Grimuca · Mañongo · Big Low · CC CEM
      </p>
      <p style={{ fontSize: '0.9em' }}>
        <Link className="g-enlace" to="/privacidad">
          Aviso de privacidad
        </Link>{' '}
        ·{' '}
        <Link className="g-enlace" to="/terminos">
          Términos de uso
        </Link>
      </p>
    </PaginaAlta>
  );
}
