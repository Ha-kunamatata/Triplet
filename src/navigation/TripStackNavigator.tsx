import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TripListScreen } from '@screens/trip/TripListScreen';
import { TripDetailScreen } from '@screens/trip/TripDetailScreen';
import { CreateTripScreen } from '@screens/trip/CreateTripScreen';
import { AddScheduleScreen } from '@screens/trip/AddScheduleScreen';
import { DiaryScreen } from '@screens/diary/DiaryScreen';
import { DiaryEditScreen } from '@screens/diary/DiaryEditScreen';
import type { TripStackParamList } from './types';

const Stack = createNativeStackNavigator<TripStackParamList>();

export function TripStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TripList" component={TripListScreen} />
      <Stack.Screen
        name="TripDetail"
        component={TripDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="CreateTrip"
        component={CreateTripScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="AddSchedule"
        component={AddScheduleScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="Diary"
        component={DiaryScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
