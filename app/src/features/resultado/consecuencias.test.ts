import type { ClaveParametro, Nivel } from '../../lib/tipos';
import {
  LINEA_FIJA_CONSECUENCIAS,
  armarConclusion,
  fraseCorta,
  ordenarPorGravedad,
  pasosQueHacerHoy,
  siNoHacesNada,
  type ParametroLeido,
  type PerfilConclusion,
} from './consecuencias';

const NOMBRES: Record<ClaveParametro, string> = {
  alcalinidad: 'Alcalinidad',
  dureza: 'Dureza',
  cobre: 'Cobre',
  nitrato: 'Nitrato',
  cloro_libre: 'Cloro libre',
  plomo: 'Plomo',
  ph: 'pH',
  nitrito: 'Nitrito',
  hierro: 'Hierro',
};

const VALOR_VERDE: Record<ClaveParametro, number> = {
  alcalinidad: 80,
  dureza: 50,
  cobre: 0,
  nitrato: 0,
  cloro_libre: 1,
  plomo: 0,
  ph: 7.2,
  nitrito: 0,
  hierro: 0,
};

/** Las 9 casillas en verde, con los cambios que se pidan. */
function medicion(cambios: Partial<Record<ClaveParametro, [Nivel, number | null]>> = {}): ParametroLeido[] {
  return (Object.keys(NOMBRES) as ClaveParametro[]).map((clave) => {
    const [nivel, valor] = cambios[clave] ?? ['verde', VALOR_VERDE[clave]];
    return { clave, nombre: NOMBRES[clave], nivel, valor };
  });
}

/** El caso del dueño: plomo, cobre y nitrito en rojo; pH en amarillo (ácido); el resto en verde. */
const CASO_DUENO = medicion({ plomo: ['rojo', 15], cobre: ['rojo', 2], nitrito: ['rojo', 5], ph: ['amarillo', 6.2] });

const HOGAR_4_CON_MASCOTAS: PerfilConclusion = {
  personas: 4,
  mascotas: true,
  origen_agua: 'chorro',
  tiene_filtro: true,
  etapas_filtro: 3,
  ultimo_cambio: 'mas_de_tres_meses',
};

const PROHIBIDAS = /potable|segur[ao]|te vas a enfermar|estás intoxicad|contaminad|elimina|purific|garantiz/i;

/** "apta" solo en "no certifica que el agua sea apta"; "certific" solo en esa misma frase. */
function sinPalabrasProhibidas(texto: string) {
  expect(texto).not.toMatch(PROHIBIDAS);
  const sinFraseAprobada = texto.replace('no certifica que el agua sea apta para tomar', '');
  expect(sinFraseAprobada).not.toMatch(/\bapta\b|certific/i);
  expect(texto).not.toMatch(/undefined|null|NaN|\s{2,}|\s[.,:]/);
}

describe('ordenarPorGravedad', () => {
  it('rojos de salud primero, luego rojos operativos, amarillos de salud y amarillos operativos', () => {
    const orden = ordenarPorGravedad(
      medicion({ dureza: ['rojo', 425], ph: ['amarillo', 6.2], nitrato: ['amarillo', 25], cobre: ['rojo', 2], plomo: ['rojo', 15] }),
    ).map((p) => p.clave);
    expect(orden).toEqual(['plomo', 'cobre', 'dureza', 'nitrato', 'ph']);
  });
});

