import { StyleSheet, Text, View } from 'react-native'

import type { AuthScreenProps } from '../../navigation/types'

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  return (
    <View style={styles.container}>
      <Text>Cadastro</Text>
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
