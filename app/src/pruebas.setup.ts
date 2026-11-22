import '@testing-library/jest-dom/vitest';

// jsdom no implementa window.scrollTo y Leaflet lo llama al pulsar el mapa (pestañas Rutas y Zonas).
if (typeof window !== 'undefined') window.scrollTo = (() => undefined) as typeof window.scrollTo;
