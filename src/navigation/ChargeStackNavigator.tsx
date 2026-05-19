import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { ChargeSelectorScreen } from '../screens/app/Cobranca/ChargeSelectorScreen'
import { ChargeValueSelectorScreen } from '../screens/app/Cobranca/ChargeValueSelectorScreen'
import { ChargeQRCodeScreen } from '../screens/app/Cobranca/ChargeQRCodeScreen'
import { ChargeNotificationConfirmScreen } from '../screens/app/Cobranca/ChargeNotificationConfirmScreen'
import type { ChargeStackParamList } from './types'

const Stack = createNativeStackNavigator<ChargeStackParamList>()

export function ChargeStackNavigator() {
  return (
    <Stack.Navigator id="ChargeStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChargeSelectMode" component={ChargeSelectorScreen} />
      <Stack.Screen
        name="ChargeValueSelector"
        component={ChargeValueSelectorScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ChargeQRCode"
        component={ChargeQRCodeScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ChargeNotificationConfirm"
        component={ChargeNotificationConfirmScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  )
}
