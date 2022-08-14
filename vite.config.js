import legacy from '@vitejs/plugin-legacy';

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
  ],
};
