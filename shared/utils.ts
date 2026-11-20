export function generateJobSlug(title: string, id: number): string {
  // Convert title to URL-friendly slug
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100); // Limit length to 100 characters
  
  // Append ID to ensure uniqueness
  return `${slug}-${id}`;
}

export function extractJobIdFromSlug(slug: string): number | null {
  const match = slug.match(/-(\d+)$/);
  if (!match) return null;
  const id = parseInt(match[1], 10);
  if (isNaN(id) || id > 2147483647 || id < 1) return null;
  return id;
}
// Images inside job descriptions may only point at raster image files that
// were uploaded to our own /uploads store (never SVG, data: or external URLs).
const CONTENT_IMAGE_SRC = /^(?:https:\/\/(?:www\.)?somkenjobs\.com)?\/uploads\/[A-Za-z0-9._-]+\.(?:png|jpe?g|gif|webp)$/i;

export function isAllowedContentImageSrc(src: string | null | undefined): boolean {
  return !!src && CONTENT_IMAGE_SRC.test(src.trim());
}

// Display width (px) for a content image; anything odd is dropped.
export function normalizeContentImageWidth(width: string | null | undefined): string | undefined {
  if (!width || !/^\s*\d+(?:px)?\s*$/i.test(width)) return undefined;
  const n = parseInt(width, 10);
  return n >= 16 && n <= 2000 ? String(n) : undefined;
}

export const CONTENT_IMAGE_EXTENSIONS = /\.(?:png|jpe?g|gif|webp)$/i;
