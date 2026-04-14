import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen'
import { LoginScreen } from '../screens/auth/LoginScreen'
import {
  RegisterInfoScreen,
  RegisterVerifyScreen,
  RegisterPasswordScreen,
  RegisterPhotoScreen,
  RegisterUsernameScreen,
} from '../screens/auth/register'
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
      <Stack.Screen name="RegisterInfo" component={RegisterInfoScreen} />
      <Stack.Screen name="RegisterVerify" component={RegisterVerifyScreen} />
      <Stack.Screen name="RegisterPassword" component={RegisterPasswordScreen} />
      <Stack.Screen name="RegisterPhoto" component={RegisterPhotoScreen} />
      <Stack.Screen name="RegisterUsername" component={RegisterUsernameScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  )
}
