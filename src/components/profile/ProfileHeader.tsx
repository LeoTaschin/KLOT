import React from 'react'
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import { PersonIcon, Text } from '../ui'
import { Colors, Radius, Shadows, Spacing } from '../../constants/theme'

interface Props {
  name: string
  username: string
  avatarUrl: string | null
  onPress?: () => void
}

const AVATAR_SIZE = 88

function EditIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke={Colors.neutral.placeholder}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"
        stroke={Colors.neutral.placeholder}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function ProfileHeader({ name, username, avatarUrl, onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      {/* Ícone de editar no canto */}
      {onPress && (
        <View style={styles.editBtn}>
          <EditIcon />
        </View>
      )}

      {/* Avatar */}
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <PersonIcon size={36} color={Colors.neutral.placeholder} />
        </View>
      )}

      {/* Info */}
      <View style={styles.info}>
        <Text variant="h3" color={Colors.neutral.primary} weight="600" style={styles.name}>
          {name}
        </Text>
        <Text variant="label" color={Colors.brand.primary} weight="500" style={styles.username}>
          @{username}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    ...Shadows.sm,
  },
  editBtn: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    padding: 6,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    backgroundColor: Colors.neutral.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: 4,
  },
  name: {
    textAlign: 'center',
  },
  username: {
    textAlign: 'center',
  },
})
