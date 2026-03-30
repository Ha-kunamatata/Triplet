import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PlaceSearchScreen } from '@screens/place/PlaceSearchScreen';
import type { PlaceStackParamList } from './types';

// PlaceDetailScreen은 추후 구현
const PlaceDetailScreen = () => null;

const Stack = createNativeStackNavigator<PlaceStackParamList>();

export function PlaceStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PlaceSearch" component={PlaceSearchScreen} />
      <Stack.Screen
        name="PlaceDetail"
        component={PlaceDetailScreen as any}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
