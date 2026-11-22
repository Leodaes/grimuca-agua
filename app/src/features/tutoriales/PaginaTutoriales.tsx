import { Link } from 'react-router-dom';
import { Insignia } from '../../components/grimuca';
import { Miniatura } from './Miniatura';
import { NOTA_FABRICANTE, ROTULO_DEMO, TUTORIALES } from './contenido';

/** /tutoriales: lista de guías para cambiar los cartuchos (maqueta de la demo). */
export function PaginaTutoriales() {
  return (
    <main id="contenido" className="g-pantalla__contenido g-pila" tabIndex={-1}>
      <div>
        <Insignia tono="aviso">{ROTULO_DEMO}</Insignia>
      </div>
      <h1 className="g-h1">Aprende a cambiar tus cartuchos</h1>
      <p>Guías cortas, paso a paso, para cambiar los cartuchos de tu filtro en casa.</p>

      <ul className="g-pila" style={{ listStyle: 'none', padding: 0, margin: 0 }} aria-label="Tutoriales">
        {TUTORIALES.map((t) => (
          <li key={t.id}>
            <article
              className="g-pila"
              style={{ border: '1px solid var(--linea)', padding: 'var(--s4)', gap: 'var(--s2)' }}
            >
              <Link to={`/tutoriales/${t.id}`} tabIndex={-1} aria-hidden="true">
                <Miniatura minutos={t.minutos} />
              </Link>
              <h2 className="g-h3" style={{ margin: 0 }}>
                {t.titulo}
              </h2>
              <p className="g-apagado" style={{ margin: 0 }}>
                {t.minutos} min · Nivel: {t.nivel}
              </p>
              <Link
                className="g-enlace"
                to={`/tutoriales/${t.id}`}
                style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center' }}
                aria-label={`Ver la guía: ${t.titulo}`}
              >
                Ver la guía
              </Link>
            </article>
          </li>
        ))}
      </ul>

      <p className="g-apagado">{NOTA_FABRICANTE}</p>
      <p>
        <Link
          className="g-enlace"
          to="/experto?servicio=cambio"
          style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center' }}
        >
          ¿No sabes hacerlo? Contrata a un experto
        </Link>
      </p>
    </main>
  );
}
