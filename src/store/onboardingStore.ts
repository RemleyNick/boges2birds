import { create } from 'zustand'
import { ProgramSlug, SkillArea, SkillRatings, WeeklyTime } from '@/types'

interface OnboardingState {
  program: ProgramSlug | null
  skillRatings: Partial<SkillRatings>
  weeklyTime: WeeklyTime | null
  setProgram: (p: ProgramSlug) => void
  setSkillRating: (skill: SkillArea, rating: number) => void
  setWeeklyTime: (t: WeeklyTime) => void
  reset: () => void
}

const initialState = {
  program: null,
  skillRatings: {},
  weeklyTime: null,
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,
  setProgram: (p) => set({ program: p }),
  setSkillRating: (skill, rating) =>
    set((state) => ({ skillRatings: { ...state.skillRatings, [skill]: rating } })),
  setWeeklyTime: (t) => set({ weeklyTime: t }),
  reset: () => set(initialState),
}))
