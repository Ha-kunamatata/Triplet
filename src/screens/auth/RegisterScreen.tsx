import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Input } from '@components/common';
import { authService } from '@services/authService';
import { useAuthStore } from '@store/useAuthStore';
import { Colors } from '@constants/colors';
import { FontSize, FontFamily } from '@constants/typography';
import { Layout } from '@constants/layout';
import type { AuthStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const [form, setForm] = useState({ email: '', password: '', passwordConfirm: '', nickname: '' });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { setUser, setTokens } = useAuthStore();

  const update = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const newErrors: Partial<typeof form> = {};
    if (!form.email) newErrors.email = '이메일을 입력해주세요.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = '올바른 이메일 형식이 아닙니다.';
    if (!form.nickname) newErrors.nickname = '닉네임을 입력해주세요.';
    if (!form.password) newErrors.password = '비밀번호를 입력해주세요.';
    else if (form.password.length < 8) newErrors.password = '비밀번호는 8자 이상이어야 합니다.';
    if (form.password !== form.passwordConfirm)
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const { user, tokens } = await authService.register({
        email: form.email,
        password: form.password,
        nickname: form.nickname,
      });
      setTokens(tokens);
      setUser(user);
    } catch {
      setErrors({ email: '이미 사용 중인 이메일입니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backText}>← 뒤로</Text>
            </TouchableOpacity>
            <Text style={styles.title}>회원가입</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="이메일"
              value={form.email}
              onChangeText={update('email')}
              placeholder="example@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
              error={errors.email}
            />
            <Input
              label="닉네임"
              value={form.nickname}
              onChangeText={update('nickname')}
              placeholder="사용할 닉네임을 입력하세요"
              leftIcon="person-outline"
              error={errors.nickname}
            />
            <Input
              label="비밀번호"
              value={form.password}
              onChangeText={update('password')}
              placeholder="8자 이상 입력하세요"
              isPassword
              leftIcon="lock-closed-outline"
              error={errors.password}
              hint="영문, 숫자 조합 8자 이상"
            />
            <Input
              label="비밀번호 확인"
              value={form.passwordConfirm}
              onChangeText={update('passwordConfirm')}
              placeholder="비밀번호를 다시 입력하세요"
              isPassword
              leftIcon="lock-closed-outline"
              error={errors.passwordConfirm}
            />

            <Button
              label="가입하기"
              onPress={handleRegister}
              loading={isLoading}
              fullWidth
              style={styles.registerButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: Layout.spacing.xl,
    gap: Layout.spacing.xxxl,
  },
  header: {
    gap: Layout.spacing.md,
    paddingTop: Layout.spacing.md,
  },
  backButton: { alignSelf: 'flex-start' },
  backText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: Colors.primary,
  },
  title: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  form: { gap: Layout.spacing.sm },
  registerButton: { marginTop: Layout.spacing.md },
});
