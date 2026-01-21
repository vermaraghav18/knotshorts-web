// src/lib/spotlightArticles.ts
//
// Single source of truth for the 3-article container (Spotlight Articles).
// Admin dropdown options + backend validation + homepage insertion all use this.

export const SPOTLIGHT_ARTICLES_REQUIRED_COUNT = 3 as const;

/**
 * Where the Spotlight Articles block can be injected on the homepage.
 * Keep these keys stable (they are stored in DB).
 */
export const SPOTLIGHT_POSITIONS = [
  "after_top_stories",

  "after_world_section",
  "after_india_section",
  "after_business_section",
  "after_technology_section",
  "after_entertainment_section",
  "after_sports_section",
  "after_health_section",
  "after_lifestyle_section",
] as const;

export type SpotlightPosition = (typeof SPOTLIGHT_POSITIONS)[number];

/**
 * Labels shown in admin dropdown.
 * (Keys must match SPOTLIGHT_POSITIONS exactly.)
 */
export const SPOTLIGHT_POSITION_LABELS: Record<SpotlightPosition, string> = {
  after_top_stories: "After Top Stories",

  after_world_section: "After World Section",
  after_india_section: "After India Section",
  after_business_section: "After Business Section",
  after_technology_section: "After Technology Section",
  after_entertainment_section: "After Entertainment Section",
  after_sports_section: "After Sports Section",
  after_health_section: "After Health Section",
  after_lifestyle_section: "After Lifestyle Section",
};

/**
 * Stored config structure.
 */
export type SpotlightArticlesConfig = {
  position: SpotlightPosition;
  articleIds: string[]; // exactly 3 ids, ordered
  updatedAt: string; // ISO string
};

/**
 * Payload shape from Admin -> API
 */
export type SpotlightArticlesPayload = {
  position: SpotlightPosition;
  articleIds: string[];
};

export function isSpotlightPosition(value: unknown): value is SpotlightPosition {
  return (
    typeof value === "string" &&
    (SPOTLIGHT_POSITIONS as readonly string[]).includes(value)
  );
}

/**
 * Returns normalized IDs: trimmed, non-empty, unique (preserves order)
 */
export function normalizeArticleIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  const seen = new Set<string>();
  const out: string[] = [];

  for (const raw of ids) {
    if (typeof raw !== "string") continue;
    const id = raw.trim();
    if (!id) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }

  return out;
}

/**
 * Strict validation for spotlight creation/update.
 * - position must be allowed
 * - articleIds must be exactly 3 unique ids
 */
export function validateSpotlightArticlesPayload(
  input: unknown
):
  | {
      ok: true;
      data: SpotlightArticlesPayload;
    }
  | {
      ok: false;
      error: string;
    } {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Invalid payload" };
  }

  const obj = input as Record<string, unknown>;

  if (!isSpotlightPosition(obj.position)) {
    return { ok: false, error: "Invalid position" };
  }

  const articleIds = normalizeArticleIds(obj.articleIds);

  if (articleIds.length !== SPOTLIGHT_ARTICLES_REQUIRED_COUNT) {
    return {
      ok: false,
      error: `Select exactly ${SPOTLIGHT_ARTICLES_REQUIRED_COUNT} articles`,
    };
  }

  return {
    ok: true,
    data: {
      position: obj.position,
      articleIds,
    },
  };
}
