export interface TextPart {
  text: string;
  em: boolean;
}

/** Découpe un texte en morceaux, les passages entre `**` étant mis en évidence. */
export function splitEmphasis(input: string): TextPart[] {
  const parts: TextPart[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(input)) !== null) {
    if (match.index > last) {
      parts.push({ text: input.slice(last, match.index), em: false });
    }
    parts.push({ text: match[1], em: true });
    last = match.index + match[0].length;
  }
  if (last < input.length) {
    parts.push({ text: input.slice(last), em: false });
  }
  return parts;
}
