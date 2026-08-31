import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";

const contentDirectory = path.join(process.cwd(), "content");

export type DocMeta = {
  title: string;
  description?: string;
  phase?: string;
  status?: string;
  updated?: string;
};

export type Doc = {
  slug: string;
  meta: DocMeta;
  /** HTML with mermaid fences preserved as placeholders */
  contentHtml: string;
  mermaidBlocks: string[];
};

function slugToFile(slug: string): string {
  return path.join(contentDirectory, `${slug}.md`);
}

export function getDocSlugs(): string[] {
  if (!fs.existsSync(contentDirectory)) return [];
  return fs
    .readdirSync(contentDirectory)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

/**
 * Extract ```mermaid ... ``` blocks so we can render them client-side.
 * Replaces each with a numbered placeholder div.
 */
function extractMermaid(markdown: string): {
  markdown: string;
  blocks: string[];
} {
  const blocks: string[] = [];
  const replaced = markdown.replace(/```mermaid\n([\s\S]*?)```/g, (_, code) => {
    const index = blocks.length;
    blocks.push(code.trim());
    return `\n\n<div data-mermaid-index="${index}" class="mermaid-placeholder"></div>\n\n`;
  });
  return { markdown: replaced, blocks };
}

function asString(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value);
}

export async function getDocBySlug(slug: string): Promise<Doc | null> {
  const fullPath = slugToFile(slug);
  if (!fs.existsSync(fullPath)) return null;

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);
  const { markdown, blocks } = extractMermaid(content);

  const processed = await remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .process(markdown);

  return {
    slug,
    meta: {
      title: asString(data.title) ?? slug,
      description: asString(data.description),
      phase: asString(data.phase),
      status: asString(data.status),
      updated: asString(data.updated),
    },
    contentHtml: processed.toString(),
    mermaidBlocks: blocks,
  };
}
