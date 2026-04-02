import { create } from 'zustand'

interface AuthState {
  isAuthenticated: boolean
  hasSeenWelcome: boolean
  token: string | null
  login: (token: string) => void
  logout: () => void
  completeWelcome: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  hasSeenWelcome: false,
  token: null,
  login: (token) => set({ isAuthenticated: true, token }),
  logout: () => set({ isAuthenticated: false, token: null }),
  completeWelcome: () => set({ hasSeenWelcome: true }),
}))
