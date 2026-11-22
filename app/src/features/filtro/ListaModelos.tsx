import { useState } from 'react';
import { Boton } from '../../components/grimuca';
import type { ModeloLegible } from './modelos';

const VISIBLES = 6;

interface PropsListaModelos {
  modelos: ModeloLegible[];
  valor: string;
  onCambio: (codigo: string) => void;
}

/**
 * "Modelo (opcional)": filas legibles con radio, nombre corto en negrita, detalle pequeño y miniatura si hay foto.
 * Muestra 6 y "Ver más modelos"; la primera opción es "No sé el modelo".
 */
export function ListaModelos({ modelos, valor, onCambio }: PropsListaModelos) {
  const indiceElegido = modelos.findIndex((m) => m.codigo === valor);
  const [todos, setTodos] = useState(false);
  // Si el modelo ya elegido está más abajo, se ve igual.
  const verTodos = todos || indiceElegido >= VISIBLES;
  const visibles = verTodos ? modelos : modelos.slice(0, VISIBLES);
  const opciones = [{ codigo: '', nombreCorto: 'No sé el modelo', detalle: '', foto: null, orden: -1 }, ...visibles];

  return (
    <fieldset className="g-grupo alta-grupo" aria-describedby="modelo-ayuda">
      <legend className="g-campo__etiqueta">
        Modelo <span className="g-campo__opcional">(opcional)</span>
      </legend>
      <p className="g-campo__ayuda" id="modelo-ayuda">
        Si lo compraste en Grimuca y sabes cuál es. Si no, déjalo en "No sé el modelo".
      </p>
      <div className="alta-opciones" id="lista-modelos">
        {opciones.map((m) => {
          const id = `modelo-${m.codigo || 'no-se'}`;
          const elegida = valor === m.codigo;
          return (
            <label key={id} htmlFor={id} className={elegida ? 'alta-opcion alta-opcion--elegida' : 'alta-opcion'}>
              <input
                id={id}
                type="radio"
                name="modelo"
                value={m.codigo}
                checked={elegida}
                onChange={() => onCambio(m.codigo)}
              />
              {m.foto && <img className="alta-opcion__foto" src={m.foto} alt="" width={48} height={48} loading="lazy" />}
              <span className="alta-opcion__texto">
                <strong>{m.nombreCorto}</strong>
                {m.detalle && <span className="alta-opcion__ayuda g-cifra">{m.detalle}</span>}
              </span>
            </label>
          );
        })}
      </div>
      {!verTodos && modelos.length > VISIBLES && (
        <Boton
          variante="secundario"
          anchoCompleto
          className="alta-ver-mas"
          aria-controls="lista-modelos"
          onClick={() => setTodos(true)}
        >
          Ver más modelos
        </Boton>
      )}
    </fieldset>
  );
}
