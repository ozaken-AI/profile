import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://ozaken.ai',
  integrations: [sitemap()],
  image: {
    // 5000px級の元データを扱うため、生成サイズを明示する
    responsiveStyles: true,
  },
  build: { inlineStylesheets: 'auto' },
  vite: {
    build: { assetsInlineLimit: 2048 },
  },
});
