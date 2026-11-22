// Nombres de eventos de `window` sobre el hogar de la sesión. Van aparte de `api` y `sesion`
// para que las pruebas que simulan esos módulos no tengan que repetirlos.

/** Se emite cada vez que se guarda u olvida el hogar (`detail`: el id o `null`). */
export const EVENTO_HOGAR = 'agua:hogar';

/** Se emite cuando la API dice que el hogar de la sesión ya no existe; `Marco` lleva al perfil. */
export const EVENTO_PERFIL_PERDIDO = 'agua:perfil-perdido';

/** Error que ve la persona en la pantalla donde se perdió el perfil. */
export const MENSAJE_PERFIL_PERDIDO = 'No encontramos tu perfil en este teléfono. Vuelve a llenarlo; toma un minuto.';

/** Aviso de arriba en `/perfil` tras perder el perfil. */
export const TEXTO_AVISO_PERFIL_PERDIDO =
  'No encontramos tu perfil en este teléfono, quizás se reinició la demostración. Vuelve a llenarlo; toma un minuto.';
