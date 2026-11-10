import type { LabGoalSpec } from '../../content/labs';
import { goalMet, type LabValues } from '../../engine/labs';
import { t } from '../strings';
import { showValue } from './show';

/**
 * Las metas de un laboratorio, medidas en vivo: qué se mide, cuánto vale ahora y cuánto tiene que
 * valer. Con `quiet` (examen) no dice si la meta está cumplida.
 */
export function GoalMeters({
  goals,
  values,
  quiet = false,
}: {
  goals: readonly LabGoalSpec[];
  values: LabValues;
  quiet?: boolean;
}) {
  return (
    <ul className="lab__goals" aria-label={t.labs.goalsLabel}>
      {goals.map((g, k) => {
        const met = !quiet && goalMet(g, values);
        const value = Object.hasOwn(values, g.metric) ? values[g.metric]! : NaN;
        return (
          <li key={k} className={`lab__goal${met ? ' lab__goal--met' : ''}`}>
            <span className="lab__goal-mark" aria-hidden="true">
              {met ? '✓' : '○'}
            </span>
            <span className="lab__goal-label">{g.label}</span>
            <output className="lab__goal-value">{showValue(value, g.format)}</output>
            <span className="lab__goal-target">
              {t.labs.goalOp[g.op]} {showValue(g.target, g.format)}
            </span>
            {quiet ? null : (
              <span className="lab__sr">{met ? t.labs.goalMet : t.labs.goalPending}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
