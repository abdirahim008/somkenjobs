import DOMPurify from "dompurify";
import { isAllowedContentImageSrc, normalizeContentImageWidth } from "@shared/utils";

// Only images uploaded to our own /uploads store may appear in job content,
// with a plain numeric width. Mirrors server/utils/sanitizeHtml.ts.
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.nodeName !== "IMG") return;
  const img = node as Element;
  if (!isAllowedContentImageSrc(img.getAttribute("src"))) {
    img.remove();
    return;
  }
  const width = normalizeContentImageWidth(img.getAttribute("width"));
  if (width) img.setAttribute("width", width);
  else img.removeAttribute("width");
});

const allowedTags = [
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "h2",
  "h3",
  "h4",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "span",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
];

const allowedAttributes = ["href", "name", "target", "rel", "colspan", "rowspan", "src", "alt", "width"];

export function sanitizeRichHtml(html: string): string {
  if (!html) return "";

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttributes,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "svg", "math"],
    FORBID_ATTR: ["style", "srcset"],
  });
}
