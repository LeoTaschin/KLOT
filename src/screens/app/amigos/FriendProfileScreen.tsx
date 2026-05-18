import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Share,
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
import { PersonIcon, PixIcon, Text } from '../../../components/ui'
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

export function FriendProfileScreen({ navigation, route }: Props) {
  const { id: friendId, name, avatarUrl } = route.params
  const firstName = name.split(' ')[0]

  const [extra, setExtra] = useState<FriendExtra | null>(null)
  const [theyOweMe, setTheyOweMe] = useState(0)
  const [iOweThem, setIOweThem] = useState(0)
  const [debts, setDebts] = useState<DebtDetail[]>([])
  const [groups, setGroups] = useState<GroupData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dividas' | 'grupos' | 'pagamentos'>('dividas')

  useFocusEffect(
    useCallback(() => {
      async function load() {
        setLoading(true)
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          const [profileRes, theyOweRes, iOweRes, myGroupsRes, friendGroupsRes] = await Promise.all([
            // Perfil do amigo
            supabase
              .from('profiles')
              .select('username, pix_key')
              .eq('id', friendId)
              .single(),

            // Amigo me deve: splits do amigo em despesas que eu paguei
            supabase
              .from('expense_splits')
              .select('id, amount, expenses!inner(id, title, category, date, payer_id, group_id)')
              .eq('user_id', friendId)
              .eq('paid', false)
              .eq('expenses.payer_id', user.id),

            // Eu devo ao amigo: meus splits em despesas que ele pagou
            supabase
              .from('expense_splits')
              .select('id, amount, expenses!inner(id, title, category, date, payer_id, group_id)')
              .eq('user_id', user.id)
              .eq('paid', false)
              .eq('expenses.payer_id', friendId),

            // Meus grupos
            supabase
              .from('group_members')
              .select('group_id')
              .eq('user_id', user.id),

            // Grupos do amigo
            supabase
              .from('group_members')
              .select('group_id, groups!inner(id, name, avatar_url, category)')
              .eq('user_id', friendId),
          ])

          // Perfil
          if (profileRes.data) {
            setExtra({ username: profileRes.data.username, pixKey: profileRes.data.pix_key ?? null })
          }

          // Balanço
          const theyOweMeTotal = (theyOweRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0)
          const iOweThemTotal = (iOweRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0)
          setTheyOweMe(theyOweMeTotal)
          setIOweThem(iOweThemTotal)

          // Grupos em comum
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

          // Dívidas pendentes entre os dois
          const creditItems: DebtDetail[] = (theyOweRes.data ?? []).map((r: any) => ({
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
        } finally {
          setLoading(false)
        }
      }
      load()
    }, [friendId])
  )

  const handlePixShare = async () => {
    if (!extra?.pixKey) return
    await Share.share({ message: extra.pixKey, title: `Chave PIX de ${firstName}` })
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
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: Spacing.xl }} />
        ) : (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

            {/* ── Perfil ── */}
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

            {/* ── Balanço ── */}
            {(() => {
              const net = theyOweMe - iOweThem
              const absStr = `R$ ${Math.abs(net).toFixed(2).replace('.', ',')}`
              const color = net > 0 ? Colors.status.credit : net < 0 ? Colors.status.debt : Colors.neutral.secondary
              const label = net > 0 ? `${firstName} te deve` : net < 0 ? 'Você deve' : 'Vocês estão quites'

              return (
                <View style={styles.balanceCard}>
                  {net !== 0 && (
                    <Text style={[styles.balanceAmount, { color }]}>
                      {absStr}
                    </Text>
                  )}
                  <Text variant="body" color={color} weight="600">
                    {label}
                  </Text>
                </View>
              )
            })()}

            {/* ── Ações de pagamento ── */}
            {(iOweThem > 0 || theyOweMe > 0) && (
              <View style={styles.actionRow}>
                {iOweThem > 0 && (
                  <TouchableOpacity
                    style={styles.payBtn}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('PaymentFlow', {
                      screen: 'PaymentSelector',
                      params: { friendId, friendName: name, avatarUrl: avatarUrl ?? null, direction: 'pay' },
                    })}
                  >
                    <PixIcon size={15} color={Colors.neutral.white} />
                    <Text variant="label" color={Colors.neutral.white} weight="700">
                      Pagar com PIX
                    </Text>
                  </TouchableOpacity>
                )}
                {theyOweMe > 0 && (
                  <TouchableOpacity
                    style={styles.chargeBtn}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('PaymentFlow', {
                      screen: 'PaymentSelector',
                      params: { friendId, friendName: name, avatarUrl: avatarUrl ?? null, direction: 'charge' },
                    })}
                  >
                    <PixIcon size={15} color={Colors.brand.primary} />
                    <Text variant="label" color={Colors.brand.primary} weight="700">
                      Cobrar
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* ── PIX ── */}
            {extra?.pixKey && (
              <TouchableOpacity style={styles.pixBtn} onPress={handlePixShare} activeOpacity={0.8}>
                <PixIcon size={18} color={Colors.brand.primary} />
                <View style={styles.pixInfo}>
                  <Text variant="label" color={Colors.neutral.primary} weight="600">
                    Chave PIX
                  </Text>
                  <Text variant="caption" color={Colors.neutral.secondary} numberOfLines={1}>
                    {extra.pixKey}
                  </Text>
                </View>
                <Text variant="caption" color={Colors.brand.primary} weight="600">
                  Compartilhar
                </Text>
              </TouchableOpacity>
            )}

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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },

  // Perfil
  profileSection: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
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
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  payBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.full,
    paddingVertical: 12,
  },
  chargeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.brand.primary,
    paddingVertical: 12,
  },

  // PIX
  pixBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.brand.xlight,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.brand.light,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  pixInfo: {
    flex: 1,
    gap: 2,
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

  // Grupos
  groupList: {
    gap: Spacing.sm,
  },
})
