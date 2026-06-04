export const PERSONAL_DEFAULT_CATEGORY = "personal" as const;

/** Sales / service / retail — confirmed partners only (commercial / 6% NPD). */
export const PARTNER_ONLY_CATEGORIES = [
  "consultation",
  "cashier",
  "merchandising",
  "loading",
  "delivery_vehicle",
  "delivery_walk",
  "food_service",
  "admin",
  "store",
] as const;

export type PartnerOnlyCategory = (typeof PARTNER_ONLY_CATEGORIES)[number];

/** Optional labels when posting as a person — domestic / personal help. */
export const LEGACY_PERSONAL_CATEGORIES = [
  "yard",
  "home_help",
  "moving",
  "cleaning",
  "elderly_care",
  "childcare",
  "errands",
] as const;

export type OptionalPersonCategory = (typeof LEGACY_PERSONAL_CATEGORIES)[number];

export type PersonPostCategory = typeof PERSONAL_DEFAULT_CATEGORY | OptionalPersonCategory;

/** Categories a person may pick on the post form. */
export const PERSON_POST_CATEGORIES = [
  PERSONAL_DEFAULT_CATEGORY,
  ...LEGACY_PERSONAL_CATEGORIES,
] as const;

export const TASK_CATEGORY_GROUPS = [
  {
    id: "personal",
    categories: [PERSONAL_DEFAULT_CATEGORY],
  },
  {
    id: "home",
    categories: [...LEGACY_PERSONAL_CATEGORIES],
  },
  {
    id: "retail",
    categories: ["consultation", "cashier", "merchandising", "loading"],
  },
  {
    id: "delivery",
    categories: ["delivery_vehicle", "delivery_walk"],
  },
  {
    id: "services",
    categories: ["food_service", "admin"],
  },
  {
    id: "partner",
    categories: ["store"],
  },
] as const;

export type TaskCategoryGroupId = (typeof TASK_CATEGORY_GROUPS)[number]["id"];

export const TASK_CATEGORIES = TASK_CATEGORY_GROUPS.flatMap((group) => group.categories);

export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export const PARTNER_TASK_CATEGORY_GROUPS = TASK_CATEGORY_GROUPS.filter(
  (group) => group.id === "retail" || group.id === "delivery" || group.id === "services" || group.id === "partner"
);

export const PARTNER_DEFAULT_CATEGORY: PartnerOnlyCategory = "merchandising";

/** @deprecated Use PERSON_POST_CATEGORIES */
export const PERSON_TASK_CATEGORIES = PERSON_POST_CATEGORIES;

export function isAllowedPersonPostCategory(value: string | null | undefined): boolean {
  const category = normalizeCategory(value ?? undefined);
  if (!category || category === PERSONAL_DEFAULT_CATEGORY) return true;
  if (isPartnerOnlyCategory(category)) return false;
  return (LEGACY_PERSONAL_CATEGORIES as readonly string[]).includes(category);
}

export function parsePersonPostCategory(value: string | null | undefined): PersonPostCategory {
  const category = normalizeCategory(value ?? undefined);
  if (!category || category === PERSONAL_DEFAULT_CATEGORY) {
    return PERSONAL_DEFAULT_CATEGORY;
  }
  if ((LEGACY_PERSONAL_CATEGORIES as readonly string[]).includes(category)) {
    return category as OptionalPersonCategory;
  }
  return PERSONAL_DEFAULT_CATEGORY;
}

export const LEGACY_CATEGORY_MAP: Record<string, TaskCategory> = {
  home: "home_help",
  errand: "errands",
};

export function isPartnerOnlyCategory(value: string): value is PartnerOnlyCategory {
  return (PARTNER_ONLY_CATEGORIES as readonly string[]).includes(value);
}

export function normalizeCategory(value: string | null | undefined): TaskCategory | undefined {
  if (!value) return undefined;
  const mapped = LEGACY_CATEGORY_MAP[value] ?? value;
  if (TASK_CATEGORIES.includes(mapped as TaskCategory)) {
    return mapped as TaskCategory;
  }
  return undefined;
}

export function parsePartnerCategory(value: string | null | undefined): PartnerOnlyCategory | undefined {
  const category = normalizeCategory(value);
  if (category && isPartnerOnlyCategory(category)) {
    return category;
  }
  return undefined;
}

export function categoryLabelKey(category: TaskCategory): string {
  return `filters.category.${category}`;
}

export function categoryGroupLabelKey(groupId: TaskCategoryGroupId): string {
  return `filters.categoryGroup.${groupId}`;
}

export function findCategoryGroup(category: TaskCategory): TaskCategoryGroupId | undefined {
  for (const group of TASK_CATEGORY_GROUPS) {
    if ((group.categories as readonly string[]).includes(category)) {
      return group.id;
    }
  }
  return undefined;
}
