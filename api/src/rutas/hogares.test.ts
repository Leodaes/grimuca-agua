import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearEntorno, perfilDePrueba, type Entorno } from './ayudas-prueba';
import { fechaDeUltimoCambio } from './hogares';

let e: Entorno;
beforeEach(async () => {
  e = await crearEntorno();
});
afterEach(async () => {
  await e.app.close();
});

async function crear(cambios: Record<string, unknown> = {}) {
  return e.app.inject({ method: 'POST', url: '/api/hogares', payload: perfilDePrueba(cambios) });
}

describe('WhatsApp del hogar', () => {
  it.each(['0414-555-0199', '4145550199', '+58 414 5550199', '584145550199', '00584145550199'])(
    'POST guarda %s como +584145550199',
    async (whatsapp) => {
      const respuesta = await crear({ whatsapp });
      expect(respuesta.statusCode).toBe(201);
      expect(respuesta.json().whatsapp).toBe('+584145550199');
    },
  );

  it('rechaza un número que no es celular y normaliza también en PATCH', async () => {
    const malo = await crear({ whatsapp: '0241-555-0199' });
    expect(malo.statusCode).toBe(400);
    expect(JSON.stringify(malo.json())).toContain('debe ser un celular');

    const hogar = (await crear()).json();
    const cambiado = await e.app.inject({ method: 'PATCH', url: `/api/hogares/${hogar.id}`, payload: { whatsapp: '+57 300 123 4567' } });
    expect(cambiado.json().whatsapp).toBe('+573001234567');
  });

  it('un número viejo guardado con otro formato se sigue leyendo', async () => {
    const hogar = (await crear()).json();
    await e.bd.query('UPDATE hogares SET whatsapp = $1 WHERE id = $2', ['0414-555-0199', hogar.id]);
    const leido = await e.app.inject({ method: 'GET', url: `/api/hogares/${hogar.id}` });
    expect(leido.statusCode).toBe(200);
    expect(leido.json().whatsapp).toBe('0414-555-0199');
  });
});

describe('último cambio de cartucho (respuesta cerrada)', () => {
  it('deriva la fecha: menos de un mes, más de tres meses, no me acuerdo', async () => {
    const menos = (await crear({ tiene_filtro: true, ultimo_cambio: 'menos_de_un_mes' })).json();
    expect(menos.ultimo_cambio).toBe('menos_de_un_mes');
    expect(menos.fecha_ultimo_cambio).toBe(fechaDeUltimoCambio('menos_de_un_mes'));

    const mas = (await crear({ tiene_filtro: true, ultimo_cambio: 'mas_de_tres_meses' })).json();
    expect(mas.fecha_ultimo_cambio).toBe(fechaDeUltimoCambio('mas_de_tres_meses'));

    const nose = (await crear({ tiene_filtro: true, ultimo_cambio: 'no_me_acuerdo', fecha_ultimo_cambio: '2026-01-01' })).json();
    expect(nose.ultimo_cambio).toBe('no_me_acuerdo');
    expect(nose.fecha_ultimo_cambio).toBeNull();

    const sinFiltro = (await crear({ tiene_filtro: false, ultimo_cambio: 'mas_de_tres_meses' })).json();
    expect(sinFiltro.ultimo_cambio).toBeNull();
    expect(sinFiltro.fecha_ultimo_cambio).toBeNull();
  });

  it('PATCH: "Ya lo cambié" deja la fecha de hoy; la misma respuesta no reinicia la fecha', async () => {
    const hogar = (await crear({ tiene_filtro: true, ultimo_cambio: 'mas_de_tres_meses' })).json();
    const url = `/api/hogares/${hogar.id}`;
    const hoy = '2026-11-21';
    const tutorial = (await e.app.inject({ method: 'PATCH', url, payload: { tiene_filtro: true, ultimo_cambio: 'menos_de_un_mes', fecha_ultimo_cambio: hoy } })).json();
    expect(tutorial).toMatchObject({ ultimo_cambio: 'menos_de_un_mes', fecha_ultimo_cambio: hoy });

    const otraVez = (await e.app.inject({ method: 'PATCH', url, payload: { ultimo_cambio: 'menos_de_un_mes', nombre: 'Otro' } })).json();
    expect(otraVez.fecha_ultimo_cambio).toBe(hoy);

    const quita = (await e.app.inject({ method: 'PATCH', url, payload: { tiene_filtro: false } })).json();
    expect(quita).toMatchObject({ ultimo_cambio: null, fecha_ultimo_cambio: null });
  });

  it('fechaDeUltimoCambio resta 15 o 100 días', () => {
    const hoy = new Date(2026, 10, 21);
    expect(fechaDeUltimoCambio('menos_de_un_mes', hoy)).toBe('2026-11-06');
    expect(fechaDeUltimoCambio('mas_de_tres_meses', hoy)).toBe('2026-08-13');
    expect(fechaDeUltimoCambio('no_me_acuerdo', hoy)).toBeNull();
  });
});

describe('sugeridos con motivo', () => {
  it('cada sugerido de una medición trae su frase y lo que atiende', async () => {
    const hogar = (await crear({ personas: 5 })).json();
    const respuesta = await e.app.inject({
      method: 'POST',
      url: '/api/mediciones/manual',
      payload: { hogar_id: hogar.id, valores: { nitrato: 50, dureza: 425, cloro_libre: 1 } },
    });
    const medicion = respuesta.json();
    expect(medicion.sugeridos.length).toBeGreaterThan(0);
    for (const s of medicion.sugeridos) {
      expect(s.motivo).toMatch(/^Te recomendamos /);
      expect(Array.isArray(s.atiende)).toBe(true);
    }
    expect(new Set(medicion.sugeridos.map((s: { motivo: string }) => s.motivo)).size).toBe(medicion.sugeridos.length);
  });
});
