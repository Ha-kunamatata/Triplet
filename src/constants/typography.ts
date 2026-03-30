import { Platform } from 'react-native';

export const FontFamily = {
  regular: Platform.OS === 'ios' ? 'AppleSDGothicNeo-Regular' : 'NotoSansKR-Regular',
  medium: Platform.OS === 'ios' ? 'AppleSDGothicNeo-Medium' : 'NotoSansKR-Medium',
  semiBold: Platform.OS === 'ios' ? 'AppleSDGothicNeo-SemiBold' : 'NotoSansKR-SemiBold',
  bold: Platform.OS === 'ios' ? 'AppleSDGothicNeo-Bold' : 'NotoSansKR-Bold',
  light: Platform.OS === 'ios' ? 'AppleSDGothicNeo-Light' : 'NotoSansKR-Light',
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,
} as const;

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;
