/**
 * Generate a URL-safe slug from a club name.
 * "Chiddingstone CC" → "chiddingstone-cc"
 */
export function clubSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
