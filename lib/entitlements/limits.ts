export type PlanId = "free" | "creator" | "creator_pro";

export type FeatureKey =
  | "ideas"
  | "scripts"
  | "seo"
  | "planner"
  | "analyzer";
  // "coach" removed pre-launch — Creator Coach runs on Claude Sonnet and
  // accounted for ~95% of projected API cost. Re-add with a limit here when
  // revenue supports it. The route and CoachMessage model are untouched.

// null = unlimited
const LIMITS: Record<PlanId, Record<FeatureKey, number | null>> = {
  free: {
    ideas: 10,
    scripts: 5,
    seo: 15,
    planner: 5,
    analyzer: 3,
  },
  creator: {
    ideas: null,
    scripts: 50,
    seo: 150,
    planner: 30,
    analyzer: 20,
  },
  creator_pro: {
    ideas: null,
    scripts: null,
    seo: 400,
    planner: 100,
    analyzer: null,
  },
};

export function getLimit(plan: PlanId, feature: FeatureKey): number | null {
  return LIMITS[plan][feature];
}