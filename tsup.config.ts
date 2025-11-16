import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  external: ['vscode'],
  // noExternal: [/^(?!vscode$).*/], // Bundle all dependencies except vscode
  clean: true,
})
