import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import Svg, { Path } from 'react-native-svg'

import { DebtDetailItem, type DebtDetail } from '../../../components/DebtDetailItem'
import { GroupItem, type GroupData } from '../../../components/GroupItem'
import { ScreenTransition } from '../../../components/ScreenTransition'
import { PersonIcon, Text } from '../../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../../constants/theme'
import { supabase } from '../../../lib/supabase'
import type { AppStackParamList } from '../../../navigation/types'

type Props = NativeStackScreenProps<AppStackParamList, 'FriendProfile'>

interface FriendExtra {
  username: string
  pixKey: string | null
}


const MONTHS_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

function getPeriodKey(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const startOfWeek = new Date(now)
  const day = now.getDay()
  startOfWeek.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  startOfWeek.setHours(0, 0, 0, 0)
  if (date >= startOfWeek) return 'Esta semana'
  return `${MONTHS_PT[date.getMonth()]} ${date.getFullYear()}`
}

function groupDebtsByPeriod(items: DebtDetail[]) {
  const sorted = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const map = new Map<string, DebtDetail[]>()
  for (const item of sorted) {
    const key = getPeriodKey(item.date)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }))
}

const AVATAR_SIZE = 88

function BackIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={Colors.neutral.primary} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  )
}

function MoreIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"
        fill={Colors.neutral.secondary} stroke={Colors.neutral.secondary} strokeWidth={1.5} strokeLinecap="round"
      />
    </Svg>
  )
}

function WalletIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"
        stroke={Colors.brand.primary} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round"
      />
      <Path d="M16 12h5v4h-5a2 2 0 0 1 0-4z"
        stroke={Colors.brand.primary} strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  )
}

function PlusIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14"
        stroke={Colors.brand.primary} strokeWidth={2.2} strokeLinecap="round"
      />
    </Svg>
  )
}

function BellIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={Colors.brand.primary} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round"
      />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke={Colors.brand.primary} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  )
}

