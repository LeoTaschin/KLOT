import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { CompositeScreenProps } from '@react-navigation/native'

// ─── Auth Stack ───────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Login: undefined
  RegisterInfo: undefined
  RegisterVerify: undefined
  RegisterPassword: undefined
  RegisterPhoto: undefined
  RegisterUsername: undefined
  ForgotPassword: undefined
}

// ─── Tab Navigator ────────────────────────────────────────────────────────────

export type TabParamList = {
  Home: undefined
  Profile: undefined
}

// ─── Root Navigator ───────────────────────────────────────────────────────────

export type RootParamList = {
  Welcome: undefined
  Auth: undefined
  App: undefined
}

// ─── Screen Props Helpers ─────────────────────────────────────────────────────

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootParamList>
>
