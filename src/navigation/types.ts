import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native'

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
  // Configurações de perfil
  EditProfile: undefined
  PixSettings: undefined
  Notifications: undefined
  ChangeName: undefined
  ChangeUsername: undefined
  // Dívida — modal com stack interno
  DebtFlow: NavigatorScreenParams<DebtStackParamList> | undefined
  // Detalhe de dívida
  DebtDetail: {
    id: string
    title: string
    category: string
    amount: number
    personName: string
    avatarUrl: string | null
    groupId: string | null
    groupName: string | null
    direction: 'owe' | 'credit'
    date: string
  }
  // Receber PIX — QR Code para cobrança
  ReceivePix: { amount?: number; friendName?: string }
  // Pagamento PIX — modal com stack interno
  PaymentFlow: NavigatorScreenParams<PaymentStackParamList>
  // Cobrança PIX — modal com stack interno
  ChargeFlow: NavigatorScreenParams<ChargeStackParamList>
}

// ─── Group Stack (modal interno) ─────────────────────────────────────────────

export type GroupStackParamList = {
  CreateGroupName: undefined
  CreateGroupMembers: { name: string; category: string }
  CreateGroupReview: { name: string; category: string; memberIds: string[] }
}

// ─── Payment Stack (modal interno) ───────────────────────────────────────────

export type PaymentStackParamList = {
  PaymentSelectMode: {
    friendId: string
    friendName: string
    avatarUrl: string | null
  }
  PaymentValueSelector: {
    friendId: string
    friendName: string
    avatarUrl: string | null
    pixKey: string | null
  }
  PaymentPix: {
    friendId: string
    friendName: string
    avatarUrl: string | null
    pixKey: string | null
    amount: number
    splitIds: string[]
  }
}

// ─── Charge Stack (modal interno) ────────────────────────────────────────────

export type ChargeStackParamList = {
  ChargeSelectMode: {
    friendId: string
    friendName: string
    avatarUrl: string | null
  }
  ChargeValueSelector: {
    friendId: string
    friendName: string
    avatarUrl: string | null
  }
  ChargeQRCode: {
    friendId: string
    friendName: string
    amount: number
    splitIds: string[]
  }
  ChargeNotificationConfirm: {
    friendId: string
    friendName: string
    avatarUrl: string | null
    amount: number
  }
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
