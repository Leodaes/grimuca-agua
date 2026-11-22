import type { ReactNode } from 'react';
import { BandaCifras, Boton, Icono } from '../../../components/grimuca';
import type { NombreIcono } from '../../../components/grimuca';
import { DibujoPaso, IconoBotellon, IlustracionFiltro, IlustracionSobre } from './Ilustraciones';
import './portada.css';

export const LEMA = 'Saber qué tomas empieza en casa';
export const PROMESA = 'Menos botellones: mide tu agua y cambia el cartucho cuando toca';
/** Título original del proyecto. Va con la línea de medición orientativa en la misma pantalla (Legal). */
export const TITULO_ORIGINAL = 'Descubre la calidad del agua de tu casa';
export const LINEA_ORIENTATIVA = 'Medición orientativa con tira. No es un análisis de laboratorio.';

export const BOTON_PEDIR = 'Pedir el sobre a domicilio ($9)';
export const BOTON_YA_TENGO = 'Ya tengo mi sobre';

/** Contenido del sobre (mismo texto que en Envío y Pago). */
export const CONTENIDO_SOBRE: { texto: string; detalle: string; icono: NombreIcono }[] = [
  { texto: '1 tira para medir tu agua', detalle: 'Una gota en cada casilla.', icono: 'gota' },
  { texto: '1 prueba casera de bacterias coliformes', detalle: 'Su resultado sale a las 48 horas.', icono: 'reloj' },
  { texto: 'La tabla de colores impresa', detalle: 'Va al lado de la tira en la foto.', icono: 'resultados' },
  { texto: 'Un código QR con el video de cómo se hace', detalle: 'Lo escaneas y la app te guía.', icono: 'camara' },
];

/** Marca un bloque que contiene el botón principal: la barra fija se esconde mientras alguno se vea. */
function ZonaPrincipal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={className} data-p-cta="">
      {children}
    </div>
  );
}

/* ───────────── 1. Hero ───────────── */

export interface PropsBannerHero {
  /** "pedir": el botón principal es pedir el sobre. "ya": llega desde el QR del sobre. */
  principal?: 'pedir' | 'ya';
}

/** Hero de la portada: foto, lema, promesa concreta, precio y los dos caminos. */
export function BannerHero({ principal = 'pedir' }: PropsBannerHero) {
  const pedir = { a: '/perfil', texto: BOTON_PEDIR };
  const ya = { a: '/perfil?ya=1', texto: BOTON_YA_TENGO };
  const [primero, segundo] = principal === 'ya' ? [ya, pedir] : [pedir, ya];
  return (
    <section className="p-hero g-sobre-azul" aria-labelledby="p-hero-titulo">
      <div className="p-hero__rejilla">
        <div className="p-hero__foto">
          <img
            src="/promo/saber-que-tomas.jpg"
            alt="Una madre y su hija miden el agua de la cocina con una tira dentro de un vaso."
            width={1024}
            height={1024}
          />
          <p className="p-hero__precio">
            <span>Sobre de medición, envío incluido</span>
            <strong>$9</strong>
          </p>
        </div>
        <div className="p-hero__texto">
          <h1 className="p-hero__titulo" id="p-hero-titulo">
            <span className="p-eyebrow p-eyebrow--azul">{TITULO_ORIGINAL}</span>
            <span className="p-hero__lema">{LEMA}</span>
          </h1>
          <p className="p-hero__promesa">
            {principal === 'ya'
              ? 'Escanea el QR, pon una gota en cada casilla de la tira y tómale una foto. En unos minutos sabes qué salió en cada casilla y qué filtro o cartucho va.'
              : 'Con una tira y una foto mides el agua de tu casa en unos minutos y sabes qué filtro o cartucho va.'}
          </p>
          <ZonaPrincipal className="p-hero__acciones">
            <Boton a={primero.a} anchoCompleto>
              {primero.texto}
            </Boton>
            <Boton a={segundo.a} variante="sobreAzul" anchoCompleto>
              {segundo.texto}
            </Boton>
          </ZonaPrincipal>
          <p className="p-hero__legal">{LINEA_ORIENTATIVA}</p>
        </div>
      </div>
    </section>
  );
}

/* ───────────── 2. Botellones ───────────── */

/** Banner del gasto en botellones con la estimación de Tulio. */
export function BannerBotellones({ cierre }: { cierre?: ReactNode }) {
  return (
    <section className="p-banner p-banner--azul g-sobre-azul" aria-labelledby="p-botellones-titulo">
      <div className="p-envoltura p-pila">
        <p className="p-eyebrow p-eyebrow--azul">Estimación para una familia en Valencia</p>
        <h2 className="p-h2 p-h2--claro" id="p-botellones-titulo">
          ¿Cuánto se te va en botellones?
        </h2>
        <div className="p-botellones__fila" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <IconoBotellon key={i} className={i === 5 ? 'p-botellones__tenue' : undefined} tamano={34} />
          ))}
          <span className="p-botellones__nota">cada quincena</span>
        </div>
        <BandaCifras
          className="p-cifras"
          etiqueta="Gasto estimado en botellones"
          cifras={[
            { valor: '5 a 6', etiqueta: 'botellones por quincena' },
            { valor: '$20 a $48', etiqueta: 'al mes', detalle: '$2 por botellón, hasta $4 con delivery' },
            { valor: 'Hasta $576', etiqueta: 'al año', detalle: 'si los compras con delivery' },
          ]}
        />
        <p className="p-botellones__rotulo">Estimación de Grimuca para una familia en Valencia. Tu gasto puede ser otro.</p>
        {cierre ?? (
          <p className="p-botellones__promesa">
            <strong>{PROMESA}.</strong> Saber qué tiene tu agua cuesta $9 y es el primer paso.
          </p>
        )}
      </div>
    </section>
  );
}

