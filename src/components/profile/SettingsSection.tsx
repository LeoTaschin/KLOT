import React from 'react'
import { StyleSheet, View } from 'react-native'

import { Text } from '../ui'
import { Colors, Radius, Shadows, Spacing } from '../../constants/theme'

interface Props {
  title: string
  children: React.ReactNode
}

export function SettingsSection({ title, children }: Props) {
  const items = React.Children.toArray(children)

  return (
    <View style={styles.wrapper}>
      <Text variant="caption" color={Colors.neutral.secondary} weight="600" style={styles.title}>
        {title.toUpperCase()}
      </Text>

      <View style={styles.card}>
        {items.map((child, index) => (
          <React.Fragment key={index}>
            {child}
            {index < items.length - 1 && <View style={styles.divider} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.sm,
  },
  title: {
    paddingHorizontal: 4,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.neutral.border,
    marginLeft: 34 + Spacing.md * 2,
  },
})
