import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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

import { ScreenTransition } from '../../components/ScreenTransition'
import { Text } from '../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../constants/theme'
import { supabase } from '../../lib/supabase'
import { generatePixPayload } from '../../utils/pixPayload'
import type { AppStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<AppStackParamList, 'ReceivePix'>

interface Profile {
  name: string
  pix_key: string | null
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

function CopyIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"
        stroke={Colors.brand.primary} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round"
      />
      <Path d="M10 10h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z"
        stroke={Colors.brand.primary} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  )
}

const QR_SIZE = 220

export function ReceivePixScreen({ navigation, route }: Props) {
  const { amount, friendName } = route.params
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('name, pix_key')
        .eq('id', user.id)
        .single()
      setProfile(data)
      setLoading(false)
    }
    load()
  }, [])

  function handleCopy() {
    if (!profile?.pix_key) return
    Clipboard.setString(profile.pix_key)
    Alert.alert('Copiado!', 'Chave PIX copiada para a área de transferência.')
  }

  function handleNoKey() {
    navigation.replace('PixSettings')
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={Colors.brand.primary} />
      </SafeAreaView>
    )
  }

  const pixPayload = profile?.pix_key
    ? generatePixPayload({
        pixKey: profile.pix_key,
        merchantName: profile.name,
        amount,
      })
    : null

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenTransition>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
            <BackIcon />
          </TouchableOpacity>
          <Text variant="h3" color={Colors.neutral.primary} weight="600">
            Receber PIX
          </Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Subtítulo ── */}
          {friendName && (
            <Text variant="body" color={Colors.neutral.secondary} style={styles.subtitle}>
              Cobrança para {friendName}
            </Text>
          )}

          {/* ── Sem chave PIX ── */}
          {!profile?.pix_key ? (
            <View style={styles.emptyCard}>
              <Text variant="body" color={Colors.neutral.secondary} style={styles.emptyText}>
                Você ainda não tem uma chave PIX cadastrada.
              </Text>
              <TouchableOpacity style={styles.addKeyBtn} onPress={handleNoKey} activeOpacity={0.8}>
                <Text variant="label" color={Colors.neutral.white} weight="700">
                  Cadastrar chave PIX
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* ── Valor ── */}
              {amount !== undefined && (
                <View style={styles.amountCard}>
                  <Text variant="caption" color={Colors.neutral.secondary} weight="600">
                    VALOR A RECEBER
                  </Text>
                  <Text variant="h1" color={Colors.brand.primary} weight="800">
                    {amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </Text>
                </View>
              )}

              {/* ── QR Code ── */}
              <View style={styles.qrCard}>
                <QRCode
                  value={pixPayload!}
                  size={QR_SIZE}
                  color={Colors.neutral.primary}
                  backgroundColor={Colors.neutral.white}
                />
                <Text variant="caption" color={Colors.neutral.placeholder} style={styles.qrHint}>
                  Mostre este QR Code para receber o pagamento
                </Text>
              </View>

              {/* ── Chave PIX ── */}
              <View style={styles.keyCard}>
                <View style={styles.keyInfo}>
                  <Text variant="caption" color={Colors.neutral.secondary} weight="600">
                    CHAVE PIX
                  </Text>
                  <Text variant="body" color={Colors.neutral.primary} weight="500" numberOfLines={1}>
                    {profile.pix_key}
                  </Text>
                </View>
                <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.7}>
                  <CopyIcon />
                  <Text variant="caption" color={Colors.brand.primary} weight="600">
                    Copiar
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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
    alignItems: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },

  // Sem chave
  emptyCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.lg,
    width: '100%',
    ...Shadows.sm,
  },
  emptyText: {
    textAlign: 'center',
  },
  addKeyBtn: {
    height: 48,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
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

  // QR
  qrCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.sm,
  },
  qrHint: {
    textAlign: 'center',
    marginTop: Spacing.xs,
  },

  // Chave
  keyCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    width: '100%',
    ...Shadows.sm,
  },
  keyInfo: {
    flex: 1,
    gap: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
})
