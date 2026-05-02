import sanitizeHtml from "sanitize-html";

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
    transformTags: {
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
