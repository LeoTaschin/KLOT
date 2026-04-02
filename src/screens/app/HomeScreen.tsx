import { StyleSheet, Text, View } from 'react-native'

import type { TabScreenProps } from '../../navigation/types'

export function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
  return (
    <View style={styles.container}>
      <Text>Home</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
