import { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes } from 'react-router';

// Solo en desarrollo: con la constante falsa, el bundler descarta la importación y el módulo no se empaqueta.
const DevRoutes = import.meta.env.DEV ? lazy(() => import('./ui/dev/DevRoutes')) : null;

// Las pantallas de juego traen el contenido, KaTeX y el ejecutor de tandas: van en trozos aparte.
const LaunchScreen = lazy(() =>
  import('./ui/screens/LaunchScreen').then((m) => ({ default: m.LaunchScreen })),
);
const ExerciseScreen = lazy(() =>
  import('./ui/screens/ExerciseScreen').then((m) => ({ default: m.ExerciseScreen })),
);
const SheetScreen = lazy(() =>
  import('./ui/screens/SheetScreen').then((m) => ({ default: m.SheetScreen })),
);
const ExamScreen = lazy(() =>
  import('./ui/screens/ExamScreen').then((m) => ({ default: m.ExamScreen })),
);

// El inicio, el mapa, el panel y las estadísticas leen el contenido del juego: también van en trozos aparte.
const Hub = lazy(() => import('./ui/screens/Hub').then((m) => ({ default: m.Hub })));
const GameMap = lazy(() => import('./ui/screens/GameMap').then((m) => ({ default: m.GameMap })));
const ProjectPanel = lazy(() =>
  import('./ui/screens/ProjectPanel').then((m) => ({ default: m.ProjectPanel })),
);
const StatsScreen = lazy(() =>
  import('./ui/screens/StatsScreen').then((m) => ({ default: m.StatsScreen })),
);

/** Las rutas, sin enrutador: las pruebas las montan en un `MemoryRouter`. */
export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Suspense fallback={null}>
            <Hub />
          </Suspense>
        }
      />
      <Route
        path="/j/:game"
        element={
          <Suspense fallback={null}>
            <GameMap />
          </Suspense>
        }
      />
      <Route
        path="/j/:game/p/:project"
        element={
          <Suspense fallback={null}>
            <ProjectPanel />
          </Suspense>
        }
      />
      <Route
        path="/j/:game/estadisticas"
        element={
          <Suspense fallback={null}>
            <StatsScreen />
          </Suspense>
        }
      />
      <Route
        path="/j/:game/despegue"
        element={
          <Suspense fallback={null}>
            <LaunchScreen />
          </Suspense>
        }
      />
      <Route
        path="/j/:game/p/:project/ex/:n"
        element={
          <Suspense fallback={null}>
            <ExerciseScreen />
          </Suspense>
        }
      />
      <Route
        path="/j/:game/p/:project/hoja/:n"
        element={
          <Suspense fallback={null}>
            <SheetScreen />
          </Suspense>
        }
      />
      <Route
        path="/j/:game/examen/:c"
        element={
          <Suspense fallback={null}>
            <ExamScreen />
          </Suspense>
        }
      />
      {DevRoutes && (
        <Route
          path="/dev/*"
          element={
            <Suspense fallback={null}>
              <DevRoutes />
            </Suspense>
          }
        />
      )}
    </Routes>
  );
}

export function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}
