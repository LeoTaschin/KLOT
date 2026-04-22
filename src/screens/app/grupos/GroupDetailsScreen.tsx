import React, { useCallback, useState } from 'react'
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { GroupDebtItem, type GroupExpense } from '../../../components/GroupDebtItem'
import { ScreenTransition } from '../../../components/ScreenTransition'
import {
  CasaIcon,
  ContasIcon,
  FestaIcon,
  GruposIcon,
  PersonIcon,
  Text,
  TrabalhoIcon,
  ViagemIcon,
} from '../../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../../constants/theme'
import { supabase } from '../../../lib/supabase'
import type { AppStackParamList } from '../../../navigation/types'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

type Props = NativeStackScreenProps<AppStackParamList, 'GroupDetails'>

interface Member {
  id: string
  name: string
  username: string
  avatar_url: string | null
  isAdmin: boolean
}


const AVATAR_SIZE = 44

const CATEGORY_CONFIG: Record<string, { label: string; Icon: React.FC<{ size?: number; color?: string }> }> = {
  casa:     { label: 'Casa',     Icon: CasaIcon     },
  trabalho: { label: 'Trabalho', Icon: TrabalhoIcon },
  viagem:   { label: 'Viagem',   Icon: ViagemIcon   },
  festa:    { label: 'Festa',    Icon: FestaIcon    },
  amigos:   { label: 'Amigos',   Icon: GruposIcon   },
  outro:    { label: 'Outro',    Icon: ContasIcon   },
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function GroupDetailsScreen({ navigation, route }: Props) {
  const { id, name, category, avatarUrl } = route.params
  const config = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.outro
  const { Icon, label } = config

  const [members, setMembers] = useState<Member[]>([])
  const [expenses, setExpenses] = useState<GroupExpense[]>([])
  const [myBalance, setMyBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      async function fetchData() {
        setLoading(true)
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          // Busca criador + membros
          const [groupRes, membersRes] = await Promise.all([
            supabase.from('groups').select('created_by').eq('id', id).single(),
            supabase
              .from('group_members')
              .select('user_id, profiles(id, name, username, avatar_url)')
              .eq('group_id', id),
          ])

          const createdBy: string = groupRes.data?.created_by ?? ''

          const parsedMembers: Member[] = (membersRes.data ?? [])
            .map((r: any) => ({
              id: r.profiles?.id,
              name: r.profiles?.name,
              username: r.profiles?.username,
              avatar_url: r.profiles?.avatar_url,
              isAdmin: r.user_id === createdBy,
            }))
            .filter((m: Member) => m.id)
            .sort((a: Member, b: Member) => Number(b.isAdmin) - Number(a.isAdmin))

          setMembers(parsedMembers)

          // Busca despesas do grupo com contagem de splits
          const { data: expensesData } = await supabase
            .from('expenses')
            .select('id, title, category, amount, created_at, profiles!payer_id(name), expense_splits!expense_id(id)')
            .eq('group_id', id)
            .order('created_at', { ascending: false })
            .limit(5)

          setExpenses(
            (expensesData ?? []).map((e: any) => ({
              id: e.id,
              title: e.title,
              category: e.category ?? 'outro',
              amount: Number(e.amount),
              payer_name: e.profiles?.name ?? '',
              split_count: Array.isArray(e.expense_splits) ? e.expense_splits.length : 0,
            }))
          )

          // Calcula saldo do usuário no grupo
          const memberIds = parsedMembers.map((m) => m.id).filter((mid) => mid !== user.id)

          if (memberIds.length > 0) {
            const [theyOweRes, iOweRes] = await Promise.all([
              supabase
                .from('expense_splits')
                .select('amount, expenses!inner(payer_id, group_id)')
                .in('user_id', memberIds)
                .eq('paid', false)
                .eq('expenses.payer_id', user.id)
                .eq('expenses.group_id', id),
              supabase
                .from('expense_splits')
                .select('amount, expenses!inner(payer_id, group_id)')
                .eq('user_id', user.id)
                .eq('paid', false)
                .eq('expenses.group_id', id)
                .neq('expenses.payer_id', user.id),
            ])

            const credit = (theyOweRes.data ?? []).reduce((s: number, r: any) => s + Number(r.amount), 0)
            const debt = (iOweRes.data ?? []).reduce((s: number, r: any) => s + Number(r.amount), 0)
            setMyBalance(credit - debt)
          }
        } finally {
          setLoading(false)
        }
      }
      fetchData()
    }, [id])
  )

  const balanceIsPositive = myBalance > 0
  const balanceIsZero = myBalance === 0
  const balanceColor = balanceIsZero
    ? Colors.status.settled
    : balanceIsPositive
    ? Colors.status.credit
    : Colors.status.debt
  const balanceLabel = balanceIsZero
    ? 'Tudo quitado'
    : balanceIsPositive
    ? 'Te devem'
    : 'Você deve'

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenTransition>
        <View style={styles.flex}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Header ── */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
                <Text variant="body" color={Colors.brand.primary}>← Voltar</Text>
              </TouchableOpacity>
            </View>

            {/* ── Hero ── */}
            <View style={styles.hero}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.heroAvatar} />
              ) : (
                <View style={styles.heroIcon}>
                  <Icon size={38} color={Colors.brand.primary} />
                </View>
              )}
              <Text variant="h2" color={Colors.neutral.primary} weight="700" style={styles.heroName}>
                {name}
              </Text>
              <View style={styles.categoryBadge}>
                <Text variant="caption" color={Colors.brand.primary} weight="600">
                  {label}
                </Text>
              </View>
            </View>

            {/* ── Resumo financeiro ── */}
            <View style={styles.balanceCard}>
              <View style={styles.balanceLeft}>
                <Text variant="caption" color={Colors.neutral.secondary} weight="500">
                  {balanceLabel}
                </Text>
                <Text variant="h2" color={balanceColor} weight="700">
                  R$ {Math.abs(myBalance).toFixed(2).replace('.', ',')}
                </Text>
              </View>
              <View style={[styles.balanceDot, { backgroundColor: balanceColor }]} />
            </View>

            {/* ── Membros ── */}
            <View style={styles.section}>
              <Text variant="label" color={Colors.neutral.secondary} weight="600" style={styles.sectionLabel}>
                Membros ({members.length})
              </Text>
              {loading ? (
                <Text variant="body" color={Colors.neutral.placeholder}>Carregando...</Text>
              ) : (
                <View style={styles.memberList}>
                  {members.map((m) => (
                    <View key={m.id} style={[styles.memberRow, m.isAdmin && styles.memberRowAdmin]}>
                      {m.avatar_url ? (
                        <Image source={{ uri: m.avatar_url }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatarFallback, m.isAdmin && styles.avatarFallbackAdmin]}>
                          <PersonIcon size={18} color={m.isAdmin ? Colors.brand.primary : Colors.neutral.placeholder} />
                        </View>
                      )}
                      <View style={styles.memberInfo}>
                        <Text variant="label" color={Colors.neutral.primary} weight="600">
                          {m.name}
                        </Text>
                        <Text variant="caption" color={Colors.neutral.secondary}>
                          @{m.username}
                        </Text>
                      </View>
                      {m.isAdmin && (
                        <View style={styles.adminBadge}>
                          <Text variant="caption" color={Colors.brand.primary} weight="700">
                            ADM
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* ── Despesas recentes ── */}
            <View style={styles.section}>
              <Text variant="label" color={Colors.neutral.secondary} weight="600" style={styles.sectionLabel}>
                Despesas recentes
              </Text>
              {loading ? (
                <Text variant="body" color={Colors.neutral.placeholder}>Carregando...</Text>
              ) : expenses.length === 0 ? (
                <View style={styles.emptyExpenses}>
                  <Text variant="body" color={Colors.neutral.placeholder}>
                    Nenhuma despesa ainda
                  </Text>
                </View>
              ) : (
                <View style={styles.expenseList}>
                  {expenses.map((e) => (
                    <GroupDebtItem key={e.id} expense={e} />
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* ── Rodapé fixo ── */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.newExpenseBtn}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('DebtFlow')
              }
            >
              <Text variant="label" color={Colors.neutral.white} weight="700">
                + Nova despesa
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenTransition>
    </SafeAreaView>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xs,
  },
  backBtn: {
    alignSelf: 'flex-start',
  },

  // Hero
  hero: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  heroAvatar: {
    width: 88,
    height: 88,
    borderRadius: Radius.xl,
  },
  heroIcon: {
    width: 88,
    height: 88,
    borderRadius: Radius.xl,
    backgroundColor: Colors.brand.xlight,
    borderWidth: 1.5,
    borderColor: Colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
    shadowColor: Colors.brand.primary,
    shadowOpacity: 0.12,
  },
  heroName: {
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.xlight,
    borderWidth: 1,
    borderColor: Colors.brand.light,
  },

  // Balanço
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
  balanceLeft: {
    gap: 4,
  },
  balanceDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    opacity: 0.8,
  },

  // Seções
  section: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    marginLeft: 2,
  },

  // Membros
  memberList: {
    gap: Spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.neutral.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    ...Shadows.sm,
  },
  memberRowAdmin: {
    backgroundColor: Colors.brand.xlight,
    borderColor: Colors.brand.light,
    borderWidth: 1,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
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
  },
  avatarFallbackAdmin: {
    backgroundColor: Colors.neutral.white,
    borderColor: Colors.brand.light,
  },
  memberInfo: {
    flex: 1,
    gap: 2,
  },
  adminBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.brand.light,
  },

  // Despesas
  expenseList: {
    gap: Spacing.sm,
  },
  emptyExpenses: {
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },

  // Rodapé
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
  },
  newExpenseBtn: {
    height: 54,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
    shadowColor: Colors.brand.primary,
    shadowOpacity: 0.3,
  },
})

