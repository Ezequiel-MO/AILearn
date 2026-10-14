import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// Una sola versión de katex en el árbol: el CSS que importa `Md` (el de la raíz) debe corresponder
// al HTML que genera `rehype-katex` (con su propio katex). Si difieren, las clases de tamaño del
// HTML no existen en la hoja y los exponentes salen del mismo tamaño que la base.
// Se imita la resolución de Node a mano porque estos paquetes no exportan su package.json.
const modules = path.join(process.cwd(), 'node_modules');

function versionAt(file: string): string {
  return (JSON.parse(readFileSync(file, 'utf8')) as { version: string }).version;
}

function katexVersionSeenBy(packageName: string): string {
  const nested = path.join(modules, packageName, 'node_modules', 'katex', 'package.json');
  return versionAt(existsSync(nested) ? nested : path.join(modules, 'katex', 'package.json'));
}

describe('versión única de katex', () => {
  const root = versionAt(path.join(modules, 'katex', 'package.json'));

  it('la raíz y rehype-katex resuelven la misma versión', () => {
    // contract: review-10 C1
    expect(katexVersionSeenBy('rehype-katex')).toBe(root);
  });

  it('la raíz y micromark-extension-math resuelven la misma versión', () => {
    // contract: review-10 C1
    expect(katexVersionSeenBy('micromark-extension-math')).toBe(root);
  });

  it('package.json declara katex en la serie 0.16 que usan rehype-katex y micromark-extension-math', () => {
    // contract: review-10 C1 (R21)
    const pkg = JSON.parse(readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>;
    };
    expect(pkg.dependencies['katex']).toMatch(/^\^0\.16\./);
  });
});
