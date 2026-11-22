import type { ResultadoParametro } from '../../lib/tipos';
import {
  avisoDeRecambio,
  datosDelHogar,
  mensajeBacteriasUV,
  mensajeCotizar,
  mensajePreguntarFiltros,
  mensajeRecambio,
  resumenMedicion,
} from './textos';

const p = (clave: ResultadoParametro['clave'], nombre: string, nivel: ResultadoParametro['nivel']): ResultadoParametro => ({
  clave,
  nombre,
  unidad: '',
  valor: 1,
  nivel,
  frase: '',
  orientativo: clave === 'plomo' || clave === 'cobre',
});

function sinHuecos(texto: string) {
  expect(texto).not.toMatch(/undefined|null|NaN|\{|\}/);
  expect(texto).not.toMatch(/\s{2,}/);
  expect(texto).not.toMatch(/\s[.,]/);
  expect(texto).not.toMatch(/,\s*\./);
}

describe('mensajes de WhatsApp', () => {
  it('con todos los datos arma el mensaje de Marketing', () => {
    const texto = mensajeCotizar(
      {
        nombre: 'Ana',
        zona: 'San Diego',
        fecha: '2026-11-22T15:00:00.000Z',
        personas: 3,
        tieneFiltro: true,
        etapas: 2,
        tienda: 'Big Low',
        porParametro: [p('cloro_libre', 'Cloro', 'amarillo'), p('dureza', 'Dureza', 'rojo'), p('ph', 'pH', 'verde'), p('cobre', 'Cobre', 'amarillo')],
      },
      { nombre: 'Cartucho GAC', codigo: 'OPW-GAC' },
    );
    expect(texto).toBe(
      'Hola, soy Ana, de San Diego. Medí mi agua con el sobre de Grimuca Agua el 22 de noviembre de 2026. ' +
        'Casillas para vigilar o atender: Cloro: Amarillo, Dureza: Rojo, Cobre: Amarillo (orientativo). ' +
        'Somos 3 en casa y tenemos un filtro de 2 etapas. Quiero cotizar: Cartucho GAC (código OPW-GAC). ¿Tienen en Grimuca Big Low?',
    );
  });

  it('sin datos del hogar no deja huecos ni "undefined"', () => {
    const cotizar = mensajeCotizar({}, { nombre: 'Cartucho GAC' });
    expect(cotizar).toBe('Hola. Quiero cotizar: Cartucho GAC. ¿Tienen en su tienda más cercana?');
    sinHuecos(cotizar);

    const parcial = mensajeCotizar(datosDelHogar({ nombre: 'Luis', zona: 'Otra', personas: null, tiene_filtro: false }), {
      nombre: 'Filtro',
      codigo: 'F-1',
    });
    expect(parcial).toBe('Hola, soy Luis. Todavía no tenemos filtro. Quiero cotizar: Filtro (código F-1). ¿Tienen en su tienda más cercana?');
    sinHuecos(parcial);

    for (const texto of [mensajeRecambio({}), mensajePreguntarFiltros({}), mensajeBacteriasUV({}), mensajeRecambio(datosDelHogar(null))]) {
      sinHuecos(texto);
      expect(texto.startsWith('Hola.')).toBe(true);
    }
    expect(mensajeRecambio({})).toBe('Hola. Tengo un filtro y no me acuerdo cuándo fue el último cambio de cartucho. Quiero cotizar el recambio.');
    expect(mensajePreguntarFiltros({})).toBe('Hola. No tenemos filtro. ¿Qué filtros tienen y cuánto cuestan?');
  });

  it('recambio con fecha del último cambio y bacterias con nombre y zona', () => {
    expect(mensajeRecambio({ nombre: 'Ana', fechaUltimoCambio: '2026-08-13', etapas: 3 })).toBe(
      'Hola, soy Ana. Tengo un filtro de 3 etapas y el último cambio de cartucho fue el 13 de agosto de 2026. Quiero cotizar el recambio.',
    );
    expect(mensajeRecambio({ ultimoCambio: 'mas_de_tres_meses' })).toContain('fue hace más de tres meses.');
    expect(mensajeBacteriasUV({ nombre: 'Ana', zona: 'Naguanagua' })).toBe(
      'Hola, soy Ana, de Naguanagua. Mi prueba de bacterias cambió de color a las 48 horas. Quiero consultar la lámpara UV.',
    );
  });

  it('resumen: todo verde, sin lecturas', () => {
    expect(resumenMedicion([p('ph', 'pH', 'verde')])).toBe('Todas las casillas medidas salieron en Verde.');
    expect(resumenMedicion([p('ph', 'pH', 'sin_dato')])).toBe('');
    expect(resumenMedicion(undefined)).toBe('');
  });
});

describe('aviso de recambio según la respuesta del perfil', () => {
  it('más de tres meses, no me acuerdo, menos de un mes y sin respuesta', () => {
    expect(avisoDeRecambio(80, 'mas_de_tres_meses')?.texto).toBe('Ya te toca cambiar el cartucho.');
    expect(avisoDeRecambio(null, 'no_me_acuerdo')?.texto).toBe('Como no recuerdas el último cambio, conviene revisarlo.');
    expect(avisoDeRecambio(75, 'menos_de_un_mes')).toBeNull();
    expect(avisoDeRecambio(30, null)?.texto).toBe('Te toca cambiar el cartucho en 30 días.');
    expect(avisoDeRecambio(null, null)).toBeNull();
  });
});
