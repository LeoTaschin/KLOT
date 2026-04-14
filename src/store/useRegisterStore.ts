import { create } from 'zustand'

interface RegisterState {
  // Dados coletados durante o fluxo
  name: string
  email: string
  birthdate: string       // formato DD/MM/YYYY
  photoUri: string | null
  username: string

  // Sessão criada após verificação do OTP
  sessionToken: string | null
  userId: string | null

  // Impede o auto-login do onAuthStateChange enquanto o cadastro não terminou
  isInRegistrationFlow: boolean

  setName: (name: string) => void
  setEmail: (email: string) => void
  setBirthdate: (birthdate: string) => void
  setPhotoUri: (uri: string | null) => void
  setUsername: (username: string) => void
  setSession: (token: string, userId: string) => void
  setInRegistrationFlow: (value: boolean) => void
  reset: () => void
}

const initial = {
  name: '',
  email: '',
  birthdate: '',
  photoUri: null,
  username: '',
  sessionToken: null,
  userId: null,
  isInRegistrationFlow: false,
}

export const useRegisterStore = create<RegisterState>((set) => ({
  ...initial,
  setName: (name) => set({ name }),
  setEmail: (email) => set({ email }),
  setBirthdate: (birthdate) => set({ birthdate }),
  setPhotoUri: (photoUri) => set({ photoUri }),
  setUsername: (username) => set({ username }),
  setSession: (sessionToken, userId) => set({ sessionToken, userId }),
  setInRegistrationFlow: (isInRegistrationFlow) => set({ isInRegistrationFlow }),
  reset: () => set(initial),
}))
