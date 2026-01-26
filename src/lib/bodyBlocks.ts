export type BodyBlock =
  | { type: "p"; text: string }
  | { type: "img"; url: string; caption?: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "takeaways"; items: string[] }
  | { type: "divider" };

const CLOUDINARY_RE = /https?:\/\/res\.cloudinary\.com\/[^\s"'<>]+/i;

function isImageUrl(url: string) {
  return /\/image\/upload\//i.test(url);
}

export function parseBodyToBlocks(raw: string): BodyBlock[] {
  const lines = String(raw || "")
    .replace(/\r\n?/g, "\n")
    .split("\n");

  const blocks: BodyBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      i++;
      continue;
    }

    // Divider
    if (line === "---") {
      blocks.push({ type: "divider" });
      i++;
      continue;
    }

    // Heading
    if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.slice(3).trim() });
      i++;
      continue;
    }

    // Quote
    if (line.startsWith(">quote:")) {
      blocks.push({
        type: "quote",
        text: line.replace(">quote:", "").trim(),
      });
      i++;
      continue;
    }

    // Takeaways
    if (line === "[takeaways]") {
      const items: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== "[/takeaways]") {
        if (lines[i].trim().startsWith("- ")) {
          items.push(lines[i].trim().slice(2));
        }
        i++;
      }
      blocks.push({ type: "takeaways", items });
      i++;
      continue;
    }

    // Image
    if (CLOUDINARY_RE.test(line) && isImageUrl(line)) {
      let caption: string | undefined;
      const next = lines[i + 1]?.trim();
      if (next?.startsWith("(caption:")) {
        caption = next.replace("(caption:", "").replace(")", "").trim();
        i++;
      }
      blocks.push({ type: "img", url: line, caption });
      i++;
      continue;
    }

    // UL
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (lines[i]?.trim().startsWith("- ")) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // OL
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (/^\d+\.\s/.test(lines[i]?.trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // Paragraph
    blocks.push({ type: "p", text: line });
    i++;
  }

  return blocks;
}

export type InlinePart =
  | { type: "text"; value: string }
  | { type: "highlight"; value: string }
  | { type: "alert"; value: string };

export function parseInlineHighlight(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  let i = 0;

  while (i < text.length) {
    const yellow = text.indexOf("==", i);
    const red = text.indexOf("!!", i);

    const next =
      yellow === -1
        ? red
        : red === -1
        ? yellow
        : Math.min(yellow, red);

    if (next === -1) {
      parts.push({ type: "text", value: text.slice(i) });
      break;
    }

    if (next > i) {
      parts.push({ type: "text", value: text.slice(i, next) });
    }

    const isRed = text.startsWith("!!", next);
    const marker = isRed ? "!!" : "==";
    const end = text.indexOf(marker, next + 2);

    if (end === -1) {
      parts.push({ type: "text", value: text.slice(next) });
      break;
    }

    parts.push({
      type: isRed ? "alert" : "highlight",
      value: text.slice(next + 2, end),
    });

    i = end + 2;
  }

  return parts;
}
