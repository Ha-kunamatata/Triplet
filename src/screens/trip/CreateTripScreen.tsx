import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
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
import type { TripStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<TripStackParamList, 'CreateTrip'>;

export function CreateTripScreen({ navigation }: Props) {
  const [form, setForm] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    isPublic: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { addTrip } = useTripStore();

  const update = (key: keyof typeof form) => (value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!form.title) newErrors.title = '여행 제목을 입력해주세요.';
    if (!form.destination) newErrors.destination = '여행지를 입력해주세요.';
    if (!form.startDate) newErrors.startDate = '출발일을 입력해주세요.';
    if (!form.endDate) newErrors.endDate = '귀국일을 입력해주세요.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const trip = await tripService.createTrip({
        title: form.title,
        destination: form.destination,
        startDate: form.startDate,
        endDate: form.endDate,
        isPublic: form.isPublic,
      });
      addTrip(trip);
      navigation.replace('TripDetail', { tripId: trip.id });
    } catch {
      setErrors({ title: '여행 생성에 실패했습니다. 다시 시도해주세요.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>새 여행 만들기</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.form}>
          <Input
            label="여행 제목"
            value={form.title}
            onChangeText={update('title')}
            placeholder="ex) 도쿄 벚꽃 여행"
            leftIcon="pencil-outline"
            error={errors.title}
          />
          <Input
            label="여행지"
            value={form.destination}
            onChangeText={update('destination')}
            placeholder="ex) 일본 도쿄"
            leftIcon="location-outline"
            error={errors.destination}
          />
          <Input
            label="출발일"
            value={form.startDate}
            onChangeText={update('startDate')}
            placeholder="YYYY-MM-DD"
            leftIcon="calendar-outline"
            error={errors.startDate}
          />
          <Input
            label="귀국일"
            value={form.endDate}
            onChangeText={update('endDate')}
            placeholder="YYYY-MM-DD"
            leftIcon="calendar-outline"
            error={errors.endDate}
          />

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>공개 여행</Text>
              <Text style={styles.switchHint}>다른 사람들이 이 여행을 볼 수 있어요</Text>
            </View>
            <Switch
              value={form.isPublic}
              onValueChange={update('isPublic')}
              trackColor={{ false: Colors.gray200, true: Colors.primaryLight }}
              thumbColor={form.isPublic ? Colors.primary : Colors.white}
            />
          </View>
        </View>

        <Button
          label="여행 만들기"
          onPress={handleCreate}
          loading={isLoading}
          fullWidth
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flexGrow: 1,
    padding: Layout.spacing.xl,
    gap: Layout.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  form: { gap: Layout.spacing.sm },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.lg,
    marginTop: Layout.spacing.sm,
  },
  switchLabel: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
  },
  switchHint: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
