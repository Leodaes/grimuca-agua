// Contenido de los tutoriales de cambio de cartucho (maqueta para la demo).
// Para editar: cambia los textos aquí. Los videos todavía no existen: la miniatura dice "disponible pronto".
import type { ServicioTecnico } from '../../lib/tipos';

export type Nivel = 'Fácil' | 'Intermedio';

export interface PasoTutorial {
  titulo: string;
  detalle?: string;
}

export interface Tutorial {
  /** Va en la ruta: /tutoriales/:id */
  id: string;
  titulo: string;
  resumen: string;
  /** Duración del video de demostración, en minutos. */
  minutos: number;
  nivel: Nivel;
  necesitas: string[];
  pasos: PasoTutorial[];
}

export const NOTA_FABRICANTE = 'Guía general. Sigue siempre el manual del fabricante de tu filtro.';
export const ROTULO_VIDEO = 'Video de demostración: disponible pronto';
export const ROTULO_DEMO = 'Contenido de demostración';

const NECESITAS_BASE = ['Llave del portafiltro', 'Un balde', 'Un paño', 'El cartucho nuevo'];

// Pasos comunes a los cartuchos que van dentro de un vaso (sedimentos y carbón).
function pasosDeVaso(cartucho: string, extra: PasoTutorial): PasoTutorial[] {
  return [
    { titulo: 'Cierra la llave de paso', detalle: 'La que alimenta el filtro, para que no llegue más agua.' },
    { titulo: 'Abre un grifo para soltar la presión', detalle: 'Déjalo abierto hasta que deje de salir agua.' },
    { titulo: 'Afloja el vaso con la llave', detalle: 'Pon el balde debajo: va a caer un poco de agua.' },
    { titulo: `Saca el ${cartucho} usado`, detalle: 'Fíjate en qué posición estaba para poner el nuevo igual.' },
    { titulo: 'Lava el vaso y revisa el anillo de goma', detalle: 'Sécalo con el paño. Si el anillo está partido o reseco, cámbialo.' },
    extra,
    { titulo: 'Cierra el vaso a mano, sin forzar', detalle: 'Apretar de más daña la rosca y el anillo.' },
    { titulo: 'Abre la llave y revisa que no gotee', detalle: 'Si gotea, cierra el agua y acomoda el anillo.' },
    { titulo: 'Deja correr el agua unos 5 minutos antes de usarla', detalle: 'Así sale el polvo del cartucho nuevo.' },
    { titulo: 'Anota la fecha del cambio', detalle: 'Puedes hacerlo aquí abajo y te avisamos en la app cuándo toca el próximo.' },
  ];
}

