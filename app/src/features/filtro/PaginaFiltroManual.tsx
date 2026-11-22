import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Aviso, Boton, Campo } from '../../components/grimuca';
import { api, ErrorApi } from '../../lib/api';
import { hogarId } from '../../lib/sesion';
import type { FiltroHogar, MedidaCartucho, ModeloFiltro, RespuestaFiltro, TipoFiltro } from '../../lib/tipos';
import { OpcionesRadio } from '../alta/comun';
import { SinHogar } from '../medicion/SinHogar';
import { CartuchosQueNecesita, FichaFiltro } from './Piezas';
import { destinoSeguro, OPCIONES_MEDIDA, OPCIONES_TIPO } from './textos';

const MENSAJE_FALLA = 'No se pudo guardar. Intenta otra vez.';

function filtroDelEstado(estado: unknown): FiltroHogar | null {
  const filtro = (estado as { filtro?: unknown } | null)?.filtro;
  return filtro && typeof filtro === 'object' && typeof (filtro as FiltroHogar).tipo === 'string' ? (filtro as FiltroHogar) : null;
}

/** /mi-filtro/manual: carga o corrección a mano del filtro. Acepta `?sigue=<ruta interna>`. */
export function PaginaFiltroManual() {
  const [parametros] = useSearchParams();
  const destino = destinoSeguro(parametros.get('sigue'));
  const hogar = hogarId();
  // "Corregir" desde la foto trae el filtro identificado en el estado de la navegación.
  const ubicacion = useLocation();
  const identificado = filtroDelEstado(ubicacion.state);

  const [tipo, setTipo] = useState('');
  const [etapas, setEtapas] = useState('');
  const [medida, setMedida] = useState('');
  const [modelo, setModelo] = useState('');
  const [modelos, setModelos] = useState<ModeloFiltro[]>([]);
  const [errorTipo, setErrorTipo] = useState<string | undefined>();
  const [errorEtapas, setErrorEtapas] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [guardado, setGuardado] = useState<RespuestaFiltro | null>(null);

  useEffect(() => {
    if (!hogar) return;
    let vigente = true;
    api
      .modelosDeFiltro()
      .then((lista) => {
        if (vigente && Array.isArray(lista)) setModelos(lista);
      })
      .catch(() => undefined);
    const precargar = (filtro: FiltroHogar) => {
      setTipo(OPCIONES_TIPO.some((o) => o.valor === filtro.tipo) ? filtro.tipo : 'otro');
      setEtapas(filtro.etapas ? String(filtro.etapas) : '');
      setMedida(filtro.medida ?? '');
      setModelo(filtro.modelo_codigo ?? '');
    };
    // Para corregir: se parte de lo identificado en la foto (sin guardar) o, si no viene, de lo registrado.
    if (identificado) {
      precargar(identificado);
    } else {
      api
        .filtroDeHogar(hogar)
        .then((respuesta) => {
          if (vigente && respuesta?.filtro) precargar(respuesta.filtro);
        })
        .catch(() => undefined);
    }
    return () => {
      vigente = false;
    };
  }, [hogar, identificado]);

  if (!hogar) return <SinHogar titulo="Mi filtro" />;

  async function guardar(evento?: FormEvent) {
    evento?.preventDefault();
    if (!hogar) return;
    const numero = etapas ? Number(etapas) : null;
    const etapasMalas = numero !== null && (!Number.isInteger(numero) || numero < 1 || numero > 12);
    setErrorTipo(tipo ? undefined : 'Elige una opción. Si no sabes, marca "No sé".');
    setErrorEtapas(etapasMalas ? 'Escribe un número del 1 al 12, o déjalo vacío.' : undefined);
    if (!tipo || etapasMalas) return;

    setEnviando(true);
    setErrorEnvio(null);
    try {
      const respuesta = await api.guardarFiltro(hogar, {
        tipo: tipo as TipoFiltro,
        etapas: numero,
        medida: (medida || null) as MedidaCartucho | null,
        modelo_codigo: modelo || null,
      });
      setGuardado(respuesta);
    } catch (error) {
      setErrorEnvio(error instanceof ErrorApi ? error.mensaje : MENSAJE_FALLA);
    } finally {
      setEnviando(false);
    }
  }

  if (guardado?.filtro) {
    return (
      <main id="contenido" className="g-pantalla__contenido">
        <div className="g-pila">
          <h1 className="g-h1">Listo, guardamos tu filtro</h1>
          <FichaFiltro filtro={guardado.filtro} />
          <CartuchosQueNecesita cartuchos={guardado.cartuchos} />
          <Boton anchoCompleto a={destino}>
            Continuar
          </Boton>
        </div>
      </main>
    );
  }

  return (
    <main id="contenido" className="g-pantalla__contenido">
      <div className="g-pila">
        <h1 className="g-h1">Carga tu filtro a mano</h1>
        <p>Marca lo que más se parezca. Si no sabes algo, déjalo en "No sé".</p>
        <form className="g-pila" noValidate onSubmit={guardar}>
          <OpcionesRadio
            pregunta="¿Cómo es tu filtro?"
            nombre="tipo_filtro"
            opciones={OPCIONES_TIPO}
            valor={tipo}
            onCambio={(v) => {
              setTipo(v);
              setErrorTipo(undefined);
            }}
            error={errorTipo}
          />
          <Campo
            etiqueta="¿Cuántas etapas tiene?"
            ayuda="Cuenta los vasos o cartuchos."
            opcional
            name="etapas"
            type="number"
            inputMode="numeric"
            min={1}
            max={12}
            value={etapas}
            onChange={(e) => {
              setEtapas(e.target.value);
              setErrorEtapas(undefined);
            }}
            error={errorEtapas}
          />
          <OpcionesRadio
            pregunta="¿Cómo son los cartuchos?"
            ayuda="Corto es como una botella de refresco de 1 litro; largo, el doble."
            nombre="medida"
            opciones={OPCIONES_MEDIDA}
            valor={medida}
            onCambio={setMedida}
          />
          {modelos.length > 0 && (
            <Campo
              como="select"
              etiqueta="Modelo"
              ayuda="Si lo compraste en Grimuca y sabes cuál es."
              opcional
              name="modelo"
              marcador="No sé el modelo"
              opciones={modelos.map((m) => ({ valor: m.codigo, etiqueta: m.nombre }))}
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
            />
          )}
          {errorEnvio && (
            <Aviso tono="error" rol="alert">
              {errorEnvio}
            </Aviso>
          )}
          <Boton type="submit" anchoCompleto cargando={enviando} textoCargando="Guardando…">
            Guardar mi filtro
          </Boton>
        </form>
      </div>
    </main>
  );
}
