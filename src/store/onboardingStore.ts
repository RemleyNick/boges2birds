import { create } from 'zustand'
import type { ProgramSlug, SessionDuration, SessionsPerWeek, SessionStructure, SkillArea, SkillRatings } from '@/types'

interface OnboardingState {
  program: ProgramSlug | null
  skillRatings: Partial<SkillRatings>
  sessionsPerWeek: SessionsPerWeek | null
  sessionDuration: SessionDuration | null
  sessionStructure: SessionStructure | null
  setProgram: (p: ProgramSlug) => void
  setSkillRating: (skill: SkillArea, rating: number) => void
  setSessionsPerWeek: (n: SessionsPerWeek) => void
  setSessionDuration: (d: SessionDuration) => void
  setSessionStructure: (s: SessionStructure) => void
  reset: () => void
}

const initialState = {
  program: null,
  skillRatings: {},
  sessionsPerWeek: null,
  sessionDuration: null,
  sessionStructure: null,
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,
  setProgram: (p) => set({ program: p }),
  setSkillRating: (skill, rating) =>
    set((state) => ({ skillRatings: { ...state.skillRatings, [skill]: rating } })),
  setSessionsPerWeek: (n) => set({ sessionsPerWeek: n }),
  setSessionDuration: (d) => set({ sessionDuration: d }),
  setSessionStructure: (s) => set({ sessionStructure: s }),
  reset: () => set(initialState),
}))
