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
        'wiki-darker': '#121212',
        'wiki-accent': '#c4a35a',
        'wiki-accent-light': '#d4b86a',
        'wiki-accent-dark': '#a8894a',
        'wiki-bg': '#f5f5f0',
        'wiki-bg-light': '#fafaf7',
        'wiki-card': '#ffffff',
        'wiki-gray': '#e8e8e8',
        'wiki-gray-light': '#f0f0eb',
        'wiki-text': '#1a1a1a',
        'wiki-text-secondary': '#666666',
        'wiki-text-muted': '#999999',
        'wiki-border': '#e0e0e0',
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
