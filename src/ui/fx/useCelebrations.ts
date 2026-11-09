import { toShape, type Game } from '../../content/schema';
import { xp } from '../../engine/progression';
import { levelProgress, newAchievements } from '../../engine/rewards';
import { t } from '../strings';
import { useSummaryChanges } from '../useProgress';
import { fireworks, toast } from './effects';
import { sounds } from './sound';

/**
 * Celebra lo que consigue el jugador en esta pantalla: subir de nivel y cada logro nuevo, con confeti,
 * fanfarria y un aviso. Lo decide el motor comparando el resumen de antes y el de después.
 */
export function useCelebrations(game: Game | undefined): void {
  useSummaryChanges(game?.id, (before, after) => {
    if (!game) return;
    const shape = toShape(game);
    const levelBefore = levelProgress(xp(shape, before)).whole;
    const levelAfter = levelProgress(xp(shape, after)).whole;
    const fresh = newAchievements(shape, before, after);
    const levelUp = levelAfter > levelBefore;
    if (!levelUp && fresh.length === 0) return;
    fireworks();
    sounds.fanfare();
    if (levelUp) toast({ icon: '▲', title: t.fx.levelUp(levelAfter), text: t.fx.levelUpText });
    fresh.forEach((id, i) => {
      const { title, text } = t.fx.achievements[id];
      setTimeout(
        () => toast({ icon: '★', title: t.fx.achievementNew(title), text }),
        (i + (levelUp ? 1 : 0)) * 600,
      );
    });
  });
}
