import { StyleSheet, Text, View } from 'react-native'

import type { TabScreenProps } from '../../navigation/types'

export function ProfileScreen({ navigation }: TabScreenProps<'Profile'>) {
  return (
    <View style={styles.container}>
      <Text>Perfil</Text>
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
