import React, { useCallback, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'

import { BalanceCard, type BalanceData } from '../../components/BalanceCard'
import { ScreenTransition } from '../../components/ScreenTransition'
import { ExpensesShortcut, type ExpenseCategory, type ExpenseItem } from '../../components/ExpensesShortcut'
import { FriendShortcut, type FriendItem } from '../../components/FriendShortcut'
import { KlotLogo } from '../../components/KlotLogo'
import { Colors, Radius, Shadows, Spacing } from '../../constants/theme'
import { supabase } from '../../lib/supabase'
import type { TabScreenProps } from '../../navigation/types'

function formatExpenseDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (date.toDateString() === now.toDateString()) return `Hoje ${time}`
  if (date.toDateString() === yesterday.toDateString()) return `Ontem ${time}`
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) + ' ' + time
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
  const [balance, setBalance] = useState<BalanceData>({ theyOweMe: 0, iOweThem: 0 })
  const [friends, setFriends] = useState<FriendItem[]>([])
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])

  useFocusEffect(useCallback(() => {
    async function loadAll() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [iOweRes, theyOweRes, expensesRes, friendsReqRes, friendsAddRes] =
        await Promise.all([

          supabase
            .from('expense_splits')
            .select('amount')
            .eq('user_id', user.id)
            .eq('paid', false),

          supabase
            .from('expense_splits')
            .select('amount, expenses!inner(payer_id)')
            .eq('expenses.payer_id', user.id)
            .neq('user_id', user.id)
            .eq('paid', false),

          supabase
            .from('expenses')
            .select('id, title, category, amount, date, payer_id')
            .eq('payer_id', user.id)
            .order('date', { ascending: false })
            .limit(4),

          supabase
            .from('friendships')
            .select('id, profiles!addressee_id(id, name, avatar_url)')
            .eq('requester_id', user.id)
            .eq('status', 'accepted')
            .limit(3),

          supabase
            .from('friendships')
            .select('id, profiles!requester_id(id, name, avatar_url)')
            .eq('addressee_id', user.id)
            .eq('status', 'accepted')
            .limit(3),
        ])

      // ── Balanço ──
      const iOweThem = (iOweRes.data ?? []).reduce((sum, r) => sum + Number(r.amount), 0)
      const theyOweMe = (theyOweRes.data ?? []).reduce((sum, r) => sum + Number(r.amount), 0)
      setBalance({ theyOweMe, iOweThem })

      // ── Despesas ──
      const mappedExpenses: ExpenseItem[] = (expensesRes.data ?? []).map((e) => ({
        id: e.id,
        title: e.title,
        category: e.category as ExpenseCategory,
        amount: Number(e.amount),
        date: formatExpenseDate(e.date),
        isCredit: false,
      }))
      setExpenses(mappedExpenses)

      // ── Amigos ──
      const seen = new Set<string>()
      const allFriends: FriendItem[] = []
      for (const f of [
        ...(friendsReqRes.data ?? []).map((f: any) => ({ profileId: f.profiles?.id, name: f.profiles?.name, avatarUrl: f.profiles?.avatar_url })),
        ...(friendsAddRes.data ?? []).map((f: any) => ({ profileId: f.profiles?.id, name: f.profiles?.name, avatarUrl: f.profiles?.avatar_url })),
      ]) {
        if (!f.profileId || seen.has(f.profileId)) continue
        seen.add(f.profileId)
        allFriends.push({
          id: f.profileId,
          name: f.name ?? 'Amigo',
          avatarUrl: f.avatarUrl ?? null,
          statusParts: [{ text: 'Amigo' }],
        })
        if (allFriends.length === 3) break
      }
      setFriends(allFriends)
    }

    loadAll()
  }, []))

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenTransition>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Logo ── */}
        <View style={styles.logoRow}>
          <KlotLogo size={36} />
        </View>

        {/* ── Balanço + Atalhos ── */}
        <View style={styles.balanceContainer}>
          <BalanceCard data={balance} />
          {/* <HomeShortcuts /> */}
        </View>

        {/* ── Amigos ── */}
        <FriendShortcut
          friends={friends}
          onViewAll={() => navigation.navigate('Grupos')}
          onPressFriend={(item) =>
            navigation.navigate('FriendProfile', {
              id: item.id,
              name: item.name,
              avatarUrl: item.avatarUrl ?? null,
            })
          }
        />

        {/* ── Despesas recentes ── */}
        <ExpensesShortcut
          expenses={expenses}
          onViewAll={() => navigation.navigate('Contas')}
        />


      </ScrollView>
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
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 100,
    gap: Spacing.lg,
  },
  balanceContainer: {
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  logoRow: {
    alignItems: 'center',
  },
})