describe('armarConclusion', () => {
  it('caso del dueño: tres rojos de salud, 4 en casa y con mascotas', () => {
    const texto = armarConclusion({ porParametro: CASO_DUENO, hogar: HOGAR_4_CON_MASCOTAS, diasParaRecambio: 0 });
    expect(texto).toBe(
      'Tu agua necesita atención en 3 cosas: plomo, cobre y nitrito. ' +
        'Lo primero es no usarla para tomar ni cocinar mientras la confirmas con un laboratorio. ' +
        'Son 4 en casa y tienen mascotas: ellas también toman de esa agua.',
    );
    sinPalabrasProhibidas(texto);
  });

  it('rojo de salud sin mascotas: la precaución es para todos', () => {
    const texto = armarConclusion({ porParametro: CASO_DUENO, hogar: { ...HOGAR_4_CON_MASCOTAS, mascotas: false } });
    expect(texto).toContain('Son 4 en casa: la precaución es para todos.');
    expect(texto).not.toMatch(/mascotas/);
  });

  it('rojo de salud sin perfil: solo las dos primeras oraciones', () => {
    const texto = armarConclusion({ porParametro: medicion({ nitrato: ['rojo', 50] }), hogar: null });
    expect(texto).toBe(
      'Tu agua necesita atención en 1 cosa: nitrato. Lo primero es no usarla para tomar ni cocinar mientras la confirmas con un laboratorio.',
    );
  });

  it('cloro en rojo: primero repetir la prueba', () => {
    const texto = armarConclusion({ porParametro: medicion({ cloro_libre: ['rojo', 5] }) });
    expect(texto).toContain('Lo primero es repetir la prueba');
  });

  it('solo amarillos operativos: no salió nada en rojo y no es urgente', () => {
    const texto = armarConclusion({ porParametro: medicion({ dureza: ['amarillo', 250] }), hogar: { tiene_filtro: false } });
    expect(texto).toBe(
      'No salió nada en rojo. Tu agua tiene sarro (dureza en Amarillo): no es urgente, pero desgasta la grifería y los equipos.',
    );
    sinPalabrasProhibidas(texto);
  });

  it('varios amarillos operativos y recambio pendiente', () => {
    const texto = armarConclusion({
      porParametro: medicion({ dureza: ['amarillo', 250], ph: ['amarillo', 8.8] }),
      hogar: { tiene_filtro: true, ultimo_cambio: 'mas_de_tres_meses' },
    });
    expect(texto).toContain('Hay 2 casillas para vigilar: dureza y pH.');
    expect(texto).toContain('Ya te toca cambiar el cartucho.');
    sinPalabrasProhibidas(texto);
  });

  it('amarillo de salud (plomo): no salió rojo, pero se confirma con un laboratorio', () => {
    const texto = armarConclusion({ porParametro: medicion({ plomo: ['amarillo', 5] }) });
    expect(texto).toContain('hay 1 casilla para vigilar: plomo.');
    expect(texto).toContain('Confírmalo con un laboratorio');
  });

  it('todo verde: no certifica que sea apta y dice cuándo volver a medir y cuándo toca el recambio', () => {
    const texto = armarConclusion({
      porParametro: medicion(),
      hogar: { tiene_filtro: true, ultimo_cambio: null },
      diasParaRecambio: 30,
    });
    expect(texto).toBe(
      'Lo que midió tu tira está en rango. ' +
        'Esto no certifica que el agua sea apta para tomar: la tira no mide bacterias ni todo lo que puede traer el agua. ' +
        'Vuelve a medir en 3 meses; te toca cambiar el cartucho en 30 días.',
    );
    sinPalabrasProhibidas(texto);
  });

  it('todo verde sin filtro: volver a medir', () => {
    const texto = armarConclusion({ porParametro: medicion(), hogar: { tiene_filtro: false }, diasParaRecambio: 30 });
    expect(texto).toContain('Vuelve a medir en 3 meses o antes si el agua cambia de olor, color o sabor.');
    expect(texto).not.toMatch(/cartucho/);
  });

  it('casillas sin lectura: lo dice y pide repetir la foto', () => {
    const texto = armarConclusion({ porParametro: medicion({ hierro: ['sin_dato', null], nitrito: ['sin_dato', null] }) });
    expect(texto).toContain('2 casillas no se pudieron leer: repite la foto o cárgalas a mano para completar tu resultado.');
    const una = armarConclusion({ porParametro: medicion({ hierro: ['sin_dato', null] }) });
    expect(una).toContain('1 casilla no se pudo leer: repite la foto o cárgala a mano para completar tu resultado.');
  });

  it('nada leído: pide repetir la foto', () => {
    const todo = (Object.keys(NOMBRES) as ClaveParametro[]).reduce(
      (acc, clave) => ({ ...acc, [clave]: ['sin_dato', null] }),
      {} as Partial<Record<ClaveParametro, [Nivel, number | null]>>,
    );
    expect(armarConclusion({ porParametro: medicion(todo) })).toBe(
      'No pudimos leer las casillas: repite la foto o carga los colores a mano.',
    );
  });
});

