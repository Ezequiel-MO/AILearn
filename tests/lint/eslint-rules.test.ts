import { ESLint } from 'eslint';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

// Ejecuta ESLint con la configuración real del proyecto sobre texto, sin escribir ficheros.
const eslint = new ESLint({ cwd: process.cwd() });

async function ruleIds(filePath: string, code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath: path.resolve(filePath) });
  return (result?.messages ?? []).map((m) => m.ruleId ?? `fatal:${m.message}`);
}

// El primer lint carga la configuración, el analizador de TypeScript y las reglas: con la máquina
// cargada tarda más que el límite de 5 s por prueba. Se hace una vez aquí, con plazo amplio, para
// que ninguna prueba cargue con el arranque en frío.
beforeAll(async () => {
  await ruleIds('src/engine/p.ts', 'export const warm = 1;\n');
}, 120_000);

describe('regla de aislamiento del motor (local/engine-isolation)', () => {
  it('rechaza un import de tipo en línea hacia otro directorio de src', async () => {
    const ids = await ruleIds(
      'src/engine/p.ts',
      "export type T = typeof import('../ui/strings').t;\n",
    );
    // contract: fix1 punto 1: los imports de tipo en línea también salen del motor
    expect(ids).toContain('local/engine-isolation');
  });

  it('rechaza un import de tipo en línea de un paquete', async () => {
    const ids = await ruleIds('src/engine/p.ts', "export type Z = import('zod').ZodType;\n");
    // contract: fix1 punto 1: un paquete de npm no entra en el motor
    expect(ids).toContain('local/engine-isolation');
  });

  it('rechaza `import x = require(...)` de un paquete', async () => {
    const ids = await ruleIds('src/engine/p.ts', "import z = require('zod');\nexport { z };\n");
    // contract: fix1 punto 1: simetría con TSExternalModuleReference
    expect(ids).toContain('local/engine-isolation');
  });

  it('vigila también los ficheros .mts', async () => {
    const ids = await ruleIds(
      'src/engine/p.mts',
      "import { t } from '../ui/strings';\nexport const x = t;\n",
    );
    // contract: fix1 punto 2: el glob cubre mts, cts, js, jsx, mjs y cjs
    expect(ids).toContain('local/engine-isolation');
  });

  it('vigila también los ficheros .js', async () => {
    const ids = await ruleIds(
      'src/engine/p.js',
      "import { t } from '../ui/strings';\nexport const x = t;\n",
    );
    // contract: fix1 punto 2
    expect(ids).toContain('local/engine-isolation');
  });

  it('rechaza node:test en una prueba del motor', async () => {
    const ids = await ruleIds(
      'src/engine/p.test.ts',
      "import { it } from 'node:test';\nit('x', () => {});\n",
    );
    // contract: fix1 punto 3: solo `vitest` está permitido
    expect(ids).toContain('local/engine-isolation');
  });

  it('permite vitest en una prueba del motor', async () => {
    const ids = await ruleIds(
      'src/engine/p.test.ts',
      "import { it } from 'vitest';\nit('x', () => {});\n",
    );
    // contract: common.md y brief: las pruebas de src/engine pueden importar vitest
    expect(ids).not.toContain('local/engine-isolation');
  });

  it('no permite vitest fuera de una prueba del motor', async () => {
    const ids = await ruleIds('src/engine/p.ts', "import { it } from 'vitest';\nexport { it };\n");
    // contract: brief: solo los ficheros de prueba de src/engine pueden importar vitest
    expect(ids).toContain('local/engine-isolation');
  });

  it('permite importar entre hermanos del motor', async () => {
    const ids = await ruleIds('src/engine/p.ts', "import { y } from './q';\nexport const x = y;\n");
    // contract: brief: src/engine puede importar ficheros de src/engine
    expect(ids).not.toContain('local/engine-isolation');
  });

  it('permite subir un nivel dentro del motor', async () => {
    const ids = await ruleIds(
      'src/engine/sub/p.ts',
      "import { y } from '../q';\nexport const x = y;\n",
    );
    // contract: brief: cualquier fichero de src/engine es importable
    expect(ids).not.toContain('local/engine-isolation');
  });
});

describe('regla de localStorage', () => {
  const code = "export const a = localStorage.getItem('k');\n";

  it('salta fuera de src/storage', async () => {
    const ids = await ruleIds('src/ui/x.ts', code);
    // contract: common.md: solo src/storage toca localStorage
    expect(ids).toContain('no-restricted-globals');
  });

  it('salta con window.localStorage fuera de src/storage', async () => {
    const ids = await ruleIds('src/ui/x.ts', 'export const a = window.localStorage;\n');
    // contract: common.md: solo src/storage toca localStorage
    expect(ids).toContain('no-restricted-properties');
  });

  it('no salta en src/storage', async () => {
    const ids = await ruleIds('src/storage/x.ts', code);
    // contract: common.md: src/storage es el único que lo usa
    expect(ids).not.toContain('no-restricted-globals');
  });

  it('no salta en tests/e2e', async () => {
    const ids = await ruleIds('tests/e2e/x.spec.ts', code);
    // contract: fix1 punto 5: la prueba de humo siembra progreso en localStorage
    expect(ids).not.toContain('no-restricted-globals');
  });

  it('salta en otras carpetas de tests', async () => {
    const ids = await ruleIds('tests/x.test.ts', code);
    // contract: fix1 punto 5: solo tests/e2e queda exento
    expect(ids).toContain('no-restricted-globals');
  });
});
