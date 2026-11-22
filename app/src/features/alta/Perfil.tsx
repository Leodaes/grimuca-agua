import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Aviso, Boton, Campo, Cargando, Casilla, Icono } from '../../components/grimuca';
import { api } from '../../lib/api';
import { guardarHogarId, hogarId } from '../../lib/sesion';
import type { Hogar, OrigenAgua, TipoCliente, UltimoCambio } from '../../lib/tipos';
import { CentroMasCercano } from '../centros/TarjetaCentro';
import {
  CODIGO_PAIS_POR_DEFECTO,
  CODIGOS_PAIS,
  normalizarTelefono,
  partirTelefono,
  PREFIJOS_CELULAR_VE,
} from '../../lib/telefono';
import type { ResultadoTelefono } from '../../lib/telefono';
import { urbanizacionesDeZona } from '../../lib/urbanizaciones';
import { IndicadorPasos } from './portada/IndicadorPasos';
import {
  Atras,
  borrarBorrador,
  ErrorConReintento,
  guardarBorrador,
  IconoOrigen,
  leerBorrador,
  mensajeDeError,
  OpcionesRadio,
  ORIGENES,
  PaginaAlta,
  ResumenErrores,
  SelectorCantidad,
  useCarga,
  ZONAS,
} from './comun';

interface Formulario {
  /** 'hogar' | 'negocio' */
  tipo_cliente: string;
  /** Solo negocios: a qué se dedica (opcional). */
  rubro: string;
  /** Nombre de pila. La API guarda un solo campo `nombre`: al guardar se une con el apellido. */
  nombre: string;
  apellido: string;
  zona: string;
  /** Nombre de la urbanización, 'Otra' o '' (no la indicó). */
  urbanizacion: string;
  origen_agua: string;
  personas: string;
  mascotas: string; // 'si' | 'no'
  tiene_filtro: string; // 'si' | 'no' | ''
  etapas_filtro: string;
  /** Respuesta cerrada sobre el último cambio de cartucho ('' = sin responder). */
  ultimo_cambio: UltimoCambio | '';
  agua_turbia: string; // 'si' | 'no' | ''
  /** Código de país del WhatsApp, solo dígitos ("58"). */
  codigo_pais: string;
  /** Solo con +58: operadora con el 0 ("0414") y número de 7 dígitos. */
  operadora: string;
  numero: string;
  /** Con otro código de país: el número nacional en un solo campo. */
  whatsapp: string;
  consentimiento: boolean;
}

type ClaveError =
  | 'zona'
  | 'personas'
  | 'origen_agua'
  | 'agua_turbia'
  | 'tiene_filtro'
  | 'ultimo_cambio'
  | 'nombre'
  | 'apellido'
  | 'whatsapp'
  | 'consentimiento';

type Errores = Partial<Record<ClaveError, string>>;

const VACIO: Formulario = {
  tipo_cliente: 'hogar',
  rubro: '',
  nombre: '',
  apellido: '',
  zona: '',
  urbanizacion: '',
  origen_agua: '',
  personas: '',
  mascotas: 'no',
  tiene_filtro: '',
  etapas_filtro: '',
  ultimo_cambio: '',
  agua_turbia: '',
  codigo_pais: CODIGO_PAIS_POR_DEFECTO,
  operadora: '',
  numero: '',
  whatsapp: '',
  consentimiento: false,
};

const SI_NO = [
  { valor: 'si', etiqueta: 'Sí' },
  { valor: 'no', etiqueta: 'No' },
];

/** "¿Para quién es?": un hogar o un negocio (restaurante, oficina…). */
const TIPOS_CLIENTE_OPCIONES = [
  { valor: 'hogar', etiqueta: 'Hogar', ayuda: 'Tu casa o apartamento.' },
  { valor: 'negocio', etiqueta: 'Negocio', ayuda: 'Restaurante, oficina, consultorio…' },
];

const LARGO_RUBRO = 60;

const FALTA = 'Este dato hace falta.';
const VE = '58';

