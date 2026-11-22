// Errores con código HTTP. El manejador central (app.ts) los convierte en `{ error, detalle? }`.
export class ErrorHttp extends Error {
  constructor(
    public readonly estado: number,
    mensaje: string,
    public readonly detalle?: unknown,
  ) {
    super(mensaje);
    this.name = 'ErrorHttp';
  }
}

export const noEncontrado = (que: string) => new ErrorHttp(404, `${que} no existe.`);
export const datosInvalidos = (mensaje: string, detalle?: unknown) => new ErrorHttp(400, mensaje, detalle);
