  /** @type {import('tailwindcss').Config} */
  export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
      extend: {
        animation: {
          'progress': 'progress 1s ease-in-out infinite',
          'fade-in': 'fadeIn 0.2s ease-in',
        },
        keyframes: {
          progress: {
            '0%': { transform: 'translateX(-100%)' },
            '100%': { transform: 'translateX(100%)' }
          },
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' }
          }
        }
      },
    },
    plugins: [require('tailwind-scrollbar-hide')],
  };
