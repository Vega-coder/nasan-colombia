import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^[A-Z_]', caughtErrors: 'none' }],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['src/presentation/context/**/*.{js,jsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // Regla de dependencia de Clean Architecture: el dominio no conoce a nadie.
    files: ['src/domain/**/*.js'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['react', 'react-*', '@supabase/*', 'sweetalert2'], message: 'El dominio debe ser JS puro, sin frameworks.' },
          { group: ['@/application/*', '@/infrastructure/*', '@/presentation/*'], message: 'El dominio no puede depender de capas externas.' },
        ],
      }],
    },
  },
  {
    // Los casos de uso solo dependen del dominio y de puertos (inyectados).
    files: ['src/application/**/*.js'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['react', 'react-*', '@supabase/*', 'sweetalert2'], message: 'Los casos de uso no conocen frameworks.' },
          { group: ['@/infrastructure/*', '@/presentation/*'], message: 'La aplicación no puede depender de infraestructura ni de la UI.' },
        ],
      }],
    },
  },
  {
    files: ['src/**/*.test.js'],
    languageOptions: { globals: { ...globals.node } },
  },
])