export function FriendProfileScreen({ navigation, route }: Props) {
  const { id: friendId, name, avatarUrl } = route.params
  const firstName = name.split(' ')[0]

  const [extra, setExtra] = useState<FriendExtra | null>(null)
  const [theyOweMe, setTheyOweMe] = useState(0)
  const [iOweThem, setIOweThem] = useState(0)
  const [debts, setDebts] = useState<DebtDetail[]>([])
  const [groups, setGroups] = useState<GroupData[]>([])
  const [payments, setPayments] = useState<{ id: string; amount: number; date: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dividas' | 'grupos' | 'pagamentos'>('dividas')

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [profileRes, theyOweRes, iOweRes, myGroupsRes, friendGroupsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('username, pix_key')
          .eq('id', friendId)
          .single(),

        supabase
          .from('expense_splits')
          .select('id, amount, expenses!inner(id, title, category, date, payer_id, group_id)')
          .eq('user_id', friendId)
          .eq('paid', false)
          .eq('expenses.payer_id', user.id),

        supabase
          .from('expense_splits')
          .select('id, amount, expenses!inner(id, title, category, date, payer_id, group_id)')
          .eq('user_id', user.id)
          .eq('paid', false)
          .eq('expenses.payer_id', friendId),

        supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id),

        supabase
          .from('group_members')
          .select('group_id, groups!inner(id, name, avatar_url, category)')
          .eq('user_id', friendId),
      ])

      if (profileRes.data) {
        setExtra({ username: profileRes.data.username, pixKey: profileRes.data.pix_key ?? null })
      }

      const theyOweMeTotal = (theyOweRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0)
      const iOweThemTotal = (iOweRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0)
      setTheyOweMe(theyOweMeTotal)
      setIOweThem(iOweThemTotal)

      const myGroupIds = new Set((myGroupsRes.data ?? []).map((r: any) => r.group_id))
      const common: GroupData[] = (friendGroupsRes.data ?? [])
        .filter((r: any) => myGroupIds.has(r.group_id))
        .map((r: any) => ({
          id: r.groups.id,
          name: r.groups.name,
          avatar_url: r.groups.avatar_url ?? null,
          category: r.groups.category ?? 'outro',
        }))
      setGroups(common)

      const creditItems: DebtDetail[] = (theyOweRes.data ?? [])
        .filter((r: any) => r.expenses?.category !== 'pagamento')
        .map((r: any) => ({
          id: r.id,
          title: r.expenses.title,
          category: r.expenses.category ?? 'outro',
          amount: Number(r.amount),
          personName: name,
          avatarUrl: avatarUrl ?? null,
          groupId: r.expenses.group_id ?? null,
          groupName: null,
          direction: 'credit' as const,
          date: r.expenses.date,
        }))

      const oweItems: DebtDetail[] = (iOweRes.data ?? []).map((r: any) => ({
        id: r.id,
        title: r.expenses.title,
        category: r.expenses.category ?? 'outro',
        amount: Number(r.amount),
        personName: name,
        avatarUrl: avatarUrl ?? null,
        groupId: r.expenses.group_id ?? null,
        groupName: null,
        direction: 'owe' as const,
        date: r.expenses.date,
      }))

      setDebts([...creditItems, ...oweItems])

      const { data: paymentsData } = await supabase
        .from('expense_splits')
        .select('id, amount, expenses!inner(title, date, category, payer_id)')
        .eq('user_id', friendId)
        .eq('expenses.payer_id', user.id)
        .eq('expenses.category', 'pagamento')
        .order('expenses(date)', { ascending: false })

      setPayments(
        (paymentsData ?? []).map((r: any) => ({
          id: r.id,
          amount: Number(r.amount),
          date: r.expenses.date,
          title: r.expenses.title,
        }))
      )
    } finally {
      if (showSpinner) setLoading(false)
    }
  }, [friendId])

  useFocusEffect(
    useCallback(() => {
      load(true)
    }, [load])
  )

  // Reload silently when navigation state changes (e.g., PaymentFlow modal dismissed)
  useEffect(() => {
    const unsubscribe = navigation.addListener('state', () => load(false))
    return unsubscribe
  }, [navigation, load])

  const handleRemoveFriend = () => {
    Alert.alert(
      'Remover amigo',
      `Tem certeza que quer remover ${firstName} da sua lista de amigos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            // Duas operações separadas cobrem ambas as direções (requester ↔ addressee)
            await Promise.all([
              supabase.from('friendships').delete()
                .eq('requester_id', user.id).eq('addressee_id', friendId),
              supabase.from('friendships').delete()
                .eq('requester_id', friendId).eq('addressee_id', user.id),
            ])
            navigation.goBack()
          },
        },
      ]
    )
  }

  const handleDebtPress = (item: DebtDetail) => {
    navigation.navigate('DebtDetail', item)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenTransition>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
            <BackIcon />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRemoveFriend} style={styles.removeBtn} hitSlop={12}>
            <MoreIcon />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: Spacing.xl }} />
        ) : (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

            {/* ── Perfil + Balanço ── */}
            <View style={styles.profileBlock}>
              <View style={styles.profileSection}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <PersonIcon size={40} color={Colors.neutral.placeholder} />
                  </View>
                )}
                <Text variant="h2" color={Colors.neutral.primary} weight="700">
                  {name}
                </Text>
                {extra?.username && (
                  <Text variant="body" color={Colors.neutral.secondary}>
                    @{extra.username}
                  </Text>
                )}
              </View>

              {(() => {
                const net = theyOweMe - iOweThem
                const absStr = `R$ ${Math.abs(net).toFixed(2).replace('.', ',')}`
                const color = net > 0 ? Colors.status.credit : net < 0 ? Colors.status.debt : Colors.neutral.secondary
                const label = net > 0 ? `${firstName} te deve` : net < 0 ? 'Você deve' : 'Vocês estão quites'

                return (
                  <View style={styles.balanceCard}>
                    {net !== 0 && (
                      <Text style={StyleSheet.flatten([styles.balanceAmount, { color }])}>
                        {absStr}
                      </Text>
                    )}
                    <Text variant="body" color={color} weight="600">
                      {label}
                    </Text>
                  </View>
                )
              })()}
            </View>

            {/* ── Ações ── */}
            <View style={styles.actionRow}>
              {/* Pagar */}
              <TouchableOpacity
                style={styles.actionItem}
                activeOpacity={0.75}
                onPress={() => navigation.navigate('PaymentFlow', {
                  screen: 'PaymentSelectMode',
                  params: { friendId, friendName: name, avatarUrl: avatarUrl ?? null },
                })}
              >
                <View style={[styles.actionCircle, styles.actionCirclePay]}>
                  <WalletIcon />
                </View>
                <Text variant="caption" color={Colors.neutral.primary} weight="600" style={styles.actionLabel}>
                  Pagar
                </Text>
              </TouchableOpacity>

              {/* Adicionar dívida */}
              <TouchableOpacity
                style={styles.actionItem}
                activeOpacity={0.75}
                onPress={() => navigation.navigate('DebtFlow', {
                  screen: 'DebtValue',
                  params: { type: 'friend', targetId: friendId, targetName: name, avatarUrl: avatarUrl ?? null },
                })}
              >
                <View style={[styles.actionCircle, styles.actionCircleDebt]}>
                  <PlusIcon />
                </View>
                <Text variant="caption" color={Colors.neutral.primary} weight="600" style={styles.actionLabel}>
                  Dívida
                </Text>
              </TouchableOpacity>

              {/* Cobrar */}
              <TouchableOpacity
                style={styles.actionItem}
                activeOpacity={0.75}
                onPress={() => navigation.navigate('ReceivePix', {
                  amount: theyOweMe > 0 ? theyOweMe : undefined,
                  friendName: name,
                })}
              >
                <View style={[styles.actionCircle, styles.actionCircleCharge]}>
                  <BellIcon />
                </View>
                <Text variant="caption" color={Colors.neutral.primary} weight="600" style={styles.actionLabel}>
                  Cobrar
                </Text>
              </TouchableOpacity>
            </View>


            {/* ── Selector Dívidas / Grupos ── */}
            <View style={styles.chips}>
              <TouchableOpacity
                style={[styles.chip, activeTab === 'dividas' && styles.chipActive]}
                onPress={() => setActiveTab('dividas')}
                activeOpacity={0.7}
              >
                <Text
                  variant="caption"
                  color={activeTab === 'dividas' ? Colors.brand.primary : Colors.neutral.secondary}
                  weight={activeTab === 'dividas' ? '600' : '400'}
                >
                  Dívidas{debts.length > 0 ? ` (${debts.length})` : ''}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.chip, activeTab === 'grupos' && styles.chipActive]}
                onPress={() => setActiveTab('grupos')}
                activeOpacity={0.7}
              >
                <Text
                  variant="caption"
                  color={activeTab === 'grupos' ? Colors.brand.primary : Colors.neutral.secondary}
                  weight={activeTab === 'grupos' ? '600' : '400'}
                >
                  Grupos em comum{groups.length > 0 ? ` (${groups.length})` : ''}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.chip, activeTab === 'pagamentos' && styles.chipActive]}
                onPress={() => setActiveTab('pagamentos')}
                activeOpacity={0.7}
              >
                <Text
                  variant="caption"
                  color={activeTab === 'pagamentos' ? Colors.brand.primary : Colors.neutral.secondary}
                  weight={activeTab === 'pagamentos' ? '600' : '400'}
                >
                  Pagamentos
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Conteúdo do tab ── */}
            {activeTab === 'dividas' ? (
              debts.length > 0 ? (
                <View style={styles.tabContent}>
                  {groupDebtsByPeriod(debts).map(({ title, data }) => (
                    <View key={title}>
                      <View style={styles.periodHeader}>
                        <Text variant="caption" color={Colors.neutral.secondary} weight="600">
                          {title.toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.sectionCard}>
                        {data.map((debt, i) => (
                          <React.Fragment key={debt.id}>
                            {i > 0 && <View style={styles.divider} />}
                            <DebtDetailItem item={debt} onPress={handleDebtPress} />
                          </React.Fragment>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.empty}>
                  <Text variant="body" color={Colors.neutral.placeholder}>
                    Nenhuma dívida pendente
                  </Text>
                </View>
              )
            ) : activeTab === 'grupos' ? (
              groups.length > 0 ? (
                <View style={styles.groupList}>
                  {groups.map((g) => (
                    <GroupItem
                      key={g.id}
                      group={g}
                      onPress={(group) => navigation.navigate('GroupDetails', {
                        id: group.id,
                        name: group.name,
                        category: group.category,
                        avatarUrl: group.avatar_url,
                      })}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.empty}>
                  <Text variant="body" color={Colors.neutral.placeholder}>
                    Nenhum grupo em comum
                  </Text>
                </View>
              )
            ) : payments.length > 0 ? (
              <View style={styles.tabContent}>
                <View style={styles.sectionCard}>
                  {payments.map((p, i) => {
                    const dateStr = new Date(p.date).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })
                    return (
                      <React.Fragment key={p.id}>
                        {i > 0 && <View style={styles.divider} />}
                        <View style={styles.paymentRow}>
                          <View style={styles.paymentInfo}>
                            <Text variant="label" color={Colors.neutral.primary} weight="600">
                              {p.title}
                            </Text>
                            <Text variant="caption" color={Colors.neutral.secondary}>
                              {dateStr}
                            </Text>
                          </View>
                          <Text variant="label" color={Colors.status.credit} weight="700">
                            {p.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </Text>
                        </View>
                      </React.Fragment>
                    )
                  })}
                </View>
              </View>
            ) : (
              <View style={styles.empty}>
                <Text variant="body" color={Colors.neutral.placeholder}>
                  Nenhum pagamento registrado
                </Text>
              </View>
            )}

          </ScrollView>
        )}

      </ScreenTransition>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral.surface,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },

  // Perfil + Balanço
  profileBlock: {
    gap: Spacing.sm,
  },
  profileSection: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginBottom: Spacing.sm,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: Colors.neutral.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },

  // Balanço
  balanceCard: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xxl,
  },
  actionItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  actionCirclePay: {
    backgroundColor: Colors.brand.xlight,
    borderWidth: 1.5,
    borderColor: Colors.brand.light,
  },
  actionCircleCharge: {
    backgroundColor: Colors.brand.xlight,
    borderWidth: 1.5,
    borderColor: Colors.brand.light,
  },
  actionCircleDebt: {
    backgroundColor: Colors.brand.xlight,
    borderWidth: 1.5,
    borderColor: Colors.brand.light,
  },
  actionLabel: {
    textAlign: 'center',
  },

  // Chips selector
  chips: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    backgroundColor: Colors.neutral.white,
  },
  chipActive: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.xlight,
  },

  // Conteúdo dos tabs
  tabContent: {
    gap: Spacing.md,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },

  // Extrato estilo banco
  periodHeader: {
    paddingBottom: Spacing.xs,
    paddingLeft: 2,
  },
  sectionCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: Colors.neutral.border,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.neutral.border,
    marginLeft: 72, // Spacing.md(16) + avatar(40) + gap(16)
  },

  // Pagamentos
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  paymentInfo: {
    flex: 1,
    gap: 2,
  },

  // Grupos
  groupList: {
    gap: Spacing.sm,
  },
})
