// Achica la foto en el navegador antes de subirla, para que suba rápido con datos móviles.

export const LADO_MAYOR = 1600;
export const CALIDAD_JPEG = 0.85;

/** Calcula el tamaño final: el lado mayor queda en `maximo` como mucho, sin agrandar. */
export function medidasReducidas(ancho: number, alto: number, maximo = LADO_MAYOR): { ancho: number; alto: number } {
  const mayor = Math.max(ancho, alto);
  if (mayor <= maximo || mayor === 0) return { ancho, alto };
  const escala = maximo / mayor;
  return { ancho: Math.round(ancho * escala), alto: Math.round(alto * escala) };
}

function cargarImagen(url: string): Promise<HTMLImageElement> {
  return new Promise((resolver, rechazar) => {
    const imagen = new Image();
    imagen.onload = () => resolver(imagen);
    imagen.onerror = () => rechazar(new Error('No se pudo abrir la imagen'));
    imagen.src = url;
  });
}

/**
 * Devuelve la foto en JPEG con el lado mayor en 1600 px como mucho.
 * Si el navegador no puede procesarla, devuelve la foto original: nunca bloquea la subida.
 */
export async function reducirImagen(archivo: File): Promise<File> {
  if (typeof URL.createObjectURL !== 'function') return archivo;
  let url: string | null = null;
  try {
    url = URL.createObjectURL(archivo);
    const imagen = await cargarImagen(url);
    const { ancho, alto } = medidasReducidas(imagen.naturalWidth, imagen.naturalHeight);
    if (ancho === 0 || alto === 0) return archivo;

    const lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = alto;
    const contexto = lienzo.getContext('2d');
    if (!contexto) return archivo;
    contexto.drawImage(imagen, 0, 0, ancho, alto);

    const reducida = await new Promise<Blob | null>((resolver) =>
      lienzo.toBlob(resolver, 'image/jpeg', CALIDAD_JPEG),
    );
    // Si no se pudo convertir, o quedó más pesada que la original, se sube la original.
    if (!reducida || (reducida.size >= archivo.size && archivo.type === 'image/jpeg')) return archivo;
    return new File([reducida], 'tira.jpg', { type: 'image/jpeg' });
  } catch {
    return archivo;
  } finally {
    if (url) URL.revokeObjectURL(url);
  }
}
