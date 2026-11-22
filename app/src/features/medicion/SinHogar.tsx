import { Boton, EstadoVacio } from '../../components/grimuca';

/** Lo que se ve en /medir y /medir/manual cuando todavía no hay un hogar guardado en el teléfono. */
export function SinHogar({ titulo = 'Mide tu agua' }: { titulo?: string }) {
  return (
    <main id="contenido" className="g-pantalla__contenido">
      <h1 className="g-h1">{titulo}</h1>
      <EstadoVacio titulo="Primero cuéntanos de tu casa" accion={<Boton a="/perfil">Ir a mi perfil</Boton>}>
        Es un minuto. Con eso te damos un resultado hecho para ustedes.
      </EstadoVacio>
    </main>
  );
}
