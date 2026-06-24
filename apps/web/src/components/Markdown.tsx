/**
 * Renderizador de markdown leve, sob medida para o texto que a IA produz nas
 * leituras (cabeçalhos #/##/###, **negrito**, *itálico*, listas ordenadas e não
 * ordenadas, parágrafos). Evita uma dependência de markdown e dá controle total
 * sobre o estilo via design tokens — no mesmo espírito do resto do app (SVG
 * próprio, inline styles, sem Tailwind). Não cobre markdown completo de
 * propósito: o conteúdo é a saída controlada dos nossos prompts.
 *
 * O texto base (fontSize/lineHeight/cor) vem do `style` do contêiner e é herdado
 * pelos parágrafos/listas; só cabeçalhos definem o próprio tamanho.
 */

const headingTop: React.CSSProperties = { color: "var(--celestial-gold)" };
const h2Style: React.CSSProperties = { ...headingTop, fontSize: 18, margin: "20px 0 8px" };
const h3Style: React.CSSProperties = { ...headingTop, fontSize: 15.5, margin: "16px 0 6px" };
const pStyle: React.CSSProperties = { margin: "0 0 12px" };
const listStyle: React.CSSProperties = { margin: "0 0 12px", paddingLeft: 22 };
const liStyle: React.CSSProperties = { marginBottom: 5 };

/** Quebra uma linha em nós, resolvendo **negrito** e *itálico* (sem aninhar). */
function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let key = 0;

  for (let m = re.exec(text); m !== null; m = re.exec(text)) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] !== undefined) nodes.push(<strong key={key++}>{m[1]}</strong>);
    else nodes.push(<em key={key++}>{m[2]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ text, style }: { text: string; style?: React.CSSProperties }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");

  const blocks: React.ReactNode[] = [];
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let key = 0;

  const flushPara = () => {
    if (para.length) {
      blocks.push(
        <p key={key++} style={pStyle}>
          {renderInline(para.join(" "))}
        </p>,
      );
      para = [];
    }
  };

  const flushList = () => {
    if (!list) return;
    const items = list.items.map((it, i) => (
      <li key={i} style={liStyle}>
        {renderInline(it)}
      </li>
    ));
    blocks.push(
      list.ordered ? (
        <ol key={key++} style={listStyle}>
          {items}
        </ol>
      ) : (
        <ul key={key++} style={listStyle}>
          {items}
        </ul>
      ),
    );
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      // Linha em branco encerra um parágrafo, mas NÃO a lista: itens de lista
      // costumam vir separados por linhas vazias (lista "loose") e devem
      // continuar a mesma numeração. A lista só fecha ao surgir um parágrafo
      // ou cabeçalho (ou no fim).
      flushPara();
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flushPara();
      flushList();
      const level = (heading[1] ?? "").length;
      const content = renderInline(heading[2] ?? "");
      blocks.push(
        level <= 2 ? (
          <h2 key={key++} style={h2Style}>
            {content}
          </h2>
        ) : (
          <h3 key={key++} style={h3Style}>
            {content}
          </h3>
        ),
      );
      continue;
    }

    const ordered = /^(\d+)\.\s+(.*)$/.exec(line);
    if (ordered) {
      flushPara();
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(ordered[2] ?? "");
      continue;
    }

    const unordered = /^[-*]\s+(.*)$/.exec(line);
    if (unordered) {
      flushPara();
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(unordered[1] ?? "");
      continue;
    }

    flushList();
    para.push(line);
  }

  flushPara();
  flushList();

  return <div style={style}>{blocks}</div>;
}
