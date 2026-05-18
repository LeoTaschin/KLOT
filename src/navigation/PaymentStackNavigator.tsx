import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { PaymentSelectorScreen } from '../screens/app/Pagamentos/PaymentSelectorScreen'
import { PaymentCheckoutScreen } from '../screens/app/Pagamentos/PaymentCheckoutScreen'
import type { PaymentStackParamList } from './types'

const Stack = createNativeStackNavigator<PaymentStackParamList>()

export function PaymentStackNavigator() {
  return (
    <Stack.Navigator id="PaymentStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PaymentSelector" component={PaymentSelectorScreen} />
      <Stack.Screen
        name="PaymentCheckout"
        component={PaymentCheckoutScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  )
}
