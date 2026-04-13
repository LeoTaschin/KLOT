import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen'
import { LoginScreen } from '../screens/auth/LoginScreen'
import { RegisterScreen } from '../screens/auth/RegisterScreen'
import { useAuthStore } from '../store/useAuthStore'
import type { AuthStackParamList } from './types'

const Stack = createNativeStackNavigator<AuthStackParamList>()

export function AuthNavigator() {
  const initialAuthRoute = useAuthStore((state) => state.initialAuthRoute)

  return (
    <Stack.Navigator
      initialRouteName={initialAuthRoute}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  )
}
