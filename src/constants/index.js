export const SCHEDULE_CATEGORIES = [
  { key: 'attraction',    label: '관광',  icon: 'photo_camera',   color: '#3B82F6' },
  { key: 'restaurant',   label: '식당',  icon: 'restaurant',     color: '#EF4444' },
  { key: 'cafe',         label: '카페',  icon: 'local_cafe',     color: '#F59E0B' },
  { key: 'accommodation',label: '숙소',  icon: 'hotel',          color: '#8B5CF6' },
  { key: 'transport',    label: '교통',  icon: 'directions_car', color: '#10B981' },
  { key: 'shopping',     label: '쇼핑',  icon: 'shopping_bag',   color: '#EC4899' },
  { key: 'etc',          label: '기타',  icon: 'more_horiz',     color: '#94A3B8' },
]

export const TRIP_EMOJIS = ['✈️','🗺️','🏖️','🏔️','🌆','🌸','🍜','🎡','🏰','🌅','🎭','🚂']

export const TRIP_STYLES = [
  { key: 'relax',    label: '휴양',  icon: 'beach_access',  color: '#F97316', desc: '느긋하게 쉬며 재충전' },
  { key: 'tour',     label: '관광',  icon: 'photo_camera',  color: '#3B82F6', desc: '명소와 문화 탐방' },
  { key: 'food',     label: '먹방',  icon: 'restaurant',    color: '#EF4444', desc: '현지 미식 탐방' },
  { key: 'shopping', label: '쇼핑',  icon: 'shopping_bag',  color: '#8B5CF6', desc: '쇼핑 & 트렌드' },
  { key: 'mix',      label: '혼합',  icon: 'auto_awesome',  color: '#10B981', desc: '다양하게 즐기기' },
]

export const DEFAULT_CHECKLIST = [
  { id: 'passport',  label: '여권',              category: 'essential', checked: false },
  { id: 'ticket',    label: '항공권 / 교통편',    category: 'essential', checked: false },
  { id: 'hotel',     label: '숙소 예약 확인',      category: 'essential', checked: false },
  { id: 'insurance', label: '여행자 보험',         category: 'essential', checked: false },
  { id: 'money',     label: '현금 / 환전',         category: 'essential', checked: false },
  { id: 'charger',   label: '충전기 / 보조배터리', category: 'packing',   checked: false },
  { id: 'clothes',   label: '옷 / 신발',           category: 'packing',   checked: false },
  { id: 'toiletry',  label: '세면도구',             category: 'packing',   checked: false },
  { id: 'medicine',  label: '상비약',               category: 'packing',   checked: false },
  { id: 'adapter',   label: '멀티어댑터',           category: 'packing',   checked: false },
]

export const CHECKLIST_CATEGORIES = {
  essential: { label: '필수 서류', icon: 'badge',      color: '#EF4444' },
  packing:   { label: '짐 챙기기', icon: 'luggage',    color: '#3B82F6' },
  custom:    { label: '기타',       icon: 'add_circle', color: '#94A3B8' },
}

export const DIARY_MOODS = [
  { key: 'great',   label: '최고', emoji: '😄' },
  { key: 'good',    label: '좋음', emoji: '😊' },
  { key: 'neutral', label: '보통', emoji: '😐' },
  { key: 'bad',     label: '별로', emoji: '😔' },
]

export const DIARY_WEATHERS = [
  { key: 'sunny',  label: '맑음', emoji: '☀️' },
  { key: 'cloudy', label: '흐림', emoji: '☁️' },
  { key: 'rainy',  label: '비',   emoji: '🌧️' },
  { key: 'snowy',  label: '눈',   emoji: '❄️' },
]

export const TRIP_STATUS = {
  upcoming:  { label: '예정',     color: '#3B82F6', bg: '#EFF6FF' },
  ongoing:   { label: '여행 중',  color: '#10B981', bg: '#ECFDF5' },
  completed: { label: '완료',     color: '#94A3B8', bg: '#F1F5F9' },
}
