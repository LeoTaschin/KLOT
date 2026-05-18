import React, { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import Svg, { Path } from 'react-native-svg'

import { ScreenTransition } from '../../../components/ScreenTransition'
import { PersonIcon, PixIcon, Text } from '../../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../../constants/theme'
import { supabase } from '../../../lib/supabase'
import type { PaymentStackParamList } from '../../../navigation/types'

type Props = NativeStackScreenProps<PaymentStackParamList, 'PaymentCheckout'>

// ─── PIX BR Code (BACEN EMV-QR / CRC16-CCITT) ────────────────────

function crc16(str: string): string {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

function tlv(id: string, value: string): string {
  return `${id}${value.length.toString().padStart(2, '0')}${value}`
}

function generatePixBRCode(key: string, name: string, amount: number): string {
  const merchantAccount = tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', key)
  const safeName = name.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 25).toUpperCase() || 'PAGAMENTO'

  const payload =
    tlv('00', '01') +
    tlv('01', '12') +
    tlv('26', merchantAccount) +
    tlv('52', '0000') +
    tlv('53', '986') +
    tlv('54', amount.toFixed(2)) +
    tlv('58', 'BR') +
    tlv('59', safeName) +
    tlv('60', 'SAO PAULO') +
    tlv('62', tlv('05', '***')) +
    '6304'

  return payload + crc16(payload)
}

// ─── Icons ───────────────────────────────────────────────────────

function BackIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={Colors.neutral.primary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

function CopyIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 4v12a2 2 0 002 2h8a2 2 0 002-2V7.242a2 2 0 00-.602-1.43L16.083 2.57A2 2 0 0014.685 2H10a2 2 0 00-2 2z"
        stroke={Colors.brand.primary}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M16 18v2a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h2"
        stroke={Colors.brand.primary}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  )
}

function CheckIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={Colors.neutral.white}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

// ─── Componente ──────────────────────────────────────────────────

const AVATAR_SIZE = 64

