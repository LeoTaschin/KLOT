import React, { useCallback, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'

import { BalanceCard, type BalanceData } from '../../components/BalanceCard'
import { ScreenTransition } from '../../components/ScreenTransition'
import { ExpensesShortcut, type ExpenseCategory, type ExpenseItem } from '../../components/ExpensesShortcut'
import { FriendShortcut, type FriendItem } from '../../components/FriendShortcut'
import { HomeShortcuts } from '../../components/HomeShortcuts'
import { Text } from '../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../constants/theme'
import { supabase } from '../../lib/supabase'
import type { TabScreenProps } from '../../navigation/types'

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Bom dia'
  if (hour >= 12 && hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function getDayContext(): string {
  const day = new Date().getDay()
  const map: Record<number, string> = {
    0: 'Aproveite o domingo ☀️',
    1: 'Vamos lá, é segunda-feira 💪',
    2: 'Terça-feira em dia',
    3: 'Quarta-feira, metade da semana',
    4: 'Quinta já chegou',
    5: 'Sexta-feira! 🎉',
    6: 'Bom sábado pra você',
  }
  return map[day] ?? ''
}

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
  const [firstName, setFirstName] = useState('')
  const [balance, setBalance] = useState<BalanceData>({ theyOweMe: 0, iOweThem: 0 })
  const [friends, setFriends] = useState<FriendItem[]>([])
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])

  useFocusEffect(useCallback(() => {
    async function loadAll() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Roda todas as queries em paralelo
      const [profileRes, iOweRes, theyOweRes, expensesRes, friendsReqRes, friendsAddRes] =
        await Promise.all([

          // Nome do usuário
          supabase.from('profiles').select('name').eq('id', user.id).single(),

          // O que eu devo: splits onde eu sou devedor e ainda não paguei
          supabase
            .from('expense_splits')
            .select('amount')
            .eq('user_id', user.id)
            .eq('paid', false),

          // O que me devem: splits de despesas que eu paguei, de outras pessoas
          supabase
            .from('expense_splits')
            .select('amount, expenses!inner(payer_id)')
            .eq('expenses.payer_id', user.id)
            .neq('user_id', user.id)
            .eq('paid', false),

          // Despesas recentes que eu cadastrei
          supabase
            .from('expenses')
            .select('id, title, category, amount, date, payer_id')
            .eq('payer_id', user.id)
            .order('date', { ascending: false })
            .limit(4),

          // Amigos onde sou o solicitante
          supabase
            .from('friendships')
            .select('id, profiles!addressee_id(id, name, avatar_url)')
            .eq('requester_id', user.id)
            .eq('status', 'accepted')
            .limit(3),

          // Amigos onde fui solicitado
          supabase
            .from('friendships')
            .select('id, profiles!requester_id(id, name, avatar_url)')
            .eq('addressee_id', user.id)
            .eq('status', 'accepted')
            .limit(3),
        ])

      // ── Nome ──
      if (profileRes.data?.name) {
        setFirstName(profileRes.data.name.split(' ')[0])
      }

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
        {/* ── Saudação ── */}
        <View style={styles.greeting}>
          <Text variant="h1" color={Colors.neutral.primary} weight="800">
            {getGreeting()}{firstName ? `, ${firstName}` : ''} 👋
          </Text>
          <Text variant="body" color={Colors.neutral.secondary} style={styles.greetingSub}>
            {getDayContext()}
          </Text>
        </View>

        {/* ── Balanço + Atalhos ── */}
        <View style={styles.balanceContainer}>
          <BalanceCard data={balance} />
          <HomeShortcuts />
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
  greeting: {
    gap: Spacing.xs,
  },
  greetingSub: {
    marginTop: 2,
  },
})
