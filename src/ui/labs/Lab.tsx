import { useState } from 'react';
import { labControls, labStart, settle, type LabSpec, type LabState } from '../../engine/labs';
import { t } from '../strings';
import { AtencionLab } from './AtencionLab';
import { CapaLab } from './CapaLab';
import { CompresionLab } from './CompresionLab';
import { LoraLab } from './LoraLab';
import type { LabProps } from './parts';

/** Elige el dibujo por `spec.kind`. Un laboratorio nuevo entra aquí y en `src/engine/labs`. */
export function Lab({ spec, state, onChange }: LabProps<LabSpec>) {
  switch (spec.kind) {
    case 'capa':
      return <CapaLab spec={spec} state={state} onChange={onChange} />;
    case 'atencion':
      return <AtencionLab spec={spec} state={state} onChange={onChange} />;
    case 'compresion':
      return <CompresionLab spec={spec} state={state} onChange={onChange} />;
    case 'lora':
      return <LoraLab spec={spec} state={state} onChange={onChange} />;
  }
}

/** Estado de un laboratorio y la función que aplica un cambio de mandos, ya asentado en su rejilla. */
export function useLabState(spec: LabSpec) {
  const [state, setState] = useState<LabState>(() => labStart(spec));
  const change = (patch: LabState) =>
    setState((prev) => settle(labControls(spec), { ...prev, ...patch }));
  const reset = () => setState(labStart(spec));
  return { state, setState, change, reset };
}

/** Un laboratorio para explorar dentro de una pregunta de «Calcular»: se mueve, pero no puntúa. */
export function LabFigure({ spec }: { spec: LabSpec }) {
  const { state, change } = useLabState(spec);
  const hasControls = labControls(spec).length > 0;
  return (
    <div className="lab__explore">
      <Lab spec={spec} state={state} onChange={hasControls ? change : undefined} />
      {hasControls ? <p className="lab__note">{t.labs.explore}</p> : null}
    </div>
  );
}
