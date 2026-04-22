import React from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ScreenTransition } from '../../components/ScreenTransition'
import { Text } from '../../components/ui'
import { Colors } from '../../constants/theme'

export function ContasScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScreenTransition>
      <View style={styles.center}>
        <Text variant="h2" color={Colors.neutral.primary}>
          Contas
        </Text>
        <Text variant="body" color={Colors.neutral.secondary} style={styles.sub}>
          Em breve
        </Text>
      </View>
      </ScreenTransition>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.neutral.surface,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sub: {
    marginTop: 8,
  },
})
