import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { WelcomeScreen } from '../screens/welcome/WelcomeScreen'
import { useAuthStore } from '../store/useAuthStore'
import { AppStackNavigator } from './AppStackNavigator'
import { AuthNavigator } from './AuthNavigator'
import type { RootParamList } from './types'

const Stack = createNativeStackNavigator<RootParamList>()

export function RootNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasSeenWelcome = useAuthStore((state) => state.hasSeenWelcome)

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {isAuthenticated ? (
        <Stack.Screen name="App" component={AppStackNavigator} />
      ) : !hasSeenWelcome ? (
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  )
}
