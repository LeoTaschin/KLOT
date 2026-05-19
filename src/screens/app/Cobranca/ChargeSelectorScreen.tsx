import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  StyleSheet,
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
import type { ChargeStackParamList } from '../../../navigation/types'

type Props = NativeStackScreenProps<ChargeStackParamList, 'ChargeSelectMode'>

const AVATAR_SIZE = 72

function CloseIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12"
        stroke={Colors.neutral.primary} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}

function ChevronIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18L15 12L9 6"
        stroke={Colors.neutral.secondary} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function QRIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z"
        stroke={Colors.brand.primary} strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 14h2v2h-2zM18 14h3v2h-3zM14 18h2v3h-2zM18 18h3v3h-3z"
        stroke={Colors.brand.primary} strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function BellIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={Colors.brand.primary} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke={Colors.brand.primary} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function AvatarCircle({ uri, name }: { uri: string | null; name: string }) {
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  if (uri) return <Image source={{ uri }} style={styles.avatar} />
  return (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarInitials}>{initials}</Text>
    </View>
  )
}

export function ChargeSelectorScreen({ navigation, route }: Props) {
  const { friendId, friendName, avatarUrl } = route.params
  const firstName = friendName.split(' ')[0]

  const [loading, setLoading] = useState(true)
  const [totalTheyOwe, setTotalTheyOwe] = useState(0)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('expense_splits')
        .select('amount, expenses!inner(payer_id, category)')
        .eq('user_id', friendId)
        .eq('paid', false)
        .eq('expenses.payer_id', user.id)
        .neq('expenses.category', 'pagamento')

      setTotalTheyOwe((data ?? []).reduce((s: number, r: any) => s + Number(r.amount), 0))
      setLoading(false)
    }
    load()
  }, [friendId])

  const fmtBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenTransition>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={12}>
            <CloseIcon />
          </TouchableOpacity>
          <Text variant="label" color={Colors.neutral.primary} weight="700">
            Cobrar {firstName}
          </Text>
          <View style={styles.iconBtn} />
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: Spacing.xl }} />
        ) : (
          <>
            {/* ── Centro: amigo + valor ── */}
            <View style={styles.centerSection}>
              <AvatarCircle uri={avatarUrl} name={friendName} />
              <View style={styles.nameAmount}>
                <Text variant="h2" color={Colors.neutral.primary} weight="800">
                  {firstName}
                </Text>
                <Text variant="body" color={Colors.neutral.secondary}>
                  {totalTheyOwe > 0 ? 'te deve' : 'sem dívidas pendentes'}
                </Text>
                <Text style={StyleSheet.flatten([
                  styles.amountText,
                  totalTheyOwe === 0 && styles.amountTextNeutral,
                ])}>
                  {fmtBRL(totalTheyOwe)}
                </Text>
              </View>
            </View>

            {/* ── Footer: opções ── */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => navigation.navigate('ChargeValueSelector', {
                  friendId,
                  friendName,
                  avatarUrl,
                })}
                activeOpacity={0.85}
              >
                <View style={styles.optionIconWrap}>
                  <QRIcon />
                </View>
                <View style={styles.optionText}>
                  <Text variant="label" color={Colors.neutral.primary} weight="700">
                    Gerar cobrança PIX
                  </Text>
                  <Text variant="caption" color={Colors.neutral.secondary}>
                    QR Code e código copia e cola
                  </Text>
                </View>
                <ChevronIcon />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => navigation.navigate('ChargeNotificationConfirm', {
                  friendId,
                  friendName,
                  avatarUrl,
                  amount: totalTheyOwe,
                })}
                activeOpacity={0.85}
              >
                <View style={styles.optionIconWrap}>
                  <BellIcon />
                </View>
                <View style={styles.optionText}>
                  <Text variant="label" color={Colors.neutral.primary} weight="700">
                    Enviar notificação
                  </Text>
                  <Text variant="caption" color={Colors.neutral.secondary}>
                    Notificar {firstName} sobre a dívida
                  </Text>
                </View>
                <ChevronIcon />
              </TouchableOpacity>
            </View>
          </>
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
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Centro
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.lg,
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
    backgroundColor: Colors.brand.xlight,
    borderWidth: 1,
    borderColor: Colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  nameAmount: {
    alignItems: 'center',
    gap: 4,
  },
  amountText: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1.5,
    color: Colors.status.credit,
    lineHeight: 58,
    marginTop: Spacing.xs,
  },
  amountTextNeutral: {
    color: Colors.neutral.secondary,
  },

  // Footer
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    ...Shadows.sm,
  },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    backgroundColor: Colors.brand.xlight,
    borderWidth: 1,
    borderColor: Colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
})
