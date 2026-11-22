import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Aviso, Boton, Campo, Cargando, Insignia, TarjetaTienda } from '../../components/grimuca';
import { api } from '../../lib/api';
import { hogarId } from '../../lib/sesion';
import type { Hogar, Tienda } from '../../lib/tipos';
import { ErrorConReintento, mensajeDeError, OpcionesRadio, PaginaAlta, tiendaSugerida, useCarga } from './comun';
import { IndicadorPasos } from './portada/IndicadorPasos';

export function Envio() {
  const id = hogarId();
  const navegar = useNavigate();
  const carga = useCarga<{ hogar: Hogar; tiendas: Tienda[] }>(async () => {
    const hogar = await api.obtenerHogar(id as string);
    // Si fallan las tiendas, se sigue con la sugerida por zona (sin datos inventados).
    const tiendas = await api.tiendas().catch(() => [] as Tienda[]);
    return { hogar, tiendas };
  }, Boolean(id));

  const [direccion, setDireccion] = useState('');
  const [tiendaId, setTiendaId] = useState('');
  const [errorDireccion, setErrorDireccion] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  useEffect(() => {
    if (!carga.datos) return;
    const { hogar } = carga.datos;
    setDireccion(hogar.direccion ?? '');
    setTiendaId(hogar.tienda_id ?? tiendaSugerida(hogar.zona));
  }, [carga.datos]);

  if (!id) return <Navigate to="/perfil" replace />;

  if (carga.cargando || (!carga.datos && !carga.error)) {
    return (
      <PaginaAlta>
        <IndicadorPasos actual={2} total={3} nombre="a dónde va" />
        <h1 className="g-h1">¿A dónde te mandamos el sobre?</h1>
        <Cargando variante="esqueleto" texto="Un momento…" />
      </PaginaAlta>
    );
  }

  if (carga.error || !carga.datos) {
    return (
      <PaginaAlta>
        <IndicadorPasos actual={2} total={3} nombre="a dónde va" />
        <h1 className="g-h1">¿A dónde te mandamos el sobre?</h1>
        <ErrorConReintento mensaje={carga.error ?? 'No se pudo cargar.'} onReintentar={carga.reintentar} />
      </PaginaAlta>
    );
  }

  const { hogar, tiendas } = carga.datos;
  const sugerida = tiendaSugerida(hogar.zona);
  const elegida = tiendas.find((t) => t.id === tiendaId);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const texto = direccion.trim();
    if (!texto) {
      setErrorDireccion('Este dato hace falta.');
      return;
    }
    if (texto.length < 10) {
      setErrorDireccion('Falta detalle en la dirección. Agrega calle y número de casa o edificio.');
      return;
    }
    setEnviando(true);
    setErrorEnvio(null);
    try {
      await api.actualizarHogar(id as string, { direccion: texto, tienda_id: tiendaId || sugerida });
      navegar('/pago');
    } catch (e) {
      setErrorEnvio(mensajeDeError(e, 'No se pudo guardar. Intenta otra vez.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <PaginaAlta>
      <IndicadorPasos actual={2} total={3} nombre="a dónde va" />
      <h1 className="g-h1">¿A dónde te mandamos el sobre?</h1>
      <p>Sale de la tienda Grimuca más cercana a tu zona.</p>

      <form className="g-pila" noValidate onSubmit={enviar}>
        <Campo
          como="textarea"
          etiqueta="Dirección de entrega"
          ayuda="Urbanización, calle, casa o edificio y apartamento. Algo que ayude a ubicarte: frente a la panadería, portón negro."
          name="direccion"
          rows={3}
          value={direccion}
          onChange={(e) => {
            setDireccion(e.target.value);
            setErrorDireccion(undefined);
          }}
          error={errorDireccion}
        />

        {elegida && (
          <div className="g-pila">
            <h2 className="g-h2">Tu sobre sale de</h2>
            <TarjetaTienda
              nombre={elegida.nombre}
              horario={elegida.horario ? `Horario: ${elegida.horario}` : undefined}
              direccion={elegida.direccion ?? undefined}
              seleccionada
              extra={elegida.id === sugerida ? <Insignia tono="azul">Más cercana</Insignia> : undefined}
            />
          </div>
        )}

        {tiendas.length > 0 && (
        <OpcionesRadio
          pregunta="Tienda de donde sale tu sobre"
          ayuda="Ya elegimos la más cercana a tu zona. Si prefieres otra, cámbiala aquí."
          nombre="tienda_id"
          opciones={tiendas.map((t) => ({
            valor: t.id,
            etiqueta: t.nombre,
            ayuda: [t.direccion, t.horario ? `Horario: ${t.horario}` : null].filter(Boolean).join(' · ') || undefined,
          }))}
          valor={tiendaId}
          onCambio={setTiendaId}
        />
        )}

        <section className="g-pila" aria-labelledby="que-te-llega">
          <h2 className="g-h2" id="que-te-llega">
            Qué te llega
          </h2>
          <ul>
            <li>1 tira para medir tu agua</li>
            <li>1 prueba casera de bacterias coliformes</li>
            <li>La tabla de colores impresa</li>
            <li>Un código QR con el video de cómo se hace</li>
          </ul>
          <p className="g-apagado">El sobre es para una sola medición.</p>
        </section>

        {errorEnvio && (
          <Aviso tono="error" rol="alert">
            {errorEnvio}
          </Aviso>
        )}

        <Boton type="submit" anchoCompleto cargando={enviando} textoCargando="Un momento…">
          Continuar al pago
        </Boton>
      </form>
    </PaginaAlta>
  );
}