/** "¿Cuándo cambiaste el cartucho por última vez?": exactamente tres opciones (Tulio). */
export const OPCIONES_ULTIMO_CAMBIO: Array<{ valor: UltimoCambio; etiqueta: string }> = [
  { valor: 'menos_de_un_mes', etiqueta: 'Hace menos de un mes' },
  { valor: 'mas_de_tres_meses', etiqueta: 'Hace más de tres meses' },
  { valor: 'no_me_acuerdo', etiqueta: 'No me acuerdo' },
];

/** Operadoras de celular de Venezuela, con el 0: 0412, 0414, 0416, 0422, 0424, 0426. */
export const OPERADORAS_VE: readonly string[] = PREFIJOS_CELULAR_VE.map((p) => `0${p}`);

export const ERROR_TELEFONO_PARTIDO =
  'Elige la operadora y escribe los 7 dígitos del número, por ejemplo 0414 y 555 01 99';

const OPCIONES_CODIGO_PAIS = CODIGOS_PAIS.map((c) => ({ valor: c.codigo, etiqueta: c.etiqueta }));
const OTRA = 'Otra';
const CLAVE_BORRADOR = 'agua.alta.perfil';

/** Orden de los errores en el resumen: el mismo de la pantalla. */
const ORDEN: ClaveError[] = [
  'zona',
  'personas',
  'origen_agua',
  'agua_turbia',
  'tiene_filtro',
  'ultimo_cambio',
  'nombre',
  'apellido',
  'whatsapp',
  'consentimiento',
];

/** Texto de cada error en el resumen de arriba (distinto del mensaje junto al campo). */
const EN_RESUMEN: Record<ClaveError, string> = {
  zona: 'Elige tu zona',
  personas: 'Indica cuántos viven en la casa',
  origen_agua: 'Elige de dónde sale el agua',
  agua_turbia: 'Responde si el agua sale turbia',
  tiene_filtro: 'Responde si tienen filtro',
  ultimo_cambio: 'Elige cuándo cambiaste el cartucho',
  nombre: 'Escribe tu nombre',
  apellido: 'Escribe tu apellido',
  whatsapp: 'Revisa tu número de WhatsApp',
  consentimiento: 'Marca la casilla de aceptación',
};

/** Opciones del campo Urbanización: las de la zona en orden alfabético, más "Otra". */
export function opcionesUrbanizacion(zona: string): Array<{ valor: string; etiqueta: string }> {
  return [...urbanizacionesDeZona(zona).map((u) => ({ valor: u.nombre, etiqueta: u.nombre })), { valor: OTRA, etiqueta: OTRA }];
}

/** "Ana", "Pérez" → "Ana Pérez" (sin espacios de más). */
export function unirNombre(nombre: string, apellido: string): string {
  return `${nombre} ${apellido}`.replace(/\s+/g, ' ').trim();
}

/** "Ana María Pérez" → { nombre: "Ana", apellido: "María Pérez" } (se parte en el primer espacio). */
export function partirNombre(completo: string | null | undefined): { nombre: string; apellido: string } {
  const texto = String(completo ?? '').replace(/\s+/g, ' ').trim();
  const espacio = texto.indexOf(' ');
  if (espacio < 0) return { nombre: texto, apellido: '' };
  return { nombre: texto.slice(0, espacio), apellido: texto.slice(espacio + 1) };
}

/** Operadora "0414" + número "555-01 99" → "+584145550199" (con la normalización de lib/telefono). */
export function armarTelefonoVe(operadora: string, numero: string): ResultadoTelefono {
  const digitos = numero.replace(/[\s-]/g, '');
  if (!OPERADORAS_VE.includes(operadora) || !/^\d{7}$/.test(digitos)) return { ok: false, error: ERROR_TELEFONO_PARTIDO };
  return normalizarTelefono(`${operadora}${digitos}`, VE);
}

