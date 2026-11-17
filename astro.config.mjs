import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ccccccvia.github.io',
  output: 'static',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  devToolbar: { enabled: false },
});
