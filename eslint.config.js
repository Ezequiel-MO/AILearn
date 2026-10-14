import path from 'node:path';
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

const ENGINE_DIR = path.resolve(import.meta.dirname, 'src/engine');
const TEST_FILE = /\.test\.[cm]?[jt]sx?$/;

// Regla local: dentro de src/engine solo se importan ficheros de src/engine.
// No vale ningún paquete de npm ni otro directorio de src. Único permiso:
// los ficheros de prueba de src/engine pueden importar `vitest`.
const engineIsolation = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      outside: 'src/engine solo puede importar ficheros de src/engine; «{{source}}» queda fuera.',
      pkg: 'src/engine no puede importar paquetes ni alias («{{source}}»); solo ficheros de src/engine.',
    },
  },
  create(context) {
    const filename = context.filename;
    const isTest = TEST_FILE.test(filename);
    const check = (node, source) => {
      if (typeof source !== 'string') return;
      if (
        source.startsWith('./') ||
        source.startsWith('../') ||
        source === '.' ||
        source === '..'
      ) {
        const target = path.resolve(path.dirname(filename), source);
        const rel = path.relative(ENGINE_DIR, target);
        if (rel.startsWith('..') || path.isAbsolute(rel)) {
          context.report({ node, messageId: 'outside', data: { source } });
        }
        return;
      }
      if (isTest && source === 'vitest') return;
      context.report({ node, messageId: 'pkg', data: { source } });
    };
    return {
      ImportDeclaration: (node) => check(node.source, node.source.value),
      ExportAllDeclaration: (node) => check(node.source, node.source.value),
      ExportNamedDeclaration: (node) => {
        if (node.source) check(node.source, node.source.value);
      },
      // import('../x').T en posición de tipo
      TSImportType: (node) => {
        const literal = node.source;
        if (literal && literal.type === 'Literal') check(literal, literal.value);
        else context.report({ node, messageId: 'pkg', data: { source: '<dinámico>' } });
      },
      // import x = require('x')
      TSExternalModuleReference: (node) => {
        if (node.expression.type === 'Literal') check(node.expression, node.expression.value);
        else context.report({ node, messageId: 'pkg', data: { source: '<dinámico>' } });
      },
      ImportExpression: (node) => {
        if (node.source.type === 'Literal') check(node.source, node.source.value);
        else context.report({ node, messageId: 'pkg', data: { source: '<dinámico>' } });
      },
      CallExpression: (node) => {
        if (node.callee.type === 'Identifier' && node.callee.name === 'require') {
          const arg = node.arguments[0];
          if (arg && arg.type === 'Literal') check(arg, arg.value);
        }
      },
    };
  },
};

const localPlugin = { rules: { 'engine-isolation': engineIsolation } };

export default tseslint.config(
  {
    ignores: [
      'dist/',
      'node_modules/',
      'test-results/',
      'playwright-report/',
      '.superpowers/',
      'docs/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['*.config.{js,ts}'],
    languageOptions: { globals: { ...globals.node } },
  },
  // Solo src/storage toca localStorage; la prueba de humo (tests/e2e) siembra progreso desde Playwright.
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['src/storage/**', 'tests/e2e/**'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'localStorage', message: 'Solo src/storage puede usar localStorage.' },
      ],
      'no-restricted-properties': [
        'error',
        ...['window', 'globalThis', 'self'].map((object) => ({
          object,
          property: 'localStorage',
          message: 'Solo src/storage puede usar localStorage.',
        })),
      ],
    },
  },
  // src/engine no importa nada de fuera de src/engine.
  {
    files: ['src/engine/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}'],
    plugins: { local: localPlugin },
    rules: { 'local/engine-isolation': 'error' },
  },
);
