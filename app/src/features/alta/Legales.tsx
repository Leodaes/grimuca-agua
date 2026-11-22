import { Link } from 'react-router-dom';
import { PaginaAlta } from './comun';

const estilo = { maxWidth: '70ch' };

function Volver() {
  return (
    <p>
      <Link className="g-enlace" to="/">
        Volver
      </Link>
    </p>
  );
}

export function Privacidad() {
  return (
    <PaginaAlta>
      <Volver />
      <article className="g-pila" style={estilo}>
        <h1 className="g-h1">Aviso de privacidad</h1>
        <p>
          <strong>Quién recoge tus datos.</strong> Grimuca Agua, proyecto de [RESPONSABLE], en
          Valencia, Venezuela.
        </p>
        <p>
          <strong>Qué datos.</strong> Tu nombre, zona, WhatsApp y dirección; los datos de tu hogar
          (de dónde viene el agua que toman, cuántos viven, si tienen filtro y cuándo cambiaron el
          cartucho, si el agua sale turbia); la foto de tu tira, tus resultados y tus pedidos.
        </p>
        <p>
          <strong>Para qué.</strong> Para enviarte el sobre, leer tu tira, mostrarte tus
          resultados, sugerirte productos, despachar tus pedidos desde la tienda y ver, de forma
          agrupada, cómo está el agua por zona. No te mandamos publicidad sin pedirte permiso
          aparte.
        </p>
        <p>
          <strong>Con quién se comparten.</strong> Con el personal de la tienda Grimuca que
          despacha tu pedido. La foto de la tira, sin tu nombre, teléfono ni dirección, se envía a
          un servicio externo que la lee de forma automática ([PROVEEDOR]). Los datos se guardan en
          un servidor contratado, que puede estar fuera de Venezuela. Los datos por zona se
          muestran agrupados, sin identificar tu hogar. No vendemos tus datos.
        </p>
        <p>
          <strong>Cuánto tiempo.</strong> Mientras uses el servicio y hasta 12 meses después de tu
          última medición o pedido. Los datos de esta demostración se borran a más tardar el
          [FECHA].
        </p>
        <p>
          <strong>Tus derechos.</strong> Puedes pedir ver, corregir o borrar tus datos, o retirar
          tu permiso, cuando quieras. Escribe a [CONTACTO] y te respondemos en un máximo de 15 días
          hábiles.
        </p>
        <p>
          Este servicio es para mayores de 18 años. Base: artículos 28 y 60 de la Constitución de
          la República Bolivariana de Venezuela.
        </p>
      </article>
    </PaginaAlta>
  );
}

const TERMINOS: Array<[string, string]> = [
  [
    'Resultado orientativo.',
    'Grimuca Agua lee una tira casera y un frasco de prueba y te muestra lo que marcaron. No es un análisis de laboratorio y no certifica el agua.',
  ],
  ['Esta tira no mide todo.', 'Un buen resultado no significa que el agua sea apta para tomar.'],
  [
    'No es consejo de salud.',
    'La app no da consejo médico. Si tienes dudas sobre tu salud, consulta a un médico; si quieres certeza sobre tu agua, pide un análisis de laboratorio.',
  ],
  [
    'Lectura automática.',
    'La foto se lee de forma automática y puede equivocarse. Compara siempre con la tabla de colores y corrige si hace falta.',
  ],
  [
    'Plomo, cobre y bacterias.',
    'Estos resultados indican solo una posible presencia. Confírmalos con un laboratorio antes de sacar conclusiones.',
  ],
  [
    'Productos sugeridos.',
    'Son una recomendación comercial según tu resultado y tu hogar. Los productos y precios de esta versión son de ejemplo.',
  ],
  [
    'Pago simulado.',
    'En esta demostración no se cobra nada, no se piden datos de tarjeta ni de banco y no se envía un sobre real.',
  ],
  ['Tus datos.', 'Se usan como explica el Aviso de privacidad.'],
  [
    'Uso correcto.',
    'Sigue las instrucciones del sobre. No tomes el líquido de las pruebas y mantenlas lejos de los niños.',
  ],
  ['Contacto.', '[CONTACTO]. Proyecto de [RESPONSABLE], Valencia, Venezuela.'],
];

export function Terminos() {
  return (
    <PaginaAlta>
      <Volver />
      <article className="g-pila" style={estilo}>
        <h1 className="g-h1">Términos de uso</h1>
        <ol className="g-pila">
          {TERMINOS.map(([titulo, texto]) => (
            <li key={titulo}>
              <strong>{titulo}</strong> {texto}
            </li>
          ))}
        </ol>
        <p>
          <Link className="g-enlace" to="/privacidad">
            Leer el Aviso de privacidad
          </Link>
        </p>
      </article>
    </PaginaAlta>
  );
}
