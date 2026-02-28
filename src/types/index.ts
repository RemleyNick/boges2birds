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
