export type ProgramSlug = 'break100' | 'break90' | 'break80'
export type SkillArea = 'teeShot' | 'irons' | 'shortGame' | 'putting' | 'courseMgmt'
export type WeeklyTime = '<60' | '60-90' | '90-150' | '150-240' | '240+'

export interface SkillRatings {
  teeShot: number
  irons: number
  shortGame: number
  putting: number
  courseMgmt: number
}

// --- Engine types ---

export interface RoundStats {
  fairwaysHit: number
  fairwaysTotal: number
  girHit: number
  girTotal: number
  totalPutts: number
  holesPlayed: number
  penalties: number
}

export type SkillScore = Record<SkillArea, number>   // 1–4 scale

export interface SkillPriority {
  skill: SkillArea
  score: number   // higher = needs more work
}

export type SessionType = 'driving' | 'irons' | 'short_game' | 'putting' | 'mixed'

export interface Session {
  weekNumber: 1 | 2 | 3 | 4
  sessionNumber: number
  sessionType: SessionType
  primarySkill: SkillArea
  durationMinutes: number
  drills: DrillAllocation[]
}

export interface TrainingBlock {
  blockNumber: number
  skillPriorities: SkillPriority[]
  sessions: Session[]
  llmSummary: string | null
}

export interface Drill {
  id: string
  name: string
  skillArea: SkillArea
  sessionType: SessionType
  durationMinutes: number
  shotCount: number
  programSlugs: ProgramSlug[]
  instructions: string
}

export interface DrillAllocation {
  drillId: string
  durationOverride: number | null
  shotCountOverride: number | null
}

export type ArticleCategory = 'courseManagement' | 'mindset' | 'statistics' | 'strategy'

export interface Article {
  id: string
  title: string
  body: string
  category: ArticleCategory
}
