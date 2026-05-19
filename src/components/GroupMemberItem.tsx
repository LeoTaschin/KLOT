import React from 'react'
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import { PersonIcon, Text } from './ui'
import { Colors, Radius, Shadows, Spacing } from '../constants/theme'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

export interface GroupMemberData {
  id: string
  name: string
  username: string
  avatar_url: string | null
  isAdmin: boolean
}

interface Props {
  member: GroupMemberData
  onPress?: (member: GroupMemberData) => void
  onRemove?: (member: GroupMemberData) => void
}

// ═══════════════════════════════════════════════════════════════════
// ÍCONE
// ═══════════════════════════════════════════════════════════════════

function RemoveIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={Colors.neutral.placeholder}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  )
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function GroupMemberItem({ member, onPress, onRemove }: Props) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onPress?.(member)}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {member.avatar_url ? (
        <Image source={{ uri: member.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <PersonIcon size={20} color={Colors.neutral.placeholder} />
        </View>
      )}

      <View style={styles.info}>
        <Text variant="label" color={Colors.neutral.primary} weight="600" numberOfLines={1}>
          {member.name}
        </Text>
        <Text variant="caption" color={Colors.neutral.secondary} numberOfLines={1}>
          @{member.username}
        </Text>
      </View>

      {member.isAdmin ? (
        <View style={styles.adminBadge}>
          <Text variant="caption" color={Colors.brand.primary} weight="700">
            ADM
          </Text>
        </View>
      ) : onRemove ? (
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => onRemove(member)}
          hitSlop={12}
        >
          <RemoveIcon />
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════

const AVATAR_SIZE = 44

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
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
  adminBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.brand.light,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
