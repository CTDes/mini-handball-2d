/** Session counters. Effectiveness is derived, never stored. */
export interface Stats {
  readonly goals: number;
  readonly shots: number;
}

export function recordShot(stats: Stats): Stats {
  return { goals: stats.goals, shots: stats.shots + 1 };
}

export function recordGoal(stats: Stats): Stats {
  return { goals: stats.goals + 1, shots: stats.shots };
}

/** Goals over shots, 0 when there are no shots. */
export function effectiveness(stats: Stats): number {
  return stats.shots === 0 ? 0 : stats.goals / stats.shots;
}
