/**
 * La ruta completa de AIlearn: todos los juegos previstos, con su despegue, sus órbitas y sus proyectos.
 * Es dato, no reglas: lo que está disponible lo decide el registro de juegos (`games`). Un juego de la ruta
 * cuyo `id` no está registrado se muestra como «Próximamente»; en un juego registrado, las órbitas que aún
 * no tiene, también. `tests/content/roadmap.test.ts` comprueba que los nombres de lo construido coinciden.
 */

export interface RoadmapStage {
  /** Matemática que se aprende. */
  math: string;
  /** Su aplicación en IA. */
  ai: string;
}

export interface RoadmapOrbit extends RoadmapStage {
  name: string;
  projects: string[];
}

export interface RoadmapGame extends RoadmapStage {
  /** Igual que el `id` del juego cuando se registre en `src/games/index.ts`. */
  id: string;
  title: string;
  launch: RoadmapStage;
  orbits: RoadmapOrbit[];
}

export const roadmap: RoadmapGame[] = [
  {
    id: 'vectores',
    title: 'Vectores y embeddings',
    math: 'Vectores, producto escalar, normas, proyecciones',
    ai: 'Embeddings, similitud coseno, búsqueda semántica, RAG',
    launch: {
      math: 'Coordenadas, leer un plano, primer array en NumPy',
      ai: 'Qué es un embedding, sin fórmulas',
    },
    orbits: [
      {
        name: 'La flecha',
        projects: ['Componentes', 'Suma y escala', 'Norma y distancia'],
        math: 'Vector como flecha y como lista, combinación lineal, norma euclídea, distancia, vector unitario',
        ai: 'Un texto como punto; el centroide de varios textos; el punto más cercano',
      },
      {
        name: 'El ángulo',
        projects: ['Producto escalar', 'Coseno', 'Proyección'],
        math: 'Producto escalar, coseno, ortogonalidad, proyección',
        ai: 'Similitud coseno frente a distancia euclídea',
      },
      {
        name: 'Muchas dimensiones',
        projects: ['ℝⁿ en NumPy', 'Normalizar', 'Dimensión alta'],
        math: 'Operar con matrices de vectores, métricas equivalentes en vectores unitarios, casi ortogonalidad',
        ai: 'Por qué los embeddings tienen cientos de dimensiones y se normalizan',
      },
      {
        name: 'Búsqueda',
        projects: ['Vecinos y top-k', 'Analogías', 'Por qué falla un RAG'],
        math: 'Vecinos más cercanos, aritmética de vectores, umbrales',
        ai: 'Búsqueda semántica con embeddings reales y sus fallos típicos',
      },
    ],
  },
  {
    id: 'matrices',
    title: 'Matrices y transformaciones',
    math: 'Matrices, transformaciones lineales, rango, autovalores, SVD',
    ai: 'Capas lineales, atención como producto de matrices, LoRA',
    launch: {
      math: 'Una matriz como tabla de números; multiplicar una matriz por un vector del plano',
      ai: 'Una capa de una red es una matriz que transforma embeddings',
    },
    orbits: [
      {
        name: 'La máquina lineal',
        projects: ['Matriz por vector', 'Transformar el plano', 'Componer transformaciones'],
        math: 'Producto matriz-vector, rotar, escalar y cizallar, producto de matrices como composición',
        ai: 'Una capa lineal mueve todos los embeddings a la vez; apilar capas lineales sigue siendo lineal',
      },
      {
        name: 'Lo que se pierde',
        projects: ['Determinante', 'Rango e imagen', 'Inversa y núcleo'],
        math: 'Determinante como área, rango, imagen, núcleo, matriz inversa',
        ai: 'Capas que comprimen (cuello de botella) y la información que ya no se recupera',
      },
      {
        name: 'Direcciones propias',
        projects: ['Autovectores', 'Matrices simétricas', 'PCA'],
        math: 'Autovalores y autovectores, matrices simétricas y covarianza, análisis de componentes principales',
        ai: 'Ver embeddings de cientos de dimensiones en un plano con PCA',
      },
      {
        name: 'Descomponer y aproximar',
        projects: ['SVD', 'Rango bajo y LoRA', 'Atención como matriz'],
        math: 'Descomposición en valores singulares, aproximación de rango bajo, matriz de similitudes QKᵀ',
        ai: 'Comprimir pesos, afinar un modelo con LoRA y leer la atención como producto de matrices',
      },
    ],
  },
  {
    id: 'gradiente',
    title: 'Derivadas y gradiente',
    math: 'Derivadas, gradiente, regla de la cadena',
    ai: 'Función de pérdida, descenso de gradiente, backpropagation',
    launch: {
      math: 'Pendiente de una recta y tasa de cambio',
      ai: 'Aprender es ajustar números para equivocarse menos',
    },
    orbits: [
      {
        name: 'La pendiente',
        projects: ['Derivada como pendiente', 'Reglas de derivación', 'Mínimos'],
        math: 'Derivada como límite y como pendiente, reglas de derivación, mínimos de una función',
        ai: 'Una pérdida con un solo parámetro y el valor que la hace mínima',
      },
      {
        name: 'Bajar la colina',
        projects: ['Derivadas parciales', 'El gradiente', 'Descenso de gradiente'],
        math: 'Derivadas parciales, vector gradiente, curvas de nivel, paso de aprendizaje',
        ai: 'Entrenar a mano una regresión lineal; qué pasa con una tasa de aprendizaje mala',
      },
      {
        name: 'La cadena',
        projects: ['Regla de la cadena', 'Grafos de cómputo', 'Backpropagation a mano'],
        math: 'Regla de la cadena, grafo de operaciones, propagación hacia atrás',
        ai: 'Cómo sabe una red qué peso tiene la culpa del error',
      },
      {
        name: 'Gradientes con matrices',
        projects: ['Gradiente de una capa', 'Activaciones', 'Gradientes que se desvanecen'],
        math: 'Gradiente respecto a una matriz de pesos, derivadas de ReLU y sigmoide, productos de muchas derivadas',
        ai: 'Por qué las redes profundas costaban de entrenar y qué lo arregló',
      },
    ],
  },
  {
    id: 'probabilidad',
    title: 'Probabilidad y siguiente token',
    math: 'Probabilidad, softmax, entropía, divergencia KL',
    ai: 'Siguiente token, temperatura, entropía cruzada, perplejidad',
    launch: {
      math: 'Probabilidad como frecuencia: dados, monedas y recuentos',
      ai: 'Un modelo de lenguaje reparte probabilidad entre las palabras posibles',
    },
    orbits: [
      {
        name: 'Azar',
        projects: ['Sucesos y probabilidad', 'Probabilidad condicionada', 'Distribuciones'],
        math: 'Sucesos, probabilidad condicionada, teorema de Bayes, distribuciones discretas',
        ai: 'Un modelo de bigramas: la siguiente palabra según la anterior',
      },
      {
        name: 'Softmax',
        projects: ['Logits', 'Softmax', 'Temperatura y muestreo'],
        math: 'Exponencial y logaritmo, softmax, muestreo top-k y top-p',
        ai: 'Cómo elige un LLM la siguiente palabra y qué cambia la temperatura',
      },
      {
        name: 'Sorpresa',
        projects: ['Información', 'Entropía', 'Entropía cruzada'],
        math: 'Información en bits, entropía, entropía cruzada',
        ai: 'La pérdida con la que se entrenan los modelos de lenguaje',
      },
      {
        name: 'Comparar distribuciones',
        projects: ['Divergencia KL', 'Máxima verosimilitud', 'Perplejidad'],
        math: 'Divergencia KL, estimación por máxima verosimilitud, perplejidad',
        ai: 'Medir un modelo de lenguaje y no alejarlo demasiado del original al afinarlo',
      },
    ],
  },
  {
    id: 'estadistica',
    title: 'Estadística y evaluación',
    math: 'Estadística descriptiva e inferencia',
    ai: 'Evaluación de modelos, intervalos de confianza',
    launch: {
      math: 'Media, mediana e histograma',
      ai: 'Un modelo no se juzga por un ejemplo: se mide sobre muchos',
    },
    orbits: [
      {
        name: 'Describir datos',
        projects: ['Media y varianza', 'La normal', 'Correlación'],
        math: 'Media, varianza, desviación típica, distribución normal, puntuación z, correlación',
        ai: 'Normalizar datos y activaciones (la idea de LayerNorm)',
      },
      {
        name: 'Muestras',
        projects: [
          'Ley de los grandes números',
          'Teorema central del límite',
          'Intervalos de confianza',
        ],
        math: 'Muestreo, ley de los grandes números, teorema central del límite, intervalos de confianza',
        ai: 'Cuántos ejemplos necesita una evaluación para creerse su resultado',
      },
      {
        name: 'Medir un clasificador',
        projects: ['Matriz de confusión', 'Precisión y exhaustividad', 'Umbrales y ROC'],
        math: 'Matriz de confusión, precisión, exhaustividad, F1, curva ROC',
        ai: 'Evaluar un clasificador o un filtro y elegir su umbral',
      },
      {
        name: '¿Es mejor de verdad?',
        projects: ['Contraste de hipótesis', 'Comparar dos modelos', 'Trampas de la evaluación'],
        math: 'Contraste de hipótesis, valor p, bootstrap, pruebas pareadas',
        ai: 'Comparar dos modelos o dos prompts; fuga de datos, benchmarks contaminados y LLM como juez',
      },
    ],
  },
  {
    id: 'optimizacion',
    title: 'Optimización',
    math: 'Optimización numérica',
    ai: 'SGD, momentum, Adam, regularización, sobreajuste',
    launch: {
      math: 'Repaso del descenso de gradiente sobre una parábola',
      ai: 'Entrenar es optimizar una pérdida con millones de parámetros',
    },
    orbits: [
      {
        name: 'El paisaje',
        projects: ['Convexidad', 'Mínimos locales y puntos de silla', 'Tasa de aprendizaje'],
        math: 'Funciones convexas y no convexas, mínimos locales, puntos de silla, condicionamiento',
        ai: 'Cómo es el paisaje de pérdida de una red y por qué aun así se entrena',
      },
      {
        name: 'Por lotes',
        projects: ['Descenso estocástico', 'Minilotes', 'Ruido y convergencia'],
        math: 'Gradiente estimado con muestras, varianza del estimador, convergencia',
        ai: 'Por qué se entrena con minilotes y qué aporta el ruido',
      },
      {
        name: 'Con inercia',
        projects: ['Momentum', 'RMSProp', 'Adam'],
        math: 'Medias móviles exponenciales, momentum, pasos adaptativos por parámetro',
        ai: 'Adam, el optimizador con el que se entrenan casi todos los LLM',
      },
      {
        name: 'Generalizar',
        projects: ['Sobreajuste', 'Regularización', 'Calendarios de aprendizaje'],
        math: 'Error de entrenamiento y de validación, penalización L2, dropout, calentamiento y decaimiento',
        ai: 'Leer curvas de entrenamiento y saber cuándo parar',
      },
    ],
  },
  {
    id: 'redes',
    title: 'Redes neuronales desde cero',
    math: 'Redes neuronales en Python con NumPy',
    ai: 'Un MLP con NumPy y un autograd propio',
    launch: {
      math: 'Una neurona: suma ponderada y activación',
      ai: 'La pieza de la que están hechas todas las redes',
    },
    orbits: [
      {
        name: 'La neurona',
        projects: ['Perceptrón', 'Activaciones', 'Frontera de decisión'],
        math: 'Perceptrón, funciones de activación, fronteras lineales',
        ai: 'Por qué una sola neurona no resuelve XOR',
      },
      {
        name: 'Capas',
        projects: ['Paso hacia delante', 'Inicializar pesos', 'Clasificar con softmax'],
        math: 'Composición de capas, inicialización, softmax con entropía cruzada',
        ai: 'Un MLP que clasifica puntos del plano',
      },
      {
        name: 'Autograd',
        projects: ['Un valor con gradiente', 'Backprop automática', 'Entrenar el MLP'],
        math: 'Grafo de cómputo dinámico, orden topológico, acumulación de gradientes',
        ai: 'Escribir un autograd pequeño, la idea que hay dentro de PyTorch',
      },
      {
        name: 'Entrenar de verdad',
        projects: [
          'Clasificar dígitos',
          'Diagnosticar el entrenamiento',
          'Residuales y normalización',
        ],
        math: 'Entrenamiento por épocas, conexiones residuales, normalización de capa',
        ai: 'Una red que reconoce dígitos escritos a mano y cómo saber si está aprendiendo',
      },
    ],
  },
  {
    id: 'transformer',
    title: 'El transformer por dentro',
    math: 'Atención, bloques y modelos de lenguaje',
    ai: 'Tokenización, atención multicabeza, un GPT pequeño',
    launch: {
      math: 'Convertir texto en números',
      ai: 'Lo que entra y lo que sale de un modelo de lenguaje',
    },
    orbits: [
      {
        name: 'Tokens',
        projects: ['Caracteres y palabras', 'BPE', 'Embeddings y posiciones'],
        math: 'Vocabularios, fusión de pares frecuentes (BPE), tablas de embeddings, codificación posicional',
        ai: 'Cómo trocea el texto un LLM y por qué cuenta mal las letras',
      },
      {
        name: 'Atención',
        projects: ['Consultas, claves y valores', 'Máscara causal', 'Multicabeza'],
        math: 'Atención de producto escalar escalado, máscara causal, varias cabezas en paralelo',
        ai: 'Cómo mira cada token a los anteriores para decidir el siguiente',
      },
      {
        name: 'El bloque',
        projects: ['Bloque transformer', 'Apilar bloques', 'Contar parámetros'],
        math: 'Atención, MLP, residuales y normalización en un bloque; recuento de parámetros',
        ai: 'De qué está hecho un GPT y dónde están sus miles de millones de parámetros',
      },
      {
        name: 'Un GPT pequeño',
        projects: ['Entrenar con un texto', 'Generar', 'Coste del contexto'],
        math: 'Entrenamiento autorregresivo, muestreo, coste cuadrático de la atención, caché de claves y valores',
        ai: 'Entrenar un GPT diminuto, hacerlo escribir y entender por qué el contexto largo es caro',
      },
    ],
  },
  {
    id: 'sistemas',
    title: 'Ingeniería de sistemas con IA',
    math: 'Diseño y medida de sistemas con modelos',
    ai: 'RAG, coste y contexto, agentes, fine-tuning',
    launch: {
      math: 'Un modelo como función: tokens que entran, tokens que salen y lo que cuestan',
      ai: 'De un modelo suelto a un producto que funciona',
    },
    orbits: [
      {
        name: 'Contexto y coste',
        projects: ['Ventana de contexto', 'Tokens y precio', 'Caché y latencia'],
        math: 'Presupuestos de tokens, coste por petición, latencia',
        ai: 'Qué cabe en el contexto, cuánto cuesta y cómo lo abarata la caché de prompts',
      },
      {
        name: 'RAG completo',
        projects: ['Trocear documentos', 'Recuperar y reordenar', 'Evaluar un RAG'],
        math: 'Fragmentación, búsqueda híbrida, reordenación, métricas de recuperación',
        ai: 'Un RAG de principio a fin y cómo medir si responde bien',
      },
      {
        name: 'Agentes',
        projects: ['Llamar herramientas', 'El bucle del agente', 'Fallos y seguridad'],
        math: 'Bucles de decisión, probabilidad de error acumulada en varios pasos',
        ai: 'Un agente con herramientas, sus límites y la inyección de prompts',
      },
      {
        name: 'Adaptar el modelo',
        projects: [
          'Prompt, RAG o fine-tuning',
          'LoRA en la práctica',
          'Alineamiento y preferencias',
        ],
        math: 'Ajuste fino, adaptadores de rango bajo, aprendizaje por preferencias con penalización KL',
        ai: 'Cuándo afinar un modelo y cómo se alinea un asistente (RLHF y DPO)',
      },
    ],
  },
];
