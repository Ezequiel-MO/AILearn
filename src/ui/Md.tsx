import 'katex/dist/katex.min.css';
import type { Element, Root, RootContent } from 'hast';
import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

// Puntuación que el navegador no debe separar de la fórmula en línea que la precede.
const TRAILING_PUNCTUATION = /^[.,;:)!?]+/;

const isInlineFormula = (node: RootContent): node is Element =>
  node.type === 'element' &&
  Array.isArray(node.properties.className) &&
  node.properties.className.includes('katex');

// Mete cada fórmula en línea y la puntuación que le sigue pegada en un span `md__nowrap`.
function glueFormulas(parent: { children: RootContent[] }): void {
  const out: RootContent[] = [];
  const { children } = parent;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const next = children[i + 1];
    if (child.type === 'element' && !isInlineFormula(child)) glueFormulas(child);
    const sign =
      isInlineFormula(child) && next?.type === 'text'
        ? TRAILING_PUNCTUATION.exec(next.value)
        : null;
    if (isInlineFormula(child) && next?.type === 'text' && sign) {
      out.push({
        type: 'element',
        tagName: 'span',
        properties: { className: ['md__nowrap'] },
        children: [child, { type: 'text', value: sign[0] }],
      });
      const rest = next.value.slice(sign[0].length);
      if (rest !== '') out.push({ ...next, value: rest });
      i++;
    } else {
      out.push(child);
    }
  }
  parent.children = out;
}

const rehypeNoSplitFormulas = () => (tree: Root) => glueFormulas(tree);

const remarkPlugins = [remarkMath];
const rehypePlugins = [rehypeKatex, rehypeNoSplitFormulas];
// En modo inline el párrafo se desenvuelve: el texto fluye dentro de quien lo contiene.
const inlineComponents = { p: ({ children }: { children?: ReactNode }) => <>{children}</> };

/**
 * Markdown con fórmulas KaTeX ($…$ y $$…$$). No interpreta HTML del contenido
 * (react-markdown lo trata como texto) y la hoja de estilos y las fuentes de KaTeX
 * salen del propio sitio.
 */
export function Md({ children, inline = false }: { children: string; inline?: boolean }) {
  const body = (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      components={inline ? inlineComponents : undefined}
    >
      {children}
    </ReactMarkdown>
  );
  return inline ? <span className="md md--inline">{body}</span> : <div className="md">{body}</div>;
}
