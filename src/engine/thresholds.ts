import type { ProgramSlug, SkillArea, WeeklyTime } from '@/types'

// ─── Stat → Score thresholds ─────────────────────────────────────────────────
// Each entry: { max, score } — iterate from top; first max the value falls under
// wins. Score 4 = critical weakness, 1 = solid.

export interface Threshold {
  max: number   // exclusive upper bound (value < max → this score)
  score: number
}

// Fairway hit percentage (0–1)
export const FAIRWAY_THRESHOLDS: Threshold[] = [
  { max: 0.30, score: 4 },
  { max: 0.45, score: 3 },
  { max: 0.60, score: 2 },
  { max: Infinity, score: 1 },
]

// GIR percentage (0–1)
export const GIR_THRESHOLDS: Threshold[] = [
  { max: 0.15, score: 4 },
  { max: 0.30, score: 3 },
  { max: 0.44, score: 2 },
  { max: Infinity, score: 1 },
]

// Putts per hole
export const PUTTS_THRESHOLDS: Threshold[] = [
  { max: Infinity, score: 1 },   // placeholder — reversed (higher putts = worse)
]

// Putts per hole — thresholds ordered from worst to best
export const PUTTS_THRESHOLDS_DESC: Array<{ min: number; score: number }> = [
  { min: 2.2, score: 4 },
  { min: 2.0, score: 3 },
  { min: 1.8, score: 2 },
  { min: 0,   score: 1 },
]

// Penalties per round
export const PENALTY_THRESHOLDS_DESC: Array<{ min: number; score: number }> = [
  { min: 5, score: 4 },
  { min: 3, score: 3 },
  { min: 1, score: 2 },
  { min: 0, score: 1 },
]

// ─── Program multipliers ──────────────────────────────────────────────────────
// Applied after blending to emphasise skills relevant to each program.

export const PROGRAM_MULTIPLIERS: Record<ProgramSlug, Record<SkillArea, number>> = {
  break100: {
    putting:    1.3,
    shortGame:  1.2,
    teeShot:    1.1,
    irons:      1.0,
    courseMgmt: 0.9,
  },
  break90: {
    putting:    1.0,
    shortGame:  1.1,
    teeShot:    1.2,
    irons:      1.3,
    courseMgmt: 1.0,
  },
  break80: {
    putting:    1.0,
    shortGame:  1.0,
    teeShot:    1.1,
    irons:      1.2,
    courseMgmt: 1.4,
  },
}

// ─── Sessions per week ────────────────────────────────────────────────────────

export const SESSIONS_PER_WEEK: Record<WeeklyTime, number> = {
  '<60':     1,
  '60-90':   2,
  '90-150':  3,
  '150-240': 4,
  '240+':    5,
}

// ─── Week volume multipliers ──────────────────────────────────────────────────
// Week 1: Foundation (60%), Week 2: Build (80%), Week 3: Peak (100%), Week 4: Consolidate (70%)

export const WEEK_VOLUME: Record<1 | 2 | 3 | 4, number> = {
  1: 0.6,
  2: 0.8,
  3: 1.0,
  4: 0.7,
}

// ─── Session duration targets ─────────────────────────────────────────────────
// Base duration per session given the weekly time bucket.

export const SESSION_DURATION: Record<WeeklyTime, number> = {
  '<60':     45,
  '60-90':   40,
  '90-150':  35,
  '150-240': 35,
  '240+':    30,
}
