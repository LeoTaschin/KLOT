import React, { useState } from 'react'
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
import { notifyUser } from '../../../lib/notifications'
import type { ChargeStackParamList } from '../../../navigation/types'

type Props = NativeStackScreenProps<ChargeStackParamList, 'ChargeNotificationConfirm'>

const AVATAR_SIZE = 80

function BackIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={Colors.neutral.primary} strokeWidth={2}
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

function AvatarCircle({ uri, name }: { uri: string | null; name: string }) {
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  if (uri) return <Image source={{ uri }} style={styles.avatar} />
  return (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarInitials}>{initials}</Text>
    </View>
  )
}

export function ChargeNotificationConfirmScreen({ navigation, route }: Props) {
  const { friendId, friendName, avatarUrl, amount } = route.params
  const firstName = friendName.split(' ')[0]

  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const fmtBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  async function handleSend() {
    setSending(true)
    await notifyUser(
      friendId,
      'Cobrança recebida 💸',
      amount > 0
        ? `Você tem uma dívida de ${fmtBRL(amount)} pendente.`
        : 'Você tem uma dívida pendente.',
      { type: 'charge' }
    )
    setSending(false)
    setSent(true)
    setTimeout(() => navigation.getParent()?.goBack(), 1400)
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
            Enviar notificação
          </Text>
          <View style={styles.iconBtn} />
        </View>

        {/* ── Conteúdo ── */}
        <View style={styles.content}>
          <AvatarCircle uri={avatarUrl} name={friendName} />

          <View style={styles.textBlock}>
            <Text variant="h2" color={Colors.neutral.primary} weight="800">
              {firstName}
            </Text>
            <Text variant="body" color={Colors.neutral.secondary} style={styles.subtitle}>
              vai receber uma notificação lembrando da dívida
            </Text>
          </View>

          {amount > 0 && (
            <View style={styles.amountPill}>
              <Text variant="label" color={Colors.status.credit} weight="700">
                {fmtBRL(amount)}
              </Text>
            </View>
          )}

          <Text variant="caption" color={Colors.neutral.placeholder} style={styles.hint}>
            A notificação será enviada imediatamente para o celular de {firstName}.
          </Text>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.sendBtn, sent && styles.sendBtnDone]}
            onPress={sent ? undefined : handleSend}
            activeOpacity={0.85}
            disabled={sending || sent}
          >
            {sending ? (
              <ActivityIndicator color={Colors.neutral.white} />
            ) : sent ? (
              <>
                <CheckIcon />
                <Text variant="label" color={Colors.neutral.white} weight="700">
                  Notificação enviada!
                </Text>
              </>
            ) : (
              <Text variant="label" color={Colors.neutral.white} weight="700">
                Enviar notificação
              </Text>
            )}
          </TouchableOpacity>
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
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
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
    fontSize: 28,
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  textBlock: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 240,
  },
  amountPill: {
    backgroundColor: Colors.status.creditBg,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.status.credit,
  },
  hint: {
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },

  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
  },
  sendBtn: {
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.full,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  sendBtnDone: {
    backgroundColor: Colors.status.credit,
  },
})
