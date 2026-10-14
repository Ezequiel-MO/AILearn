import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// Todo paquete que importa el código de `src/` (salvo pruebas) debe estar en `dependencies`: si solo
// resuelve por hoisting, un `npm install` distinto lo pierde sin avisar.
const root = process.cwd();
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')) as {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    const isSource = /\.(ts|tsx)$/.test(entry.name);
    const isTest = /\.test\.(ts|tsx)$/.test(entry.name) || entry.name === 'test-setup.ts';
    return isSource && !isTest ? [full] : [];
  });
}

function packageOf(specifier: string): string {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : (parts[0] ?? specifier);
}

function typesPackageOf(pkgName: string): string {
  // `@scope/nombre` se publica como `@types/scope__nombre`.
  return pkgName.startsWith('@')
    ? `@types/${pkgName.slice(1).replace('/', '__')}`
    : `@types/${pkgName}`;
}

/** Paquetes importados por el fichero, con las importaciones que son solo de tipo (`import type ... from`) aparte. */
function importedPackages(file: string): { name: string; typeOnly: boolean }[] {
  const text = readFileSync(file, 'utf8');
  const found = [...text.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)].map((m) => ({
    specifier: m[1] ?? '',
    // Una importación de tipo empieza por `import type` y llega hasta su `from` sin cruzar otro `import`.
    typeOnly: /import\s+type\b(?:(?!\bimport\b)[^;])*$/.test(
      text.slice(0, (m.index ?? 0) + m[0].length),
    ),
  }));
  return found
    .filter(
      ({ specifier: s }) =>
        s !== '' && !s.startsWith('.') && !s.startsWith('node:') && !s.startsWith('/'),
    )
    .map(({ specifier, typeOnly }) => ({ name: packageOf(specifier), typeOnly }));
}

/** Un paquete está declarado si está en `dependencies`; uno importado solo por sus tipos vale con `@types/X` en `devDependencies`. */
function isDeclared({ name, typeOnly }: { name: string; typeOnly: boolean }): boolean {
  return name in pkg.dependencies || (typeOnly && typesPackageOf(name) in pkg.devDependencies);
}

describe('imports de src/ declarados en dependencies', () => {
  it('src/ui/CodeEditor.tsx importa solo paquetes declarados', () => {
    // contract: review-10 C1 (R19: @codemirror/language y @lezer/highlight se resolvían por hoisting)
    const missing = importedPackages(path.join(root, 'src/ui/CodeEditor.tsx'))
      .filter((p) => !isDeclared(p))
      .map((p) => p.name);
    expect(missing).toEqual([]);
  });

  it('ningún fichero de src/ (salvo pruebas) importa un paquete no declarado', () => {
    // contract: review-10 C1 (R19)
    const missing = sourceFiles(path.join(root, 'src')).flatMap((file) =>
      importedPackages(file)
        .filter((p) => !isDeclared(p))
        .map((p) => `${path.relative(root, file)} -> ${p.name}`),
    );
    expect(missing).toEqual([]);
  });
});
