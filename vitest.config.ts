import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    // Contract tests talk to an in-process Fastify instance; nothing leaves the machine.
    testTimeout: 10_000,
  },
});
