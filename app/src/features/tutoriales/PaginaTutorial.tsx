import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Aviso, Boton, EstadoVacio, Insignia, Pasos } from '../../components/grimuca';
import { api } from '../../lib/api';
import { hogarId } from '../../lib/sesion';
import { mensajeError } from '../resultado/textos';
import { Miniatura } from './Miniatura';
import { NOTA_FABRICANTE, ROTULO_DEMO, buscarTutorial } from './contenido';

/** Fecha local de hoy como AAAA-MM-DD. */
function hoy(): string {
  const ahora = new Date();
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}`;
}

type Anotar = { tipo: 'inicio' } | { tipo: 'guardando' } | { tipo: 'listo' } | { tipo: 'error'; mensaje: string };

/** /tutoriales/:id: guía paso a paso de un cambio de cartucho. */
export function PaginaTutorial() {
  const { id } = useParams();
  const tutorial = buscarTutorial(id);
  const idHogar = hogarId();
  const [anotar, setAnotar] = useState<Anotar>({ tipo: 'inicio' });

  if (!tutorial) {
    return (
      <main id="contenido" className="g-pantalla__contenido g-pila" tabIndex={-1}>
        <h1 className="g-h1">No encontramos esa guía</h1>
        <EstadoVacio titulo="Esa guía no existe" accion={<Boton a="/tutoriales">Ver todas las guías</Boton>} />
      </main>
    );
  }

  async function anotarFecha() {
    if (!idHogar) return;
    setAnotar({ tipo: 'guardando' });
    try {
      await api.actualizarHogar(idHogar, { tiene_filtro: true, ultimo_cambio: 'menos_de_un_mes', fecha_ultimo_cambio: hoy() });
      setAnotar({ tipo: 'listo' });
    } catch (error) {
      setAnotar({ tipo: 'error', mensaje: mensajeError(error) });
    }
  }

  return (
    <main id="contenido" className="g-pantalla__contenido g-pila" tabIndex={-1}>
      <p>
        <Link className="g-enlace" to="/tutoriales" style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>
          Todas las guías
        </Link>
      </p>
      <h1 className="g-h1">{tutorial.titulo}</h1>
      <p className="g-apagado" style={{ margin: 0 }}>
        {tutorial.minutos} min · Nivel: {tutorial.nivel}
      </p>
      <Miniatura minutos={tutorial.minutos} grande />
      <div>
        <Insignia tono="aviso">{ROTULO_DEMO}</Insignia>
      </div>
      <p>{tutorial.resumen}</p>

      <section className="g-pila" aria-labelledby="titulo-necesitas">
        <h2 className="g-h3" id="titulo-necesitas">
          Qué necesitas
        </h2>
        <ul style={{ paddingLeft: '1.25rem', listStyle: 'disc', margin: 0 }}>
          {tutorial.necesitas.map((cosa) => (
            <li key={cosa}>{cosa}</li>
          ))}
        </ul>
      </section>

      <section className="g-pila" aria-labelledby="titulo-pasos">
        <h2 className="g-h3" id="titulo-pasos">
          Paso a paso
        </h2>
        <Pasos pasos={tutorial.pasos} etiqueta={`Pasos: ${tutorial.titulo}`} />
      </section>

      <Aviso tono="info">{NOTA_FABRICANTE}</Aviso>

      {idHogar && anotar.tipo !== 'listo' && (
        <Boton
          variante="secundario"
          anchoCompleto
          cargando={anotar.tipo === 'guardando'}
          textoCargando="Anotando…"
          onClick={() => void anotarFecha()}
        >
          Ya lo cambié: anotar la fecha de hoy
        </Boton>
      )}
      {anotar.tipo === 'listo' && (
        <Aviso tono="ok" rol="status">
          Listo. Te avisamos aquí cuando toque el próximo cambio.
        </Aviso>
      )}
      {anotar.tipo === 'error' && (
        <Aviso tono="error" rol="alert">
          {anotar.mensaje}
        </Aviso>
      )}

      <Boton a="/experto?servicio=cambio" anchoCompleto>
        ¿No sabes hacerlo? Contrata a un experto
      </Boton>
    </main>
  );
}
