import React, { useCallback, useState } from 'react'
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import Svg, { Path } from 'react-native-svg'

import { GroupAddMember } from '../../../components/Alerts/GroupAddMember'
import { GroupRemoveMember } from '../../../components/Alerts/GroupRemoveMember'
import { GroupDebtItem, type GroupExpense } from '../../../components/GroupDebtItem'
import { GroupMemberItem, type GroupMemberData } from '../../../components/GroupMemberItem'
import { ScreenTransition } from '../../../components/ScreenTransition'
import {
  CasaIcon,
  ContasIcon,
  FestaIcon,
  GruposIcon,
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

type Tab = 'membros' | 'despesas'

const CATEGORY_CONFIG: Record<string, { label: string; Icon: React.FC<{ size?: number; color?: string }> }> = {
  casa:     { label: 'Casa',     Icon: CasaIcon     },
  trabalho: { label: 'Trabalho', Icon: TrabalhoIcon },
  viagem:   { label: 'Viagem',   Icon: ViagemIcon   },
  festa:    { label: 'Festa',    Icon: FestaIcon    },
  amigos:   { label: 'Amigos',   Icon: GruposIcon   },
  outro:    { label: 'Outro',    Icon: ContasIcon   },
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

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

function groupExpensesByPeriod(items: GroupExpense[]) {
  const map = new Map<string, GroupExpense[]>()
  for (const item of items) {
    const key = getPeriodKey(item.date)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }))
}

