import type { ReactNode } from 'react';

/**
 * A post's body, rendered on the server into plain elements (PHASE5B_LEAGUE_SITES §6, Actualités):
 * no editor, no Markdown library and no HTML string reaches the reader's phone.
 *
 * Two sources. The organisers' post form saves a Lexical document (`richContent`); posts written
 * before it, or through the API, carry Markdown (`content`). Only what those produce is drawn —
 * paragraphs, headings, quotes, lists, links, line breaks, bold, italic, underline, strikethrough,
 * code — and anything else is read as its text. Links are kept only for http(s) and mailto.
 */

type Node = { type?: string; text?: string; format?: number | string; tag?: string; listType?: string; url?: string; children?: Node[] };

const SAFE_URL = /^(https?:\/\/|mailto:)/i;

const P = 'leading-relaxed text-ink';

export function PostBody({ rich, markdown }: { rich: Record<string, unknown> | null | undefined; markdown: string | null | undefined }) {
  const root = rich && typeof rich === 'object' ? (rich as { root?: Node }).root : undefined;
  const hasText = root?.children?.some((c) => textOf(c).trim() !== '');
  return <div className="space-y-4 text-base">{hasText ? root!.children!.map(block) : markdownBlocks(markdown ?? '')}</div>;
}

// --- Lexical ------------------------------------------------------------------------------------

function textOf(n: Node): string {
  return typeof n.text === 'string' ? n.text : (n.children ?? []).map(textOf).join('');
}

function block(n: Node, i: number): ReactNode {
  const kids = (n.children ?? []).map(inline);
  switch (n.type) {
    case 'heading':
      return n.tag === 'h1' || n.tag === 'h2' ? (
        <h2 key={i} className="pt-2 text-xl font-bold text-ink">{kids}</h2>
      ) : (
        <h3 key={i} className="pt-1 text-lg font-semibold text-ink">{kids}</h3>
      );
    case 'quote':
      return (
        <blockquote key={i} className="border-l-4 border-[var(--site-accent)] pl-4 italic text-ink-muted">
          {kids}
        </blockquote>
      );
    case 'list': {
      const items = (n.children ?? []).map((li, j) => (
        <li key={j} className="pl-1">
          {(li.children ?? []).map(inline)}
        </li>
      ));
      return n.listType === 'number' ? (
        <ol key={i} className={`list-decimal space-y-1 pl-6 ${P}`}>{items}</ol>
      ) : (
        <ul key={i} className={`list-disc space-y-1 pl-6 ${P}`}>{items}</ul>
      );
    }
    default:
      return textOf(n).trim() === '' ? null : (
        <p key={i} className={P}>
          {kids}
        </p>
      );
  }
}

function inline(n: Node, i: number): ReactNode {
  if (n.type === 'linebreak') return <br key={i} />;
  if ((n.type === 'link' || n.type === 'autolink') && n.url) {
    const kids = (n.children ?? []).map(inline);
    return SAFE_URL.test(n.url) ? (
      <a key={i} href={n.url} target="_blank" rel="noopener noreferrer nofollow" className="font-medium text-[var(--site-accent)] underline underline-offset-2">
        {kids}
      </a>
    ) : (
      <span key={i}>{kids}</span>
    );
  }
  if (typeof n.text === 'string') {
    const f = typeof n.format === 'number' ? n.format : 0;
    let out: ReactNode = n.text;
    if (f & 16) out = <code className="rounded bg-surface-sunk px-1 py-0.5 text-[0.9em]">{out}</code>;
    if (f & 1) out = <strong className="font-semibold">{out}</strong>;
    if (f & 2) out = <em>{out}</em>;
    if (f & 8) out = <span className="underline">{out}</span>;
    if (f & 4) out = <s>{out}</s>;
    return <span key={i}>{out}</span>;
  }
  return <span key={i}>{(n.children ?? []).map(inline)}</span>;
}

// --- Markdown -----------------------------------------------------------------------------------

function markdownBlocks(md: string): ReactNode[] {
  return md
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk, i) => {
      const heading = chunk.match(/^(#{1,6})\s+(.*)$/);
      if (heading) {
        return heading[1].length <= 2 ? (
          <h2 key={i} className="pt-2 text-xl font-bold text-ink">{mdInline(heading[2])}</h2>
        ) : (
          <h3 key={i} className="pt-1 text-lg font-semibold text-ink">{mdInline(heading[2])}</h3>
        );
      }
      const lines = chunk.split('\n');
      if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
        return (
          <ul key={i} className={`list-disc space-y-1 pl-6 ${P}`}>
            {lines.map((l, j) => <li key={j}>{mdInline(l.replace(/^\s*[-*]\s+/, ''))}</li>)}
          </ul>
        );
      }
      if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
        return (
          <ol key={i} className={`list-decimal space-y-1 pl-6 ${P}`}>
            {lines.map((l, j) => <li key={j}>{mdInline(l.replace(/^\s*\d+[.)]\s+/, ''))}</li>)}
          </ol>
        );
      }
      if (lines.every((l) => l.startsWith('>'))) {
        return (
          <blockquote key={i} className="border-l-4 border-[var(--site-accent)] pl-4 italic text-ink-muted">
            {mdInline(lines.map((l) => l.replace(/^>\s?/, '')).join(' '))}
          </blockquote>
        );
      }
      return (
        <p key={i} className={P}>
          {lines.flatMap((l, j) => (j === 0 ? [mdInline(l)] : [<br key={`b${j}`} />, mdInline(l)]))}
        </p>
      );
    });
}

/** **bold**, *italic*, `code` and [links](https://…); everything else is text. */
function mdInline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const t = m[0];
    const k = parts.length;
    if (t.startsWith('**')) parts.push(<strong key={k} className="font-semibold">{t.slice(2, -2)}</strong>);
    else if (t.startsWith('`')) parts.push(<code key={k} className="rounded bg-surface-sunk px-1 py-0.5 text-[0.9em]">{t.slice(1, -1)}</code>);
    else if (t.startsWith('[')) {
      const link = t.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/)!;
      parts.push(
        SAFE_URL.test(link[2]) ? (
          <a key={k} href={link[2]} target="_blank" rel="noopener noreferrer nofollow" className="font-medium text-[var(--site-accent)] underline underline-offset-2">
            {link[1]}
          </a>
        ) : (
          link[1]
        ),
      );
    } else parts.push(<em key={k}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
