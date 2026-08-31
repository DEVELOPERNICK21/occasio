"use client";

import { useEffect, useId, useState } from "react";

type Props = {
  chart: string;
};

export function Mermaid({ chart }: Props) {
  const id = useId().replace(/:/g, "");
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          securityLevel: "loose",
          fontFamily: "inherit",
        });
        const { svg: rendered } = await mermaid.render(
          `mermaid-${id}`,
          chart,
        );
        if (!cancelled) setSvg(rendered);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to render diagram");
        }
      }
    }

    void render();
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return (
      <pre className="overflow-x-auto rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        Mermaid error: {error}
      </pre>
    );
  }

  if (!svg) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">
        Rendering diagram…
      </div>
    );
  }

  return (
    <div
      className="my-6 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