export const TUTORIALES: Tutorial[] = [
  {
    id: 'sedimentos',
    titulo: 'Cómo cambiar el cartucho de sedimentos',
    resumen: 'Es el primero del filtro: retiene la arena y el óxido. Suele ser el que más rápido se ensucia.',
    minutos: 3,
    nivel: 'Fácil',
    necesitas: NECESITAS_BASE,
    pasos: pasosDeVaso('cartucho de sedimentos', {
      titulo: 'Coloca el cartucho nuevo de sedimentos',
      detalle: 'Céntralo en el vaso. Quítale el plástico antes de ponerlo.',
    }),
  },
  {
    id: 'carbon',
    titulo: 'Cómo cambiar el cartucho de carbón',
    resumen: 'Va después del de sedimentos y está pensado para reducir el cloro, el sabor y el olor.',
    minutos: 3,
    nivel: 'Fácil',
    necesitas: NECESITAS_BASE,
    pasos: pasosDeVaso('cartucho de carbón', {
      titulo: 'Coloca el cartucho nuevo de carbón',
      detalle: 'Respeta la flecha del sentido del agua si la trae. Quítale el plástico antes de ponerlo.',
    }),
  },
  {
    id: 'membrana',
    titulo: 'Cómo cambiar la membrana de ósmosis inversa',
    resumen: 'La membrana va en su propia carcasa alargada. Lleva más cuidado que un cartucho común.',
    minutos: 6,
    nivel: 'Intermedio',
    necesitas: [...NECESITAS_BASE.slice(0, 3), 'La membrana nueva', 'Guantes limpios'],
    pasos: [
      { titulo: 'Cierra la llave de paso', detalle: 'También la válvula del tanque de reserva, si tu equipo la tiene.' },
      { titulo: 'Abre el grifo del filtro para soltar la presión', detalle: 'Déjalo abierto hasta que deje de salir agua.' },
      { titulo: 'Suelta la manguera de la carcasa de la membrana', detalle: 'Empuja el anillo del conector y tira de la manguera.' },
      { titulo: 'Abre la tapa de la carcasa', detalle: 'Con la llave o a mano, según el modelo. Ten el balde cerca.' },
      { titulo: 'Saca la membrana usada', detalle: 'Con unas pinzas si hace falta. Fíjate de qué lado tiene los anillos.' },
      { titulo: 'Lava la carcasa y revisa los anillos de goma', detalle: 'Sécala con el paño. Si un anillo está partido, cámbialo.' },
      { titulo: 'Coloca la membrana nueva', detalle: 'Con guantes. Empújala firme hasta el fondo, con los anillos hacia dentro.' },
      { titulo: 'Cierra la tapa a mano, sin forzar, y vuelve a poner la manguera', detalle: 'La manguera debe entrar hasta el tope.' },
      { titulo: 'Abre la llave y revisa que no gotee', detalle: 'Revisa la tapa y cada conector.' },
      { titulo: 'Desecha el primer tanque de agua', detalle: 'Deja que se llene y vacíalo completo antes de usar el agua.' },
      { titulo: 'Anota la fecha del cambio', detalle: 'Puedes hacerlo aquí abajo y te avisamos en la app cuándo toca el próximo.' },
    ],
  },
  {
    id: 'cuando',
    titulo: 'Cómo saber cuándo toca el cambio',
    resumen: 'Señales sencillas para no esperar a que el filtro se tape.',
    minutos: 2,
    nivel: 'Fácil',
    necesitas: ['La fecha del último cambio', 'Tu tira de medición (si la tienes)'],
    pasos: [
      { titulo: 'Mira la fecha del último cambio', detalle: 'Como referencia, el de sedimentos dura unos 3 meses y el de carbón unos 6.' },
      { titulo: 'Fíjate en la presión', detalle: 'Si el agua sale cada vez más despacio, el cartucho puede estar tapado.' },
      { titulo: 'Revisa el color del cartucho de sedimentos', detalle: 'Si se ve marrón o naranja, ya está cargado.' },
      { titulo: 'Atento al sabor y al olor', detalle: 'Si vuelve el sabor a cloro, puede tocar cambiar el de carbón.' },
      { titulo: 'Mide tu agua con la tira', detalle: 'La app te dice cuándo volver a medir y qué cartucho va.' },
      { titulo: 'Anota la fecha cuando lo cambies', detalle: 'Así la app calcula el próximo cambio por ti.' },
    ],
  },
];

export function buscarTutorial(id: string | undefined): Tutorial | undefined {
  return TUTORIALES.find((t) => t.id === id);
}

// --- Contratar a un experto ---

export interface OpcionServicio {
  valor: ServicioTecnico;
  etiqueta: string;
  precio: string;
  /** Texto para la confirmación y el panel. */
  nombre: string;
}

export const OPCIONES_SERVICIO: OpcionServicio[] = [
  { valor: 'cambio_cartucho', etiqueta: 'Cambiar el cartucho', precio: 'Desde $30', nombre: 'Cambio de cartucho' },
  { valor: 'instalacion_filtro', etiqueta: 'Instalar un filtro', precio: 'De $40 a $60', nombre: 'Instalación de filtro' },
];

export const TEXTO_PRECIOS_SERVICIO =
  'Precios referenciales del servicio técnico. No se cobra nada ahora: la tienda te contactará para confirmar el costo y la fecha.';

export function nombreServicio(servicio: ServicioTecnico | null | undefined): string {
  return OPCIONES_SERVICIO.find((o) => o.valor === servicio)?.nombre ?? 'Servicio técnico';
}

export const NOMBRE_MOMENTO = { manana: 'En la mañana', tarde: 'En la tarde' } as const;

/** "lunes, 23 de noviembre" a partir de AAAA-MM-DD (sin correr el día por la zona horaria). */
export function formatearDia(dia: string | null | undefined): string {
  if (!dia) return '';
  const [anio, mes, fecha] = dia.split('-').map(Number);
  if (!anio || !mes || !fecha) return dia;
  return new Date(anio, mes - 1, fecha).toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Fecha preferida y momento en una línea: "lunes, 23 de noviembre · En la tarde". */
export function textoFechaPreferida(dia: string | null | undefined, momento: 'manana' | 'tarde' | null | undefined): string {
  return [formatearDia(dia), momento ? NOMBRE_MOMENTO[momento] : ''].filter(Boolean).join(' · ');
}
