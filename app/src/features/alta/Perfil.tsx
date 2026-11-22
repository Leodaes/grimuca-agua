import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Aviso, Boton, Campo, Cargando, Casilla } from '../../components/grimuca';
import { api } from '../../lib/api';
import { guardarHogarId, hogarId } from '../../lib/sesion';
import type { Hogar, OrigenAgua, UltimoCambio } from '../../lib/tipos';
import {
  CODIGO_PAIS_POR_DEFECTO,
  CODIGOS_PAIS,
  formatearNacional,
  normalizarTelefono,
  partirTelefono,
} from '../../lib/telefono';
import { urbanizacionesDeZona } from '../../lib/urbanizaciones';
import { ErrorConReintento, mensajeDeError, OpcionesRadio, ORIGENES, PaginaAlta, useCarga, ZONAS } from './comun';

interface Formulario {
  nombre: string;
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
  whatsapp: string;
  consentimiento: boolean;
}

type Errores = Partial<Record<keyof Formulario, string>>;

const VACIO: Formulario = {
  nombre: '',
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
  whatsapp: '',
  consentimiento: false,
};

const SI_NO = [
  { valor: 'si', etiqueta: 'Sí' },
  { valor: 'no', etiqueta: 'No' },
];

const FALTA = 'Este dato hace falta.';

/** "¿Cuándo cambiaste el cartucho por última vez?": exactamente tres opciones (Tulio). */
export const OPCIONES_ULTIMO_CAMBIO: Array<{ valor: UltimoCambio; etiqueta: string }> = [
  { valor: 'menos_de_un_mes', etiqueta: 'Hace menos de un mes' },
  { valor: 'mas_de_tres_meses', etiqueta: 'Hace más de tres meses' },
  { valor: 'no_me_acuerdo', etiqueta: 'No me acuerdo' },
];

const OPCIONES_CODIGO_PAIS = CODIGOS_PAIS.map((c) => ({ valor: c.codigo, etiqueta: c.etiqueta }));
const OTRA = 'Otra';

/** Opciones del campo Urbanización: las de la zona en orden alfabético, más "Otra". */
export function opcionesUrbanizacion(zona: string): Array<{ valor: string; etiqueta: string }> {
  return [...urbanizacionesDeZona(zona).map((u) => ({ valor: u.nombre, etiqueta: u.nombre })), { valor: OTRA, etiqueta: OTRA }];
}

function desdeHogar(h: Hogar): Formulario {
  // Números guardados con otro formato se muestran tal cual (no rompen la lectura).
  const telefono = partirTelefono(h.whatsapp);
  return {
    nombre: h.nombre ?? '',
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
    whatsapp: telefono.nacional,
    // Ya lo aceptó al crear el hogar.
    consentimiento: true,
  };
}

export function validarPerfil(f: Formulario): Errores {
  const e: Errores = {};
  if (!f.nombre.trim()) e.nombre = FALTA;
  if (!f.zona) e.zona = FALTA;
  if (!f.origen_agua) e.origen_agua = FALTA;
  const personas = Number(f.personas);
  if (!f.personas || !Number.isInteger(personas) || personas < 1 || personas > 20) {
    e.personas = 'Escribe un número del 1 al 20.';
  }
  if (!f.tiene_filtro) e.tiene_filtro = FALTA;
  if (f.tiene_filtro === 'si' && !f.ultimo_cambio) e.ultimo_cambio = 'Elige una opción.';
  if (!f.agua_turbia) e.agua_turbia = FALTA;
  const telefono = normalizarTelefono(f.whatsapp, f.codigo_pais);
  if (!telefono.ok) e.whatsapp = telefono.error;
  if (!f.consentimiento) e.consentimiento = 'Marca la casilla para poder seguir.';
  return e;
}

/** "+584145550199": la misma normalización que aplica la API. */
function telefonoNormalizado(f: Formulario): string {
  const resultado = normalizarTelefono(f.whatsapp, f.codigo_pais);
  return resultado.ok ? resultado.numero : f.whatsapp.trim();
}

