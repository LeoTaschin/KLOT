import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

import { ChevronRightIcon, Text } from '../ui'
import { Colors, Radius, Spacing } from '../../constants/theme'

interface Props {
  icon: React.ReactNode
  iconBg: string
  label: string
  value?: string
  onPress: () => void
  danger?: boolean
}

export function SettingsItem({ icon, iconBg, label, value, onPress, danger }: Props) {
  const labelColor = danger ? Colors.status.debt : Colors.neutral.primary

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        {icon}
      </View>

      <Text variant="label" color={labelColor} weight="500" style={styles.label}>
        {label}
      </Text>

      {value && (
        <Text variant="caption" color={Colors.neutral.secondary} numberOfLines={1} style={styles.value}>
          {value}
        </Text>
      )}

      <ChevronRightIcon size={16} color={danger ? Colors.status.debt : Colors.neutral.placeholder} />
    </TouchableOpacity>
  )
}

const ICON_SIZE = 40

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  iconWrap: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  label: {
    flex: 1,
  },
  value: {
    maxWidth: 120,
  },
})
