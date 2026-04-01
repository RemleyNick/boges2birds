import { create } from 'zustand'

type PaywallState = {
  visible: boolean
  resolve: ((purchased: boolean) => void) | null
  showPaywall: () => Promise<boolean>
  dismiss: (purchased: boolean) => void
}

export const usePaywallStore = create<PaywallState>((set, get) => ({
  visible: false,
  resolve: null,
  showPaywall: () =>
    new Promise<boolean>((resolve) => {
      set({ visible: true, resolve })
    }),
  dismiss: (purchased: boolean) => {
    get().resolve?.(purchased)
    set({ visible: false, resolve: null })
  },
}))
