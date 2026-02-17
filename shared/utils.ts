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