export function PaymentCheckoutScreen({ navigation, route }: Props) {
  const { friendId, friendName, avatarUrl, direction, amount, splitIds, pixKey } = route.params
  const firstName = friendName.split(' ')[0]
  const isPay = direction === 'pay'

  const amountStr = `R$ ${amount.toFixed(2).replace('.', ',')}`
  const brCode = pixKey ? generatePixBRCode(pixKey, isPay ? friendName : 'KLOT', amount) : null

  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const handleCopyKey = async () => {
    if (!pixKey) return
    await Share.share({ message: pixKey })
  }

  const handleShareBRCode = async () => {
    if (!brCode) return
    const msg = isPay
      ? `Pagamento PIX para ${firstName}: ${brCode}`
      : `Cobrança PIX de ${amountStr} — use o código Copia e Cola:\n\n${brCode}`
    await Share.share({ message: msg })
  }

  const handleConfirmPay = async () => {
    Alert.alert(
      'Confirmar pagamento',
      `Você pagou ${amountStr} para ${firstName} via PIX?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, paguei',
          onPress: async () => {
            setConfirming(true)
            try {
              await supabase
                .from('expense_splits')
                .update({ paid: true })
                .in('id', splitIds)
              setConfirmed(true)
              setTimeout(() => navigation.getParent()?.goBack(), 1200)
            } finally {
              setConfirming(false)
            }
          },
        },
      ]
    )
  }

  const handleShareCharge = async () => {
    const msg = `Oi ${firstName}! Você me deve ${amountStr}. Pode pagar via PIX${pixKey ? ` para a chave:\n${pixKey}` : '.'}`
    await Share.share({ message: msg })
  }

  const paySteps = [
    'Abra o app do seu banco',
    'Vá em Pix → Pagar',
    pixKey ? 'Cole a chave ou use o código Copia e Cola' : 'Peça a chave PIX para o contato',
    'Digite o valor e confirme',
  ]

  const chargeSteps = [
    `Compartilhe o código com ${firstName}`,
    `${firstName} abre o app do banco`,
    'Cola o código no campo Pix Copia e Cola',
    'Pagamento vai cair na sua conta',
  ]

  const steps = isPay ? paySteps : chargeSteps

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenTransition>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={12}>
            <BackIcon />
          </TouchableOpacity>
          <Text variant="label" color={Colors.neutral.primary} weight="700">
            {isPay ? 'Pagar via PIX' : 'Cobrar via PIX'}
          </Text>
          <View style={styles.iconBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Hero ── */}
          <View style={styles.heroCard}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <PersonIcon size={28} color={Colors.neutral.placeholder} />
              </View>
            )}
            <Text variant="body" color={Colors.neutral.secondary} weight="500">
              {isPay ? 'Pagando para' : 'Cobrando de'}
            </Text>
            <Text variant="h3" color={Colors.neutral.primary} weight="700">
              {friendName}
            </Text>
            <Text style={isPay ? styles.amountPay : styles.amountCharge}>
              {amountStr}
            </Text>
          </View>

          {/* ── Chave PIX ── */}
          {pixKey ? (
            <View style={styles.section}>
              <Text variant="caption" color={Colors.neutral.secondary} weight="600">
                {isPay ? 'CHAVE PIX DE ' + firstName.toUpperCase() : 'SUA CHAVE PIX'}
              </Text>
              <View style={styles.codeCard}>
                <PixIcon size={18} color={Colors.brand.primary} />
                <Text
                  variant="label"
                  color={Colors.neutral.primary}
                  weight="500"
                  style={styles.codeText}
                  numberOfLines={2}
                >
                  {pixKey}
                </Text>
                <TouchableOpacity onPress={handleCopyKey} style={styles.copyBtn} hitSlop={8}>
                  <CopyIcon />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.noPixCard}>
              <Text variant="body" color={Colors.neutral.secondary}>
                {isPay
                  ? `${firstName} não cadastrou uma chave PIX ainda.`
                  : 'Você não cadastrou uma chave PIX no seu perfil.'}
              </Text>
            </View>
          )}

          {/* ── BR Code ── */}
          {brCode && (
            <View style={styles.section}>
              <Text variant="caption" color={Colors.neutral.secondary} weight="600">
                CÓDIGO PIX (COPIA E COLA)
              </Text>
              <View style={styles.codeCard}>
                <Text
                  variant="caption"
                  color={Colors.neutral.secondary}
                  style={styles.codeText}
                  numberOfLines={3}
                >
                  {brCode}
                </Text>
                <TouchableOpacity onPress={handleShareBRCode} style={styles.copyBtn} hitSlop={8}>
                  <CopyIcon />
                </TouchableOpacity>
              </View>
              <Text variant="caption" color={Colors.neutral.placeholder} style={styles.hint}>
                {isPay
                  ? 'Cole no app do seu banco em "Pix Copia e Cola"'
                  : `Compartilhe com ${firstName} para ele colar no app do banco`}
              </Text>
            </View>
          )}

          {/* ── Passos ── */}
          <View style={styles.steps}>
            {steps.map((step, i) => (
              <View key={i} style={styles.step}>
                <View style={styles.stepNumber}>
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
          {isPay ? (
            <TouchableOpacity
              style={[styles.actionBtn, confirmed && styles.actionBtnDone]}
              onPress={confirmed ? undefined : handleConfirmPay}
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
          ) : (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleShareCharge}
              activeOpacity={0.85}
            >
              <Text variant="label" color={Colors.neutral.white} weight="700">
                Compartilhar cobrança
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },

  // Hero
  heroCard: {
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginBottom: Spacing.xs,
  },
  avatarFallback: {
    backgroundColor: Colors.neutral.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountPay: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 44,
    marginTop: Spacing.xs,
    color: Colors.status.debt,
  },
  amountCharge: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 44,
    marginTop: Spacing.xs,
    color: Colors.status.credit,
  },

  // Seções
  section: {
    gap: Spacing.sm,
  },
  codeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    ...Shadows.sm,
  },
  codeText: {
    flex: 1,
  },
  copyBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.brand.xlight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  hint: {
    paddingHorizontal: 2,
    lineHeight: 18,
  },
  noPixCard: {
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
  },

  // Passos
  steps: {
    gap: Spacing.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stepNumber: {
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
  actionBtn: {
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.full,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  actionBtnDone: {
    backgroundColor: Colors.status.credit,
  },
})
