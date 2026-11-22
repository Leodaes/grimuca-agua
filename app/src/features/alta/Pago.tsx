import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Aviso, Boton, Cargando, Insignia } from '../../components/grimuca';
import { api } from '../../lib/api';
import { hogarId } from '../../lib/sesion';
import type { Hogar, Pedido, Tienda } from '../../lib/tipos';
import { Atras, ErrorConReintento, mensajeDeError, nombreConMarca, PaginaAlta, tiendaSugerida, useCarga } from './comun';
import { BannerSobre } from './portada/Banners';
import { IndicadorPasos } from './portada/IndicadorPasos';

export const ROTULO_PAGO_SIMULADO =
  'Pago simulado. Esto es una demostración: no se cobra nada, no se piden datos de tarjeta ni de banco y no se envía un sobre real.';

export function Pago() {
  const id = hogarId();
  const carga = useCarga<{ hogar: Hogar; tiendas: Tienda[] }>(async () => {
    const hogar = await api.obtenerHogar(id as string);
    const tiendas = await api.tiendas().catch(() => [] as Tienda[]);
    return { hogar, tiendas };
  }, Boolean(id));

  const [enviando, setEnviando] = useState(false);
  const [errorPago, setErrorPago] = useState<string | null>(null);
  const [pedido, setPedido] = useState<Pedido | null>(null);

  if (!id) return <Navigate to="/perfil" replace />;

  const cabecera = (
    <>
      <Insignia tono="aviso">Simulación</Insignia>
      <Atras a="/envio" />
      <IndicadorPasos actual={3} total={3} nombre="tu sobre" />
      <h1 className="g-h1">Paga tu sobre</h1>
    </>
  );

  if (carga.cargando || (!carga.datos && !carga.error)) {
    return (
      <PaginaAlta>
        {cabecera}
        <Cargando texto="Un momento…" />
      </PaginaAlta>
    );
  }

  if (carga.error || !carga.datos) {
    return (
      <PaginaAlta>
        {cabecera}
        <ErrorConReintento mensaje={carga.error ?? 'No se pudo cargar.'} onReintentar={carga.reintentar} />
      </PaginaAlta>
    );
  }

  const { hogar, tiendas } = carga.datos;
  const tiendaId = hogar.tienda_id ?? tiendaSugerida(hogar.zona);
  const nombreTienda = nombreConMarca(tiendas.find((t) => t.id === tiendaId)?.nombre ?? tiendaId);

  if (!hogar.direccion) {
    return (
      <PaginaAlta>
        {cabecera}
        <Aviso tono="atencion">Antes de pagar, dinos a dónde te mandamos el sobre.</Aviso>
        <Boton a="/envio" anchoCompleto>
          Continuar
        </Boton>
      </PaginaAlta>
    );
  }

  async function pagar() {
    setEnviando(true);
    setErrorPago(null);
    try {
      const nuevo = await api.crearPedido({
        hogar_id: id as string,
        tipo: 'sobre',
        modalidad: 'envio',
        direccion: hogar.direccion,
        tienda_id: tiendaId,
      });
      setPedido(nuevo);
    } catch (e) {
      setErrorPago(
        mensajeDeError(e, 'No se pudo registrar el pedido. No se cobró nada. Intenta otra vez.'),
      );
    } finally {
      setEnviando(false);
    }
  }

  if (pedido) {
    return (
      <PaginaAlta>
        <Insignia tono="aviso">Simulación</Insignia>
        <h1 className="g-h1">Listo. Tu sobre está pedido.</h1>
        <p>Gracias, {hogar.nombre}.</p>
        <Aviso tono="ok" rol="status">
          Pago simulado registrado. No se hizo ningún cobro.
        </Aviso>
        <p>
          <strong>Pedido N.º {pedido.id}</strong> · Sale de {nombreTienda}
        </p>
        <p>Cuando el pedido salga de la tienda, su estado cambia a Despachado en la app.</p>
        <p className="g-apagado">Cuando te llegue, abre la app y toca "Ya me llegó el sobre".</p>
        <Boton a="/medir" anchoCompleto>
          Ya me llegó el sobre (saltar la espera)
        </Boton>
        <p className="g-apagado" style={{ fontSize: '0.9em' }}>
          Botón de la demostración: salta la espera del envío.
        </p>
      </PaginaAlta>
    );
  }

  return (
    <PaginaAlta>
      {cabecera}
      <p>Revisa tu pedido. Si algo no está bien, puedes cambiarlo antes de pagar.</p>

      <section className="alta-resumen-pedido" aria-labelledby="resumen-sobre">
        <h2 className="alta-bloque__titulo" id="resumen-sobre">
          Sobre de medición Grimuca Agua
        </h2>
        <BannerSobre compacto />
        <dl>
          <div>
            <dt>Qué trae</dt>
            <dd>
              <ul>
                <li>1 tira para medir tu agua</li>
                <li>1 prueba casera de bacterias coliformes</li>
                <li>La tabla de colores impresa</li>
                <li>Un código QR con el video de cómo se hace</li>
              </ul>
            </dd>
          </div>
          <div>
            <dt>Envío a</dt>
            <dd>{hogar.direccion}</dd>
          </div>
          <div>
            <dt>Sale de</dt>
            <dd>
              {nombreTienda}, para {hogar.zona}
            </dd>
          </div>
        </dl>
        <p style={{ margin: 0 }}>
          <Link className="g-enlace g-enlace--tactil" to="/envio">
            Cambiar dirección o tienda
          </Link>
        </p>
        <p className="alta-total">
          <span>Total</span>
          <strong>$9</strong>
        </p>
      </section>

      <Aviso tono="atencion" titulo="SIMULACIÓN · No se cobra nada">
        {ROTULO_PAGO_SIMULADO}
      </Aviso>

      {errorPago && (
        <Aviso tono="error" rol="alert">
          {errorPago}
        </Aviso>
      )}

      <Boton anchoCompleto cargando={enviando} textoCargando="Registrando tu pedido…" onClick={pagar}>
        Simular pago de $9
      </Boton>
    </PaginaAlta>
  );
}
