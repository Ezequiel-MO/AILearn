import { describe, expect, it } from 'vitest';
import { NETWORK_PARTS } from '../../src/content/schema';
import type { BigPicture } from '../../src/content/schema';
import { games } from '../../src/games';
import { NETWORK_GROUPS, network } from '../../src/games/network';
import { roadmap } from '../../src/games/roadmap';
import { plainTextProblems } from './prose-helpers';

/**
 * «Dónde encaja en la red» (petición de Oliver, 2026-11-04): todo juego y todo proyecto lleva su
 * `bigPicture`, y las fichas de `src/games/network.ts` cubren las piezas de la red.
 */

const entries: { label: string; bp: BigPicture | undefined }[] = games.flatMap((g) => [
  { label: `${g.id} (juego)`, bp: g.bigPicture },
  ...g.orbits.flatMap((o) =>
    o.projects.map((p) => ({ label: `${g.id}/${p.id}`, bp: p.bigPicture })),
  ),
]);

describe('big picture: juegos y proyectos', () => {
  it('todo juego y todo proyecto tiene bigPicture', () => {
    // contract: petición de Oliver 2026-11-04 (brief-bigpicture-textos.md): sin lista de pendientes
    expect(entries.filter((e) => e.bp === undefined).map((e) => e.label)).toEqual([]);
  });

  it('cada texto mide de 120 a 480 caracteres', () => {
    // contract: brief-bigpicture-textos.md, «de 120 a 480 caracteres»
    const bad = entries
      .filter((e) => e.bp !== undefined && (e.bp.text.length < 120 || e.bp.text.length > 480))
      .map((e) => `${e.label}: ${e.bp!.text.length}`);
    expect(bad).toEqual([]);
  });

  it('ningún texto se repite entre proyectos', () => {
    // contract: brief-bigpicture-textos.md, «no se repite entre proyectos»
    const seen = new Map<string, string>();
    const dup: string[] = [];
    for (const e of entries) {
      if (!e.bp) continue;
      const prev = seen.get(e.bp.text);
      if (prev !== undefined) dup.push(`${e.label} repite a ${prev}`);
      seen.set(e.bp.text, e.label);
    }
    expect(dup).toEqual([]);
  });

  it('los textos pasan las reglas de prosa de un texto suelto', () => {
    // contract: reglas de prosa de prose-helpers.ts (`plainTextProblems`), brief-bigpicture-textos.md
    expect(
      entries.flatMap((e) => (e.bp ? plainTextProblems(`${e.label} text`, e.bp.text) : [])),
    ).toEqual([]);
  });

  it('las piezas de cada uno no se repiten', () => {
    // contract: bigPictureSchema permite de 1 a 4 piezas; una repetida no aporta nada
    const bad = entries
      .filter((e) => e.bp && new Set(e.bp.parts).size !== e.bp.parts.length)
      .map((e) => e.label);
    expect(bad).toEqual([]);
  });
});

describe('big picture: las fichas de la red', () => {
  it('las claves de `network` son exactamente NETWORK_PARTS', () => {
    // contract: `network: Record<NetworkPart, …>` y NETWORK_PARTS de schema.ts
    expect(Object.keys(network).sort()).toEqual([...NETWORK_PARTS].sort());
  });

  it('cada pieza sale en un solo grupo y entre todos están las 13', () => {
    // contract: NETWORK_GROUPS de network.ts reparte las piezas del dibujo; NETWORK_PARTS tiene 13
    const all = NETWORK_GROUPS.flatMap((g) => g.parts);
    expect(new Set(all).size).toBe(all.length);
    expect([...all].sort()).toEqual([...NETWORK_PARTS].sort());
    expect(NETWORK_PARTS).toHaveLength(13);
  });

  it('cada órbita de las fichas existe en la ruta', () => {
    // contract: network.ts, «sus órbitas existen en la ruta» (`src/games/roadmap.ts`)
    const bad = NETWORK_PARTS.flatMap((p) =>
      network[p].roadmap
        .filter(
          (r) => !roadmap.some((g) => g.id === r.game && g.orbits.some((o) => o.name === r.orbit)),
        )
        .map((r) => `${p}: ${r.game} / ${r.orbit}`),
    );
    expect(bad).toEqual([]);
  });

  it('short y detail de cada ficha pasan las reglas de prosa', () => {
    // contract: reglas de prosa de prose-helpers.ts (`plainTextProblems`)
    expect(
      NETWORK_PARTS.flatMap((p) => [
        ...plainTextProblems(`${p} short`, network[p].short),
        ...plainTextProblems(`${p} detail`, network[p].detail),
      ]),
    ).toEqual([]);
  });
});