/* ───────────── 3. Cómo funciona ───────────── */

const PASOS: { titulo: string; detalle: string }[] = [
  {
    titulo: 'Pides o compras el sobre',
    detalle: 'Te lo llevamos a la casa por $9 o lo compras en una tienda Grimuca.',
  },
  {
    titulo: 'Mides con la tira y subes la foto',
    detalle: 'Una gota en cada casilla, esperas 30 segundos y le tomas una foto al lado de la tabla de colores.',
  },
  {
    titulo: 'Recibes tu resultado y lo que va con tu casa',
    detalle: 'Cada casilla en Verde, Amarillo o Rojo, y el filtro o cartucho que corresponde, en la tienda más cercana.',
  },
];

/** Banner "Cómo funciona" con los tres pasos numerados. */
export function BannerComoFunciona({ titulo = 'Cómo funciona' }: { titulo?: string }) {
  return (
    <section className="p-banner" aria-labelledby="p-como-titulo">
      <div className="p-envoltura p-pila">
        <p className="p-eyebrow">Tres pasos</p>
        <h2 className="p-h2" id="p-como-titulo">
          {titulo}
        </h2>
        <ol className="p-pasos">
          {PASOS.map((paso, i) => (
            <li key={paso.titulo} className="p-paso">
              <span className="p-paso__numero" aria-hidden="true">
                {i + 1}
              </span>
              <DibujoPaso paso={(i + 1) as 1 | 2 | 3} />
              <h3 className="p-paso__titulo">
                <span className="g-solo-lector">Paso {i + 1}: </span>
                {paso.titulo}
              </h3>
              <p className="p-paso__detalle">{paso.detalle}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ───────────── 4. El sobre ───────────── */

export interface PropsBannerSobre {
  /** Botón de compra (va dentro de una zona principal). */
  accion?: ReactNode;
  /** Solo la ilustración, para pantallas angostas como el pago. */
  compacto?: boolean;
  /** Muestra la etiqueta de precio en la ilustración. */
  conPrecio?: boolean;
}

/** Banner "El sobre de $9": ilustración del sobre, lo que trae, precio y botón. */
export function BannerSobre({ accion, compacto = false, conPrecio = true }: PropsBannerSobre) {
  if (compacto) {
    return (
      <div className="p-sobre__figura p-sobre__figura--compacta">
        <IlustracionSobre conPrecio={conPrecio} />
      </div>
    );
  }
  return (
    <section className="p-banner p-banner--papel" aria-labelledby="p-sobre-titulo">
      <div className="p-envoltura p-sobre">
        <div className="p-sobre__figura">
          <IlustracionSobre conPrecio={conPrecio} />
        </div>
        <div className="p-pila">
          <p className="p-eyebrow">Sobre de medición, envío incluido</p>
          <h2 className="p-h2" id="p-sobre-titulo">
            Qué trae el sobre
          </h2>
          <ul className="p-lista-sobre">
            {CONTENIDO_SOBRE.map((item) => (
              <li key={item.texto}>
                <Icono nombre={item.icono} tamano={24} />
                <span>
                  <strong>{item.texto}</strong>
                  <span className="p-lista-sobre__detalle">{item.detalle}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="p-sobre__precio">
            <span className="p-sobre__monto">$9</span>
            <span>
              El sobre es para una sola medición. Te lo llevamos a la casa o lo compras en el mostrador de una tienda
              Grimuca.
            </span>
          </p>
          {accion && <ZonaPrincipal className="p-sobre__accion">{accion}</ZonaPrincipal>}
        </div>
      </div>
    </section>
  );
}

/* ───────────── 5. Ya tienes filtro ───────────── */

/** Banner corto para quien ya tiene filtro en casa. */
export function BannerFiltro() {
  return (
    <section className="p-banner p-banner--azul-claro" aria-labelledby="p-filtro-titulo">
      <div className="p-envoltura p-filtro">
        <div className="p-filtro__figura">
          <IlustracionFiltro />
        </div>
        <div className="p-pila">
          <p className="p-eyebrow">Si ya tienes filtro</p>
          <h2 className="p-h2" id="p-filtro-titulo">
            ¿Ya tienes filtro?
          </h2>
          <p className="p-texto-grande">
            Tómale una foto y te decimos qué cartuchos lleva y cuándo toca cambiarlos.
          </p>
          <div className="p-filtro__acciones">
            <Boton a="/tutoriales" variante="secundario">
              Tutoriales para cambiar tu cartucho
            </Boton>
            <Boton a="/experto" variante="secundario">
              Pedir un técnico a domicilio
            </Boton>
          </div>
        </div>
      </div>
    </section>
  );
}
