import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EmptyState } from '@components/common';
import { Colors } from '@constants/colors';
import { FontSize, FontFamily } from '@constants/typography';
import { Layout } from '@constants/layout';
import { DIARY_MOODS, DIARY_WEATHERS } from '@constants/index';
import type { DiaryStackParamList } from '@navigation/types';
import type { DiaryEntry } from '@types/index';

type Props = NativeStackScreenProps<DiaryStackParamList, 'DiaryList'>;

// 임시 데이터 - 실제로는 react-query나 store에서 불러옴
const MOCK_ENTRIES: DiaryEntry[] = [];

export function DiaryScreen({ navigation, route }: Props) {
  const { tripId } = route.params;
  const entries = MOCK_ENTRIES;

  const renderEntry = ({ item }: { item: DiaryEntry }) => {
    const mood = DIARY_MOODS.find((m) => m.key === item.mood);
    const weather = DIARY_WEATHERS.find((w) => w.key === item.weather);

    return (
      <TouchableOpacity
        style={styles.entryCard}
        onPress={() => navigation.navigate('DiaryEdit', { tripId, diaryId: item.id })}
        activeOpacity={0.9}
      >
        {item.images[0] && (
          <Image
            source={{ uri: item.images[0].url }}
            style={styles.entryImage}
            contentFit="cover"
          />
        )}
        <View style={styles.entryContent}>
          <View style={styles.entryMeta}>
            <Text style={styles.entryDate}>
              {format(new Date(item.createdAt), 'M월 d일 (E)', { locale: ko })}
            </Text>
            <View style={styles.entryIcons}>
              {mood && <Text style={styles.moodEmoji}>{mood.emoji}</Text>}
              {weather && <Text style={styles.weatherEmoji}>{weather.icon}</Text>}
            </View>
          </View>
          <Text style={styles.entryTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.entryContent2} numberOfLines={2}>
            {item.content}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>여행 일기</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('DiaryEdit', { tripId })}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={renderEntry}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: Layout.spacing.md }} />}
        ListEmptyComponent={
          <EmptyState
            icon="book-outline"
            title="아직 일기가 없어요"
            description="여행의 소중한 순간을 기록해보세요"
            actionLabel="첫 일기 작성하기"
            onAction={() => navigation.navigate('DiaryEdit', { tripId })}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.md,
  },
  title: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  addButton: {
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: Layout.spacing.xl,
    flexGrow: 1,
  },
  entryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.lg,
    overflow: 'hidden',
    ...Layout.shadow.sm,
  },
  entryImage: {
    height: 160,
    width: '100%',
  },
  entryContent: {
    padding: Layout.spacing.md,
    gap: Layout.spacing.xs,
  },
  entryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryDate: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },
  entryIcons: {
    flexDirection: 'row',
    gap: 4,
  },
  moodEmoji: { fontSize: 16 },
  weatherEmoji: { fontSize: 16 },
  entryTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  entryContent2: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: FontSize.sm * 1.6,
  },
});
