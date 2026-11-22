import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Boton } from '../../components/grimuca';
import { api } from '../../lib/api';
import { hogarId } from '../../lib/sesion';
import { AvisoRecambio } from '../resultado/PaginaResultado';
import { PaginaAlta } from './comun';

export const LEMA = 'Saber qué tomas empieza en casa';
export const PROMESA = 'Menos botellones: mide tu agua y cambia el cartucho cuando toca';

const BENEFICIOS = [
  { titulo: 'Mides en tu casa.', detalle: 'Una tira, una gota por casilla y una foto.' },
  { titulo: 'Te lo explicamos claro.', detalle: 'Verde, amarillo o rojo, casilla por casilla.' },
  {
    titulo: 'Te decimos qué cartucho va.',
    detalle: 'Y sale de la tienda Grimuca que te quede más cerca.',
  },
];

/** Días para el recambio según la última medición del hogar (null si no hay dato). */
function useDiasRecambio(id: string | null): number | null {
  const [dias, setDias] = useState<number | null>(null);
  useEffect(() => {
    if (!id) return;
    let vigente = true;
    Promise.resolve(api.medicionesDeHogar(id))
      .then((mediciones) => {
        const valor = mediciones?.[0]?.evaluacion?.diasParaRecambio;
        if (vigente && typeof valor === 'number') setDias(valor);
      })
      .catch(() => undefined);
    return () => {
      vigente = false;
    };
  }, [id]);
  return dias;
}

export function Bienvenida() {
  const id = hogarId();
  const conHogar = Boolean(id);
  const diasRecambio = useDiasRecambio(id);

  return (
    <PaginaAlta>
      <img
        src="/promo/saber-que-tomas.jpg"
        alt=""
        width={1024}
        height={1024}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
      <p className="g-kicker">Grimuca Agua</p>
      <h1 className="g-h1">Descubre la calidad del agua de tu casa</h1>
      <p className="g-h3" style={{ margin: 0 }}>
        {LEMA}
      </p>
      <p>
        <strong>{PROMESA}.</strong>
      </p>
      <p>
        Escanea el QR de tu sobre, haz la prueba tú mismo y en minutos te decimos qué está saliendo
        por tu chorro y qué hacer.
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

      <img
        src="/promo/mide-entiende-filtra.jpg"
        alt="Mide, entiende y filtra: retira en Mañongo o San Diego, o te lo llevamos."
        width={1024}
        height={1024}
        loading="lazy"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />

      {conHogar && diasRecambio !== null && (
        <AvisoRecambio dias={diasRecambio} destino="/resultado/ultimo" etiqueta="Ver productos sugeridos" />
      )}

      {conHogar ? (
        <div className="g-pila">
          <Boton a="/medir" anchoCompleto>
            Medir mi agua
          </Boton>
          <Boton a="/resultados" variante="secundario" anchoCompleto>
            Ver mis resultados
          </Boton>
          <Boton a="/perfil" variante="secundario" anchoCompleto>
            Pedir el sobre a domicilio ($9)
          </Boton>
        </div>
      ) : (
        <div className="g-pila">
          <Boton a="/perfil?ya=1" anchoCompleto>
            Ya tengo mi sobre
          </Boton>
          <Boton a="/perfil" variante="secundario" anchoCompleto>
            Pedir el sobre a domicilio ($9)
          </Boton>
        </div>
      )}
      <p className="g-apagado">El sobre se consigue en las tiendas Grimuca o te lo llevamos a casa.</p>

      <p className="g-apagado" style={{ fontSize: '0.9em' }}>
        Medición orientativa con tira. No es un análisis de laboratorio.
      </p>
      <p className="g-apagado" style={{ fontSize: '0.9em' }}>
        <Link className="g-enlace" to="/tiendas">
          Grimuca · Mañongo · Big Low · CC CEM
        </Link>
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
