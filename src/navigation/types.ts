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
  Grupos: undefined
  Contas: undefined
  Profile: undefined
}

// ─── App Stack (tabs + telas de fluxo) ───────────────────────────────────────

export type AppStackParamList = {
  Tabs: undefined
  // Amigos
  AddFriend: undefined
  FriendProfile: { id: string; name: string; avatarUrl: string | null }
  // Grupo
  GroupFlow: undefined
  GroupDetails: { id: string; name: string; category: string; avatarUrl: string | null }
  // Dívida — modal com stack interno
  DebtFlow: undefined
}

// ─── Group Stack (modal interno) ─────────────────────────────────────────────

export type GroupStackParamList = {
  CreateGroupName: undefined
  CreateGroupMembers: { name: string; category: string }
  CreateGroupReview: { name: string; category: string; memberIds: string[] }
}

// ─── Debt Stack (modal interno) ──────────────────────────────────────────────

export type DebtStackParamList = {
  DebtSelector: undefined
  DebtValue: {
    type: 'friend' | 'group'
    targetId: string
    targetName: string
    avatarUrl: string | null
  }
  DebtReviewIndividual: {
    friendId: string
    friendName: string
    avatarUrl: string | null
    amount: number // em centavos
  }
  DebtReviewGroup: {
    groupId: string
    groupName: string
    amount: number // em centavos
  }
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
  NativeStackScreenProps<AppStackParamList>
>
