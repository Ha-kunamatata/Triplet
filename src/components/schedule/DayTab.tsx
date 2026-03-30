import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Colors } from '@constants/colors';
import { FontSize, FontFamily } from '@constants/typography';
import { Layout } from '@constants/layout';

interface DayTabProps {
  date: string;
  dayNumber: number;
  isSelected: boolean;
  onPress: () => void;
  scheduleCount?: number;
}

export function DayTab({ date, dayNumber, isSelected, onPress, scheduleCount = 0 }: DayTabProps) {
  const parsed = new Date(date);
  const dayOfWeek = format(parsed, 'EEE', { locale: ko });
  const dayOfMonth = format(parsed, 'd');

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.container, isSelected && styles.selected]}
    >
      <Text style={[styles.dayNumber, isSelected && styles.selectedText]}>
        Day {dayNumber}
      </Text>
      <Text style={[styles.date, isSelected && styles.selectedText]}>
        {dayOfMonth}일
      </Text>
      <Text style={[styles.dayOfWeek, isSelected && styles.selectedSubText]}>
        {dayOfWeek}
      </Text>
      {scheduleCount > 0 && (
        <View style={[styles.badge, isSelected && styles.selectedBadge]}>
          <Text style={[styles.badgeText, isSelected && styles.selectedBadgeText]}>
            {scheduleCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.radius.md,
    minWidth: 60,
    gap: 2,
  },
  selected: {
    backgroundColor: Colors.primary,
  },
  dayNumber: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },
  date: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  dayOfWeek: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  selectedText: {
    color: Colors.white,
  },
  selectedSubText: {
    color: 'rgba(255,255,255,0.75)',
  },
  badge: {
    backgroundColor: Colors.gray200,
    borderRadius: Layout.radius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    paddingHorizontal: 4,
  },
  selectedBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  badgeText: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },
  selectedBadgeText: {
    color: Colors.white,
  },
});
