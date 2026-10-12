import { toCents } from "./domain";
import type { Goal } from "./types";

export function goalProgress(goal: Pick<Goal, "saved" | "target">) {
  const saved = toCents(goal.saved);
  const target = toCents(goal.target);
  const complete = saved >= target;
  return { complete, percent: complete ? 100 : Math.min(99, Math.round(saved / target * 100)) };
}
