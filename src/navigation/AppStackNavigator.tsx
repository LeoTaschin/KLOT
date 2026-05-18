import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { AppNavigator } from './AppNavigator'
import type { AppStackParamList } from './types'

import { AddFriendScreen } from '../screens/app/amigos/AddFriendScreen'
import { FriendProfileScreen } from '../screens/app/amigos/FriendProfileScreen'
import { GroupDetailsScreen } from '../screens/app/grupos/GroupDetailsScreen'
import { DebtDetailScreen } from '../screens/app/DebtDetailScreen'
import { GroupStackNavigator } from './GroupStackNavigator'
import { DebtStackNavigator } from './DebtStackNavigator'
import { PaymentStackNavigator } from './PaymentStackNavigator'

const Stack = createNativeStackNavigator<AppStackParamList>()

export function AppStackNavigator() {
  return (
    <Stack.Navigator id="AppStack" screenOptions={{ headerShown: false }}>
      {/* Tabs principais */}
      <Stack.Screen name="Tabs" component={AppNavigator} />

      {/* Amigos */}
      <Stack.Screen
        name="AddFriend"
        component={AddFriendScreen}
        options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
      />
      <Stack.Screen
        name="FriendProfile"
        component={FriendProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />

      {/* Grupo */}
      <Stack.Screen
        name="GroupDetails"
        component={GroupDetailsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="GroupFlow"
        component={GroupStackNavigator}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />

      {/* Detalhe de dívida */}
      <Stack.Screen
        name="DebtDetail"
        component={DebtDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />

      {/* Dívida — modal com stack interno */}
      <Stack.Screen
        name="DebtFlow"
        component={DebtStackNavigator}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />

      {/* Pagamento PIX — modal com stack interno */}
      <Stack.Screen
        name="PaymentFlow"
        component={PaymentStackNavigator}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  )
}
