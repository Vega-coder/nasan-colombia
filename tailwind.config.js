/** @type {import('tailwindcss').Config} */
export default {
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Paleta oficial de NASAN COLOMBIA (Herramientas, Insumos, Baterías y Maquinaria)
      colors: {
        ink: {
          DEFAULT: '#0B131F', // Grafito oscuro industrial
          soft: '#131F30',
          muted: '#1E293B',
        },
        gold: {
          light: '#26C6DA',   // Cyan brillante
          DEFAULT: '#008C99', // Cyan / Teal oficial NASAN
          dark: '#0A525B',    // Teal profundo
        },
        nasan: {
          teal: '#008C99',
          cyan: '#26C6DA',
          bright: '#00e5ff',
          deep: '#0A525B',
          dark: '#0B131F',
          slate: '#1E293B',
          light: '#E6F7F8',
        },
        cream: {
          DEFAULT: '#F1F5F9', // Plata metálico suave
          light: '#F8FAFC',
        },
        blush: '#E0F2FE',     // Brisa tecnológica
        taupe: {
          DEFAULT: '#64748B', // Titanio / gris técnico
          light: '#94A3B8',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'Rajdhani', 'Montserrat', 'sans-serif'],
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
        tech: ['Rajdhani', 'Montserrat', 'sans-serif'],
      },
      letterSpacing: {
        luxe: '0.24em',
        tech: '0.18em',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #0A525B 0%, #008C99 45%, #26C6DA 70%, #0A525B 100%)',
        'teal-gradient': 'linear-gradient(135deg, #008C99 0%, #26C6DA 50%, #00A8B5 100%)',
        'nasan-banner': 'linear-gradient(180deg, #CBD5E1 0%, #94A3B8 25%, #008C99 75%, #0A525B 100%)',
      },
      boxShadow: {
        luxe: '0 20px 50px -20px rgba(0, 140, 153, 0.35)',
        cyan: '0 0 25px rgba(0, 140, 153, 0.4)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.1)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        progress: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out both',
        float: 'float 3.5s ease-in-out infinite',
        'pulse-subtle': 'pulse-subtle 3s ease-in-out infinite',
        marquee: 'marquee 28s linear infinite',
        progress: 'progress 3.5s linear forwards',
      },
    },
  },
  plugins: [],
}
