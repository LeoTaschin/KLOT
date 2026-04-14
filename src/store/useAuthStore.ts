import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type AuthRoute = 'Login' | 'RegisterInfo'

interface AuthState {
  // ─── Estado persistido ────────────────────────────────────────────
  isAuthenticated: boolean
  hasSeenWelcome: boolean
  token: string | null

  // ─── Estado em memória (não persiste) ────────────────────────────
  initialAuthRoute: AuthRoute

  // ─── Ações ───────────────────────────────────────────────────────
  login: (token: string) => void
  logout: () => void
  completeWelcome: (route?: AuthRoute) => void
  resetWelcome: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      hasSeenWelcome: false,
      token: null,
      initialAuthRoute: 'Login',

      login: (token) => set({ isAuthenticated: true, token }),
      logout: () => set({ isAuthenticated: false, token: null }),
      completeWelcome: (route = 'Login') =>
        set({ hasSeenWelcome: true, initialAuthRoute: route }),
      resetWelcome: () => set({ hasSeenWelcome: false, initialAuthRoute: 'Login' }),
    }),
    {
      name: 'klot-auth',
      storage: createJSONStorage(() => AsyncStorage),
      // Persiste apenas o estado — não as funções
      // initialAuthRoute não persiste — sempre começa em Login ao reabrir o app
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        hasSeenWelcome: state.hasSeenWelcome,
        token: state.token,
      }),
    },
  ),
)
