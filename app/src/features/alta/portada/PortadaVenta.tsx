import { Link } from 'react-router-dom';
import {
  Boton,
  FilaParametro,
  Icono,
  Insignia,
  ListaParametros,
  Semaforo,
  TEXTO_AVISO_TIRA,
  WHATSAPP_MARCADOR,
} from '../../../components/grimuca';
import { PorQueTeLoRecomendamos, ResumenNiveles } from '../../resultado/PaginaResultado';
import { RESUMEN_NIVEL } from '../../resultado/textos';
import {
  BOTON_PEDIR,
  BOTON_YA_TENGO,
  BannerBotellones,
  BannerComoFunciona,
  BannerFiltro,
  BannerHero,
  BannerSobre,
  LEMA,
  LINEA_ORIENTATIVA,
} from './Banners';
import { BarraCompra } from './BarraCompra';

const INDICADORES: { nombre: string; frase: string }[] = [
  { nombre: 'pH', frase: 'Si el agua está ácida o alcalina.' },
  { nombre: 'Cloro', frase: 'El desinfectante. Si hay mucho, cambia el sabor.' },
  { nombre: 'Dureza', frase: 'El sarro que mancha la grifería.' },
  { nombre: 'Alcalinidad', frase: 'Qué tan estable es el agua.' },
  { nombre: 'Nitrato', frase: 'Viene de abonos o del pozo séptico.' },
  { nombre: 'Nitrito', frase: 'Igual que el nitrato: una casilla para vigilar.' },
  { nombre: 'Cobre', frase: 'Posible presencia; confirma con un laboratorio.' },
  { nombre: 'Plomo', frase: 'Posible presencia; confirma con un laboratorio.' },
];

const MUESTRA = [
  {
    nombre: 'Nitrato',
    valor: 50,
    unidad: 'mg/L',
    nivel: 'rojo' as const,
    frase: 'Salió fuera de rango. Viene de la tierra, de abonos o del pozo séptico.',
  },
  {
    nombre: 'Dureza',
    valor: 250,
    unidad: 'mg/L',
    nivel: 'amarillo' as const,
    frase: 'Salió cerca del límite. Es el sarro que mancha la grifería y tapa la ducha.',
  },
  { nombre: 'Cloro', valor: 1, unidad: 'mg/L', nivel: 'verde' as const, frase: 'En rango.' },
];

const PREGUNTAS: { pregunta: string; respuesta: string }[] = [
  {
    pregunta: '¿Es difícil hacer la prueba?',
    respuesta:
      'No. Pones una gota de agua en cada casilla de la tira, esperas 30 segundos y le tomas una foto con la tabla de colores al lado. La app te guía paso a paso.',
  },
  {
    pregunta: '¿Qué tan confiable es?',
    respuesta:
      'Es una medición orientativa con una tira casera: te dice qué revisar, pero no es un análisis de laboratorio. Si algo sale en Rojo, te sugerimos confirmarlo con un laboratorio.',
  },
  {
    pregunta: '¿Cuánto tarda en llegar el sobre?',
    respuesta:
      'Sale de la tienda Grimuca más cercana a tu zona y la tienda te confirma la entrega. En la app ves cuándo sale despachado.',
  },
  {
    pregunta: '¿Y si todo sale en verde?',
    respuesta:
      'Te lo decimos tal cual: todos los parámetros medidos están en rango. La tira no mide todo, así que conviene volver a medir cada cierto tiempo.',
  },
  {
    pregunta: '¿Tengo que comprar algo después?',
    respuesta:
      'No. El resultado es tuyo aunque no compres nada. Si quieres un filtro o un cartucho, lo cotizas con la tienda por WhatsApp y no pagas nada hasta confirmar.',
  },
];

const TIENDAS = [
  { nombre: 'Grimuca Mañongo', zona: 'Naguanagua', lugar: 'C.C. Profesional Paseo Orquídea, local A-3' },
  { nombre: 'Grimuca Big Low', zona: 'San Diego', lugar: 'C.C. Big Low Center, nivel 1, nave F' },
  { nombre: 'Grimuca CC CEM', zona: 'San Diego', lugar: 'C.C. CEM I, nivel 1, local 06' },
];

