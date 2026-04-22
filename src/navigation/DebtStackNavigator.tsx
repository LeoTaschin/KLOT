import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { DebtSelectorScreen } from '../screens/app/divida/DebtSelectorScreen'
import { DebtValueScreen } from '../screens/app/divida/DebtValueScreen'
import { DebtReviewIndividualScreen } from '../screens/app/divida/DebtReviewIndividualScreen'
import { DebtReviewGroupScreen } from '../screens/app/divida/DebtReviewGroupScreen'
import type { DebtStackParamList } from './types'

const Stack = createNativeStackNavigator<DebtStackParamList>()

export function DebtStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DebtSelector" component={DebtSelectorScreen} />
      <Stack.Screen
        name="DebtValue"
        component={DebtValueScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="DebtReviewIndividual"
        component={DebtReviewIndividualScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="DebtReviewGroup"
        component={DebtReviewGroupScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  )
}
