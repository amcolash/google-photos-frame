import legacy from '@vitejs/plugin-legacy';

export default {
  build: {
    target: 'es2015',
    sourcemap: 'inline',
  },
  plugins: [
    legacy({
      targets: 'Safari 9',
    }),
  ],
};
