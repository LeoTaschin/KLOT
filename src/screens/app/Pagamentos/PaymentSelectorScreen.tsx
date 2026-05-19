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
import type { PaymentStackParamList } from '../../../navigation/types'

type Props = NativeStackScreenProps<PaymentStackParamList, 'PaymentSelectMode'>

function CloseIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12"
        stroke={Colors.neutral.primary} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}

function AvatarCircle({ uri, name }: { uri: string | null; name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  if (uri) {
    return <Image source={{ uri }} style={styles.avatar} />
  }
  return (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarInitials}>{initials}</Text>
    </View>
  )
}

export function PaymentSelectModeScreen({ navigation, route }: Props) {
  const { friendId, friendName, avatarUrl } = route.params
  const firstName = friendName.split(' ')[0]

  const [loading, setLoading] = useState(true)
  const [totalAll, setTotalAll] = useState(0)
  const [allSplitIds, setAllSplitIds] = useState<string[]>([])
  const [pixKey, setPixKey] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [splitsRes, pixRes] = await Promise.all([
        supabase
          .from('expense_splits')
          .select('id, amount, expenses!inner(payer_id)')
          .eq('user_id', user.id)
          .eq('paid', false)
          .eq('expenses.payer_id', friendId),
        supabase.from('profiles').select('pix_key').eq('id', friendId).single(),
      ])

      const splits = splitsRes.data ?? []
      setTotalAll(splits.reduce((s: number, r: any) => s + Number(r.amount), 0))
      setAllSplitIds(splits.map((r: any) => r.id))
      setPixKey(pixRes.data?.pix_key ?? null)
      setLoading(false)
    }
    load()
  }, [friendId])

  const fmtBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const hasDebt = totalAll > 0

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenTransition>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={12}>
            <CloseIcon />
          </TouchableOpacity>
          <Text variant="label" color={Colors.neutral.primary} weight="700">
            Pagar {firstName}
          </Text>
          <View style={styles.iconBtn} />
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: Spacing.xl }} />
        ) : (
          <>
            {/* ── Centro: destinatário + valor ── */}
            <View style={styles.centerSection}>
              <AvatarCircle uri={avatarUrl} name={friendName} />
              <View style={styles.nameAmount}>
                <Text variant="h2" color={Colors.neutral.primary} weight="800">
                  {firstName}
                </Text>
                <Text variant="body" color={Colors.neutral.secondary}>
                  {hasDebt ? 'você deve' : 'sem dívidas pendentes'}
                </Text>
                <Text style={StyleSheet.flatten([styles.amountText, !hasDebt ? styles.amountTextNeutral : undefined])}>
                  {fmtBRL(totalAll)}
                </Text>
              </View>
            </View>

            {/* ── Footer: ações ── */}
            <View style={styles.footer}>
              {hasDebt && (
                <>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() =>
                      navigation.navigate('PaymentPix', {
                        friendId,
                        friendName,
                        avatarUrl: route.params.avatarUrl,
                        pixKey,
                        amount: totalAll,
                        splitIds: allSplitIds,
                      })
                    }
                    activeOpacity={0.85}
                  >
                    <Text variant="label" color={Colors.neutral.white} weight="700">
                      Pagar {fmtBRL(totalAll)}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.orRow}>
                    <View style={styles.orLine} />
                    <Text variant="caption" color={Colors.neutral.placeholder}>ou</Text>
                    <View style={styles.orLine} />
                  </View>
                </>
              )}

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() =>
                  navigation.navigate('PaymentValueSelector', {
                    friendId,
                    friendName,
                    avatarUrl: route.params.avatarUrl,
                    pixKey,
                  })
                }
                activeOpacity={0.85}
              >
                <Text variant="label" color={Colors.brand.primary} weight="700">
                  Escolher valor
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScreenTransition>
    </SafeAreaView>
  )
}

const AVATAR_SIZE = 72

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
    color: Colors.status.debt,
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
  primaryBtn: {
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.neutral.border,
  },
  secondaryBtn: {
    height: 56,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.brand.light,
    backgroundColor: Colors.brand.xlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
