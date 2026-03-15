import path from 'path';

const root = import.meta.dirname;

export default {
  test: {
    projects: [
      {
        test: {
          name: 'client',
          root: './client',
          environment: 'jsdom',
          globals: true,
          setupFiles: [path.resolve(root, 'test-setup.ts')],
          include: ['src/**/*.test.{ts,tsx}'],
        },
        resolve: {
          alias: {
            '@': path.resolve(root, 'client/src'),
            '@shared': path.resolve(root, 'shared'),
          },
        },
      },
      {
        test: {
          name: 'server',
          root: './server',
          globals: false,
          setupFiles: ['./src/__tests__/setup.ts'],
          include: ['src/**/*.test.ts'],
        },
        resolve: {
          alias: {
            '@shared': path.resolve(root, 'shared'),
          },
        },
      },
    ],
  },
};
