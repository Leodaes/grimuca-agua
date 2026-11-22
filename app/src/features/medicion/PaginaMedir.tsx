import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Aviso, Boton, Cargando, EstadoVacio, Icono, Pasos, Temporizador } from '../../components/grimuca';
import { api, ErrorApi } from '../../lib/api';
import { hogarId } from '../../lib/sesion';
import { reducirImagen } from './reducirImagen';
import { SinHogar } from './SinHogar';

type Estado =
  | { fase: 'guia' }
  | { fase: 'leyendo' }
  | { fase: 'no_legible'; motivo: string }
  | { fase: 'error'; sinConexion: boolean; mensaje: string };

const MENSAJE_FALLA = 'Algo falló de nuestro lado. Intenta otra vez en un momento.';

const PASOS = [
  {
    titulo: 'Pon una gota en cada casilla',
    detalle: 'Una sola gota de agua por casilla de la tira. Ni más ni menos.',
  },
  {
    titulo: 'Espera entre 30 y 60 segundos',
    detalle: 'Toca "Empezar a contar" y te avisamos cuando sea el momento.',
    contenido: <Temporizador espera={30} ventana={30} />,
  },
  {
    titulo: 'Pon la tira junto a la tabla de colores',
    detalle: 'Una al lado de la otra, sobre la mesa, sin que se tapen.',
  },
  {
    titulo: 'Toma la foto con buena luz',
    detalle: 'Cerca de una ventana o con la luz prendida. Sin sombras encima.',
  },
];

