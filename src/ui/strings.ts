import { fmt } from './format';

// Todos los textos fijos de la interfaz, en castellano.
//
// Convención para ampliar (varias tareas de interfaz tocan este fichero):
// - Cada área añade UN grupo propio, `t.<area>`, y solo edita el suyo.
// - Los textos con valores variables son funciones del grupo, que formatean con `fmt`.
// - Orden de los grupos: el de las tareas que los crean; añade el tuyo al final, antes de `as const`.
export const t = {
  appTitle: 'AIlearn',

  // --- Layout (tarea 9) ---
  layout: {
    back: 'Volver',
    level: (n: number) => `Nivel ${fmt(n, 2)}`,
  },

  // --- Plano de vectores (tarea 9) ---
  plane: {
    figure: 'Plano de vectores',
    readouts: 'Lecturas',
    xAxis: 'x',
    yAxis: 'y',
    dotName: (a: string, b: string) => `${a} · ${b}`,
    cosName: (a: string, b: string) => `cos(${a}, ${b})`,
    angleName: (a: string, b: string) => `ángulo(${a}, ${b})`,
    projectionName: (a: string, b: string) => `proy de ${a} sobre ${b}`,
    // el vector nulo no tiene dirección: el ángulo, el coseno y la proyección no existen
    noAngle: 'sin ángulo',
    noProjection: 'sin proyección',
    handleLabel: (name: string, position: string) => `Asa del vector ${name}, en ${position}`,
    // transformación lineal: A tiene por columnas los dos vectores de la base
    matrixName: 'A',
    detName: 'det A',
    imageName: (name: string) => `A·${name}`,
  },

  // --- Preguntas (tarea 10) ---
  questions: {
    submit: 'Entregar',
    reset: 'Recolocar',
    invalidNumber: 'Escribe un número, por ejemplo 3,5',
    answerLabel: 'Tu respuesta',
    vectorLegend: 'Tu respuesta, componente a componente',
    componentLabel: (index: number, count: number) => `Componente ${index} de ${count}`,
    matrixLegend: 'Tu respuesta, fila a fila',
    cellLabel: (row: number, col: number) => `Fila ${row}, columna ${col}`,
    optionsLegend: 'Opciones',
    verdictLegend: 'Tu veredicto',
    verdictOk: 'Está bien',
    verdictFault: 'Tiene un error',
    pickLine: 'Pulsa la línea errónea',
    linesLegend: 'Líneas',
    lineLabel: (line: number, text: string) => `Línea ${line}: ${text}`,
  },

  // --- Pregunta de código (tarea 11) ---
  code: {
    editorLabel: 'Editor de código Python',
    editorLoading: 'Cargando el editor…',
    tabHelp: 'Tab sangra. Para salir del editor con el teclado, pulsa Esc y después Tab.',
    resultsLabel: 'Resultado',
    run: 'Ejecutar',
    running: 'Ejecutando…',
    reset: 'Restablecer',
    resetConfirm: '¿Volver al código de partida? Se perderá lo que has escrito.',
    resetYes: 'Sí, restablecer',
    resetNo: 'Cancelar',
    loading: 'Cargando Python…',
    loadFailed: 'No se ha podido cargar Python. Comprueba la conexión.',
    retry: 'Reintentar',
    timedOut: 'Tu código tardó demasiado. ¿Hay un bucle que no termina?',
    runFailed: 'Algo ha fallado al ejecutar. Vuelve a intentarlo.',
    outputLabel: 'Salida',
    errorLabel: 'Error',
    checksLabel: 'Comprobaciones',
    checkFailed: 'Fallida',
    checksSummary: (passed: number, total: number) =>
      total === 1
        ? `${passed} de 1 comprobación superada`
        : `${passed} de ${total} comprobaciones superadas`,
    figuresLabel: 'Figuras',
    figureAlt: (n: number) => `Figura ${n}`,
  },

  // --- Ejecutor de tandas (tarea 12) ---
  runner: {
    progress: (n: number, total: number) => `${n} de ${total}`,
    firsts: (n: number) => `A la primera: ${n}`,
    hint: 'Dame una pista',
    hintsLabel: 'Pistas',
    next: 'Siguiente',
    explainLabel: 'Explicación',
    explainedIntro: 'Todavía no. Esto te ayudará; puedes volver a entregar.',
    solutionLabel: 'Solución',
    solved: '¡Correcto!',
    revealedIntro: 'No ha salido. Esta es la solución.',
    recorded: 'Respuesta registrada',
    finished: 'Tanda terminada',
  },

  // --- Pantallas de juego: Despegue, ejercicio y hoja (tarea 13b) ---
  play: {
    closed: 'Todavía no está abierto',
    closedHelp: 'Esta etapa aún no se ha abierto. Vuelve al mapa y sigue avanzando.',
    missing: 'No existe',
    missingHelp: 'No hay nada en esta dirección.',
    toMap: 'Volver al mapa',
    toHome: 'Volver al inicio',
    toProject: 'Volver al proyecto',
    repeat: 'Repetir',
    launchTitle: 'Despegue',
    exerciseTitle: (project: string, n: number) => `${project} · Ejercicio ${n}`,
    sheetTitle: (project: string, n: number) => `${project} · Caza el error ${n}`,
    resultHeading: 'Resultado',
    launchDone: (correct: number, total: number, firsts: number) =>
      `Despegue completado: ${correct} de ${total} acertadas, ${firsts} a la primera.`,
    exerciseResult: (firsts: number, total: number) =>
      `Este intento: ${firsts} de ${total} a la primera.`,
    exerciseBest: (best: number, total: number) =>
      `Tu mejor marca en este ejercicio: ${best} de ${total}.`,
    projectMark: (mark: number) => `Nota del proyecto: ${mark} sobre 100.`,
    validated: 'Proyecto validado.',
    notValidated: (threshold: number) =>
      `El proyecto aún no está validado: hace falta una nota de ${threshold}.`,
    sheetSolved: 'Hoja resuelta.',
    sheetFailed: 'Esta vez no ha salido. Puedes repetirla.',
  },

  // --- Pantalla de examen (tarea 13c) ---
  exam: {
    title: (orbit: string) => `Examen · ${orbit}`,
    intro: (total: number, pass: number) =>
      `${total} preguntas, un solo intento en cada una y sin pistas. Con ${pass} aciertos apruebas.`,
    resultHeading: 'Resultado del examen',
    score: (correct: number, total: number) => `Has acertado ${correct} de ${total}.`,
    passed: 'Examen aprobado.',
    xpGained: (xp: number) => `Ganas ${xp} XP.`,
    alreadyPassed: 'Ya tenías este examen aprobado: el aprobado no se pierde ni suma XP otra vez.',
    failed: (pass: number) =>
      `No has llegado a ${pass} aciertos. Puedes repetir el examen con otras preguntas.`,
    reviseHeading: 'Conviene repasar estos proyectos:',
    repeat: 'Repetir el examen',
  },

  // --- Inicio, mapa, panel de proyecto y estadísticas (tarea 14) ---
  hub: {
    chooseGame: 'Elige un juego para seguir.',
    xp: (points: number) => `${fmt(points, 0)} XP`,
    statsLink: 'Estadísticas',
    // mapa
    launchHeading: 'Despegue',
    launchOpen: 'Abierto',
    launchDone: 'Superado',
    launchPlay: 'Jugar el despegue',
    launchRepeat: 'Repetir el despegue',
    orbitOpen: 'Órbita abierta',
    orbitClosed: 'Órbita cerrada',
    needLaunch: 'Completa el despegue',
    needPreviousExam: 'Aprueba el examen de la órbita anterior',
    needProjects: 'Valida todos los proyectos',
    noProjects: 'Esta órbita aún no tiene proyectos',
    projectsLegend: 'Proyectos',
    stateClosed: 'Cerrado',
    stateOpen: 'Abierto',
    stateValidated: 'Validado',
    statePassed: 'Aprobado',
    mark: (mark: number) => `Nota ${fmt(mark, 0)}`,
    examHeading: 'Examen',
    examTake: 'Hacer el examen',
    examRepeat: 'Repetir el examen',
    // panel de proyecto
    projectMark: (mark: number, threshold: number) =>
      `Nota del proyecto: ${fmt(mark, 0)} de 100 (se valida con ${threshold}).`,
    exercisesHeading: 'Ejercicios',
    exerciseKinds: { manipular: 'Manipular', calcular: 'Calcular', programar: 'Programar' },
    exerciseTitle: (n: number, kind: string) => `Ejercicio ${n} · ${kind}`,
    exerciseBest: (best: number, total: number) => `${best} de ${total}`,
    exerciseNone: 'sin hacer',
    exercisePlayShort: 'Jugar',
    exercisePlay: (n: number) => `Jugar el ejercicio ${n}`,
    sheetsHeading: 'Caza el error',
    sheetTitle: (n: number) => `Hoja ${n}`,
    sheetClosed: 'Cerrada: valida el proyecto',
    sheetSolved: 'Resuelta',
    sheetOpen: (n: number) => `Abrir la hoja ${n}`,
    // estadísticas
    statsTitle: 'Estadísticas',
    statsTotal: 'Preguntas respondidas',
    statsFirstTry: 'Acierto a la primera',
    percent: (n: number) => `${fmt(n, 0)} %`,
    statsEmpty: 'Aún no hay datos',
    statsEmptyHelp: 'Cuando respondas preguntas, aquí verás tus cifras.',
    statsTable: 'Intentos por proyecto',
    statsWhere: 'Dónde',
    statsAttempts: 'Intentos',
    statsCorrect: 'Aciertos',
    statsLaunch: 'Despegue',
  },

  // --- Cuenta (inicio de sesión y progreso en la nube) ---
  account: {
    signIn: 'Entrar con Google',
    signOut: 'Salir',
    syncing: 'Guardando en la nube…',
    synced: 'Guardado en la nube',
    failed: 'Sin guardar en la nube: se reintentará',
  },

  // --- Repaso de un ejercicio ya entregado ---
  review: {
    note: 'Repaso: ya entregaste este ejercicio. Puedes moverte entre las preguntas, ver pistas y solución y volver a contestar; nada de lo que hagas aquí cuenta para la nota.',
    navLabel: 'Preguntas del ejercicio',
    goTo: (n: number) => `Ir a la pregunta ${n}`,
    showSolution: 'Ver la solución',
    hideSolution: 'Ocultar la solución',
    wrong: 'Todavía no. Puedes volver a intentarlo o ver la solución.',
    previous: 'Anterior',
    next: 'Siguiente',
    repeat: 'Volver a hacerlo (cuenta)',
    toReview: 'Repasar',
  },
} as const;