describe('siNoHacesNada', () => {
  it('caso del dueño: una línea por rojo y amarillo, de la más grave a la menos, con fuente', () => {
    const lineas = siNoHacesNada(CASO_DUENO);
    expect(lineas.map((l) => [l.clave, l.nivel])).toEqual([
      ['plomo', 'rojo'],
      ['cobre', 'rojo'],
      ['nitrito', 'rojo'],
      ['ph', 'amarillo'],
    ]);
    expect(lineas[0].texto).toContain('se va acumulando en el cuerpo');
    expect(lineas[0].nota).toBe('La tira solo marca una posible presencia: por eso el primer paso es confirmarlo.');
    expect(lineas[2].texto).toContain('bebés menores de 6 meses');
    expect(lineas[3].texto).toContain('Un agua ácida desgasta las tuberías');
    for (const l of lineas) expect(l.fuente).toBeTruthy();
  });

  it('todas las líneas, en todos los niveles, sin palabras prohibidas ni certezas sobre plomo o cobre', () => {
    for (const clave of Object.keys(NOMBRES) as ClaveParametro[]) {
      for (const [nivel, valor] of [
        ['amarillo', 1],
        ['rojo', 500],
        ['amarillo', 9],
      ] as Array<[Nivel, number]>) {
        for (const linea of siNoHacesNada(medicion({ [clave]: [nivel, valor] }))) {
          sinPalabrasProhibidas(`${linea.texto} ${linea.nota ?? ''}`.trim());
          expect(linea.texto).not.toMatch(/tu agua tiene (plomo|cobre)/i);
        }
      }
    }
    expect(LINEA_FIJA_CONSECUENCIAS).toBe(
      'Esto es información general, no un diagnóstico. Si alguien en casa se siente mal, consulta a un médico.',
    );
    expect(LINEA_FIJA_CONSECUENCIAS).not.toMatch(PROHIBIDAS);
  });

  it('todo verde: no hay líneas', () => {
    expect(siNoHacesNada(medicion())).toEqual([]);
  });
});

