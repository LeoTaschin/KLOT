import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Clipboard,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import Svg, { Path } from 'react-native-svg'
import QRCode from 'react-native-qrcode-svg'

import { ScreenTransition } from '../../../components/ScreenTransition'
import { Text } from '../../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../../constants/theme'
import { supabase } from '../../../lib/supabase'
import { generatePixPayload } from '../../../utils/pixPayload'
import type { ChargeStackParamList } from '../../../navigation/types'

type Props = NativeStackScreenProps<ChargeStackParamList, 'ChargeQRCode'>

const QR_SIZE = 220

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

export function ChargeQRCodeScreen({ navigation, route }: Props) {
  const { friendId, friendName, amount, splitIds } = route.params
  const firstName = friendName.split(' ')[0]

  const [pixKey, setPixKey] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('name, pix_key')
        .eq('id', user.id)
        .single()
      setPixKey(data?.pix_key ?? null)
      setUserName(data?.name ?? '')
      setLoading(false)
    }
    load()
  }, [])

  function handleCopy() {
    if (!pixPayload) return
    Clipboard.setString(pixPayload)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  async function handleConfirmReceived() {
    setConfirming(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setConfirming(false); return }

    const { data: expense } = await supabase
      .from('expenses')
      .insert({
        payer_id: friendId,
        title: `Pagamento de ${firstName}`,
        category: 'pagamento',
        amount,
        date: new Date().toISOString().split('T')[0],
        group_id: null,
      })
      .select('id')
      .single()

    if (expense) {
      await supabase.from('expense_splits').insert({
        expense_id: expense.id,
        user_id: user.id,
        amount,
        paid: false,
      })
    }

    setConfirming(false)
    setConfirmed(true)
    setTimeout(() => navigation.getParent()?.goBack(), 1400)
  }

  const pixPayload = pixKey
    ? generatePixPayload({ pixKey, merchantName: userName, amount })
    : null

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: Spacing.xl }} />
      </SafeAreaView>
    )
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
            Cobrança PIX
          </Text>
          <View style={styles.iconBtn} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Valor ── */}
          <View style={styles.amountCard}>
            <Text variant="caption" color={Colors.neutral.secondary} weight="600">
              COBRANDO DE {firstName.toUpperCase()}
            </Text>
            <Text style={styles.amountText}>
              {amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </Text>
          </View>

          {/* ── Sem chave PIX ── */}
          {!pixKey ? (
            <View style={styles.noPixCard}>
              <Text variant="body" color={Colors.neutral.secondary} style={{ textAlign: 'center' }}>
                Você ainda não tem uma chave PIX cadastrada.{'\n'}
                Cadastre uma para gerar cobranças.
              </Text>
              <TouchableOpacity
                style={styles.addKeyBtn}
                onPress={() => navigation.getParent()?.navigate('PixSettings')}
                activeOpacity={0.85}
              >
                <Text variant="label" color={Colors.neutral.white} weight="700">
                  Cadastrar chave PIX
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* ── QR Code ── */}
              <View style={styles.qrCard}>
                <QRCode
                  value={pixPayload!}
                  size={QR_SIZE}
                  color={Colors.neutral.primary}
                  backgroundColor={Colors.neutral.white}
                />
                <Text variant="caption" color={Colors.neutral.placeholder} style={styles.qrHint}>
                  Mostre este QR Code para {firstName} escanear
                </Text>
              </View>

              {/* ── Copia e cola ── */}
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
                    {pixPayload}
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
              </View>

              {/* ── Chave PIX ── */}
              <View style={styles.keyCard}>
                <View style={styles.keyInfo}>
                  <Text variant="caption" color={Colors.neutral.secondary} weight="600">
                    SUA CHAVE PIX
                  </Text>
                  <Text variant="body" color={Colors.neutral.primary} weight="500" numberOfLines={1}>
                    {pixKey}
                  </Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>

        {/* ── Footer: confirmar recebimento ── */}
        {pixKey && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.confirmBtn, confirmed && styles.confirmBtnDone]}
              onPress={confirmed ? undefined : handleConfirmReceived}
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
                  Confirmar recebimento
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

      </ScreenTransition>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.neutral.surface,
  },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.neutral.white,
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
    alignItems: 'center',
  },

  // Valor
  amountCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
    width: '100%',
    ...Shadows.sm,
  },
  amountText: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
    color: Colors.status.credit,
    lineHeight: 48,
  },

  // Sem PIX
  noPixCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.lg,
    width: '100%',
    ...Shadows.sm,
  },
  addKeyBtn: {
    height: 48,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // QR
  qrCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.sm,
  },
  qrHint: { textAlign: 'center', marginTop: Spacing.xs },

  // Copia e cola
  section: { gap: Spacing.sm, width: '100%' },
  codeCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  codeText: { lineHeight: 20 },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-end',
    paddingVertical: 6, paddingHorizontal: Spacing.md,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.brand.light, backgroundColor: Colors.brand.xlight,
  },
  copyBtnDone: {
    borderColor: Colors.status.credit,
    backgroundColor: Colors.status.creditBg,
  },

  // Chave
  keyCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    width: '100%',
    ...Shadows.sm,
  },
  keyInfo: { gap: 2 },

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
