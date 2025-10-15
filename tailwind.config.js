/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        blueprint: {
          blue: '#1E40AF', // Royal blue for main accents
          'blue-light': '#3B82F6', // Lighter blue for hover states
          'blue-dark': '#1E3A8A', // Darker blue for text
          'blue-50': '#EFF6FF', // Very light blue for backgrounds
          'blue-100': '#DBEAFE', // Light blue for subtle backgrounds
          'off-white': '#FEFEFE', // Off-white background
          'cream': '#F8FAFC', // Slightly warmer off-white
          'gray-soft': '#64748B', // Soft gray for secondary text
          'gray-dark': '#1E293B' // Dark gray for primary text
        }
      },
      fontFamily: {
        'sans': ['Montserrat', 'system-ui', 'sans-serif'], // Default font family
        'blueprint': ['Montserrat', 'system-ui', 'sans-serif'], // Clean sans-serif for menu items
        'blueprint-bold': ['Montserrat', 'system-ui', 'sans-serif'], // Bold version for headings
        'blueprint-display': ['Montserrat', 'system-ui', 'sans-serif'] // Display font for large text
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        bounceGentle: {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-4px)' },
          '60%': { transform: 'translateY(-2px)' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      }
    },
  },
  plugins: [],
};