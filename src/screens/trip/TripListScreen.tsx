import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TripCard } from '@components/trip';
import { EmptyState, LoadingSpinner } from '@components/common';
import { useTripStore } from '@store/useTripStore';
import { Colors } from '@constants/colors';
import { FontSize, FontFamily } from '@constants/typography';
import { Layout } from '@constants/layout';
import type { TripStackParamList } from '@navigation/types';
import type { Trip, TripStatus } from '@types/index';

type Props = NativeStackScreenProps<TripStackParamList, 'TripList'>;

const FILTER_TABS: { key: TripStatus | 'all'; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'upcoming', label: '예정' },
  { key: 'ongoing', label: '진행 중' },
  { key: 'completed', label: '완료' },
];

export function TripListScreen({ navigation }: Props) {
  const { trips, isLoading } = useTripStore();
  const [activeFilter, setActiveFilter] = useState<TripStatus | 'all'>('all');

  const filtered = activeFilter === 'all' ? trips : trips.filter((t) => t.status === activeFilter);

  const handleTripPress = (trip: Trip) => {
    navigation.navigate('TripDetail', { tripId: trip.id });
  };

  if (isLoading) return <LoadingSpinner fullScreen message="여행 목록을 불러오는 중..." />;

  return (
    <SafeAreaView style={styles.safe}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>내 여행</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateTrip')}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* 필터 탭 */}
      <View style={styles.filterRow}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveFilter(tab.key)}
            style={[styles.filterTab, activeFilter === tab.key && styles.activeFilterTab]}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === tab.key && styles.activeFilterText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 여행 목록 */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TripCard trip={item} onPress={handleTripPress} />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: Layout.spacing.md }} />}
        ListEmptyComponent={
          <EmptyState
            icon="airplane-outline"
            title="여행이 없어요"
            description="새로운 여행을 계획해보세요!"
            actionLabel="여행 만들기"
            onAction={() => navigation.navigate('CreateTrip')}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.xl,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  addButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Layout.spacing.xl,
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.lg,
  },
  filterTab: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs + 2,
    borderRadius: Layout.radius.full,
    backgroundColor: Colors.gray100,
  },
  activeFilterTab: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },
  activeFilterText: {
    color: Colors.white,
  },
  list: {
    paddingHorizontal: Layout.spacing.xl,
    paddingBottom: Layout.spacing.xl,
    flexGrow: 1,
  },
});
