import { Route, Routes } from 'react-router';
import CodigoDev from './CodigoDev';
import PlanoDev from './PlanoDev';
import PreguntasDev from './PreguntasDev';
import TandaDev from './TandaDev';

// Rutas de desarrollo, bajo /#/dev/. App.tsx las monta solo con import.meta.env.DEV y con importación
// perezosa, así que no entran en la compilación de producción. Las tareas 11 y 12 añaden aquí las suyas.
export default function DevRoutes() {
  return (
    <Routes>
      <Route path="plano" element={<PlanoDev />} />
      <Route path="codigo" element={<CodigoDev />} />
      <Route path="preguntas" element={<PreguntasDev />} />
      <Route path="tanda" element={<TandaDev />} />
    </Routes>
  );
}
