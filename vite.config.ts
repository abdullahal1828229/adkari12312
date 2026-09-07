import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// على GitHub Pages لموقع مشروع (وليس موقع مستخدم/منظمة)، يجب أن يكون المسار
// الأساسي هو "/اسم-المستودع/". نضبط هذا تلقائيًا عبر متغير البيئة BASE_PATH
// الذي يحدده workflow الخاص بـ GitHub Actions (انظر .github/workflows/deploy.yml).
// عند التشغيل محليًا (pnpm/npm run dev أو build) بدون هذا المتغير، نستخدم "/" كافتراضي.
const basePath = process.env.BASE_PATH || '/';

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
  },
});
