import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/helpers/setup.js'],
    include: ['tests/unit/**/*.test.*', 'tests/integration/**/*.test.*'],
  },
})
