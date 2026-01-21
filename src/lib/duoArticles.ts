// src/lib/duoArticles.ts
//
// Single source of truth for the 2-article container (Duo Articles).
// Admin dropdown options + backend validation + homepage insertion all use this.

export const DUO_ARTICLES_REQUIRED_COUNT = 2 as const;

/**
 * Where the Duo Articles block can be injected on the homepage.
 * Keep these keys stable (they are stored in DB).
 */
export const DUO_POSITIONS = [
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

export type DuoPosition = (typeof DUO_POSITIONS)[number];

/**
 * Labels shown in admin dropdown.
 * (Keys must match DUO_POSITIONS exactly.)
 */
export const DUO_POSITION_LABELS: Record<DuoPosition, string> = {
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
export type DuoArticlesConfig = {
  position: DuoPosition;
  articleIds: string[]; // exactly 2 ids, ordered
  updatedAt: string; // ISO string
};

/**
 * Payload shape from Admin -> API
 */
export type DuoArticlesPayload = {
  position: DuoPosition;
  articleIds: string[];
};

export function isDuoPosition(value: unknown): value is DuoPosition {
  return (
    typeof value === "string" &&
    (DUO_POSITIONS as readonly string[]).includes(value)
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
 * Strict validation for duo creation/update.
 * - position must be allowed
 * - articleIds must be exactly 2 unique ids
 */
export function validateDuoArticlesPayload(
  input: unknown
):
  | {
      ok: true;
      data: DuoArticlesPayload;
    }
  | {
      ok: false;
      error: string;
    } {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Invalid payload" };
  }

  const obj = input as Record<string, unknown>;

  if (!isDuoPosition(obj.position)) {
    return { ok: false, error: "Invalid position" };
  }

  const articleIds = normalizeArticleIds(obj.articleIds);

  if (articleIds.length !== DUO_ARTICLES_REQUIRED_COUNT) {
    return {
      ok: false,
      error: `Select exactly ${DUO_ARTICLES_REQUIRED_COUNT} articles`,
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
