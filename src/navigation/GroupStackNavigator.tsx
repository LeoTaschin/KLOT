import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { CreateGroupNameScreen } from '../screens/app/grupos/CreateGroupNameScreen'
import { CreateGroupMembersScreen } from '../screens/app/grupos/CreateGroupMembersScreen'
import { CreateGroupReviewScreen } from '../screens/app/grupos/CreateGroupReviewScreen'
import type { GroupStackParamList } from './types'

const Stack = createNativeStackNavigator<GroupStackParamList>()

export function GroupStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CreateGroupName" component={CreateGroupNameScreen} />
      <Stack.Screen
        name="CreateGroupMembers"
        component={CreateGroupMembersScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="CreateGroupReview"
        component={CreateGroupReviewScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  )
}
