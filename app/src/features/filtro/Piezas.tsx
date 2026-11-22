// Piezas compartidas de las pantallas del filtro: la ficha del filtro y la lista de cartuchos que necesita.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Boton, Icono } from '../../components/grimuca';
import { agregarALista, lista } from '../../lib/sesion';
import type { CartuchoDelFiltro, FiltroHogar } from '../../lib/tipos';
import { enlaceCotizar } from '../resultado/textos';
import { PRUDENCIA, textoMedida } from './textos';

export function FichaFiltro({ filtro }: { filtro: FiltroHogar }) {
  const medida = textoMedida(filtro.medida);
  const leido = [filtro.marca_visible, filtro.modelo_visible].filter(Boolean).join(' ');
  return (
    <section className="g-pila" aria-label="Datos de tu filtro" style={{ border: '1px solid var(--linea, #d0d7de)', padding: 16 }}>
      <dl className="g-pila" style={{ margin: 0 }}>
        <div>
          <dt className="g-apagado">Tipo</dt>
          <dd style={{ margin: 0 }}>
            <strong>{filtro.tipo_nombre}</strong>
          </dd>
        </div>
        <div>
          <dt className="g-apagado">Etapas</dt>
          <dd style={{ margin: 0 }}>{filtro.etapas ?? 'No se pudo contar'}</dd>
        </div>
        <div>
          <dt className="g-apagado">Medida de los cartuchos</dt>
          <dd style={{ margin: 0 }}>{medida ?? 'No la sabemos todavía'}</dd>
        </div>
        {filtro.modelo_codigo && (
          <div>
            <dt className="g-apagado">Modelo</dt>
            <dd style={{ margin: 0 }}>
              {filtro.modelo_nombre ?? 'Modelo del catálogo'} (código {filtro.modelo_codigo})
            </dd>
          </div>
        )}
        {!filtro.modelo_codigo && leido && (
          <div>
            <dt className="g-apagado">Modelo</dt>
            <dd style={{ margin: 0 }}>Marca/modelo que se lee: {leido}</dd>
          </div>
        )}
      </dl>
      {filtro.observaciones && <p className="g-apagado">{filtro.observaciones}</p>}
      {filtro.origen === 'foto' && <p className="g-apagado">{PRUDENCIA}</p>}
    </section>
  );
}

/** "Cartuchos que necesita": nombre, para qué sirve, cotizar y agregar a Mi lista. Sin botón principal. */
export function CartuchosQueNecesita({ cartuchos }: { cartuchos: CartuchoDelFiltro[] }) {
  const [enLista, setEnLista] = useState<Set<string>>(() => {
    try {
      return new Set(lista().map((articulo) => articulo.codigo));
    } catch {
      return new Set();
    }
  });

  function agregar(cartucho: CartuchoDelFiltro) {
    agregarALista({ codigo: cartucho.codigo, nombre: cartucho.nombre, cantidad: 1 });
    setEnLista((previo) => new Set(previo).add(cartucho.codigo));
  }

  return (
    <section className="g-pila" aria-labelledby="titulo-cartuchos-filtro">
      <h2 className="g-h3" id="titulo-cartuchos-filtro">
        Cartuchos que necesita
      </h2>
      {cartuchos.length === 0 ? (
        <p>
          Para este equipo no tenemos cartuchos sueltos en el catálogo.{' '}
          <Link className="g-enlace" to="/tiendas">
            Pasa por la tienda y lo vemos contigo.
          </Link>
        </p>
      ) : (
        cartuchos.map((cartucho) => {
          const yaEsta = enLista.has(cartucho.codigo);
          const cotizar = enlaceCotizar(cartucho.nombre, cartucho.codigo);
          return (
            <article className="g-tarjeta-producto" key={cartucho.codigo}>
              <div className="g-tarjeta-producto__foto">
                {cartucho.foto_url ? (
                  <img src={cartucho.foto_url} alt="" loading="lazy" />
                ) : (
                  <Icono nombre="cartucho" tamano={40} titulo="Foto no disponible" />
                )}
              </div>
              <div className="g-tarjeta-producto__cuerpo">
                <h3 className="g-tarjeta-producto__nombre">{cartucho.nombre}</h3>
                <p className="g-tarjeta-producto__codigo">{[cartucho.marca, cartucho.codigo].filter(Boolean).join(' · ')}</p>
                <p className="g-tarjeta-producto__motivo">{cartucho.para_que}</p>
                {cartucho.atiende_medicion && <p className="g-apagado">Atiende lo que midió tu tira.</p>}
                {cartucho.confirmar_medida && <p className="g-apagado">Confirma la medida en la tienda.</p>}
                {cotizar.interno ? (
                  <Link className="g-enlace" to={cotizar.destino}>
                    Cotizar por WhatsApp
                  </Link>
                ) : (
                  <a className="g-enlace" href={cotizar.destino} target="_blank" rel="noopener noreferrer">
                    Cotizar por WhatsApp
                  </a>
                )}
              </div>
              <div className="g-tarjeta-producto__acciones">
                <Boton
                  variante="secundario"
                  anchoCompleto
                  disabled={yaEsta}
                  icono={<Icono nombre={yaEsta ? 'check' : 'mas'} tamano={20} />}
                  onClick={() => agregar(cartucho)}
                  aria-label={yaEsta ? `${cartucho.nombre} ya está en tu lista` : `Agregar ${cartucho.nombre} a mi lista`}
                >
                  {yaEsta ? 'Ya está en tu lista' : 'Agregar a mi lista'}
                </Boton>
              </div>
            </article>
          );
        })
      )}
    </section>
  );
}
