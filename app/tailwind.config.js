/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        azul: { DEFAULT: 'var(--azul)', 700: 'var(--azul-700)', 900: 'var(--azul-900)', 100: 'var(--azul-100)', 50: 'var(--azul-50)' },
        accion: { DEFAULT: 'var(--accion)', 700: 'var(--accion-700)' },
        amarillo: 'var(--amarillo)',
        papel: 'var(--papel)',
        tinta: { DEFAULT: 'var(--tinta)', 2: 'var(--tinta-2)' },
        apagado: 'var(--apagado)',
        linea: 'var(--linea)',
        'borde-control': 'var(--borde-control)',
        ok: { DEFAULT: 'var(--ok)', bg: 'var(--ok-bg)' },
        error: { DEFAULT: 'var(--error)', bg: 'var(--error-bg)' },
      },
      fontFamily: { titulo: 'var(--f-titulo)', texto: 'var(--f-texto)' },
      borderRadius: { control: '2px' },
    },
  },
  plugins: [],
};
