import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import Svg, { Path } from 'react-native-svg'

import { ScreenTransition } from '../../../components/ScreenTransition'
import { Text } from '../../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../../constants/theme'
import { supabase } from '../../../lib/supabase'
import type { AppStackParamList } from '../../../navigation/types'

type Props = NativeStackScreenProps<AppStackParamList, 'Notifications'>

interface NotificationPrefs {
  friend_requests: boolean
  group_invites: boolean
  expense_added: boolean
  payments: boolean
  debt_reminders: boolean
}

const DEFAULT_PREFS: NotificationPrefs = {
  friend_requests: true,
  group_invites: true,
  expense_added: true,
  payments: true,
  debt_reminders: true,
}

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

interface ToggleRowProps {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
  isLast?: boolean
}

function ToggleRow({ label, description, value, onChange, isLast }: ToggleRowProps) {
  return (
    <>
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text variant="label" color={Colors.neutral.primary} weight="500">
            {label}
          </Text>
          <Text variant="caption" color={Colors.neutral.secondary}>
            {description}
          </Text>
        </View>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: Colors.neutral.border, true: Colors.brand.light }}
          thumbColor={value ? Colors.brand.primary : Colors.neutral.placeholder}
        />
      </View>
      {!isLast && <View style={styles.divider} />}
    </>
  )
}

export function NotificationsScreen({ navigation }: Props) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setPrefs({
          friend_requests: data.friend_requests ?? true,
          group_invites:   data.group_invites   ?? true,
          expense_added:   data.expense_added   ?? true,
          payments:        data.payments        ?? true,
          debt_reminders:  data.debt_reminders  ?? true,
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleToggle(key: keyof NotificationPrefs, value: boolean) {
    const updated = { ...prefs, [key]: value }
    setPrefs(updated)

    await supabase
      .from('notification_preferences')
      .upsert({ user_id: userId, ...updated })
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={Colors.brand.primary} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenTransition>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
            <BackIcon />
          </TouchableOpacity>
          <Text variant="h3" color={Colors.neutral.primary} weight="600">
            Notificações
          </Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Amigos ── */}
          <View style={styles.section}>
            <Text variant="caption" color={Colors.neutral.secondary} weight="600" style={styles.sectionTitle}>
              AMIGOS
            </Text>
            <View style={styles.card}>
              <ToggleRow
                label="Solicitações de amizade"
                description="Quando alguém te adicionar como amigo"
                value={prefs.friend_requests}
                onChange={(v) => handleToggle('friend_requests', v)}
                isLast
              />
            </View>
          </View>

          {/* ── Grupos ── */}
          <View style={styles.section}>
            <Text variant="caption" color={Colors.neutral.secondary} weight="600" style={styles.sectionTitle}>
              GRUPOS
            </Text>
            <View style={styles.card}>
              <ToggleRow
                label="Convites para grupos"
                description="Quando você for adicionado em um grupo"
                value={prefs.group_invites}
                onChange={(v) => handleToggle('group_invites', v)}
              />
              <ToggleRow
                label="Novas despesas"
                description="Quando uma despesa for registrada no grupo"
                value={prefs.expense_added}
                onChange={(v) => handleToggle('expense_added', v)}
                isLast
              />
            </View>
          </View>

          {/* ── Financeiro ── */}
          <View style={styles.section}>
            <Text variant="caption" color={Colors.neutral.secondary} weight="600" style={styles.sectionTitle}>
              FINANCEIRO
            </Text>
            <View style={styles.card}>
              <ToggleRow
                label="Pagamentos"
                description="Confirmações de pagamento recebido ou enviado"
                value={prefs.payments}
                onChange={(v) => handleToggle('payments', v)}
              />
              <ToggleRow
                label="Lembretes de dívida"
                description="Lembretes sobre dívidas pendentes"
                value={prefs.debt_reminders}
                onChange={(v) => handleToggle('debt_reminders', v)}
                isLast
              />
            </View>
          </View>
        </ScrollView>
      </ScreenTransition>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.neutral.surface,
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
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    paddingHorizontal: 4,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.neutral.border,
    marginLeft: Spacing.lg,
  },
})
