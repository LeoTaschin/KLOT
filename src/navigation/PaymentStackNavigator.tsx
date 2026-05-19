import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { PaymentSelectModeScreen } from '../screens/app/Pagamentos/PaymentSelectorScreen'
import { PaymentValueSelectorScreen } from '../screens/app/Pagamentos/PaymentValueSelectorScreen'
import { PaymentPixScreen } from '../screens/app/Pagamentos/PaymentCheckoutScreen'
import type { PaymentStackParamList } from './types'

const Stack = createNativeStackNavigator<PaymentStackParamList>()

export function PaymentStackNavigator() {
  return (
    <Stack.Navigator id="PaymentStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PaymentSelectMode" component={PaymentSelectModeScreen} />
      <Stack.Screen
        name="PaymentValueSelector"
        component={PaymentValueSelectorScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="PaymentPix"
        component={PaymentPixScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  )
}
