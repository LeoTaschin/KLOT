import React from 'react'
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import Svg, { Path } from 'react-native-svg'

import { PersonIcon, Text } from '../../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../../constants/theme'
import type { AppStackParamList } from '../../../navigation/types'

type Props = NativeStackScreenProps<AppStackParamList, 'FriendProfile'>

const AVATAR_SIZE = 88

export function FriendProfileScreen({ navigation, route }: Props) {
  const { name, avatarUrl } = route.params
  const firstName = name.split(' ')[0]

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 12H5M5 12L12 19M5 12L12 5"
              stroke={Colors.neutral.primary}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* ── Perfil ── */}
      <View style={styles.profileSection}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <PersonIcon size={40} color={Colors.neutral.placeholder} />
          </View>
        )}
        <Text variant="h2" color={Colors.neutral.primary} weight="700" style={styles.name}>
          {name}
        </Text>
      </View>

      {/* ── Resumo ── */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text variant="h3" color={Colors.brand.primary} weight="700">
            R$ 0,00
          </Text>
          <Text variant="caption" color={Colors.neutral.secondary}>
            {firstName} te deve
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statCard}>
          <Text variant="h3" color={Colors.status.error} weight="700">
            R$ 0,00
          </Text>
          <Text variant="caption" color={Colors.neutral.secondary}>
            Você deve
          </Text>
        </View>
      </View>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
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
  profileSection: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
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
    backgroundColor: Colors.neutral.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginTop: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.neutral.border,
    marginVertical: 4,
  },
})
