import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import Svg, { Path } from 'react-native-svg'

import { PaymentPixConfirm } from '../../../components/Alerts/PaymentPixConfirm'
import { ScreenTransition } from '../../../components/ScreenTransition'
import { Text } from '../../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../../constants/theme'
import { supabase } from '../../../lib/supabase'
import { generatePixPayload } from '../../../utils/pixPayload'
import type { PaymentStackParamList } from '../../../navigation/types'

type Props = NativeStackScreenProps<PaymentStackParamList, 'PaymentPix'>

// ─── Icons ───────────────────────────────────────────────────────

function BackIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={Colors.neutral.primary} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function CopyIcon({ done }: { done: boolean }) {
  if (done) {
    return (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M20 6L9 17l-5-5"
          stroke={Colors.status.credit} strokeWidth={2.5}
          strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    )
  }
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"
        stroke={Colors.brand.primary} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 10h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z"
        stroke={Colors.brand.primary} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function CheckIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5"
        stroke={Colors.neutral.white} strokeWidth={2.5}
        strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

// ─── Componente ──────────────────────────────────────────────────

const STEPS = [
  'Abra o app do seu banco',
  'Vá em Pix → Pagar com Copia e Cola',
  'Cole o código e confirme o valor',
  'Pagamento enviado!',
]

export function PaymentPixScreen({ navigation, route }: Props) {
  const { friendId, friendName, avatarUrl: friendAvatarUrl, pixKey, amount } = route.params
  const firstName = friendName.split(' ')[0]

  const brCode = pixKey
    ? generatePixPayload({ pixKey, merchantName: friendName, amount })
    : null

  const [copied, setCopied] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('avatar_url').eq('id', user.id).single()
        .then(({ data }) => setUserAvatarUrl(data?.avatar_url ?? null))
    })
  }, [])

  async function handleCopy() {
    if (!brCode) return
    await Share.share({ message: brCode })
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  async function handleConfirmed() {
    setConfirming(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Cria um expense de pagamento onde eu sou o pagador e o amigo tem um split (paid=false)
      // Isso adiciona ao theyOweMe, que cancela o iOweThem, zerando o saldo
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          title: `Pagamento para ${firstName}`,
          category: 'pagamento',
          amount,
          payer_id: user.id,
          date: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (expenseError) {
        console.error('[payment] erro ao criar registro:', expenseError)
        return
      }

      if (expense) {
        const { error: splitError } = await supabase
          .from('expense_splits')
          .insert({ expense_id: expense.id, user_id: friendId, amount, paid: false })
        if (splitError) console.error('[payment] erro ao criar split:', splitError)
      }

      setConfirmed(true)
      setTimeout(() => navigation.getParent()?.goBack(), 1400)
    } finally {
      setConfirming(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenTransition>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={12}>
            <BackIcon />
          </TouchableOpacity>
          <Text variant="label" color={Colors.neutral.primary} weight="700">
            Pagar via PIX
          </Text>
          <View style={styles.iconBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Valor ── */}
          <View style={styles.amountCard}>
            <Text variant="caption" color={Colors.neutral.secondary} weight="600">
              PAGANDO PARA {firstName.toUpperCase()}
            </Text>
            <Text style={styles.amountText}>
              {amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </Text>
          </View>

          {/* ── Copia e Cola ── */}
          {brCode ? (
            <View style={styles.section}>
              <Text variant="caption" color={Colors.neutral.secondary} weight="600">
                PIX COPIA E COLA
              </Text>
              <View style={styles.codeCard}>
                <Text
                  variant="caption"
                  color={Colors.neutral.secondary}
                  style={styles.codeText}
                  numberOfLines={4}
                  selectable
                >
                  {brCode}
                </Text>
                <TouchableOpacity
                  style={[styles.copyBtn, copied && styles.copyBtnDone]}
                  onPress={handleCopy}
                  hitSlop={8}
                  activeOpacity={0.7}
                >
                  <CopyIcon done={copied} />
                  <Text
                    variant="caption"
                    color={copied ? Colors.status.credit : Colors.brand.primary}
                    weight="600"
                  >
                    {copied ? 'Copiado!' : 'Copiar'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text variant="caption" color={Colors.neutral.placeholder} style={styles.hint}>
                Cole este código no app do seu banco em "Pix Copia e Cola"
              </Text>
            </View>
          ) : (
            <View style={styles.noPixCard}>
              <Text variant="body" color={Colors.neutral.secondary} style={{ textAlign: 'center' }}>
                {firstName} ainda não cadastrou uma chave PIX no KLOT.{'\n'}
                Combine outro meio de pagamento.
              </Text>
            </View>
          )}

          {/* ── Passos ── */}
          <View style={styles.steps}>
            {STEPS.map((step, i) => (
              <View key={i} style={styles.step}>
                <View style={styles.stepBadge}>
                  <Text variant="caption" color={Colors.brand.primary} weight="700">
                    {i + 1}
                  </Text>
                </View>
                <Text variant="label" color={Colors.neutral.primary} weight="400">
                  {step}
                </Text>
              </View>
            ))}
          </View>

        </ScrollView>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.confirmBtn, confirmed && styles.confirmBtnDone]}
            onPress={confirmed ? undefined : () => setShowConfirm(true)}
            activeOpacity={0.85}
            disabled={confirming || confirmed}
          >
            {confirming ? (
              <ActivityIndicator color={Colors.neutral.white} />
            ) : confirmed ? (
              <>
                <CheckIcon />
                <Text variant="label" color={Colors.neutral.white} weight="700">
                  Pagamento confirmado!
                </Text>
              </>
            ) : (
              <Text variant="label" color={Colors.neutral.white} weight="700">
                Já paguei — confirmar
              </Text>
            )}
          </TouchableOpacity>
        </View>

      </ScreenTransition>

      <PaymentPixConfirm
        visible={showConfirm}
        friendName={friendName}
        userAvatarUrl={userAvatarUrl}
        friendAvatarUrl={friendAvatarUrl}
        onConfirm={handleConfirmed}
        onClose={() => setShowConfirm(false)}
      />
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
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },

  // Valor
  amountCard: {
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  amountText: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
    color: Colors.status.debt,
    lineHeight: 48,
  },

  // Copia e cola
  section: {
    gap: Spacing.sm,
  },
  codeCard: {
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  codeText: {
    lineHeight: 20,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.brand.light,
    backgroundColor: Colors.brand.xlight,
  },
  copyBtnDone: {
    borderColor: Colors.status.credit,
    backgroundColor: Colors.status.creditBg,
  },
  hint: {
    lineHeight: 18,
  },
  noPixCard: {
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },

  // Passos
  steps: {
    gap: Spacing.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.brand.xlight,
    borderWidth: 1,
    borderColor: Colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // Footer
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
  },
  confirmBtn: {
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.full,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  confirmBtnDone: {
    backgroundColor: Colors.status.credit,
  },
})
