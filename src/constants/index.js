export const SCHEDULE_CATEGORIES = [
  { key: 'attraction', label: '관광지', icon: 'photo_camera', color: '#4A90E2' },
  { key: 'restaurant', label: '음식점', icon: 'restaurant', color: '#FF6B6B' },
  { key: 'cafe',       label: '카페',   icon: 'coffee',     color: '#A78BFA' },
  { key: 'accommodation', label: '숙소', icon: 'bed',      color: '#34D399' },
  { key: 'transport',  label: '교통',   icon: 'directions_car', color: '#FBBF24' },
  { key: 'shopping',   label: '쇼핑',   icon: 'shopping_bag', color: '#F472B6' },
  { key: 'etc',        label: '기타',   icon: 'more_horiz',  color: '#9CA3AF' },
]

export const TRIP_EMOJIS = ['✈️','🗺️','🏖️','🏔️','🌆','🌸','🍜','🎡','🏰','🌅','🎭','🚂']

export const DIARY_MOODS = [
  { key: 'great',   label: '최고',  emoji: '😄' },
  { key: 'good',    label: '좋음',  emoji: '😊' },
  { key: 'neutral', label: '보통',  emoji: '😐' },
  { key: 'bad',     label: '별로',  emoji: '😔' },
]

export const DIARY_WEATHERS = [
  { key: 'sunny',  label: '맑음', emoji: '☀️' },
  { key: 'cloudy', label: '흐림', emoji: '☁️' },
  { key: 'rainy',  label: '비',   emoji: '🌧️' },
  { key: 'snowy',  label: '눈',   emoji: '❄️' },
]

export const TRIP_STATUS = {
  upcoming:  { label: '예정',     color: '#4A90E2', bg: '#EBF3FC' },
  ongoing:   { label: '여행 중',  color: '#22C55E', bg: '#F0FDF4' },
  completed: { label: '완료',     color: '#9CA3AF', bg: '#F3F4F6' },
}