/** /medir: los 4 pasos con el contador, la foto de la tira y su lectura. */
export function PaginaMedir() {
  const navegar = useNavigate();
  const hogar = hogarId();
  const [estado, setEstado] = useState<Estado>({ fase: 'guia' });
  const [foto, setFoto] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const refCamara = useRef<HTMLInputElement>(null);
  const refGaleria = useRef<HTMLInputElement>(null);
  const refTitulo = useRef<HTMLHeadingElement>(null);

  // Vista previa de la foto elegida.
  useEffect(() => {
    if (!foto || typeof URL.createObjectURL !== 'function') {
      setVistaPrevia(null);
      return undefined;
    }
    const url = URL.createObjectURL(foto);
    setVistaPrevia(url);
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  // Al cambiar de vista, el foco va al título para que el lector de pantalla la anuncie.
  const vista = estado.fase === 'guia' && foto ? 'vista_previa' : estado.fase;
  const primeraVez = useRef(true);
  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    refTitulo.current?.focus();
  }, [vista]);

  if (!hogar) return <SinHogar />;

  function alElegirFoto(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0] ?? null;
    evento.target.value = ''; // permite volver a elegir la misma foto
    if (!archivo) return;
    setFoto(archivo);
    setEstado({ fase: 'guia' });
  }

  async function leer() {
    if (!foto || !hogar) return;
    setEstado({ fase: 'leyendo' });
    try {
      const lista = await reducirImagen(foto);
      const resultado = await api.medirConFoto(hogar, lista);
      if (resultado.estado === 'ok') {
        navegar(`/resultado/${resultado.medicion.id}`);
        return;
      }
      setEstado({ fase: 'no_legible', motivo: resultado.motivo });
    } catch (error) {
      const esApi = error instanceof ErrorApi;
      setEstado({
        fase: 'error',
        sinConexion: esApi && error.estado === 0,
        mensaje: esApi ? error.mensaje : MENSAJE_FALLA,
      });
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
        aria-label="Tomar la foto de la tira"
        onChange={alElegirFoto}
      />
      <input
        ref={refGaleria}
        type="file"
        accept="image/*"
        hidden
        aria-label="Elegir una foto de la tira"
        onChange={alElegirFoto}
      />
    </>
  );

  const enlaceManual = (
    <p>
      <Link className="g-enlace" to="/medir/manual">
        ¿No puedes tomar la foto? Carga los colores a mano
      </Link>
    </p>
  );

  if (estado.fase === 'leyendo') {
    return (
      <main id="contenido" className="g-pantalla__contenido">
        <h1 className="g-h1" tabIndex={-1} ref={refTitulo}>
          Foto de tu tira
        </h1>
        <Cargando texto="Leyendo tu tira…" pantalla />
        <p className="g-apagado text-center">Esto tarda unos segundos.</p>
      </main>
    );
  }

  if (estado.fase === 'no_legible') {
    return (
      <main id="contenido" className="g-pantalla__contenido">
        <div className="g-pila">
          <h1 className="g-h1" tabIndex={-1} ref={refTitulo}>
            No pudimos leer bien la foto
          </h1>
          <Aviso tono="atencion" rol="alert">
            {estado.motivo}
          </Aviso>
          <p>Preferimos decirte que no se ve antes que adivinar. Revisa esto y prueba otra vez:</p>
          <ul className="list-disc pl-5">
            <li>Que salgan completas la tira y la tabla de colores.</li>
            <li>Que no haya sombra ni reflejo encima.</li>
            <li>Que la foto no esté movida.</li>
          </ul>
          {entradas}
          <Boton anchoCompleto icono={<Icono nombre="camara" tamano={20} />} onClick={tomarFoto}>
            Repetir la foto
          </Boton>
          <Boton variante="secundario" anchoCompleto a="/medir/manual">
            Cargar los colores a mano
          </Boton>
        </div>
      </main>
    );
  }

  if (estado.fase === 'error') {
    return (
      <main id="contenido" className="g-pantalla__contenido">
        <div className="g-pila">
          <h1 className="g-h1" tabIndex={-1} ref={refTitulo}>
            Foto de tu tira
          </h1>
          <EstadoVacio
            tono="error"
            titulo={estado.sinConexion ? 'No hay conexión' : 'No se pudo leer la foto'}
            accion={
              <Boton anchoCompleto onClick={leer}>
                Intentar otra vez
              </Boton>
            }
          >
            {estado.mensaje} Tu foto sigue aquí.
          </EstadoVacio>
          <Boton variante="secundario" anchoCompleto a="/medir/manual">
            Cargar los colores a mano
          </Boton>
        </div>
      </main>
    );
  }

  if (foto) {
    return (
      <main id="contenido" className="g-pantalla__contenido">
        <div className="g-pila">
          <h1 className="g-h1" tabIndex={-1} ref={refTitulo}>
            ¿Se ve bien?
          </h1>
          <p>Que se vean completas la tira y la tabla de colores, con buena luz y sin sombras.</p>
          {vistaPrevia ? (
            <img
              src={vistaPrevia}
              alt="La foto que tomaste de la tira"
              className="max-h-[60vh] w-full border border-linea bg-papel object-contain"
            />
          ) : (
            <p className="g-apagado">Foto elegida: {foto.name}</p>
          )}
          {entradas}
          <Boton anchoCompleto onClick={leer}>
            Leer mi tira
          </Boton>
          <Boton variante="secundario" anchoCompleto icono={<Icono nombre="camara" tamano={20} />} onClick={tomarFoto}>
            Tomar otra
          </Boton>
          {enlaceManual}
        </div>
      </main>
    );
  }

  return (
    <main id="contenido" className="g-pantalla__contenido">
      <div className="g-pila--amplia g-pila">
        <h1 className="g-h1" tabIndex={-1} ref={refTitulo}>
          Cómo medir tu agua en 4 pasos
        </h1>
        <Pasos pasos={PASOS} etiqueta="Cómo medir tu agua" />
        <div className="g-pila">
          {entradas}
          <Boton anchoCompleto icono={<Icono nombre="camara" tamano={20} />} onClick={tomarFoto}>
            Tomar la foto
          </Boton>
          <Boton variante="secundario" anchoCompleto onClick={elegirFoto}>
            Elegir una foto del teléfono
          </Boton>
          {enlaceManual}
        </div>
      </div>
    </main>
  );
}
