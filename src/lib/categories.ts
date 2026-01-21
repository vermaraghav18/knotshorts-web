export type CategoryDef = { slug: string; label: string };

export const CATEGORIES: CategoryDef[] = [
  { slug: "world", label: "World" },
  { slug: "india", label: "India" },
  { slug: "business", label: "Business" },
  { slug: "technology", label: "Technology" },
  { slug: "entertainment", label: "Entertainment" },
  { slug: "sports", label: "Sports" },
  { slug: "health", label: "Health" },
  { slug: "lifestyle", label: "Lifestyle" },
];

export function isCategorySlug(slug: string) {
  return CATEGORIES.some((c) => c.slug === slug);
}

export function labelForSlug(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)?.label || null;
}
