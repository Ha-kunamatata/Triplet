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

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const { setUser, setTokens } = useAuthStore();

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = '이메일을 입력해주세요.';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = '올바른 이메일 형식이 아닙니다.';
    if (!password) newErrors.password = '비밀번호를 입력해주세요.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const { user, tokens } = await authService.login({ email, password });
      setTokens(tokens);
      setUser(user);
    } catch {
      setErrors({ email: '이메일 또는 비밀번호가 올바르지 않습니다.' });
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
            <Text style={styles.logo}>Triplet</Text>
            <Text style={styles.subtitle}>나만의 여행 일정을 만들어보세요</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="이메일"
              value={email}
              onChangeText={setEmail}
              placeholder="example@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
              error={errors.email}
            />
            <Input
              label="비밀번호"
              value={password}
              onChangeText={setPassword}
              placeholder="비밀번호를 입력하세요"
              isPassword
              leftIcon="lock-closed-outline"
              error={errors.password}
            />

            <Button
              label="로그인"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              style={styles.loginButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>아직 계정이 없으신가요?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>회원가입</Text>
            </TouchableOpacity>
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
    justifyContent: 'center',
    gap: Layout.spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  logo: {
    fontSize: FontSize.display,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  subtitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  form: {
    gap: Layout.spacing.sm,
  },
  loginButton: {
    marginTop: Layout.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  footerText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  registerLink: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },
});
