export * from './colors';
export * from './typography';
export * from './layout';
export * from './api';

export const APP_NAME = 'Triplet';

export const SCHEDULE_CATEGORIES = [
  { key: 'attraction', label: '관광지', icon: 'camera' },
  { key: 'restaurant', label: '음식점', icon: 'restaurant' },
  { key: 'cafe', label: '카페', icon: 'cafe' },
  { key: 'accommodation', label: '숙소', icon: 'bed' },
  { key: 'transport', label: '교통', icon: 'car' },
  { key: 'shopping', label: '쇼핑', icon: 'bag' },
  { key: 'etc', label: '기타', icon: 'ellipsis-horizontal' },
] as const;

export const DIARY_MOODS = [
  { key: 'great', label: '최고', emoji: '😄' },
  { key: 'good', label: '좋음', emoji: '😊' },
  { key: 'neutral', label: '보통', emoji: '😐' },
  { key: 'bad', label: '별로', emoji: '😔' },
  { key: 'terrible', label: '최악', emoji: '😢' },
] as const;

export const DIARY_WEATHERS = [
  { key: 'sunny', label: '맑음', icon: '☀️' },
  { key: 'cloudy', label: '흐림', icon: '☁️' },
  { key: 'rainy', label: '비', icon: '🌧️' },
  { key: 'snowy', label: '눈', icon: '❄️' },
  { key: 'windy', label: '바람', icon: '💨' },
] as const;

export const CURRENCIES = [
  { code: 'KRW', symbol: '₩', label: '한국 원' },
  { code: 'USD', symbol: '$', label: '미국 달러' },
  { code: 'JPY', symbol: '¥', label: '일본 엔' },
  { code: 'EUR', symbol: '€', label: '유로' },
  { code: 'CNY', symbol: '¥', label: '중국 위안' },
] as const;
