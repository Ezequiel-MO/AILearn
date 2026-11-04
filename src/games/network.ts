import type { NetworkPart } from '../content/schema';

/**
 * «La red por dentro»: las piezas de un modelo de lenguaje pequeño, el dibujo que ve el jugador en el
 * panel de cada proyecto (con sus piezas resaltadas) y en `#/red`. Es dato: la interfaz lo dibuja y
 * busca qué proyectos construidos tocan cada pieza (su `bigPicture.parts`).
 * `tests/content/big-picture.test.ts` comprueba que cada pieza tiene ficha y que sus órbitas existen
 * en la ruta.
 */
export interface NetworkPartInfo {
  /** Nombre corto: el de la caja del dibujo. */
  name: string;
  /** Una línea, sin fórmulas: qué hace. Va bajo el nombre. */
  short: string;
  /** Dos a cuatro frases en Markdown: cómo lo hace y por qué importa. */
  detail: string;
  /** Las órbitas de la ruta que la enseñan: id del juego y nombre de la órbita (`src/games/roadmap.ts`). */
  roadmap: { game: string; orbit: string }[];
}

export interface NetworkGroup {
  id: 'use' | 'train' | 'around';
  name: string;
  short: string;
  parts: NetworkPart[];
}

/**
 * Los tres grupos del dibujo, en orden: el camino que sigue un texto al responder (de arriba abajo),
 * el bucle de entrenamiento que ajusta los pesos y lo que se hace con la red desde fuera.
 */
export const NETWORK_GROUPS: NetworkGroup[] = [
  {
    id: 'use',
    name: 'Responder',
    short: 'Lo que hace la red con un texto para elegir el siguiente token.',
    parts: ['tokens', 'embedding', 'attention', 'linear', 'activation', 'norm', 'output'],
  },
  {
    id: 'train',
    name: 'Aprender',
    short: 'Cómo se ajustan sus pesos para que se equivoque menos.',
    parts: ['loss', 'gradient', 'update'],
  },
  {
    id: 'around',
    name: 'Alrededor',
    short: 'Lo que se hace con la red y sus vectores desde fuera.',
    parts: ['search', 'inspect', 'compress'],
  },
];

/** Las piezas que se repiten en cada bloque del modelo (atención, MLP, residual): el dibujo las enmarca. */
export const BLOCK_PARTS: readonly NetworkPart[] = ['attention', 'linear', 'activation', 'norm'];