// ═══════════════════════════════════════════════════════════════════
// ÍCONES
// ═══════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function GroupDetailsScreen({ navigation, route }: Props) {
  const { id, name, category, avatarUrl } = route.params
  const config = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.outro
  const { Icon, label } = config

  const [members, setMembers] = useState<GroupMemberData[]>([])
  const [expenses, setExpenses] = useState<GroupExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('membros')
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')
  const [memberToRemove, setMemberToRemove] = useState<GroupMemberData | null>(null)
  const [addMemberVisible, setAddMemberVisible] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useFocusEffect(
    useCallback(() => {
      async function fetchData() {
        setLoading(true)
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return
          setCurrentUserId(user.id)

          const [groupRes, membersRes, expensesRes] = await Promise.all([
            supabase.from('groups').select('created_by').eq('id', id).single(),

            supabase
              .from('group_members')
              .select('user_id, profiles(id, name, username, avatar_url)')
              .eq('group_id', id),

            supabase
              .from('expenses')
              .select('id, title, category, amount, date, payer_id, profiles!payer_id(name), expense_splits!expense_id(user_id)')
              .eq('group_id', id)
              .order('date', { ascending: false }),
          ])

          const createdBy: string = groupRes.data?.created_by ?? ''

          setIsCurrentUserAdmin(user.id === createdBy)

          setMembers(
            (membersRes.data ?? [])
              .map((r: any): GroupMemberData => ({
                id: r.profiles?.id,
                name: r.profiles?.name,
                username: r.profiles?.username,
                avatar_url: r.profiles?.avatar_url,
                isAdmin: r.user_id === createdBy,
              }))
              .filter((m: GroupMemberData) => m.id)
              .sort((a: GroupMemberData, b: GroupMemberData) => Number(b.isAdmin) - Number(a.isAdmin))
          )

          setExpenses(
            (expensesRes.data ?? []).map((e: any): GroupExpense => {
              const splits: string[] = Array.isArray(e.expense_splits)
                ? e.expense_splits.map((s: any) => s.user_id)
                : []
              const direction =
                e.payer_id === user.id ? 'credit'
                : splits.includes(user.id) ? 'debt'
                : 'neutral'
              return {
                id: e.id,
                title: e.title,
                category: e.category ?? 'outro',
                amount: Number(e.amount),
                date: e.date,
                payer_name: e.profiles?.name ?? '',
                split_count: splits.length,
                direction,
              }
            })
          )
        } finally {
          setLoading(false)
        }
      }
      fetchData()
    }, [id, refreshKey])
  )

  function handleAddMember() {
    setAddMemberVisible(true)
  }

  function handleRemoveMember(member: GroupMemberData) {
    setMemberToRemove(member)
  }

  async function handleConfirmRemove(member: GroupMemberData) {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', id)
      .eq('user_id', member.id)

    if (error) {
      console.error('Erro ao remover membro:', error.message)
      return
    }

    setMembers((prev) => prev.filter((m) => m.id !== member.id))
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenTransition>
        <View style={styles.flex}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
              <BackIcon />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

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

            {/* ── Seletor de tab ── */}
            <View style={styles.chips}>
              <TouchableOpacity
                style={[styles.chip, activeTab === 'membros' && styles.chipActive]}
                onPress={() => setActiveTab('membros')}
                activeOpacity={0.7}
              >
                <Text
                  variant="caption"
                  color={activeTab === 'membros' ? Colors.brand.primary : Colors.neutral.secondary}
                  weight={activeTab === 'membros' ? '600' : '400'}
                >
                  Membros{members.length > 0 ? ` (${members.length})` : ''}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.chip, activeTab === 'despesas' && styles.chipActive]}
                onPress={() => setActiveTab('despesas')}
                activeOpacity={0.7}
              >
                <Text
                  variant="caption"
                  color={activeTab === 'despesas' ? Colors.brand.primary : Colors.neutral.secondary}
                  weight={activeTab === 'despesas' ? '600' : '400'}
                >
                  Despesas{expenses.length > 0 ? ` (${expenses.length})` : ''}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Conteúdo ── */}
            {loading ? (
              <View style={styles.empty}>
                <Text variant="body" color={Colors.neutral.placeholder}>Carregando...</Text>
              </View>
            ) : activeTab === 'membros' ? (
              members.length === 0 ? (
                <View style={styles.empty}>
                  <Text variant="body" color={Colors.neutral.placeholder}>Nenhum membro</Text>
                </View>
              ) : (
                <View style={styles.memberList}>
                  {isCurrentUserAdmin && (
                    <TouchableOpacity style={styles.addMemberBtn} onPress={handleAddMember} activeOpacity={0.7}>
                      <View style={styles.addMemberIcon}>
                        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                          <Path d="M12 5v14M5 12h14" stroke={Colors.brand.primary} strokeWidth={2.5} strokeLinecap="round" />
                        </Svg>
                      </View>
                      <Text variant="caption" color={Colors.brand.primary} weight="600">
                        Adicionar membro
                      </Text>
                    </TouchableOpacity>
                  )}
                  {members.map((m) => (
                    <GroupMemberItem
                      key={m.id}
                      member={m}
                      onRemove={isCurrentUserAdmin && !m.isAdmin ? handleRemoveMember : undefined}
                    />
                  ))}
                </View>
              )
            ) : (
              expenses.length === 0 ? (
                <View style={styles.empty}>
                  <Text variant="body" color={Colors.neutral.placeholder}>Nenhuma despesa ainda</Text>
                </View>
              ) : (
                <View style={styles.expenseList}>
                  {groupExpensesByPeriod(expenses).map(({ title, data }) => (
                    <View key={title}>
                      <View style={styles.periodHeader}>
                        <Text variant="caption" color={Colors.neutral.secondary} weight="600">
                          {title.toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.sectionCard}>
                        {data.map((e, i) => (
                          <React.Fragment key={e.id}>
                            {i > 0 && <View style={styles.divider} />}
                            <GroupDebtItem expense={e} />
                          </React.Fragment>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              )
            )}

          </ScrollView>
        </View>
      </ScreenTransition>

      <GroupRemoveMember
        member={memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleConfirmRemove}
      />

      <GroupAddMember
        visible={addMemberVisible}
        groupId={id}
        groupName={name}
        existingMemberIds={members.map((m) => m.id)}
        currentUserId={currentUserId}
        onClose={() => setAddMemberVisible(false)}
        onMembersAdded={() => setRefreshKey((k) => k + 1)}
      />
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

  // Chips
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

  // Estado vazio
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },

  // Membros
  memberList: {
    gap: Spacing.sm,
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.brand.light,
    backgroundColor: Colors.brand.xlight,
  },
  addMemberIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Despesas
  expenseList: {
    gap: Spacing.md,
  },
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
    marginLeft: 72,
  },
})
