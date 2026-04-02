import { StyleSheet, Text, View } from 'react-native'

import type { AuthScreenProps } from '../../navigation/types'

export function ForgotPasswordScreen({ navigation }: AuthScreenProps<'ForgotPassword'>) {
  return (
    <View style={styles.container}>
      <Text>Recuperar senha</Text>
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
