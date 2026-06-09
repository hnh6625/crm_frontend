/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  corePlugins: {
    preflight: false,  // tắt để không conflict Element Plus
  },
  theme: {
    extend: {
      colors: {
        // Primary — Navy
        'navy':          '#001e40',
        'navy-light':    '#003366',
        'navy-dark':     '#001228',
        // Accent — Cam
        'accent':        '#ff8928',
        'accent-light':  '#ffad6b',
        // Surface
        'bg-page':       '#f0f2f5',
        'surface':       '#ffffff',
        'surface-soft':  '#f8f9fa',
        'border-base':   '#e4e7ec',
        'border-light':  '#f0f2f5',
        // Text
        'text-primary':  '#101828',
        'text-secondary':'#475467',
        'text-hint':     '#98a2b3',
        // Status
        'success':       '#12b76a',
        'warning':       '#f79009',
        'danger':        '#f04438',
        'info':          '#2e90fa',
      },
      fontFamily: {
        sans: ['Be Vietnam Pro', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(16,24,40,0.1), 0 1px 2px rgba(16,24,40,0.06)',
        'md':   '0 4px 8px -2px rgba(16,24,40,0.1), 0 2px 4px -2px rgba(16,24,40,0.06)',
      }
    }
  },
  plugins: []
}
