import { ProgramSlug } from '@/types'

export const PROGRAMS: {
  slug: ProgramSlug
  label: string
  description: string
  targetScore: number
}[] = [
  { slug: 'break100', label: 'Break 100', description: 'For golfers averaging 100+', targetScore: 99 },
  { slug: 'break90',  label: 'Break 90',  description: 'For golfers averaging 90–99', targetScore: 89 },
  { slug: 'break80',  label: 'Break 80',  description: 'For golfers averaging 80–89', targetScore: 79 },
]
