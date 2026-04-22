import React from 'react'
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native'

import { PersonIcon, Text } from './ui'
import { Colors, Radius, Shadows, Spacing } from '../constants/theme'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

export interface FriendData {
  id: string
  name: string
  username: string
  avatar_url: string | null
  /** Positivo = amigo te deve. Negativo = você deve. Undefined = sem dados. */
  balance?: number
}

interface Props {
  friend: FriendData
  onPress?: (friend: FriendData) => void
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function FriendItem({ friend, onPress }: Props) {
  const balance = friend.balance ?? 0
  const isPositive = balance > 0
  const isZero = balance === 0

  const balanceColor = isZero
    ? Colors.status.settled
    : isPositive
    ? Colors.status.credit
    : Colors.status.debt

  const balanceValue = `R$ ${Math.abs(balance).toFixed(2).replace('.', ',')}`

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onPress?.(friend)}
      activeOpacity={0.7}
    >
      {friend.avatar_url ? (
        <Image source={{ uri: friend.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <PersonIcon size={20} color={Colors.neutral.placeholder} />
        </View>
      )}

      <View style={styles.info}>
        <Text variant="label" color={Colors.neutral.primary} weight="600">
          {friend.name}
        </Text>
        <Text variant="caption" color={Colors.neutral.secondary}>
          @{friend.username}
        </Text>
      </View>

      {friend.balance !== undefined && (
        <View style={styles.balanceWrap}>
          <Text variant="label" color={balanceColor} weight="700">
            {balanceValue}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════

const AVATAR_SIZE = 46

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    borderWidth: .5,
    borderColor: Colors.neutral.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    ...Shadows.sm,
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
  info: {
    flex: 1,
    gap: 2,
  },
  balanceWrap: {
    alignItems: 'flex-end',
    gap: 2,
  },
})