/** Número guardado (+58…) → operadora y número para el formulario. */
function partirOperadora(nacional: string): { operadora: string; numero: string } {
  const digitos = nacional.replace(/\D/g, '');
  if (/^0\d{10}$/.test(digitos) && OPERADORAS_VE.includes(digitos.slice(0, 4))) {
    return { operadora: digitos.slice(0, 4), numero: digitos.slice(4) };
  }
  return { operadora: '', numero: nacional };
}

function telefonoDe(f: Formulario): ResultadoTelefono {
  return f.codigo_pais === VE ? armarTelefonoVe(f.operadora, f.numero) : normalizarTelefono(f.whatsapp, f.codigo_pais);
}

function desdeHogar(h: Hogar): Formulario {
  // Números guardados con otro formato se muestran tal cual (no rompen la lectura).
  const telefono = partirTelefono(h.whatsapp);
  const ve = telefono.codigo === VE ? partirOperadora(telefono.nacional) : { operadora: '', numero: '' };
  return {
    tipo_cliente: h.tipo_cliente ?? 'hogar',
    rubro: h.rubro ?? '',
    ...partirNombre(h.nombre),
    zona: h.zona ?? '',
    urbanizacion: h.urbanizacion ?? '',
    origen_agua: h.origen_agua ?? '',
    personas: h.personas ? String(h.personas) : '',
    mascotas: h.mascotas ? 'si' : 'no',
    tiene_filtro: h.tiene_filtro ? 'si' : 'no',
    etapas_filtro: h.etapas_filtro ? String(h.etapas_filtro) : '',
    ultimo_cambio: h.ultimo_cambio ?? '',
    agua_turbia: h.agua_turbia ? 'si' : 'no',
    codigo_pais: telefono.codigo,
    operadora: ve.operadora,
    numero: ve.numero,
    whatsapp: telefono.codigo === VE ? '' : telefono.nacional,
    // Ya lo aceptó al crear el hogar.
    consentimiento: true,
  };
}

/** Si el agua que toman "sale de un filtro", ya tienen filtro: no se vuelve a preguntar. */
function tieneFiltroEn(f: Formulario): boolean {
  return f.origen_agua === 'filtro' || f.tiene_filtro === 'si';
}

export function validarPerfil(f: Formulario): Errores {
  const e: Errores = {};
  if (!f.zona) e.zona = FALTA;
  const personas = Number(f.personas);
  if (!f.personas || !Number.isInteger(personas) || personas < 1 || personas > 20) {
    e.personas = 'Usa los botones o escribe un número del 1 al 20.';
  }
  if (!f.origen_agua) e.origen_agua = FALTA;
  if (!f.agua_turbia) e.agua_turbia = FALTA;
  if (!f.tiene_filtro && f.origen_agua !== 'filtro') e.tiene_filtro = FALTA;
  if (tieneFiltroEn(f) && !f.ultimo_cambio) e.ultimo_cambio = 'Elige una opción.';
  if (!f.nombre.trim()) e.nombre = FALTA;
  if (!f.apellido.trim()) e.apellido = 'Escribe tu apellido. Con uno basta.';
  const telefono = telefonoDe(f);
  if (!telefono.ok) e.whatsapp = telefono.error;
  if (!f.consentimiento) e.consentimiento = 'Marca la casilla para poder seguir.';
  return e;
}

/** Id del control al que lleva cada error (enlace del resumen y foco). */
function idDeError(clave: ClaveError, f: Formulario): string {
  switch (clave) {
    case 'zona':
    case 'personas':
    case 'nombre':
    case 'apellido':
    case 'consentimiento':
      return `perfil-${clave}`;
    case 'whatsapp':
      if (f.codigo_pais !== VE) return 'perfil-whatsapp';
      return OPERADORAS_VE.includes(f.operadora) ? 'perfil-numero' : 'perfil-operadora';
    case 'origen_agua':
      return `origen_agua-${f.origen_agua || ORIGENES[0].valor}`;
    case 'ultimo_cambio':
      return `ultimo_cambio-${f.ultimo_cambio || OPCIONES_ULTIMO_CAMBIO[0].valor}`;
    default:
      return `${clave}-${(f[clave] as string) || 'si'}`;
  }
}

