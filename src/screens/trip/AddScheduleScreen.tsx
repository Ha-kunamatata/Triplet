import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Input } from '@components/common';
import { tripService } from '@services/tripService';
import { useTripStore } from '@store/useTripStore';
import { Colors } from '@constants/colors';
import { FontSize, FontFamily } from '@constants/typography';
import { Layout } from '@constants/layout';
import { SCHEDULE_CATEGORIES } from '@constants/index';
import type { TripStackParamList } from '@navigation/types';
import type { ScheduleCategory } from '@types/index';

type Props = NativeStackScreenProps<TripStackParamList, 'AddSchedule'>;

export function AddScheduleScreen({ navigation, route }: Props) {
  const { tripDayId } = route.params;
  const [form, setForm] = useState({
    title: '',
    category: 'attraction' as ScheduleCategory,
    startTime: '',
    endTime: '',
    memo: '',
    cost: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const { addSchedule } = useTripStore();

  const update = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.title) return;
    setIsLoading(true);
    try {
      const schedule = await tripService.createSchedule(tripDayId, {
        title: form.title,
        category: form.category,
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
        memo: form.memo || undefined,
        cost: form.cost ? Number(form.cost) : undefined,
        order: 0,
      });
      addSchedule(tripDayId, schedule);
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>일정 추가</Text>
        <Button label="저장" onPress={handleSave} loading={isLoading} size="sm" />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Input
          label="일정 이름"
          value={form.title}
          onChangeText={update('title')}
          placeholder="ex) 도쿄 타워 방문"
          leftIcon="pencil-outline"
        />

        {/* 카테고리 선택 */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionLabel}>카테고리</Text>
          <View style={styles.categoryGrid}>
            {SCHEDULE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryChip,
                  form.category === cat.key && styles.activeCategoryChip,
                ]}
                onPress={() => setForm((p) => ({ ...p, category: cat.key as ScheduleCategory }))}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={16}
                  color={form.category === cat.key ? Colors.white : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    form.category === cat.key && styles.activeCategoryLabel,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.timeRow}>
          <View style={styles.flex1}>
            <Input
              label="시작 시간"
              value={form.startTime}
              onChangeText={update('startTime')}
              placeholder="09:00"
              leftIcon="time-outline"
            />
          </View>
          <View style={styles.flex1}>
            <Input
              label="종료 시간"
              value={form.endTime}
              onChangeText={update('endTime')}
              placeholder="11:00"
              leftIcon="time-outline"
            />
          </View>
        </View>

        <Input
          label="예산"
          value={form.cost}
          onChangeText={update('cost')}
          placeholder="0"
          keyboardType="numeric"
          leftIcon="wallet-outline"
          hint="원 단위로 입력해주세요"
        />

        <Input
          label="메모"
          value={form.memo}
          onChangeText={update('memo')}
          placeholder="장소에 대한 메모를 남겨보세요"
          multiline
          numberOfLines={4}
          leftIcon="create-outline"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.md,
  },
  title: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  container: {
    padding: Layout.spacing.xl,
    gap: Layout.spacing.sm,
    paddingBottom: Layout.spacing.xxxl,
  },
  categorySection: { gap: Layout.spacing.xs },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
    marginBottom: Layout.spacing.xs,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.radius.full,
    backgroundColor: Colors.gray100,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  activeCategoryChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },
  activeCategoryLabel: { color: Colors.white },
  timeRow: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
  },
  flex1: { flex: 1 },
});
