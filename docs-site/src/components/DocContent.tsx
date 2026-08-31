"use client";

import { useMemo } from "react";
import { Mermaid } from "./Mermaid";

type Props = {
  html: string;
  mermaidBlocks: string[];
};

/**
 * Splits server-rendered HTML on mermaid placeholders and interleaves
 * client Mermaid charts.
 */
export function DocContent({ html, mermaidBlocks }: Props) {
  const parts = useMemo(() => {
    const marker =
      /<div data-mermaid-index="(\d+)" class="mermaid-placeholder"><\/div>/g;
    const result: Array<
      { type: "html"; value: string } | { type: "mermaid"; index: number }
    > = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = marker.exec(html)) !== null) {
      if (match.index > lastIndex) {
        result.push({
          type: "html",
          value: html.slice(lastIndex, match.index),
        });
      }
      result.push({ type: "mermaid", index: Number(match[1]) });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < html.length) {
      result.push({ type: "html", value: html.slice(lastIndex) });
    }

    return result;
  }, [html]);

  return (
    <div className="doc-prose">
      {parts.map((part, i) => {
        if (part.type === "html") {
          return (
            <div
              key={`h-${i}`}
              dangerouslySetInnerHTML={{ __html: part.value }}
            />
          );
        }
        const chart = mermaidBlocks[part.index];
        if (!chart) return null;
        return <Mermaid key={`m-${part.index}`} chart={chart} />;
      })}
    </div>
  );
}
