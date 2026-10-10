import type { ReactNode } from "react";

/**
 * A small Markdown renderer for task specifications: headings, paragraphs,
 * lists, fenced code, tables (kept monospace), and inline code, bold, and
 * italics. It builds React elements only, so spec text is never injected as HTML.
 */
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("`")) out.push(<code key={`${key}-${i++}`}>{tok.slice(1, -1)}</code>);
    else if (tok.startsWith("**")) out.push(<strong key={`${key}-${i++}`}>{tok.slice(2, -2)}</strong>);
    else out.push(<em key={`${key}-${i++}`}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function SpecMarkdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0, k = 0;
  const isList = (l: string) => /^\s*([-*+]|\d+[.)])\s+/.test(l);
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*```/.test(line)) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) body.push(lines[i++]);
      i++;
      blocks.push(<pre key={k++} className="spec-pre">{body.join("\n")}</pre>);
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const level = Math.min(h[1].length, 4);
      blocks.push(<p key={k++} className={`spec-h spec-h${level}`}>{inline(h[2], `h${k}`)}</p>);
      i++;
      continue;
    }
    if (/^\s*\|/.test(line)) {
      const rows: string[] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(lines[i++]);
      blocks.push(<pre key={k++} className="spec-pre">{rows.join("\n")}</pre>);
      continue;
    }
    if (isList(line)) {
      const items: { depth: number; text: string }[] = [];
      while (i < lines.length && (isList(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
        const m = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(lines[i]);
        if (m) items.push({ depth: Math.min(3, Math.floor(m[1].length / 2)), text: m[3] });
        else items[items.length - 1].text += " " + lines[i].trim();
        i++;
      }
      blocks.push(
        <ul key={k++} className="spec-list">
          {items.map((it, j) => (
            <li key={j} style={{ marginLeft: `${it.depth * 1.1}rem` }}>
              {inline(it.text, `l${k}-${j}`)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }
    if (!line.trim()) {
      i++;
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6})\s|^\s*```|^\s*\|/.test(lines[i]) && !isList(lines[i])) para.push(lines[i++].trim());
    blocks.push(<p key={k++} className="spec-p">{inline(para.join(" "), `p${k}`)}</p>);
  }
  return <div className="spec-md">{blocks}</div>;
}
