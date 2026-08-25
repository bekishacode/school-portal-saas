/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Overridden per tenant at runtime via CSS variables (branding config)
        brand: {
          DEFAULT: 'var(--color-brand, #2563eb)',
        },
      },
    },
  },
  plugins: [],
};
