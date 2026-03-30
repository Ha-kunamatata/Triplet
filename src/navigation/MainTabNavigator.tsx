import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View } from 'react-native';
import { HomeScreen } from '@screens/home/HomeScreen';
import { TripStackNavigator } from './TripStackNavigator';
import { PlaceStackNavigator } from './PlaceStackNavigator';
import { Colors } from '@constants/colors';
import { FontSize, FontFamily } from '@constants/typography';
import type { MainTabParamList } from './types';

// ProfileScreen은 추후 구현
const ProfileScreen = () => null;

const Tab = createBottomTabNavigator<MainTabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<keyof MainTabParamList, { active: IoniconName; inactive: IoniconName }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Trips: { active: 'airplane', inactive: 'airplane-outline' },
  Places: { active: 'search', inactive: 'search-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

const TAB_LABELS: Record<keyof MainTabParamList, string> = {
  Home: '홈',
  Trips: '내 여행',
  Places: '장소',
  Profile: '프로필',
};

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          return (
            <Ionicons
              name={focused ? icons.active : icons.inactive}
              size={size}
              color={color}
            />
          );
        },
        tabBarLabel: TAB_LABELS[route.name],
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray400,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Trips" component={TripStackNavigator} />
      <Tab.Screen name="Places" component={PlaceStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileScreen as any} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
  },
});
