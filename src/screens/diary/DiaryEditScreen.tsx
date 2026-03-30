import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '@components/common';
import { diaryService } from '@services/diaryService';
import { Colors } from '@constants/colors';
import { FontSize, FontFamily } from '@constants/typography';
import { Layout } from '@constants/layout';
import { DIARY_MOODS, DIARY_WEATHERS } from '@constants/index';
import type { DiaryStackParamList } from '@navigation/types';
import type { DiaryMood, DiaryWeather } from '@types/index';

type Props = NativeStackScreenProps<DiaryStackParamList, 'DiaryEdit'>;

export function DiaryEditScreen({ navigation, route }: Props) {
  const { tripId, diaryId } = route.params;
  const isEdit = !!diaryId;

  const [form, setForm] = useState({
    title: '',
    content: '',
    mood: undefined as DiaryMood | undefined,
    weather: undefined as DiaryWeather | undefined,
    isPublic: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!form.title || !form.content) return;
    setIsLoading(true);
    try {
      if (isEdit) {
        await diaryService.updateDiary(diaryId, { id: diaryId, ...form });
      } else {
        await diaryService.createDiary(tripId, { tripId, ...form });
      }
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
        <Text style={styles.title}>{isEdit ? '일기 수정' : '일기 쓰기'}</Text>
        <Button label="저장" onPress={handleSave} loading={isLoading} size="sm" />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 기분 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>오늘의 기분</Text>
          <View style={styles.moodRow}>
            {DIARY_MOODS.map((m) => (
              <TouchableOpacity
                key={m.key}
                onPress={() => setForm((p) => ({ ...p, mood: m.key as DiaryMood }))}
                style={[styles.moodChip, form.mood === m.key && styles.activeChip]}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text
                  style={[styles.moodLabel, form.mood === m.key && styles.activeLabel]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 날씨 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>날씨</Text>
          <View style={styles.moodRow}>
            {DIARY_WEATHERS.map((w) => (
              <TouchableOpacity
                key={w.key}
                onPress={() => setForm((p) => ({ ...p, weather: w.key as DiaryWeather }))}
                style={[styles.moodChip, form.weather === w.key && styles.activeChip]}
              >
                <Text style={styles.moodEmoji}>{w.icon}</Text>
                <Text
                  style={[styles.moodLabel, form.weather === w.key && styles.activeLabel]}
                >
                  {w.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 제목 */}
        <TextInput
          style={styles.titleInput}
          value={form.title}
          onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
          placeholder="제목을 입력하세요"
          placeholderTextColor={Colors.gray300}
          maxLength={50}
        />

        {/* 본문 */}
        <TextInput
          style={styles.contentInput}
          value={form.content}
          onChangeText={(v) => setForm((p) => ({ ...p, content: v }))}
          placeholder="오늘의 여행 이야기를 적어보세요..."
          placeholderTextColor={Colors.gray300}
          multiline
          textAlignVertical="top"
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  container: {
    padding: Layout.spacing.xl,
    gap: Layout.spacing.xl,
  },
  section: { gap: Layout.spacing.sm },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: Colors.textSecondary,
  },
  moodRow: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    flexWrap: 'wrap',
  },
  moodChip: {
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.radius.md,
    backgroundColor: Colors.gray100,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 4,
  },
  activeChip: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  moodEmoji: { fontSize: 20 },
  moodLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  activeLabel: {
    color: Colors.primary,
    fontFamily: FontFamily.medium,
  },
  titleInput: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Layout.spacing.md,
  },
  contentInput: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: Colors.textPrimary,
    lineHeight: FontSize.md * 1.8,
    minHeight: 300,
  },
});
