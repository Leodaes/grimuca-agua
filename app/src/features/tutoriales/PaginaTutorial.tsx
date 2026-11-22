import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Aviso, Boton, EstadoVacio, Insignia, Pasos } from '../../components/grimuca';
import { api } from '../../lib/api';
import { hogarId } from '../../lib/sesion';
import type { Hogar } from '../../lib/tipos';
import { fechaCorta, hoyLocal, mensajeCambioRegistrado, remitenteTienda } from '../../lib/recordatorios';
import { MensajeTienda, RecordatorioCambio } from './CambioCartucho';
import { Miniatura } from './Miniatura';
import { NOTA_FABRICANTE, ROTULO_DEMO, buscarTutorial } from './contenido';

type Anotar = { tipo: 'inicio' } | { tipo: 'guardando' } | { tipo: 'listo'; fecha: string } | { tipo: 'error'; mensaje: string };

/** /tutoriales/:id: guía paso a paso de un cambio de cartucho. */
export function PaginaTutorial() {
  const { id } = useParams();
  const tutorial = buscarTutorial(id);
  const idHogar = hogarId();
  const [anotar, setAnotar] = useState<Anotar>({ tipo: 'inicio' });
  const [hogar, setHogar] = useState<Hogar | null>(null);

  useEffect(() => {
    if (!idHogar) return;
    let vigente = true;
    Promise.resolve()
      .then(() => api.obtenerHogar(idHogar))
      .then((datos) => {
        if (vigente && datos) setHogar(datos);
      })
      .catch(() => undefined);
    return () => {
      vigente = false;
    };
  }, [idHogar]);

  if (!tutorial) {
    return (
      <main id="contenido" className="g-pantalla__contenido g-pila" tabIndex={-1}>
        <h1 className="g-h1">No encontramos esa guía</h1>
        <EstadoVacio titulo="Esa guía no existe" accion={<Boton a="/tutoriales">Ver todas las guías</Boton>} />
      </main>
    );
  }

  async function anotarFecha() {
    if (!idHogar) return;
    setAnotar({ tipo: 'guardando' });
    try {
      const fecha = hoyLocal();
      const actualizado = await api.actualizarHogar(idHogar, { tiene_filtro: true, ultimo_cambio: 'menos_de_un_mes', fecha_ultimo_cambio: fecha });
      setHogar((previo) => ({ ...(previo ?? {}), ...(actualizado ?? {}), id: idHogar, tiene_filtro: true, fecha_ultimo_cambio: fecha }) as Hogar);
      setAnotar({ tipo: 'listo', fecha });
    } catch (error) {
      const mensaje = error && typeof error === 'object' && 'mensaje' in error ? String((error as { mensaje: unknown }).mensaje) : '';
      setAnotar({ tipo: 'error', mensaje: mensaje || 'Algo falló de nuestro lado. Intenta otra vez en un momento.' });
    }
  }

  return (
    <main id="contenido" className="g-pantalla__contenido g-pila" tabIndex={-1}>
      <p>
        <Link className="g-enlace" to="/tutoriales" style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>
          Todas las guías
        </Link>
      </p>
      <h1 className="g-h1">{tutorial.titulo}</h1>
      <p className="g-apagado" style={{ margin: 0 }}>
        {tutorial.minutos} min · Nivel: {tutorial.nivel}
      </p>
      <Miniatura minutos={tutorial.minutos} grande />
      <div>
        <Insignia tono="aviso">{ROTULO_DEMO}</Insignia>
      </div>
      <p>{tutorial.resumen}</p>

      <section className="g-pila" aria-labelledby="titulo-necesitas">
        <h2 className="g-h3" id="titulo-necesitas">
          Qué necesitas
        </h2>
        <ul style={{ paddingLeft: '1.25rem', listStyle: 'disc', margin: 0 }}>
          {tutorial.necesitas.map((cosa) => (
            <li key={cosa}>{cosa}</li>
          ))}
        </ul>
      </section>

      <section className="g-pila" aria-labelledby="titulo-pasos">
        <h2 className="g-h3" id="titulo-pasos">
          Paso a paso
        </h2>
        <Pasos pasos={tutorial.pasos} etiqueta={`Pasos: ${tutorial.titulo}`} />
      </section>

      <Aviso tono="info">{NOTA_FABRICANTE}</Aviso>

      {idHogar && anotar.tipo !== 'listo' && (
        <Boton
          variante="secundario"
          anchoCompleto
          cargando={anotar.tipo === 'guardando'}
          textoCargando="Anotando…"
          onClick={() => void anotarFecha()}
        >
          Ya lo cambié: anotar la fecha de hoy
        </Boton>
      )}
      {anotar.tipo === 'listo' && (
        <>
          <Aviso tono="ok" rol="status">
            Listo. Registramos el cambio del {fechaCorta(anotar.fecha)}.
          </Aviso>
          <MensajeTienda de={remitenteTienda(hogar?.tienda_id)} mensaje={mensajeCambioRegistrado(anotar.fecha)} />
        </>
      )}
      {anotar.tipo === 'error' && (
        <Aviso tono="error" rol="alert">
          {anotar.mensaje}
        </Aviso>
      )}
      {idHogar && <RecordatorioCambio key={hogar?.fecha_ultimo_cambio ?? 'sin-fecha'} hogar={hogar ?? { id: idHogar }} />}

      <Boton a="/experto?servicio=cambio" anchoCompleto>
        ¿No sabes hacerlo? Contrata a un experto
      </Boton>
    </main>
  );
}
