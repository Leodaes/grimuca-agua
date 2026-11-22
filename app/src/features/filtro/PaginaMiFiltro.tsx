import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Aviso, Boton, Cargando, Icono } from '../../components/grimuca';
import { api, ErrorApi } from '../../lib/api';
import { hogarId } from '../../lib/sesion';
import type { CartuchoDelFiltro, FiltroHogar } from '../../lib/tipos';
import { reducirImagen } from '../medicion/reducirImagen';
import { SinHogar } from '../medicion/SinHogar';
import { CartuchosQueNecesita, FichaFiltro } from './Piezas';
import { AYUDA_FOTO, destinoSeguro, resumenFiltro } from './textos';

type Estado =
  | { fase: 'inicio' }
  | { fase: 'leyendo' }
  | { fase: 'no_identificado'; motivo: string }
  | { fase: 'identificado'; filtro: FiltroHogar; cartuchos: CartuchoDelFiltro[] };

const MENSAJE_FALLA = 'Algo falló de nuestro lado. Intenta otra vez en un momento.';

/** /mi-filtro: foto del filtro → "¿Es este tu filtro?" → confirmar. Acepta `?sigue=<ruta interna>`. */
export function PaginaMiFiltro() {
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const sigueCrudo = parametros.get('sigue');
  const destino = destinoSeguro(sigueCrudo);
  const rutaManual = `/mi-filtro/manual${sigueCrudo ? `?sigue=${encodeURIComponent(destino)}` : ''}`;
  const hogar = hogarId();

  const [estado, setEstado] = useState<Estado>({ fase: 'inicio' });
  const [registrado, setRegistrado] = useState<FiltroHogar | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [errorConfirmar, setErrorConfirmar] = useState<string | null>(null);
  const refCamara = useRef<HTMLInputElement>(null);
  const refGaleria = useRef<HTMLInputElement>(null);
  const refTitulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!hogar) return;
    let vigente = true;
    api
      .filtroDeHogar(hogar)
      .then((respuesta) => {
        if (vigente) setRegistrado(respuesta?.filtro ?? null);
      })
      .catch(() => undefined);
    return () => {
      vigente = false;
    };
  }, [hogar]);

  const primeraVez = useRef(true);
  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    refTitulo.current?.focus();
  }, [estado.fase]);

  if (!hogar) return <SinHogar titulo="Mi filtro" />;

  async function identificar(archivo: File) {
    if (!hogar) return;
    setEstado({ fase: 'leyendo' });
    try {
      const lista = await reducirImagen(archivo);
      const resultado = await api.identificarFiltro(hogar, lista);
      if (resultado.estado === 'ok') {
        setEstado({ fase: 'identificado', filtro: resultado.filtro, cartuchos: resultado.cartuchos });
      } else {
        setEstado({ fase: 'no_identificado', motivo: resultado.motivo });
      }
    } catch (error) {
      setEstado({ fase: 'no_identificado', motivo: error instanceof ErrorApi ? error.mensaje : MENSAJE_FALLA });
    }
  }

  function alElegirFoto(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0] ?? null;
    evento.target.value = '';
    if (archivo) void identificar(archivo);
  }

  async function confirmar(filtro: FiltroHogar) {
    if (!hogar) return;
    setConfirmando(true);
    setErrorConfirmar(null);
    try {
      await api.guardarFiltro(hogar, {
        tipo: filtro.tipo,
        etapas: filtro.etapas,
        medida: filtro.medida,
        modelo_codigo: filtro.modelo_codigo,
      });
      navegar(destino);
    } catch (error) {
      setErrorConfirmar(error instanceof ErrorApi ? error.mensaje : MENSAJE_FALLA);
      setConfirmando(false);
    }
  }

  const tomarFoto = () => refCamara.current?.click();
  const elegirFoto = () => refGaleria.current?.click();

  const entradas = (
    <>
      <input
        ref={refCamara}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        aria-label="Tomar una foto de mi filtro"
        onChange={alElegirFoto}
      />
      <input
        ref={refGaleria}
        type="file"
        accept="image/*"
        hidden
        aria-label="Elegir una foto del filtro"
        onChange={alElegirFoto}
      />
    </>
  );

  if (estado.fase === 'leyendo') {
    return (
      <main id="contenido" className="g-pantalla__contenido">
        <h1 className="g-h1" tabIndex={-1} ref={refTitulo}>
          Cuéntanos qué filtro tienes
        </h1>
        <Cargando texto="Mirando tu filtro…" pantalla />
        <p className="g-apagado text-center">Esto tarda unos segundos.</p>
      </main>
    );
  }

  if (estado.fase === 'no_identificado') {
    return (
      <main id="contenido" className="g-pantalla__contenido">
        <div className="g-pila">
          <h1 className="g-h1" tabIndex={-1} ref={refTitulo}>
            No pudimos reconocer tu filtro
          </h1>
          <Aviso tono="atencion" rol="alert">
            {estado.motivo}
          </Aviso>
          <p>{AYUDA_FOTO}</p>
          {entradas}
          <Boton anchoCompleto icono={<Icono nombre="camara" tamano={20} />} onClick={tomarFoto}>
            Repetir la foto
          </Boton>
          <Boton variante="secundario" anchoCompleto a={rutaManual}>
            Cargarlo a mano
          </Boton>
        </div>
      </main>
    );
  }

  if (estado.fase === 'identificado') {
    const { filtro, cartuchos } = estado;
    return (
      <main id="contenido" className="g-pantalla__contenido">
        <div className="g-pila">
          <h1 className="g-h1" tabIndex={-1} ref={refTitulo}>
            ¿Es este tu filtro?
          </h1>
          <FichaFiltro filtro={filtro} />
          <CartuchosQueNecesita cartuchos={cartuchos} />
          {errorConfirmar && (
            <Aviso tono="error" rol="alert">
              {errorConfirmar}
            </Aviso>
          )}
          <Boton anchoCompleto cargando={confirmando} textoCargando="Guardando…" onClick={() => void confirmar(filtro)}>
            Sí, es este
          </Boton>
          <Boton variante="secundario" anchoCompleto a={rutaManual}>
            Corregir
          </Boton>
        </div>
      </main>
    );
  }

  return (
    <main id="contenido" className="g-pantalla__contenido">
      <div className="g-pila">
        <h1 className="g-h1" tabIndex={-1} ref={refTitulo}>
          Cuéntanos qué filtro tienes
        </h1>
        <p>Con una foto lo identificamos y te decimos qué cartuchos necesita.</p>
        {registrado && <Aviso tono="info">Tienes registrado: {resumenFiltro(registrado)}.</Aviso>}
        {entradas}
        <Boton anchoCompleto icono={<Icono nombre="camara" tamano={20} />} onClick={tomarFoto}>
          Tomar una foto de mi filtro
        </Boton>
        <p className="g-apagado">{AYUDA_FOTO}</p>
        <Boton variante="secundario" anchoCompleto onClick={elegirFoto}>
          Elegir una foto del teléfono
        </Boton>
        <p>
          <Link className="g-enlace" to={rutaManual}>
            ¿No puedes tomar la foto? Cárgalo a mano
          </Link>
        </p>
      </div>
    </main>
  );
}
