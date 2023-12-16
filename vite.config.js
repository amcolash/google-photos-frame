import legacy from '@vitejs/plugin-legacy';
import svgr from 'vite-plugin-svgr';

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
};