function borradorInicial(): Formulario {
  const guardado = leerBorrador<Formulario>(CLAVE_BORRADOR);
  // El consentimiento nunca se trae del borrador: la casilla siempre empieza desmarcada.
  return guardado ? { ...VACIO, ...guardado, consentimiento: false } : VACIO;
}

export function Perfil() {
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const yaTieneSobre = parametros.get('ya') === '1';
  const indicador = yaTieneSobre ? (
    <IndicadorPasos actual={1} total={2} nombre="tu casa" />
  ) : (
    <IndicadorPasos actual={1} total={3} nombre="tu casa" />
  );
  const idExistente = hogarId();

  const carga = useCarga(() => api.obtenerHogar(idExistente as string), Boolean(idExistente));
  // Sin hogar guardado, lo escrito se guarda como borrador para no perderlo al ir y volver.
  const [f, setF] = useState<Formulario>(() => (idExistente ? VACIO : borradorInicial()));
  const [errores, setErrores] = useState<Errores>({});
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  useEffect(() => {
    if (carga.datos) setF(desdeHogar(carga.datos));
  }, [carga.datos]);

  useEffect(() => {
    if (idExistente) return;
    guardarBorrador(CLAVE_BORRADOR, { ...f, consentimiento: false });
  }, [f, idExistente]);

  function poner<K extends keyof Formulario>(clave: K, valor: Formulario[K]) {
    setF((previo) => ({ ...previo, [clave]: valor }));
    // Mientras escribe no se valida: solo se quita el error que ya había.
    const claveError = (clave === 'operadora' || clave === 'numero' || clave === 'codigo_pais' ? 'whatsapp' : clave) as ClaveError;
    setErrores((previo) => ({ ...previo, [claveError]: undefined }));
  }

  /** Validación al salir de un campo: solo si ya tiene algo escrito (no regaña por pasar de largo). */
  function validarAlSalir(clave: ClaveError, formulario: Formulario = f) {
    const mensaje = validarPerfil(formulario)[clave];
    setErrores((previo) => ({ ...previo, [clave]: mensaje }));
  }

  function irAError(clave: ClaveError, formulario: Formulario = f) {
    const elemento = document.getElementById(idDeError(clave, formulario));
    if (!elemento) return;
    elemento.focus();
    elemento.scrollIntoView?.({ block: 'center' });
  }

  function alSalirDelNumero() {
    const crudo = f.numero.trim();
    if (!crudo) return;
    const limpio = crudo.replace(/[\s\-.()]/g, '');
    let siguiente: Formulario = { ...f, numero: limpio };
    // Si pegó el número completo (0414…, +58…, +57…), se reparte solo.
    if (limpio.length > 7) {
      const completo = normalizarTelefono(crudo, VE);
      if (completo.ok && completo.codigo === VE) {
        siguiente = { ...f, operadora: `0${completo.nacional.slice(0, 3)}`, numero: completo.nacional.slice(3) };
      } else if (completo.ok) {
        siguiente = { ...f, codigo_pais: completo.codigo, whatsapp: completo.nacional, numero: '' };
      }
    }
    setF(siguiente);
    const telefono = telefonoDe(siguiente);
    // Sin operadora todavía no se regaña: puede que la elija después.
    if (!telefono.ok && (siguiente.codigo_pais !== VE || siguiente.operadora)) {
      setErrores((previo) => ({ ...previo, whatsapp: telefono.error }));
    } else {
      setErrores((previo) => ({ ...previo, whatsapp: undefined }));
    }
  }

  function alSalirDelWhatsapp() {
    if (!f.whatsapp.trim()) return;
    const telefono = normalizarTelefono(f.whatsapp, f.codigo_pais);
    if (!telefono.ok) {
      setErrores((previo) => ({ ...previo, whatsapp: telefono.error }));
      return;
    }
    // Si pegó un número con otro código (+58…), el selector se ajusta solo.
    if (telefono.codigo === VE) {
      setF((previo) => ({
        ...previo,
        codigo_pais: VE,
        operadora: `0${telefono.nacional.slice(0, 3)}`,
        numero: telefono.nacional.slice(3),
        whatsapp: '',
      }));
    } else {
      setF((previo) => ({ ...previo, codigo_pais: telefono.codigo, whatsapp: telefono.nacional }));
    }
  }

  async function enviar(evento?: FormEvent) {
    evento?.preventDefault();
    const encontrados = validarPerfil(f);
    setErrores(encontrados);
    setIntentoEnviar(true);
    const primero = ORDEN.find((clave) => encontrados[clave]);
    if (primero) {
      irAError(primero);
      return;
    }

    const tieneFiltro = tieneFiltroEn(f);
    const telefono = telefonoDe(f);
    const negocio = f.tipo_cliente === 'negocio';
    const perfil = {
      tipo_cliente: (negocio ? 'negocio' : 'hogar') as TipoCliente,
      // El rubro solo es de los negocios.
      rubro: negocio ? f.rubro.trim().slice(0, LARGO_RUBRO) || null : null,
      nombre: unirNombre(f.nombre, f.apellido),
      zona: f.zona,
      urbanizacion: f.urbanizacion && f.urbanizacion !== OTRA ? f.urbanizacion : null,
      origen_agua: f.origen_agua as OrigenAgua,
      personas: Number(f.personas),
      // Un negocio no responde lo de las mascotas (la pregunta solo sale para hogares).
      mascotas: !negocio && f.mascotas === 'si',
      tiene_filtro: tieneFiltro,
      // Las etapas ya no se preguntan aquí: salen de la foto del filtro (o de la carga a mano en /mi-filtro).
      etapas_filtro: tieneFiltro ? (f.etapas_filtro ? Number(f.etapas_filtro) : undefined) : null,
      // La API deriva la fecha del último cambio de esta respuesta (para el recordatorio y la logística).
      ultimo_cambio: tieneFiltro && f.ultimo_cambio ? f.ultimo_cambio : null,
      agua_turbia: f.agua_turbia === 'si',
      // "+584145550199": la misma normalización que aplica la API.
      whatsapp: telefono.ok ? telefono.numero : f.whatsapp.trim(),
    };

    setEnviando(true);
    setErrorEnvio(null);
    try {
      let guardado: Hogar;
      if (idExistente && carga.datos) {
        guardado = await api.actualizarHogar(idExistente, perfil);
      } else {
        guardado = await api.crearHogar({ ...perfil, consentimiento: true });
        guardarHogarId(guardado.id);
      }
      borrarBorrador(CLAVE_BORRADOR);
      const destino = yaTieneSobre ? '/medir' : '/envio';
      // Con filtro y sin registrarlo todavía: primero la foto del filtro, luego sigue el recorrido.
      navegar(tieneFiltro && !guardado?.filtro ? `/mi-filtro?sigue=${encodeURIComponent(destino)}` : destino);
    } catch (e) {
      setErrorEnvio(mensajeDeError(e, 'No se pudo guardar. Intenta otra vez. Lo que llenaste no se pierde.'));
    } finally {
      setEnviando(false);
    }
  }

  const esNegocio = f.tipo_cliente === 'negocio';
  const cabecera = (
    <>
      <Atras a="/" texto="Volver al inicio" />
      {indicador}
      <h1 className="g-h1">{esNegocio ? 'Cuéntanos de tu negocio' : 'Cuéntanos de tu casa'}</h1>
    </>
  );

  if (carga.cargando) {
    return (
      <PaginaAlta>
        {cabecera}
        <Cargando texto="Un momento…" />
      </PaginaAlta>
    );
  }

  if (carga.error) {
    return (
      <PaginaAlta>
        {cabecera}
        <ErrorConReintento mensaje={carga.error} onReintentar={carga.reintentar} />
      </PaginaAlta>
    );
  }

  const tieneFiltro = tieneFiltroEn(f);
  const esVenezuela = f.codigo_pais === VE;
  const nuevo = !(idExistente && carga.datos);
  const resumen = intentoEnviar
    ? ORDEN.filter((clave) => errores[clave]).map((clave) => ({
        clave,
        texto: EN_RESUMEN[clave],
        destino: idDeError(clave, f),
      }))
    : [];
  const idErrorTelefono = 'perfil-whatsapp-error';
  const idAyudaTelefono = 'perfil-whatsapp-ayuda';

  return (
    <PaginaAlta>
      {cabecera}
      <p>Con esto te damos un resultado hecho para tu casa. Toma un minuto.</p>
      <p className="alta-nota">Todo hace falta, salvo lo que dice “(opcional)”.</p>

      <form className="g-pila g-pila--amplia" noValidate onSubmit={enviar}>
        <ResumenErrores errores={resumen} alIr={(clave) => irAError(clave as ClaveError)} />

        <section className="alta-bloque" aria-labelledby="bloque-para-quien">
          <h2 className="alta-bloque__titulo" id="bloque-para-quien">
            Para quién es
          </h2>
          <OpcionesRadio
            pregunta="¿Para quién es?"
            nombre="tipo_cliente"
            opciones={TIPOS_CLIENTE_OPCIONES}
            columnas={2}
            valor={f.tipo_cliente}
            onCambio={(v) => poner('tipo_cliente', v)}
          />
          {esNegocio && (
            <Campo
              id="perfil-rubro"
              etiqueta="¿A qué se dedica?"
              ayuda="Por ejemplo: restaurante, oficina, consultorio."
              opcional
              name="rubro"
              maxLength={LARGO_RUBRO}
              value={f.rubro}
              onChange={(e) => poner('rubro', e.target.value)}
            />
          )}
        </section>

        <section className="alta-bloque" aria-labelledby="bloque-casa">
          <h2 className="alta-bloque__titulo" id="bloque-casa">
            {esNegocio ? 'Tu negocio' : 'Tu casa'}
          </h2>
          <Campo
            como="select"
            id="perfil-zona"
            etiqueta={esNegocio ? '¿En qué zona queda?' : '¿En qué zona vives?'}
            ayuda="Así sabemos qué tienda te queda más cerca."
            name="zona"
            marcador="Elige tu zona"
            opciones={ZONAS.map((z) => ({ valor: z, etiqueta: z }))}
            value={f.zona}
            onChange={(e) => {
              const zona = e.target.value;
              poner('zona', zona);
              // Si la urbanización elegida no es de la zona nueva, se limpia.
              if (!opcionesUrbanizacion(zona).some((o) => o.valor === f.urbanizacion)) poner('urbanizacion', '');
            }}
            error={errores.zona}
          />

          <Campo
            como="select"
            id="perfil-urbanizacion"
            etiqueta="Urbanización"
            ayuda={f.zona ? 'Nos ayuda a ver cómo está el agua en tu sector.' : 'Primero elige tu zona.'}
            opcional
            name="urbanizacion"
            marcador={f.zona ? 'Elige tu urbanización' : 'Elige primero la zona'}
            opciones={f.zona ? opcionesUrbanizacion(f.zona) : []}
            disabled={!f.zona}
            value={f.urbanizacion}
            onChange={(e) => poner('urbanizacion', e.target.value)}
          />

          {f.zona && (
            <CentroMasCercano
              consulta={{ zona: f.zona, urbanizacion: f.urbanizacion && f.urbanizacion !== OTRA ? f.urbanizacion : null }}
            />
          )}

          <SelectorCantidad
            id="perfil-personas"
            name="personas"
            etiqueta={esNegocio ? '¿Cuántas personas toman agua ahí?' : '¿Cuántos viven en la casa?'}
            ayuda="Contando niños. Mientras más gente, más rápido se gasta el cartucho."
            valor={f.personas}
            min={1}
            max={20}
            textoMenos="Una persona menos"
            textoMas="Una persona más"
            onCambio={(v) => poner('personas', v)}
            onBlur={() => {
              if (f.personas) validarAlSalir('personas');
            }}
            error={errores.personas}
          />

          {!esNegocio && (
            <OpcionesRadio
              pregunta="¿Hay mascotas en casa?"
              ayuda="Ellas también toman de esa agua."
              nombre="mascotas"
              opciones={SI_NO}
              columnas={2}
              valor={f.mascotas}
              onCambio={(v) => poner('mascotas', v)}
            />
          )}
        </section>

        <section className="alta-bloque" aria-labelledby="bloque-agua">
          <h2 className="alta-bloque__titulo" id="bloque-agua">
            Tu agua
          </h2>
          <OpcionesRadio
            pregunta={esNegocio ? '¿De dónde sale el agua que toman ahí?' : '¿De dónde sale el agua que toman en casa?'}
            ayuda="Marca la que más usan."
            nombre="origen_agua"
            opciones={ORIGENES.map((o) => ({ ...o, icono: <IconoOrigen tipo={o.valor} /> }))}
            valor={f.origen_agua}
            onCambio={(v) => poner('origen_agua', v)}
            error={errores.origen_agua}
            anunciarError={false}
          />

          <OpcionesRadio
            pregunta="¿El agua a veces sale turbia o amarilla?"
            nombre="agua_turbia"
            opciones={SI_NO}
            columnas={2}
            valor={f.agua_turbia}
            onCambio={(v) => poner('agua_turbia', v)}
            error={errores.agua_turbia}
            anunciarError={false}
          />
        </section>

        <section className="alta-bloque" aria-labelledby="bloque-filtro">
          <h2 className="alta-bloque__titulo" id="bloque-filtro">
            Tu filtro
          </h2>
          {/* Si el agua sale de un filtro, ya se sabe que tienen uno: se pasa directo al cartucho. */}
          {f.origen_agua !== 'filtro' && (
            <OpcionesRadio
              pregunta={esNegocio ? '¿Tienen filtro ahí?' : '¿Tienen filtro en casa?'}
              nombre="tiene_filtro"
              opciones={SI_NO}
              columnas={2}
              valor={f.tiene_filtro}
              onCambio={(v) => poner('tiene_filtro', v)}
              error={errores.tiene_filtro}
              anunciarError={false}
            />
          )}

          {tieneFiltro && (
            <>
              <OpcionesRadio
                pregunta="¿Cuándo cambiaste el cartucho por última vez?"
                nombre="ultimo_cambio"
                opciones={OPCIONES_ULTIMO_CAMBIO}
                valor={f.ultimo_cambio}
                onCambio={(v) => poner('ultimo_cambio', v as UltimoCambio)}
                error={errores.ultimo_cambio}
                anunciarError={false}
              />
              {!carga.datos?.filtro && (
                <Aviso>
                  <span style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <Icono nombre="camara" tamano={20} />
                    <span>En el siguiente paso le tomas una foto a tu filtro y lo identificamos.</span>
                  </span>
                </Aviso>
              )}
            </>
          )}
        </section>

        <section className="alta-bloque" aria-labelledby="bloque-contacto">
          <h2 className="alta-bloque__titulo" id="bloque-contacto">
            Cómo te contactamos
          </h2>
          <Campo
            id="perfil-nombre"
            etiqueta="Nombre"
            name="nombre"
            autoComplete="given-name"
            autoCapitalize="words"
            value={f.nombre}
            onChange={(e) => poner('nombre', e.target.value)}
            onBlur={() => {
              if (f.nombre) validarAlSalir('nombre');
            }}
            error={errores.nombre}
          />
          <Campo
            id="perfil-apellido"
            etiqueta="Apellido"
            ayuda="Con uno basta."
            name="apellido"
            autoComplete="family-name"
            autoCapitalize="words"
            value={f.apellido}
            onChange={(e) => poner('apellido', e.target.value)}
            onBlur={() => {
              if (f.apellido) validarAlSalir('apellido');
            }}
            error={errores.apellido}
          />

          <fieldset className="g-grupo alta-grupo" aria-describedby={idAyudaTelefono}>
            <legend className="g-campo__etiqueta">Tu WhatsApp</legend>
            <p className="g-campo__ayuda" id={idAyudaTelefono}>
              Solo para coordinar tu pedido.
            </p>
            <div className="g-pila">
              <Campo
                como="select"
                id="perfil-codigo-pais"
                etiqueta="Código de país"
                name="codigo_pais"
                autoComplete="tel-country-code"
                opciones={OPCIONES_CODIGO_PAIS}
                value={f.codigo_pais}
                onChange={(e) => poner('codigo_pais', e.target.value)}
              />

              {esVenezuela ? (
                <div className="alta-telefono">
                  <div className="g-campo">
                    <label className="g-campo__etiqueta" htmlFor="perfil-operadora">
                      Operadora
                    </label>
                    <select
                      id="perfil-operadora"
                      name="operadora"
                      className="g-control"
                      value={f.operadora}
                      onChange={(e) => poner('operadora', e.target.value)}
                      aria-invalid={errores.whatsapp && !OPERADORAS_VE.includes(f.operadora) ? true : undefined}
                      aria-describedby={errores.whatsapp ? idErrorTelefono : undefined}
                    >
                      <option value="">Elige</option>
                      {OPERADORAS_VE.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="g-campo">
                    <label className="g-campo__etiqueta" htmlFor="perfil-numero">
                      Número
                    </label>
                    <input
                      id="perfil-numero"
                      name="numero"
                      className="g-control g-cifra"
                      type="text"
                      inputMode="numeric"
                      autoComplete="tel-local"
                      placeholder="555 01 99"
                      maxLength={20}
                      value={f.numero}
                      onChange={(e) => poner('numero', e.target.value)}
                      onBlur={alSalirDelNumero}
                      aria-invalid={errores.whatsapp && OPERADORAS_VE.includes(f.operadora) ? true : undefined}
                      aria-describedby={errores.whatsapp ? idErrorTelefono : 'perfil-numero-ayuda'}
                    />
                    <p className="g-campo__ayuda" id="perfil-numero-ayuda">
                      7 dígitos.
                    </p>
                  </div>
                </div>
              ) : (
                <Campo
                  id="perfil-whatsapp"
                  etiqueta="Número"
                  ayuda="Sin el código de país."
                  name="whatsapp"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  value={f.whatsapp}
                  onChange={(e) => poner('whatsapp', e.target.value)}
                  onBlur={alSalirDelWhatsapp}
                  error={errores.whatsapp}
                />
              )}
              {esVenezuela && errores.whatsapp && (
                <p className="g-campo__error" id={idErrorTelefono}>
                  <Icono nombre="alerta" tamano={18} />
                  <span>{errores.whatsapp}</span>
                </p>
              )}
            </div>
          </fieldset>
        </section>

        <div className="alta-cierre">
          {nuevo && (
            <>
              <Casilla
                id="perfil-consentimiento"
                name="consentimiento"
                checked={f.consentimiento}
                onChange={(e) => poner('consentimiento', e.target.checked)}
                error={errores.consentimiento}
              >
                Acepto que Grimuca Agua use mi nombre, zona, WhatsApp, dirección y los datos de mi
                hogar para enviarme el sobre, mostrarme mis resultados y atender mis pedidos, como
                explica el{' '}
                <Link className="g-enlace" to="/privacidad">
                  Aviso de privacidad
                </Link>
                .
              </Casilla>
              <p className="g-apagado" style={{ margin: 0 }}>
                Esto es una demostración: puedes usar datos de prueba.
              </p>
            </>
          )}

          {errorEnvio && (
            <Aviso tono="error" rol="alert">
              {errorEnvio}
            </Aviso>
          )}

          <Boton type="submit" anchoCompleto cargando={enviando} textoCargando="Guardando…">
            Continuar
          </Boton>
        </div>
      </form>
    </PaginaAlta>
  );
}
