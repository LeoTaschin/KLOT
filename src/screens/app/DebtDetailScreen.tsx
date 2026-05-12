import React from 'react'
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import Svg, { Path } from 'react-native-svg'

import { ScreenTransition } from '../../components/ScreenTransition'
import {
  CasaIcon, ComidaIcon, ContasIcon, FestaIcon,
  PersonIcon, Text, TrabalhoIcon, TransporteIcon, ViagemIcon,
} from '../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../constants/theme'
import type { AppStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<AppStackParamList, 'DebtDetail'>

const CATEGORY_ICON: Record<string, React.FC<{ size?: number; color?: string }>> = {
  comida:     ComidaIcon,
  transporte: TransporteIcon,
  casa:       CasaIcon,
  viagem:     ViagemIcon,
  trabalho:   TrabalhoIcon,
  festa:      FestaIcon,
  outro:      ContasIcon,
}

const CATEGORY_LABEL: Record<string, string> = {
  comida: 'Comida', transporte: 'Transporte', casa: 'Casa',
  viagem: 'Viagem', trabalho: 'Trabalho', festa: 'Festa', outro: 'Outro',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  })
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

const AVATAR_SIZE = 72

export function DebtDetailScreen({ navigation, route }: Props) {
  const item = route.params
  const Icon = CATEGORY_ICON[item.category] ?? ContasIcon
  const isOwe = item.direction === 'owe'
  const amountStr = `R$ ${item.amount.toFixed(2).replace('.', ',')}`
  const amountColor = isOwe ? Colors.status.debt : Colors.status.credit
  const amountBg = isOwe ? Colors.status.debtBg : Colors.status.creditBg

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenTransition>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
            <BackIcon />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Pessoa + valor ── */}
          <View style={styles.heroCard}>

            {/* Faixa colorida de status */}
            <View style={[styles.statusBar, { backgroundColor: amountBg }]}>
              <Text variant="caption" color={amountColor} weight="700">
                {isOwe ? 'VOCÊ DEVE' : 'TE DEVEM'}
              </Text>
            </View>

            <View style={styles.heroBody}>
              {/* Avatar centralizado */}
              {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <PersonIcon size={30} color={Colors.neutral.placeholder} />
                </View>
              )}

              <Text variant="h3" color={Colors.neutral.primary} weight="700">
                {item.personName}
              </Text>

              {/* Valor em destaque */}
              <Text style={[styles.amount, { color: amountColor }]}>
                {amountStr}
              </Text>

              {/* Título da despesa como contexto */}
              <Text variant="body" color={Colors.neutral.secondary} weight="500">
                {item.title}
              </Text>
            </View>
          </View>

          {/* ── Detalhes ── */}
          <View style={styles.detailsCard}>

            <DetailRow label="Categoria">
              <View style={[styles.categoryChip, { backgroundColor: amountBg }]}>
                <Icon size={13} color={amountColor} />
                <Text variant="caption" color={amountColor} weight="600">
                  {CATEGORY_LABEL[item.category] ?? 'Outro'}
                </Text>
              </View>
            </DetailRow>

            <View style={styles.divider} />

            <DetailRow label="Data">
              <Text variant="label" color={Colors.neutral.primary} weight="500">
                {formatDate(item.date)}
              </Text>
            </DetailRow>

            <View style={styles.divider} />

            <DetailRow label="Hora">
              <Text variant="label" color={Colors.neutral.primary} weight="500">
                {formatTime(item.date)}
              </Text>
            </DetailRow>

            {item.groupName && (
              <>
                <View style={styles.divider} />
                <DetailRow label="Grupo">
                  <Text variant="label" color={Colors.brand.primary} weight="600">
                    {item.groupName}
                  </Text>
                </DetailRow>
              </>
            )}

          </View>

        </ScrollView>
      </ScreenTransition>
    </SafeAreaView>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.detailRow}>
      <Text variant="caption" color={Colors.neutral.secondary} weight="600">
        {label.toUpperCase()}
      </Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.neutral.surface,
  },
  header: {
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
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },

  // Hero
  heroCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  statusBar: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  heroBody: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.xs,
    alignItems: 'center',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginBottom: Spacing.sm,
  },
  avatarFallback: {
    backgroundColor: Colors.neutral.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  amount: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 48,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },

  // Detalhes
  detailsCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.neutral.border,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
})
