import React from 'react'
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native'

import {
  CasaIcon,
  ChevronRightIcon,
  ContasIcon,
  FestaIcon,
  GruposIcon,
  Text,
  TrabalhoIcon,
  ViagemIcon,
} from './ui'
import { Colors, Radius, Shadows, Spacing } from '../constants/theme'

export interface GroupData {
  id: string
  name: string
  avatar_url: string | null
  category: string
}

interface Props {
  group: GroupData
  onPress?: (group: GroupData) => void
}

const CATEGORY_CONFIG: Record<string, { label: string; Icon: React.FC<{ size?: number; color?: string }> }> = {
  casa:     { label: 'Casa',     Icon: CasaIcon     },
  trabalho: { label: 'Trabalho', Icon: TrabalhoIcon },
  viagem:   { label: 'Viagem',   Icon: ViagemIcon   },
  festa:    { label: 'Festa',    Icon: FestaIcon    },
  amigos:   { label: 'Amigos',   Icon: GruposIcon   },
  outro:    { label: 'Outro',    Icon: ContasIcon   },
}

const AVATAR_SIZE = 46

export function GroupItem({ group, onPress }: Props) {
  const config = CATEGORY_CONFIG[group.category] ?? CATEGORY_CONFIG.outro
  const { Icon, label } = config

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => onPress?.(group)}>
      {group.avatar_url ? (
        <Image source={{ uri: group.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Icon size={22} color={Colors.brand.primary} />
        </View>
      )}

      <View style={styles.info}>
        <Text variant="label" color={Colors.neutral.primary} weight="600">
          {group.name}
        </Text>
        <View style={styles.categoryBadge}>
          <Text variant="caption" color={Colors.neutral.secondary} weight="500">
            {label}
          </Text>
        </View>
      </View>

      <ChevronRightIcon size={16} color={Colors.neutral.placeholder} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
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
    borderRadius: Radius.lg,
    backgroundColor: Colors.brand.xlight,
    borderWidth: 1,
    borderColor: Colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
})
