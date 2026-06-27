/** Convert HTML email content to plain text for the simple editor. */
export function htmlToPlainText(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return "";

  if (typeof document === "undefined") {
    return trimmed
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  const div = document.createElement("div");
  div.innerHTML = trimmed;
  return (div.innerText || div.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
}

/** Wrap plain text as simple TipTap-compatible HTML paragraphs. */
export function textToSimpleEditorHtml(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return "<p></p>";
  if (/<\/?p(?:\s[^>]*)?>|<br\s*\/?>/i.test(trimmed)) return content;
  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br />")}</p>`)
    .join("");
}

/** Plain text → simple editor HTML in one step. */
export function htmlToSimpleEditorHtml(html: string): string {
  return textToSimpleEditorHtml(htmlToPlainText(html));
}

/** True when content uses layout HTML beyond simple TipTap paragraphs. */
export function isStructuredHtmlEmail(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return false;

  const withoutSimpleRichText = trimmed
    .replace(/<\/?p(?:\s[^>]*)?>/gi, "")
    .replace(/<br\s*\/?>/gi, "")
    .trim();

  return /<\/?(table|tbody|thead|tfoot|tr|td|th|div|section|article|img|a|ul|ol|li|h[1-6]|blockquote|center|mj-[a-z-]+)(\s|>|\/)/i.test(
    withoutSimpleRichText
  );
}

export function resolveTemplateImportMode(content: string): "simple" | "html" {
  const trimmed = content.trim();
  if (!trimmed) return "simple";
  return isStructuredHtmlEmail(trimmed) ? "html" : "simple";
}
