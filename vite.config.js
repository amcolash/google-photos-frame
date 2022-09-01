import legacy from '@vitejs/plugin-legacy';
import svgr from 'vite-plugin-svgr';

export default {
  base: '/frame/',
  build: {
    target: 'es2015',
    sourcemap: true,
  },
  plugins: [
    legacy({
      targets: 'Safari 9',
    }),
    svgr(),
  ],
};
