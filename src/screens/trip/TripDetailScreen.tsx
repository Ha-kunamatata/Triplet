import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DayTab } from '@components/schedule';
import { ScheduleItem } from '@components/schedule';
import { EmptyState, LoadingSpinner } from '@components/common';
import { useTripStore } from '@store/useTripStore';
import { Colors } from '@constants/colors';
import { FontSize, FontFamily } from '@constants/typography';
import { Layout } from '@constants/layout';
import type { TripStackParamList } from '@navigation/types';
import type { Schedule } from '@types/index';

type Props = NativeStackScreenProps<TripStackParamList, 'TripDetail'>;

export function TripDetailScreen({ navigation, route }: Props) {
  const { tripId } = route.params;
  const { currentTrip, selectedDayIndex, setSelectedDayIndex, isLoading } = useTripStore();

  const selectedDay = currentTrip?.days[selectedDayIndex];
  const schedules = selectedDay?.schedules ?? [];

  const handleSchedulePress = (schedule: Schedule) => {
    navigation.navigate('AddSchedule', {
      tripDayId: selectedDay?.id ?? '',
      scheduleId: schedule.id,
    });
  };

  if (isLoading || !currentTrip) {
    return <LoadingSpinner fullScreen message="일정을 불러오는 중..." />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.destination}>{currentTrip.destination}</Text>
          <Text style={styles.title}>{currentTrip.title}</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* 날짜 정보 */}
      <View style={styles.dateBadge}>
        <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
        <Text style={styles.dateText}>
          {format(new Date(currentTrip.startDate), 'yyyy.M.d', { locale: ko })}
          {' - '}
          {format(new Date(currentTrip.endDate), 'M.d (E)', { locale: ko })}
        </Text>
      </View>

      {/* Day 탭 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayTabs}
      >
        {currentTrip.days.map((day, index) => (
          <DayTab
            key={day.id}
            date={day.date}
            dayNumber={day.dayNumber}
            isSelected={selectedDayIndex === index}
            onPress={() => setSelectedDayIndex(index)}
            scheduleCount={day.schedules.length}
          />
        ))}
      </ScrollView>

      {/* 일정 목록 */}
      <FlatList
        data={schedules}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ScheduleItem
            schedule={item}
            onPress={handleSchedulePress}
          />
        )}
        contentContainerStyle={styles.scheduleList}
        ItemSeparatorComponent={() => <View style={{ height: Layout.spacing.md }} />}
        ListEmptyComponent={
          <EmptyState
            icon="map-outline"
            title="일정이 없어요"
            description="이 날의 여행 일정을 추가해보세요"
            actionLabel="일정 추가"
            onAction={() =>
              navigation.navigate('AddSchedule', { tripDayId: selectedDay?.id ?? '' })
            }
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* 일정 추가 FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          navigation.navigate('AddSchedule', { tripDayId: selectedDay?.id ?? '' })
        }
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.md,
    gap: Layout.spacing.md,
  },
  headerCenter: { flex: 1 },
  destination: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },
  title: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Layout.spacing.xl,
    marginBottom: Layout.spacing.md,
  },
  dateText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  dayTabs: {
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.sm,
    gap: Layout.spacing.sm,
  },
  scheduleList: {
    padding: Layout.spacing.xl,
    flexGrow: 1,
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    bottom: Layout.spacing.xl,
    right: Layout.spacing.xl,
    backgroundColor: Colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Layout.shadow.lg,
  },
});