export const network: Record<NetworkPart, NetworkPartInfo> = {
  tokens: {
    name: 'Tokens',
    short: 'El texto, troceado en piezas con número.',
    detail:
      'Un modelo de lenguaje no lee letras: trocea el texto en **tokens** (palabras o trozos de palabra) y cambia cada uno por su número en un vocabulario fijo. El de GPT-2 tiene $50\\,257$ tokens. Todo lo que viene después trabaja con esos números.',
    roadmap: [{ game: 'transformer', orbit: 'Tokens' }],
  },
  embedding: {
    name: 'Embeddings',
    short: 'Cada token se convierte en un vector.',
    detail:
      'Cada token se cambia por una fila de una tabla, su **embedding**: un vector de cientos de números ($768$ en el GPT-2 pequeño). Tokens con significados parecidos acaban con vectores cercanos, y por eso se comparan con distancias y cosenos. Esa tabla también se aprende al entrenar.',
    roadmap: [
      { game: 'vectores', orbit: 'La flecha' },
      { game: 'vectores', orbit: 'Muchas dimensiones' },
      { game: 'transformer', orbit: 'Tokens' },
    ],
  },
  attention: {
    name: 'Atención',
    short: 'Cada token mira a los demás y mezcla lo que le sirve.',
    detail:
      'Cada token calcula una consulta $q$ y una clave $k$ con capas lineales. El producto escalar $q\\cdot k$ de cada pareja dice cuánto le importa un token a otro; softmax convierte esas puntuaciones en pesos que suman $1$, y la salida de cada token es la media ponderada de los valores $v$. Con matrices: $\\mathrm{softmax}(QK^{T}/\\sqrt{d})\\,V$.',
    roadmap: [
      { game: 'vectores', orbit: 'El ángulo' },
      { game: 'matrices', orbit: 'Descomponer y aproximar' },
      { game: 'transformer', orbit: 'Atención' },
    ],
  },
  linear: {
    name: 'Capas lineales',
    short: 'Una matriz de pesos transforma cada vector.',
    detail:
      'Una capa lineal multiplica cada vector por una matriz de pesos: $y=Wx$. Están por todas partes: calculan $Q$, $K$ y $V$ en la atención, forman el MLP de cada bloque y dan la salida final. La mayoría de los parámetros de un modelo de lenguaje son números de estas matrices, y entrenar es ajustarlos.',
    roadmap: [
      { game: 'matrices', orbit: 'La máquina' },
      { game: 'matrices', orbit: 'El área' },
      { game: 'redes', orbit: 'Capas' },
    ],
  },
  activation: {
    name: 'Activación',
    short: 'Una curva que dobla el resultado de cada capa.',
    detail:
      'Entre las dos capas lineales del MLP se aplica a cada número una función no lineal, como ReLU, $\\max(0, x)$, o GELU. Sin ella, apilar capas lineales seguiría siendo una sola capa lineal; con ella, la red aprende relaciones curvas. Su derivada decide cómo pasa el gradiente hacia atrás.',
    roadmap: [
      { game: 'gradiente', orbit: 'Gradientes con matrices' },
      { game: 'redes', orbit: 'La neurona' },
    ],
  },
  norm: {
    name: 'Residual y normalización',
    short: 'Sumar lo que entró y reescalar para que todo siga estable.',
    detail:
      'Cada bloque suma su resultado a lo que le entró (la conexión **residual**), así que solo añade un ajuste. Antes de la atención y del MLP, la **normalización de capa** reescala cada vector para que tenga media $0$ y varianza $1$. Las dos cosas permiten apilar decenas de bloques sin que los números se disparen ni el entrenamiento se atasque.',
    roadmap: [
      { game: 'estadistica', orbit: 'Describir datos' },
      { game: 'redes', orbit: 'Entrenar de verdad' },
      { game: 'transformer', orbit: 'El bloque' },
    ],
  },
  output: {
    name: 'Salida',
    short: 'Una probabilidad para cada token posible.',
    detail:
      'Tras el último bloque, una capa lineal da una puntuación (un **logit**) a cada token del vocabulario, y softmax las convierte en probabilidades que suman $1$. El modelo elige el siguiente token con ellas, lo añade al texto y repite. La temperatura decide cuánto se arriesga al elegir.',
    roadmap: [
      { game: 'probabilidad', orbit: 'Softmax' },
      { game: 'transformer', orbit: 'Un GPT pequeño' },
    ],
  },
  loss: {
    name: 'Pérdida',
    short: 'Un solo número que dice cuánto se equivoca.',
    detail:
      'Al entrenar se compara lo que predice la red con lo que de verdad venía después en el texto. La **pérdida** resume ese error en un número: en un modelo de lenguaje, la entropía cruzada, que es grande cuando la red dio poca probabilidad al token correcto. Entrenar es buscar los pesos que la hacen lo más pequeña posible.',
    roadmap: [
      { game: 'gradiente', orbit: 'La pendiente' },
      { game: 'probabilidad', orbit: 'Sorpresa' },
      { game: 'probabilidad', orbit: 'Comparar distribuciones' },
    ],
  },
  gradient: {
    name: 'Gradiente',
    short: 'Para cada peso, hacia dónde sube la pérdida y cuánto.',
    detail:
      'La derivada de la pérdida respecto a un peso dice cuánto cambia el error si ese peso se mueve un poco, y en qué sentido. Las derivadas de todos los pesos juntas forman el **gradiente**. La red lo calcula en una pasada hacia atrás, aplicando la regla de la cadena capa a capa: eso es **backpropagation**.',
    roadmap: [
      { game: 'gradiente', orbit: 'La pendiente' },
      { game: 'gradiente', orbit: 'Bajar la colina' },
      { game: 'gradiente', orbit: 'La cadena' },
      { game: 'gradiente', orbit: 'Gradientes con matrices' },
      { game: 'redes', orbit: 'Autograd' },
    ],
  },
  update: {
    name: 'Actualizar pesos',
    short: 'Mover cada peso un paso cuesta abajo.',
    detail:
      'Con el gradiente, cada peso se mueve un poco en sentido contrario, hacia donde baja la pérdida: $w \\leftarrow w-\\eta\\,\\frac{\\partial L}{\\partial w}$, con $\\eta$ la tasa de aprendizaje. Se repite con millones de trozos de texto. Optimizadores como Adam ajustan el tamaño del paso de cada peso.',
    roadmap: [
      { game: 'gradiente', orbit: 'Bajar la colina' },
      { game: 'optimizacion', orbit: 'Por lotes' },
      { game: 'optimizacion', orbit: 'Con inercia' },
    ],
  },
  search: {
    name: 'Búsqueda con embeddings',
    short: 'Encontrar textos parecidos por cercanía de vectores.',
    detail:
      'Los embeddings también se usan fuera de la red: se calcula el vector de cada documento y, ante una pregunta, se buscan los más cercanos por coseno. Así funciona un **RAG**: recupera los fragmentos relevantes y los pega en el contexto del modelo para que responda con ellos.',
    roadmap: [
      { game: 'vectores', orbit: 'Búsqueda' },
      { game: 'sistemas', orbit: 'RAG completo' },
    ],
  },
  inspect: {
    name: 'Mirar por dentro',
    short: 'Ver vectores de cientos de dimensiones en un plano.',
    detail:
      'Los vectores de una red tienen cientos de dimensiones y no se pueden dibujar tal cual. Con **PCA** se proyectan sobre las dos direcciones en las que más varían, y en el dibujo se ve qué se agrupa con qué. Es una forma habitual de explorar embeddings y activaciones.',
    roadmap: [
      { game: 'vectores', orbit: 'Muchas dimensiones' },
      { game: 'matrices', orbit: 'Direcciones propias' },
    ],
  },
  compress: {
    name: 'Comprimir y afinar',
    short: 'Aproximar o ajustar las matrices de pesos con pocos números.',
    detail:
      'Una matriz de pesos se puede descomponer con la **SVD** y aproximar con pocas direcciones, que ocupan menos. **LoRA** usa la misma idea al afinar: deja quietos los pesos originales y aprende solo un cambio de rango bajo, $\\Delta W=BA$, con una fracción pequeña de los parámetros.',
    roadmap: [
      { game: 'matrices', orbit: 'Descomponer y aproximar' },
      { game: 'sistemas', orbit: 'Adaptar el modelo' },
    ],
  },
};
