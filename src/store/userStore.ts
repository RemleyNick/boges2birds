import { create } from 'zustand'

interface UserState {
  userId: string | null
  isGuest: boolean
  isAuthReady: boolean
  setUserId: (id: string) => void
  setIsGuest: (guest: boolean) => void
  setAuthReady: (ready: boolean) => void
}

export const useUserStore = create<UserState>((set) => ({
  userId: null,
  isGuest: true,
  isAuthReady: false,
  setUserId: (id) => set({ userId: id }),
  setIsGuest: (guest) => set({ isGuest: guest }),
  setAuthReady: (ready) => set({ isAuthReady: ready }),
}))
