export type PlanId = "free" | "creator" | "creator_pro";

export type FeatureKey =
  | "ideas"
  | "scripts"
  | "seo"
  | "planner"
  | "analyzer"
  | "coach";

// null = unlimited
const LIMITS: Record<PlanId, Record<FeatureKey, number | null>> = {
  free: {
    ideas: 10,
    scripts: 5,
    seo: 15,
    planner: 5,
    analyzer: 3,
    coach: 20,
  },
  creator: {
    ideas: null,
    scripts: 50,
    seo: 150,
    planner: 30,
    analyzer: 20,
    coach: 200,
  },
  creator_pro: {
    ideas: null,
    scripts: null,
    seo: 400,
    planner: 100,
    analyzer: null,
    coach: 500,
  },
};

export function getLimit(plan: PlanId, feature: FeatureKey): number | null {
  return LIMITS[plan][feature];
}