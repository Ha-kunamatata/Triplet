import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TripCard } from '@components/trip';
import { EmptyState } from '@components/common';
import { useAuthStore } from '@store/useAuthStore';
import { useTripStore } from '@store/useTripStore';
import { Colors } from '@constants/colors';
import { FontSize, FontFamily } from '@constants/typography';
import { Layout } from '@constants/layout';
import type { MainTabParamList } from '@navigation/types';
import type { Trip } from '@types/index';

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const { trips } = useTripStore();

  const ongoingTrips = trips.filter((t) => t.status === 'ongoing');
  const upcomingTrips = trips.filter((t) => t.status === 'upcoming');

  const handleTripPress = (trip: Trip) => {
    (navigation as any).navigate('Trips', {
      screen: 'TripDetail',
      params: { tripId: trip.id },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>안녕하세요, {user?.nickname ?? '여행자'}님 👋</Text>
            <Text style={styles.subGreeting}>오늘도 멋진 여행을 계획해보세요</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* 새 여행 만들기 배너 */}
        <TouchableOpacity
          style={styles.createBanner}
          activeOpacity={0.9}
          onPress={() => (navigation as any).navigate('Trips', { screen: 'CreateTrip' })}
        >
          <View>
            <Text style={styles.createBannerTitle}>새 여행 계획하기</Text>
            <Text style={styles.createBannerSub}>일정을 짜고, 기록하고, 공유해보세요</Text>
          </View>
          <Ionicons name="add-circle" size={40} color={Colors.white} />
        </TouchableOpacity>

        {/* 진행 중인 여행 */}
        {ongoingTrips.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>지금 여행 중 ✈️</Text>
            {ongoingTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onPress={handleTripPress} />
            ))}
          </View>
        )}

        {/* 예정된 여행 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>예정된 여행</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('Trips')}>
              <Text style={styles.sectionMore}>전체보기</Text>
            </TouchableOpacity>
          </View>
          {upcomingTrips.length === 0 ? (
            <EmptyState
              icon="airplane-outline"
              title="예정된 여행이 없어요"
              description="새로운 여행을 계획해보세요!"
              actionLabel="여행 만들기"
              onAction={() => (navigation as any).navigate('Trips', { screen: 'CreateTrip' })}
            />
          ) : (
            upcomingTrips.slice(0, 3).map((trip) => (
              <TripCard key={trip.id} trip={trip} onPress={handleTripPress} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Layout.spacing.xl,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
  },
  greeting: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  subGreeting: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  notificationButton: {
    padding: Layout.spacing.xs,
  },
  createBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: Layout.spacing.xl,
    borderRadius: Layout.radius.xl,
    padding: Layout.spacing.xl,
    marginBottom: Layout.spacing.xl,
    ...Layout.shadow.md,
  },
  createBannerTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: Colors.white,
  },
  createBannerSub: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: Layout.spacing.xl,
    marginBottom: Layout.spacing.xl,
    gap: Layout.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  sectionMore: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.primary,
  },
});
