import legacy from '@vitejs/plugin-legacy';
import svgr from 'vite-plugin-svgr';
import autoprefixer from 'autoprefixer';

export default {
  build: {
    sourcemap: true,
  },
  plugins: [
    legacy({
      targets: ['Safari 8'],
    }),
    svgr(),
  ],
  css: {
    postcss: {
      plugins: [autoprefixer()],
    },
  },
};