/** Portada para quien todavía no tiene hogar en este teléfono: página de venta del sobre de $9. */
export function PortadaVenta({ desdeSobre = false }: { desdeSobre?: boolean }) {
  const principal = desdeSobre ? 'ya' : 'pedir';
  const botonCompra = desdeSobre ? (
    <Boton a="/perfil?ya=1" anchoCompleto>
      {BOTON_YA_TENGO}
    </Boton>
  ) : (
    <Boton a="/perfil" anchoCompleto>
      {BOTON_PEDIR}
    </Boton>
  );

  return (
    <>
      <main id="contenido" className="p-portada" lang="es-VE" tabIndex={-1}>
        <BannerHero principal={principal} />
        <BannerBotellones />
        <BannerComoFunciona />
        <BannerSobre accion={botonCompra} />

        {/* Qué vas a saber + muestra del resultado */}
        <section className="p-banner" aria-labelledby="p-saber-titulo">
          <div className="p-envoltura p-saber">
            <div className="p-pila">
              <p className="p-eyebrow">Lo que mide la tira</p>
              <h2 className="p-h2" id="p-saber-titulo">
                Qué vas a saber de tu agua
              </h2>
              <ul className="p-indicadores">
                {INDICADORES.map((indicador) => (
                  <li key={indicador.nombre}>
                    <strong>{indicador.nombre}</strong>
                    <span>{indicador.frase}</span>
                  </li>
                ))}
              </ul>
              <p className="p-nota">
                Aparte, el frasco de la prueba casera de bacterias coliformes te da su resultado a las 48 horas.
              </p>
            </div>

            <figure className="p-muestra" aria-labelledby="p-muestra-titulo">
              <figcaption className="p-muestra__cabeza">
                <Insignia tono="oscuro">Ejemplo</Insignia>
                <span id="p-muestra-titulo">Así se ve tu resultado</span>
              </figcaption>
              <div className="p-muestra__cuerpo">
                <Semaforo nivel="rojo" tamano="grande" />
                <p className="p-muestra__titulo">{RESUMEN_NIVEL.rojo.titulo}</p>
                <ResumenNiveles porParametro={MUESTRA} />
                <ListaParametros>
                  {MUESTRA.map((fila) => (
                    <FilaParametro key={fila.nombre} {...fila} />
                  ))}
                </ListaParametros>
                <PorQueTeLoRecomendamos
                  sugerido={{
                    motivo:
                      'Tu nitrato salió en Rojo y tu dureza en Amarillo. Este cartucho está pensado para reducir el nitrato, según el fabricante.',
                    atiende: [
                      { clave: 'nitrato', nombre: 'Nitrato', nivel: 'rojo' },
                      { clave: 'dureza', nombre: 'Dureza', nivel: 'amarillo' },
                    ],
                  }}
                />
                <p className="p-muestra__aviso">{TEXTO_AVISO_TIRA}</p>
              </div>
            </figure>
          </div>
        </section>

        <BannerFiltro />

        {/* Confianza */}
        <section className="p-banner" aria-labelledby="p-confianza-titulo">
          <div className="p-envoltura p-pila">
            <p className="p-eyebrow">Quién te atiende</p>
            <h2 className="p-h2" id="p-confianza-titulo">
              Te atienden las tiendas Grimuca
            </h2>
            <ul className="p-tiendas">
              {TIENDAS.map((tienda) => (
                <li key={tienda.nombre}>
                  <Icono nombre="tienda" />
                  <strong>{tienda.nombre}</strong>
                  <span>{tienda.zona}</span>
                  <span className="p-tiendas__lugar">{tienda.lugar}</span>
                </li>
              ))}
            </ul>
            <ul className="p-garantias">
              <li>
                <Icono nombre="whatsapp" className="p-garantias__wa" />
                <span>
                  <strong>Te atendemos por WhatsApp.</strong> Lunes a viernes de 8:30 a.m. a 4:30 p.m. y sábados de 9:00 a.m.
                  a 2:00 p.m.
                </span>
              </li>
              <li>
                <Icono nombre="check" />
                <span>
                  <strong>Filtros y cartuchos: no pagas nada hasta confirmar con la tienda.</strong> Cotizas con tu
                  resultado ya escrito.
                </span>
              </li>
              <li>
                <Icono nombre="info" />
                <span>
                  <strong>{LINEA_ORIENTATIVA}</strong> Te mostramos lo que marcó la tira y, si hace falta, el producto
                  pensado para eso.
                </span>
              </li>
            </ul>
            <div className="p-fila-botones">
              <Boton a="/tiendas" variante="secundario">
                Ver tiendas y horarios
              </Boton>
              <Boton
                href={WHATSAPP_MARCADOR}
                variante="secundario"
                icono={<Icono nombre="whatsapp" className="p-garantias__wa" />}
              >
                Escribir por WhatsApp
              </Boton>
            </div>
          </div>
        </section>

        {/* Dudas frecuentes */}
        <section className="p-banner p-banner--papel" aria-labelledby="p-dudas-titulo">
          <div className="p-envoltura p-pila p-angosto">
            <h2 className="p-h2" id="p-dudas-titulo">
              Dudas frecuentes
            </h2>
            <div className="p-dudas">
              {PREGUNTAS.map((p) => (
                <details key={p.pregunta}>
                  <summary>{p.pregunta}</summary>
                  <p>{p.respuesta}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Cierre */}
        <section className="p-banner p-banner--oscuro g-sobre-azul" aria-labelledby="p-cierre-titulo">
          <div className="p-envoltura p-pila p-angosto p-cierre">
            <p className="p-eyebrow p-eyebrow--azul">{LEMA}</p>
            <h2 className="p-h2 p-h2--claro" id="p-cierre-titulo">
              Mide el agua de tu casa por $9
            </h2>
            <div className="p-cierre__acciones" data-p-cta="">
              {botonCompra}
              <Boton a={desdeSobre ? '/perfil' : '/perfil?ya=1'} variante="sobreAzul" anchoCompleto>
                {desdeSobre ? BOTON_PEDIR : BOTON_YA_TENGO}
              </Boton>
            </div>
            <p className="p-cierre__legal">{LINEA_ORIENTATIVA}</p>
            <nav className="p-pie" aria-label="Más información">
              <Link to="/tiendas">Grimuca · Mañongo · Big Low · CC CEM</Link>
              <Link to="/privacidad">Aviso de privacidad</Link>
              <Link to="/terminos">Términos de uso</Link>
            </nav>
          </div>
        </section>
      </main>
      <BarraCompra principal={principal} />
    </>
  );
}
