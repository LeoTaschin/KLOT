import React from 'react'
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native'

import { PersonIcon, Text } from './ui'
import { Colors, Radius, Shadows, Spacing } from '../constants/theme'

export interface DebtDetail {
  id: string
  title: string
  category: string
  amount: number
  personName: string
  avatarUrl: string | null
  groupId: string | null
  groupName: string | null
  direction: 'owe' | 'credit'
  date: string
}

interface Props {
  item: DebtDetail
  onPress?: (item: DebtDetail) => void
}

export function DebtDetailItem({ item, onPress }: Props) {
  const firstName = item.personName.split(' ')[0]
  const amountStr = `R$ ${item.amount.toFixed(2).replace('.', ',')}`
  const isOwe = item.direction === 'owe'

  const subtitle = isOwe ? `Pago por ${firstName}` : `${firstName} te deve`

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onPress?.(item)}
      activeOpacity={0.75}
    >
      {item.avatarUrl ? (
        <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <PersonIcon size={18} color={Colors.neutral.placeholder} />
        </View>
      )}

      <View style={styles.info}>
        <Text variant="label" color={Colors.neutral.primary} weight="600" numberOfLines={1}>
          {item.title}
        </Text>
        <Text variant="caption" color={Colors.neutral.secondary} numberOfLines={1}>
          {subtitle}
        </Text>
        {item.groupName && (
          <View style={styles.groupBadge}>
            <Text style={styles.groupBadgeText} numberOfLines={1}>
              {item.groupName}
            </Text>
          </View>
        )}
      </View>

      <Text variant="label" color={isOwe ? Colors.status.debt : Colors.status.credit} weight="700">
        {amountStr}
      </Text>
    </TouchableOpacity>
  )
}

const AVATAR_SIZE = 40

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
    gap: 2,
  },
  groupBadge: {
    alignSelf: 'flex-start',
    marginTop: 3,
    backgroundColor: Colors.brand.xlight,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.brand.light,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  groupBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.brand.primary,
  },
})
