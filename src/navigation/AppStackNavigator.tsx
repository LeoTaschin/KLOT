import { useEffect } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { AppNavigator } from './AppNavigator'
import type { AppStackParamList } from './types'
import { registerForPushNotifications } from '../lib/notifications'

import { AddFriendScreen } from '../screens/app/amigos/AddFriendScreen'
import { FriendProfileScreen } from '../screens/app/amigos/FriendProfileScreen'
import { GroupDetailsScreen } from '../screens/app/grupos/GroupDetailsScreen'
import { DebtDetailScreen } from '../screens/app/DebtDetailScreen'
import { EditProfileScreen } from '../screens/app/Settings/EditProfileScreen'
import { PixSettingsScreen } from '../screens/app/Settings/PixSettingsScreen'
import { NotificationsScreen } from '../screens/app/Settings/NotificationsScreen'
import { ChangeNameScreen } from '../screens/app/Settings/Change/ChangeNameScreen'
import { ChangeUsernameScreen } from '../screens/app/Settings/Change/ChangeUsernameScreen'
import { GroupStackNavigator } from './GroupStackNavigator'
import { DebtStackNavigator } from './DebtStackNavigator'
import { ReceivePixScreen } from '../screens/app/ReceivePixScreen'
import { PaymentStackNavigator } from './PaymentStackNavigator'
import { ChargeStackNavigator } from './ChargeStackNavigator'

const Stack = createNativeStackNavigator<AppStackParamList>()

export function AppStackNavigator() {
  useEffect(() => { registerForPushNotifications() }, [])

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

      {/* Configurações de perfil */}
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="PixSettings"
        component={PixSettingsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ChangeName"
        component={ChangeNameScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ChangeUsername"
        component={ChangeUsernameScreen}
        options={{ animation: 'slide_from_right' }}
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

      {/* Receber PIX */}
      <Stack.Screen
        name="ReceivePix"
        component={ReceivePixScreen}
        options={{ animation: 'slide_from_right' }}
      />

      {/* Pagamento PIX — modal com stack interno */}
      <Stack.Screen
        name="PaymentFlow"
        component={PaymentStackNavigator}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />

      {/* Cobrança PIX — modal com stack interno */}
      <Stack.Screen
        name="ChargeFlow"
        component={ChargeStackNavigator}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  )
}
