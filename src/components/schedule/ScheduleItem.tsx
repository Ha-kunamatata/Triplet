import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Schedule } from '@types/index';
import { Colors } from '@constants/colors';
import { FontSize, FontFamily } from '@constants/typography';
import { Layout } from '@constants/layout';
import { SCHEDULE_CATEGORIES } from '@constants/index';

interface ScheduleItemProps {
  schedule: Schedule;
  onPress: (schedule: Schedule) => void;
  onDelete?: (schedule: Schedule) => void;
  isDragging?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  attraction: Colors.category.attraction,
  restaurant: Colors.category.restaurant,
  cafe: Colors.category.cafe,
  accommodation: Colors.category.accommodation,
  transport: Colors.category.transport,
  shopping: Colors.category.shopping,
  etc: Colors.category.etc,
};

export function ScheduleItem({ schedule, onPress, onDelete, isDragging }: ScheduleItemProps) {
  const categoryInfo = SCHEDULE_CATEGORIES.find((c) => c.key === schedule.category);
  const categoryColor = CATEGORY_COLORS[schedule.category] ?? Colors.gray400;

  return (
    <TouchableOpacity
      onPress={() => onPress(schedule)}
      activeOpacity={0.85}
      style={[styles.container, isDragging && styles.dragging]}
    >
      {/* 카테고리 색상 인디케이터 */}
      <View style={[styles.colorBar, { backgroundColor: categoryColor }]} />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons
              name={(categoryInfo?.icon as any) ?? 'ellipsis-horizontal'}
              size={15}
              color={categoryColor}
            />
            <Text style={styles.title} numberOfLines={1}>
              {schedule.title}
            </Text>
          </View>
          {onDelete && (
            <TouchableOpacity
              onPress={() => onDelete(schedule)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color={Colors.gray300} />
            </TouchableOpacity>
          )}
        </View>

        {(schedule.startTime || schedule.endTime) && (
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.time}>
              {schedule.startTime ?? ''}
              {schedule.startTime && schedule.endTime ? ' - ' : ''}
              {schedule.endTime ?? ''}
            </Text>
          </View>
        )}

        {schedule.place && (
          <View style={styles.placeRow}>
            <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.place} numberOfLines={1}>
              {schedule.place.address}
            </Text>
          </View>
        )}

        {schedule.memo && (
          <Text style={styles.memo} numberOfLines={2}>
            {schedule.memo}
          </Text>
        )}

        {schedule.cost != null && (
          <Text style={styles.cost}>
            {schedule.cost.toLocaleString('ko-KR')}원
          </Text>
        )}
      </View>

      {/* 드래그 핸들 */}
      <View style={styles.dragHandle}>
        <Ionicons name="reorder-two" size={20} color={Colors.gray300} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.md,
    overflow: 'hidden',
    ...Layout.shadow.sm,
  },
  dragging: {
    opacity: 0.85,
    ...Layout.shadow.lg,
  },
  colorBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: Layout.spacing.md,
    gap: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    flex: 1,
  },
  title: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  place: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    flex: 1,
  },
  memo: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  cost: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.primary,
  },
  dragHandle: {
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.sm,
  },
});
