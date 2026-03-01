import type { ProgramSlug, RoundStats, SkillArea, SkillPriority, SkillRatings, SkillScore } from '@/types'
import {
  FAIRWAY_THRESHOLDS,
  GIR_THRESHOLDS,
  PENALTY_THRESHOLDS_DESC,
  PROGRAM_MULTIPLIERS,
  PUTTS_THRESHOLDS_DESC,
} from './thresholds'

// ─── Threshold helpers ────────────────────────────────────────────────────────

/** Convert a fairway or GIR percentage (0–1) to a 1–4 score using ascending thresholds. */
function scoreFromAscendingThresholds(
  value: number,
  thresholds: Array<{ max: number; score: number }>,
): number {
  for (const t of thresholds) {
    if (value < t.max) return t.score
  }
  return 1
}

/** Convert a value to a 1–4 score using descending thresholds (higher value = worse). */
function scoreFromDescendingThresholds(
  value: number,
  thresholds: Array<{ min: number; score: number }>,
): number {
  for (const t of thresholds) {
    if (value >= t.min) return t.score
  }
  return 1
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Convert a raw stat value to a 1–4 engine score. */
export function statToScore(
  value: number,
  type: 'fairway' | 'gir' | 'putts' | 'penalties',
): number {
  switch (type) {
    case 'fairway':
      return scoreFromAscendingThresholds(value, FAIRWAY_THRESHOLDS)
    case 'gir':
      return scoreFromAscendingThresholds(value, GIR_THRESHOLDS)
    case 'putts':
      return scoreFromDescendingThresholds(value, PUTTS_THRESHOLDS_DESC)
    case 'penalties':
      return scoreFromDescendingThresholds(value, PENALTY_THRESHOLDS_DESC)
  }
}

/** Map a self-rating (1–5) to an engine score (1–4). */
export function selfRatingToScore(rating: number): number {
  // 1 (solid) → 1, 5 (critical) → 4, linear mapping
  // self-rating 1 = great, 5 = worst — invert and compress to 1–4
  // Formula: engineScore = 5 - rating → clamp 1–4
  const score = 5 - rating
  return Math.max(1, Math.min(4, score))
}

/** Blend stat score (70%) with self-rating score (30%). */
export function blendScores(statScore: number, selfRatingScore: number): number {
  return statScore * 0.7 + selfRatingScore * 0.3
}

/**
 * Short game is inferred — if GIR is poor but putting is decent, the gap is
 * around the green (chipping/pitching). Returns a score 1–4.
 */
export function inferShortGameScore(girScore: number, puttingScore: number): number {
  // Poor GIR (high score) + decent putting (low score) → short game is critical
  const gap = girScore - puttingScore
  if (gap >= 2) return 4
  if (gap === 1) return 3
  if (gap === 0) return Math.round((girScore + puttingScore) / 2)
  return Math.max(1, girScore - 1)
}

/** Compute average stat scores across up to 3 most recent rounds. */
export function aggregateRoundScores(rounds: RoundStats[]): Partial<SkillScore> {
  if (rounds.length === 0) return {}

  const recent = rounds.slice(-3)

  const fairwayScore =
    recent
      .filter((r) => r.fairwaysTotal > 0)
      .reduce((sum, r) => sum + statToScore(r.fairwaysHit / r.fairwaysTotal, 'fairway'), 0) /
    recent.filter((r) => r.fairwaysTotal > 0).length

  const girScore =
    recent
      .filter((r) => r.girTotal > 0)
      .reduce((sum, r) => sum + statToScore(r.girHit / r.girTotal, 'gir'), 0) /
    recent.filter((r) => r.girTotal > 0).length

  const puttsScore =
    recent
      .filter((r) => r.holesPlayed > 0)
      .reduce((sum, r) => sum + statToScore(r.totalPutts / r.holesPlayed, 'putts'), 0) /
    recent.filter((r) => r.holesPlayed > 0).length

  const penaltyScore =
    recent.reduce((sum, r) => sum + statToScore(r.penalties, 'penalties'), 0) / recent.length

  const shortGameScore = inferShortGameScore(girScore, puttsScore)

  return {
    teeShot: isNaN(fairwayScore) ? undefined : fairwayScore,
    irons: isNaN(girScore) ? undefined : girScore,
    putting: isNaN(puttsScore) ? undefined : puttsScore,
    courseMgmt: isNaN(penaltyScore) ? undefined : penaltyScore,
    shortGame: shortGameScore,
  } as Partial<SkillScore>
}

/** Apply program multipliers to blended scores. */
export function applyProgramMultipliers(scores: SkillScore, program: ProgramSlug): SkillScore {
  const multipliers = PROGRAM_MULTIPLIERS[program]
  return {
    teeShot: scores.teeShot * multipliers.teeShot,
    irons: scores.irons * multipliers.irons,
    shortGame: scores.shortGame * multipliers.shortGame,
    putting: scores.putting * multipliers.putting,
    courseMgmt: scores.courseMgmt * multipliers.courseMgmt,
  }
}

/** Sort skills by score descending → priority list. */
export function rankSkills(scores: SkillScore): SkillPriority[] {
  return (Object.entries(scores) as [SkillArea, number][])
    .map(([skill, score]) => ({ skill, score }))
    .sort((a, b) => b.score - a.score)
}

/**
 * Top-level function: takes rounds (may be empty), self-ratings, and program →
 * returns skills ranked by priority (highest score = most needs work).
 */
export function computeSkillPriorities(
  rounds: RoundStats[],
  selfRatings: SkillRatings,
  program: ProgramSlug,
): SkillPriority[] {
  const selfScores: SkillScore = {
    teeShot: selfRatingToScore(selfRatings.teeShot),
    irons: selfRatingToScore(selfRatings.irons),
    shortGame: selfRatingToScore(selfRatings.shortGame),
    putting: selfRatingToScore(selfRatings.putting),
    courseMgmt: selfRatingToScore(selfRatings.courseMgmt),
  }

  let blended: SkillScore

  if (rounds.length === 0) {
    // No round data — use self-ratings only
    blended = selfScores
  } else {
    const statScores = aggregateRoundScores(rounds)

    blended = {
      teeShot: statScores.teeShot != null
        ? blendScores(statScores.teeShot, selfScores.teeShot)
        : selfScores.teeShot,
      irons: statScores.irons != null
        ? blendScores(statScores.irons, selfScores.irons)
        : selfScores.irons,
      shortGame: statScores.shortGame != null
        ? blendScores(statScores.shortGame, selfScores.shortGame)
        : selfScores.shortGame,
      putting: statScores.putting != null
        ? blendScores(statScores.putting, selfScores.putting)
        : selfScores.putting,
      courseMgmt: statScores.courseMgmt != null
        ? blendScores(statScores.courseMgmt, selfScores.courseMgmt)
        : selfScores.courseMgmt,
    }
  }

  const withMultipliers = applyProgramMultipliers(blended, program)
  return rankSkills(withMultipliers)
}
