/** @type {import('tailwindcss').Config} */
module.exports = {
   content: ["./src/**/*.{html,js,vue}"],
   theme: {
      extend: {
         keyframes: {
            vibrate: {
               '0%, 50%, 100%': { transform: 'translateX(0)' },
               '25%': { transform: 'translateX(1rem)' },
               '75%': { transform: 'translateX(-1rem)' },
            },
         },
         animation: {
            vibrate: 'vibrate 0.15s ease-in-out 2',
         },
      },
   },
   plugins: [],
}
