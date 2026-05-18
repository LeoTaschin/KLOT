import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'

import { supabase } from './supabase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export async function registerForPushNotifications(): Promise<void> {
  if (!Device.isDevice) return

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'KLOT',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C47FF',
    })
  }

  const { status: existing } = await Notifications.getPermissionsAsync()
  const { status } = existing === 'granted'
    ? { status: existing }
    : await Notifications.requestPermissionsAsync()

  if (status !== 'granted') return

  const { data: token } = await Notifications.getExpoPushTokenAsync()
  if (!token) return

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('profiles').update({ push_token: token }).eq('id', user.id)
  }
}

export async function notifyUser(
  recipientId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  try {
    await supabase.functions.invoke('send-notification', {
      body: { recipientId, title, body, data: data ?? {} },
    })
  } catch {
    // notifications are best-effort, never block the main action
  }
}
