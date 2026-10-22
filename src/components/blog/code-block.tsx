import type { Child } from "hono/jsx";

import { lowlight } from "@/lib/syntax-highlight";

type HighlightNode = ReturnType<typeof lowlight.highlight>["children"][number];

function renderToken(node: HighlightNode, index: number): Child {
  if (node.type === "text") return node.value;
  if (node.type !== "element") return null;
  const classes = node.properties.className;
  return (
    <span
      key={index}
      class={Array.isArray(classes) ? classes.join(" ") : undefined}
    >
      {node.children.map(renderToken)}
    </span>
  );
}

export function CodeBlock({
  code,
  language,
}: {
  code: string;
  language?: string;
}) {
  const normalizedLanguage = language?.toLowerCase();
  const highlighted =
    normalizedLanguage && lowlight.registered(normalizedLanguage)
      ? lowlight.highlight(normalizedLanguage, code)
      : lowlight.highlightAuto(code);

  return (
    <pre class="syntax-highlight">
      <code
        class={
          normalizedLanguage ? `language-${normalizedLanguage}` : undefined
        }
      >
        {highlighted.children.map(renderToken)}
      </code>
    </pre>
  );
}