export function Perfil() {
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const yaTieneSobre = parametros.get('ya') === '1';
  const idExistente = hogarId();

  const carga = useCarga(() => api.obtenerHogar(idExistente as string), Boolean(idExistente));
  const [f, setF] = useState<Formulario>(VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  useEffect(() => {
    if (carga.datos) setF(desdeHogar(carga.datos));
  }, [carga.datos]);

  function poner<K extends keyof Formulario>(clave: K, valor: Formulario[K]) {
    setF((previo) => ({ ...previo, [clave]: valor }));
    setErrores((previo) => ({ ...previo, [clave]: undefined }));
  }

  async function enviar(evento?: FormEvent) {
    evento?.preventDefault();
    const encontrados = validarPerfil(f);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    const tieneFiltro = f.tiene_filtro === 'si';
    const perfil = {
      nombre: f.nombre.trim(),
      zona: f.zona,
      urbanizacion: f.urbanizacion && f.urbanizacion !== OTRA ? f.urbanizacion : null,
      origen_agua: f.origen_agua as OrigenAgua,
      personas: Number(f.personas),
      mascotas: f.mascotas === 'si',
      tiene_filtro: tieneFiltro,
      // Las etapas ya no se preguntan aquí: salen de la foto del filtro (o de la carga a mano en /mi-filtro).
      etapas_filtro: tieneFiltro ? (f.etapas_filtro ? Number(f.etapas_filtro) : undefined) : null,
      // La API deriva la fecha del último cambio de esta respuesta (para el recordatorio y la logística).
      ultimo_cambio: tieneFiltro && f.ultimo_cambio ? f.ultimo_cambio : null,
      agua_turbia: f.agua_turbia === 'si',
      whatsapp: telefonoNormalizado(f),
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
      const destino = yaTieneSobre ? '/medir' : '/envio';
      // Con filtro y sin registrarlo todavía: primero la foto del filtro, luego sigue el recorrido.
      navegar(tieneFiltro && !guardado?.filtro ? `/mi-filtro?sigue=${encodeURIComponent(destino)}` : destino);
    } catch (e) {
      setErrorEnvio(mensajeDeError(e, 'No se pudo guardar. Intenta otra vez.'));
    } finally {
      setEnviando(false);
    }
  }

  if (carga.cargando) {
    return (
      <PaginaAlta>
        <h1 className="g-h1">Cuéntanos de tu casa</h1>
        <Cargando texto="Un momento…" />
      </PaginaAlta>
    );
  }

  if (carga.error) {
    return (
      <PaginaAlta>
        <h1 className="g-h1">Cuéntanos de tu casa</h1>
        <ErrorConReintento mensaje={carga.error} onReintentar={carga.reintentar} />
      </PaginaAlta>
    );
  }

  const tieneFiltro = f.tiene_filtro === 'si';

  return (
    <PaginaAlta>
      <h1 className="g-h1">Cuéntanos de tu casa</h1>
      <p>Con esto te recomendamos lo que de verdad te sirve. Es un minuto.</p>

      <form className="g-pila" noValidate onSubmit={enviar}>
        <Campo
          etiqueta="¿Cómo te llamas?"
          ayuda="Con el nombre basta. Es para tu pedido."
          name="nombre"
          autoComplete="given-name"
          value={f.nombre}
          onChange={(e) => poner('nombre', e.target.value)}
          error={errores.nombre}
        />

        <Campo
          como="select"
          etiqueta="¿En qué zona vives?"
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
          etiqueta="Urbanización"
          ayuda="Nos ayuda a ver cómo está el agua en tu sector."
          opcional
          name="urbanizacion"
          marcador="Elige tu urbanización"
          opciones={opcionesUrbanizacion(f.zona)}
          value={f.urbanizacion}
          onChange={(e) => poner('urbanizacion', e.target.value)}
        />

        <OpcionesRadio
          pregunta="¿De dónde sale el agua que toman en casa?"
          ayuda="Marca la que más usan."
          nombre="origen_agua"
          opciones={ORIGENES}
          valor={f.origen_agua}
          onCambio={(v) => poner('origen_agua', v)}
          error={errores.origen_agua}
        />

        <Campo
          etiqueta="¿Cuántos viven en la casa?"
          ayuda="Contando niños. Mientras más gente, más rápido se gasta el cartucho."
          name="personas"
          type="number"
          inputMode="numeric"
          min={1}
          max={20}
          value={f.personas}
          onChange={(e) => poner('personas', e.target.value)}
          error={errores.personas}
        />

        <OpcionesRadio
          pregunta="¿Hay mascotas en casa?"
          ayuda="Ellas también toman de esa agua."
          nombre="mascotas"
          opciones={SI_NO}
          valor={f.mascotas}
          onCambio={(v) => poner('mascotas', v)}
        />

        <OpcionesRadio
          pregunta="¿Tienen filtro en casa?"
          nombre="tiene_filtro"
          opciones={SI_NO}
          valor={f.tiene_filtro}
          onCambio={(v) => poner('tiene_filtro', v)}
          error={errores.tiene_filtro}
        />

        {tieneFiltro && (
          <>
            {!carga.datos?.filtro && (
              <p className="g-apagado">En el siguiente paso le tomas una foto a tu filtro y lo identificamos.</p>
            )}
            <OpcionesRadio
              pregunta="¿Cuándo cambiaste el cartucho por última vez?"
              nombre="ultimo_cambio"
              opciones={OPCIONES_ULTIMO_CAMBIO}
              valor={f.ultimo_cambio}
              onCambio={(v) => poner('ultimo_cambio', v as UltimoCambio)}
              error={errores.ultimo_cambio}
            />
          </>
        )}

        <OpcionesRadio
          pregunta="¿El agua a veces sale turbia o amarilla?"
          nombre="agua_turbia"
          opciones={SI_NO}
          valor={f.agua_turbia}
          onCambio={(v) => poner('agua_turbia', v)}
          error={errores.agua_turbia}
        />

        <Campo
          como="select"
          etiqueta="Código de país"
          name="codigo_pais"
          opciones={OPCIONES_CODIGO_PAIS}
          value={f.codigo_pais}
          onChange={(e) => poner('codigo_pais', e.target.value)}
        />

        <Campo
          etiqueta="Tu WhatsApp"
          ayuda="Para que la tienda te ubique si hace falta por tu pedido. Ejemplo: 0414 555 01 99"
          name="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={f.whatsapp}
          onChange={(e) => poner('whatsapp', e.target.value)}
          onBlur={() => {
            if (!f.whatsapp.trim()) return;
            const telefono = normalizarTelefono(f.whatsapp, f.codigo_pais);
            if (!telefono.ok) {
              setErrores((previo) => ({ ...previo, whatsapp: telefono.error }));
              return;
            }
            // Si pegó un número con otro código (+57…), el selector se ajusta solo.
            setF((previo) => ({
              ...previo,
              codigo_pais: telefono.codigo,
              whatsapp: formatearNacional(telefono.codigo, telefono.nacional),
            }));
          }}
          error={errores.whatsapp}
        />

        {!(idExistente && carga.datos) && (
          <div className="g-pila">
            <Casilla
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
            <p className="g-apagado" style={{ fontSize: '0.9em' }}>
              Esto es una demostración: puedes usar datos de prueba.
            </p>
          </div>
        )}

        {Object.values(errores).some(Boolean) && (
          <Aviso tono="error" rol="alert">
            Revisa los datos marcados arriba.
          </Aviso>
        )}

        {errorEnvio && (
          <Aviso tono="error" rol="alert">
            {errorEnvio}
          </Aviso>
        )}

        <Boton type="submit" anchoCompleto cargando={enviando} textoCargando="Un momento…">
          Continuar
        </Boton>
      </form>
    </PaginaAlta>
  );
}
