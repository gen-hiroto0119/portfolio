export function fitOgTitle(title: string) {
  const normalized = title.trim().replace(/\s+/g, " ");
  const segments = Array.from(new Intl.Segmenter("ja", { granularity: "grapheme" }).segment(normalized), (part) => part.segment);
  const width = (segment: string) => /\s/.test(segment) ? 0.35 : /^[\x20-\x7e]$/.test(segment) && !/[MWmw]/.test(segment) ? 0.65 : 1;
  const units = segments.reduce((sum, segment) => sum + width(segment), 0);
  let used = 0;
  let text = "";
  for (const segment of segments) {
    if (units > 60 && used + width(segment) > 59) break;
    used += width(segment);
    text += segment;
  }
  if (units > 60) text = text.replace(/\s+[A-Za-z]+$/, "").trimEnd() + "…";
  return {
    text,
    fontSize: units > 36 ? 48 : 56,
  };
}
