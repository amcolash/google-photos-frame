import legacy from '@vitejs/plugin-legacy';
import svgr from 'vite-plugin-svgr';

export default {
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
