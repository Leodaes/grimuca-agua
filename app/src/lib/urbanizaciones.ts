// Punto de entrada compartido del front para la lista de urbanizaciones.
// La copia vive junto al mapa del operador (features/operador/urbanizaciones.ts) y es idéntica a la de la API.
export { URBANIZACIONES, buscarUrbanizacion, normalizarNombre, urbanizacionesDeZona } from '../features/operador/urbanizaciones';
export type { Urbanizacion } from '../features/operador/urbanizaciones';
