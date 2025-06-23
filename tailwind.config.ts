// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    // Make sure to include the path to all your component files that use Tailwind,
    // especially the layout and navigation components.
    './components/layouts/**/*.tsx', // Catches AppLayout, NavLink, CollapsibleNavLink, FlyoutMenu
  ],
  theme: {
    extend: {
      colors: {
        // Define these if you plan to use them as direct Tailwind classes like `bg-primary-600`
        // Otherwise, the `var(--color-<theme>-<shade>)` approach handles it.
        primary: {
            50: 'rgb(var(--color-primary-50) / <alpha-value>)',
            100: 'rgb(var(--color-primary-100) / <alpha-value>)',
            600: 'rgb(var(--color-primary-600) / <alpha-value>)',
            700: 'rgb(var(--color-primary-700) / <alpha-value>)',
        },
        // Define specific color palettes that will be used for dynamic theming.
        // These keys ('indigo', 'blue', 'emerald', etc.) will correspond to your `themeColor` prop values.
        // The values here will resolve to the CSS variables defined in the plugin below.
        indigo: {
          50: 'rgb(var(--indigo-50) / <alpha-value>)',
          100: 'rgb(var(--indigo-100) / <alpha-value>)',
          600: 'rgb(var(--indigo-600) / <alpha-value>)',
          700: 'rgb(var(--indigo-700) / <alpha-value>)',
        },
        blue: {
          50: 'rgb(var(--blue-50) / <alpha-value>)',
          100: 'rgb(var(--blue-100) / <alpha-value>)',
          600: 'rgb(var(--blue-600) / <alpha-value>)',
          700: 'rgb(var(--blue-700) / <alpha-value>)',
        },
        emerald: {
          50: 'rgb(var(--emerald-50) / <alpha-value>)',
          100: 'rgb(var(--emerald-100) / <alpha-value>)',
          600: 'rgb(var(--emerald-600) / <alpha-value>)',
          700: 'rgb(var(--emerald-700) / <alpha-value>)',
        },
        // Add more color palettes here as needed for your themes
      },
    },
  },
  plugins: [
    function ({
      addBase,
      theme,
    }: {
      addBase: (base: Record<string, Record<string, string>>) => void;
      theme: (path: string) => string;
    }) {
      addBase({
        // This is where you define the actual CSS custom properties (variables)
        // that Tailwind will use. The values are pulled from Tailwind's default
        // color palette (e.g., theme('colors.indigo.50')).
        // The `.replace('#', '')` is a workaround to get raw RGB values if `theme()`
        // returns hex codes, which is then used by `rgb(var(--...) / <alpha-value>)`.
        // Ensure you define variables for all shades you use (50, 100, 600, 700).
        ':root': {
          '--indigo-50': theme('colors.indigo.50').replace('#', ''),
          '--indigo-100': theme('colors.indigo.100').replace('#', ''),
          '--indigo-600': theme('colors.indigo.600').replace('#', ''),
          '--indigo-700': theme('colors.indigo.700').replace('#', ''),

          '--blue-50': theme('colors.blue.50').replace('#', ''),
          '--blue-100': theme('colors.blue.100').replace('#', ''),
          '--blue-600': theme('colors.blue.600').replace('#', ''),
          '--blue-700': theme('colors.blue.700').replace('#', ''),

          '--emerald-50': theme('colors.emerald.50').replace('#', ''),
          '--emerald-100': theme('colors.emerald.100').replace('#', ''),
          '--emerald-600': theme('colors.emerald.600').replace('#', ''),
          '--emerald-700': theme('colors.emerald.700').replace('#', ''),
          // Add more theme color variables here, matching the keys in `theme.extend.colors` above
        },
      });
    },
  ],
};