describe('pasosQueHacerHoy', () => {
  it('caso del dueño: proteger, confirmar y la opción para la casa', () => {
    const pasos = pasosQueHacerHoy({ porParametro: CASO_DUENO, hogar: HOGAR_4_CON_MASCOTAS, hayRecomendado: true });
    expect(pasos.map((p) => p.id)).toEqual(['proteger', 'confirmar', 'solucion']);
    expect(pasos[0].detalle).toBe(
      'Usa agua de botellón para tomar, cocinar y preparar teteros mientras confirmas. Dales esa misma agua a tus mascotas. ' +
        'No sirve hervirla: hervir no quita el plomo ni el cobre, y el nitrito se concentra (EPA).',
    );
    expect(pasos[1].detalle).toContain('Pregunta en tu tienda Grimuca por dónde hacerlo.');
    expect(pasos[2].detalle).toContain('Lo que te recomendamos');
    for (const p of pasos) sinPalabrasProhibidas(`${p.titulo} ${p.detalle}`);
  });

  it('sin mascotas no se nombran', () => {
    const pasos = pasosQueHacerHoy({ porParametro: CASO_DUENO, hogar: { personas: 2, mascotas: false }, hayRecomendado: true });
    expect(pasos[0].detalle).not.toMatch(/mascotas/);
  });

  it('solo nitrato en rojo: hervir lo concentra; filtro de 3 etapas no está pensado para nitrato', () => {
    const pasos = pasosQueHacerHoy({
      porParametro: medicion({ nitrato: ['rojo', 50] }),
      hogar: { tiene_filtro: true, etapas_filtro: 3 },
      hayRecomendado: true,
    });
    expect(pasos[0].detalle).toContain('No sirve hervirla: al hervir, el nitrato se concentra (EPA).');
    expect(pasos[2].detalle).toContain('Un filtro de 3 etapas de sedimentos y carbón no está pensado para nitrato.');
  });

  it('solo amarillos operativos: repetir, revisar el filtro o preguntar, y la opción para la casa', () => {
    const conFiltro = pasosQueHacerHoy({
      porParametro: medicion({ dureza: ['amarillo', 250] }),
      hogar: { tiene_filtro: true, ultimo_cambio: 'no_me_acuerdo' },
      hayRecomendado: false,
    });
    expect(conFiltro.map((p) => p.id)).toEqual(['repetir', 'revisar_filtro', 'solucion']);
    expect(conFiltro[2].detalle).toContain('Pregunta en tu tienda Grimuca');
    const sinFiltro = pasosQueHacerHoy({ porParametro: medicion({ dureza: ['amarillo', 250] }), hogar: { tiene_filtro: false }, hayRecomendado: true });
    expect(sinFiltro.map((p) => p.id)).toEqual(['repetir', 'preguntar_tienda', 'solucion']);
  });

  it('todo verde: volver a medir en 3 meses, el recambio y ver productos', () => {
    const pasos = pasosQueHacerHoy({ porParametro: medicion(), hogar: { tiene_filtro: true }, diasParaRecambio: 30, hayRecomendado: false });
    expect(pasos.map((p) => p.titulo)).toEqual(['Vuelve a medir en 3 meses', 'Revisa el recambio de tu filtro', 'Mira los productos']);
    expect(pasos[1].detalle).toBe('Te toca cambiar el cartucho en 30 días.');
    const sinFiltro = pasosQueHacerHoy({ porParametro: medicion(), hogar: { tiene_filtro: false }, hayRecomendado: false });
    expect(sinFiltro[1].id).toBe('sin_filtro');
  });

  it('casillas sin lectura y el resto en verde: primero completar el resultado', () => {
    const pasos = pasosQueHacerHoy({ porParametro: medicion({ hierro: ['sin_dato', null] }), hayRecomendado: false });
    expect(pasos[0].id).toBe('completar');
  });

  it('ningún paso, en ningún caso, trae palabras prohibidas', () => {
    const casos = [
      CASO_DUENO,
      medicion({ cloro_libre: ['rojo', 5] }),
      medicion({ hierro: ['rojo', 3], alcalinidad: ['amarillo', 0] }),
      medicion({ cobre: ['amarillo', 1] }),
      medicion(),
    ];
    const hogares: Array<PerfilConclusion | null> = [null, HOGAR_4_CON_MASCOTAS, { tiene_filtro: true, etapas_filtro: 5 }];
    for (const porParametro of casos) {
      for (const hogar of hogares) {
        sinPalabrasProhibidas(armarConclusion({ porParametro, hogar, diasParaRecambio: 10 }));
        for (const p of pasosQueHacerHoy({ porParametro, hogar, hayRecomendado: true })) sinPalabrasProhibidas(`${p.titulo} ${p.detalle}`);
      }
    }
  });
});

describe('fraseCorta', () => {
  it('una frase por casilla; plomo y cobre como posible presencia', () => {
    expect(fraseCorta({ clave: 'plomo', nombre: 'Plomo', nivel: 'rojo', valor: 15 })).toBe('Posible presencia. Confírmalo con un laboratorio.');
    expect(fraseCorta({ clave: 'plomo', nombre: 'Plomo', nivel: 'verde', valor: 0 })).toBe('La tira no marcó presencia de plomo.');
    expect(fraseCorta({ clave: 'ph', nombre: 'pH', nivel: 'amarillo', valor: 6.2 })).toBe('Algo ácida: desgasta las tuberías.');
    expect(fraseCorta({ clave: 'ph', nombre: 'pH', nivel: 'amarillo', valor: 8.8 })).toBe('Algo alcalina: puede dejar sarro.');
    expect(fraseCorta({ clave: 'hierro', nombre: 'Hierro', nivel: 'sin_dato', valor: null })).toMatch(/No se pudo leer/);
  });
});
