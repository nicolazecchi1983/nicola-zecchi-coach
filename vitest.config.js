import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/domain/**/*.test.js'],
    globals: false,
    passWithNoTests: false,
    clearMocks: true,
  },
})
