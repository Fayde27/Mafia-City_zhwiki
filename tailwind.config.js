/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'wiki-dark': '#1a1a1a',
        'wiki-darker': '#0f0f0f',
        'wiki-accent': '#8b5a2b',
        'wiki-accent-light': '#a67c52',
        'wiki-gray': '#2a2a2a',
        'wiki-gray-light': '#3a3a3a',
        'wiki-text': '#e5e5e5',
        'wiki-text-muted': '#9ca3af',
        'wiki-border': '#404040',
        'wiki-danger': '#dc2626',
        'wiki-success': '#16a34a',
      },
      fontFamily: {
        'heading': ['Impact', 'Arial Black', 'sans-serif'],
        'body': ['Arial', 'Helvetica', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'metal': 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 50%, #2a2a2a 100%)',
      }
    },
  },
  plugins: [],
}
