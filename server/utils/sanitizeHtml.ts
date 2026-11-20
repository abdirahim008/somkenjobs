import sanitizeHtml from "sanitize-html";
import { isAllowedContentImageSrc, normalizeContentImageWidth } from "@shared/utils";

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

const allowedAttributes: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "name", "target", "rel"],
  img: ["src", "alt", "width"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan"],
};

const allowedSchemes = ["http", "https", "mailto", "tel"];

export function sanitizeRichHtml(html: string | null | undefined): string {
  if (!html) return "";

  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes,
    allowedSchemes,
    allowedSchemesByTag: {
      a: allowedSchemes,
    },
    // Only images uploaded to our own /uploads store survive; the display width
    // is kept as a plain numeric attribute (inline styles are not allowed).
    exclusiveFilter: (frame) => frame.tag === "img" && !isAllowedContentImageSrc(frame.attribs.src),
    transformTags: {
      img: (_tagName, attribs) => {
        const width = normalizeContentImageWidth(attribs.width);
        return {
          tagName: "img",
          attribs: {
            src: (attribs.src || "").trim(),
            alt: (attribs.alt || "").slice(0, 200),
            ...(width ? { width } : {}),
          },
        };
      },
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: {
          ...attribs,
          rel: "noopener noreferrer",
          target: attribs.target === "_self" ? "_self" : "_blank",
        },
      }),
    },
    disallowedTagsMode: "discard",
    enforceHtmlBoundary: true,
  }).trim();
}

export function sanitizeJobContentFields<T extends Record<string, any>>(jobData: T): T {
  const sanitized: Record<string, any> = { ...jobData };
  const richTextFields = ["description", "bodyHtml", "howToApply", "qualifications", "responsibilities"];

  for (const field of richTextFields) {
    if (typeof sanitized[field] === "string") {
      sanitized[field] = sanitizeRichHtml(sanitized[field]);
    }
  }

  return sanitized as T;
}
