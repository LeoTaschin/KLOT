import React from 'react'
import { Image, StyleSheet, View } from 'react-native'

import { PersonIcon, Text } from '../ui'
import { Colors, Radius, Spacing } from '../../constants/theme'

interface Props {
  name: string
  username: string
  email: string
  avatarUrl: string | null
}

const AVATAR_SIZE = 80

export function ProfileHeader({ name, username, email, avatarUrl }: Props) {
  return (
    <View style={styles.card}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <PersonIcon size={32} color={Colors.neutral.placeholder} />
        </View>
      )}

      <View style={styles.info}>
        <Text variant="h3" color={Colors.neutral.primary} weight="700" numberOfLines={1}>
          {name}
        </Text>
        <Text variant="caption" color={Colors.brand.primary} weight="600">
          @{username}
        </Text>
        <Text variant="caption" color={Colors.neutral.secondary} numberOfLines={1}>
          {email}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    padding: Spacing.lg,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    flexShrink: 0,
  },
  avatarFallback: {
    backgroundColor: Colors.neutral.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 3,
  },
})
