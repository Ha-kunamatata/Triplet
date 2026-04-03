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

// ── TripItem 타입 시스템 ──────────────────────────────────────────

export const ITEM_TYPES = {
  FLIGHT:    'FLIGHT',
  STAY:      'STAY',
  PLACE:     'PLACE',
  TRANSPORT: 'TRANSPORT',
  MEMO:      'MEMO',
}

export const ITEM_TYPE_META = {
  FLIGHT:    { label: '항공편',   icon: 'flight',          color: '#D4537E', bg: '#FDF2F8' },
  STAY:      { label: '숙소',     icon: 'hotel',           color: '#378ADD', bg: '#EFF6FF' },
  PLACE:     { label: '장소',     icon: 'location_on',     color: '#1D9E75', bg: '#ECFDF5' },
  TRANSPORT: { label: '이동',     icon: 'directions_car',  color: '#7C3AED', bg: '#F5F3FF' },
  MEMO:      { label: '메모',     icon: 'sticky_note_2',   color: '#F59E0B', bg: '#FFFBEB' },
}

export const TRANSPORT_MODES = [
  { key: 'train',  label: '기차',     icon: 'train' },
  { key: 'bus',    label: '버스',     icon: 'directions_bus' },
  { key: 'car',    label: '자동차',   icon: 'directions_car' },
  { key: 'ferry',  label: '배',       icon: 'directions_boat' },
  { key: 'taxi',   label: '택시',     icon: 'local_taxi' },
  { key: 'walk',   label: '도보',     icon: 'directions_walk' },
  { key: 'subway', label: '지하철',   icon: 'subway' },
  { key: 'other',  label: '기타',     icon: 'more_horiz' },
]

export const KAKAO_CATEGORY_MAP = {
  'FD6': 'restaurant',
  'CE7': 'cafe',
  'AT4': 'attraction',
  'MT1': 'shopping',
  'CS2': 'shopping',
  'AD5': 'stay',
  'CT1': 'activity',
  'SW8': 'transport',
  'BK9': 'other',
}

export const AIRLINES = [
  { code: 'KE', name: '대한항공',      nameEn: 'Korean Air' },
  { code: 'OZ', name: '아시아나항공',  nameEn: 'Asiana Airlines' },
  { code: '7C', name: '제주항공',      nameEn: 'Jeju Air' },
  { code: 'LJ', name: '진에어',        nameEn: 'Jin Air' },
  { code: 'TW', name: '티웨이항공',    nameEn: "T'way Air" },
  { code: 'BX', name: '에어부산',      nameEn: 'Air Busan' },
  { code: 'RS', name: '에어서울',      nameEn: 'Air Seoul' },
  { code: 'ZE', name: '이스타항공',    nameEn: 'Eastar Jet' },
  { code: 'AA', name: '아메리칸항공',  nameEn: 'American Airlines' },
  { code: 'UA', name: '유나이티드항공', nameEn: 'United Airlines' },
  { code: 'DL', name: '델타항공',      nameEn: 'Delta Air Lines' },
  { code: 'BA', name: '영국항공',      nameEn: 'British Airways' },
  { code: 'AF', name: '에어프랑스',    nameEn: 'Air France' },
  { code: 'LH', name: '루프트한자',    nameEn: 'Lufthansa' },
  { code: 'NH', name: '전일본공수',    nameEn: 'ANA' },
  { code: 'JL', name: '일본항공',      nameEn: 'Japan Airlines' },
  { code: 'CX', name: '캐세이퍼시픽', nameEn: 'Cathay Pacific' },
  { code: 'SQ', name: '싱가포르항공', nameEn: 'Singapore Airlines' },
  { code: 'TG', name: '타이항공',      nameEn: 'Thai Airways' },
  { code: 'EK', name: '에미레이트',    nameEn: 'Emirates' },
  { code: 'QR', name: '카타르항공',    nameEn: 'Qatar Airways' },
  { code: 'MH', name: '말레이시아항공', nameEn: 'Malaysia Airlines' },
  { code: 'VN', name: '베트남항공',    nameEn: 'Vietnam Airlines' },
  { code: 'AK', name: '에어아시아',    nameEn: 'AirAsia' },
  { code: 'TR', name: '스쿠트',        nameEn: 'Scoot' },
  { code: 'QF', name: '콴타스항공',    nameEn: 'Qantas' },
]

export const AIRPORTS = [
  // 한국
  { code: 'ICN', city: '서울', name: '인천국제공항', country: 'KR', tz: 'Asia/Seoul' },
  { code: 'GMP', city: '서울', name: '김포국제공항', country: 'KR', tz: 'Asia/Seoul' },
  { code: 'PUS', city: '부산', name: '김해국제공항', country: 'KR', tz: 'Asia/Seoul' },
  { code: 'CJU', city: '제주', name: '제주국제공항', country: 'KR', tz: 'Asia/Seoul' },
  // 일본
  { code: 'NRT', city: '도쿄', name: '나리타국제공항', country: 'JP', tz: 'Asia/Tokyo' },
  { code: 'HND', city: '도쿄', name: '하네다공항', country: 'JP', tz: 'Asia/Tokyo' },
  { code: 'KIX', city: '오사카', name: '간사이국제공항', country: 'JP', tz: 'Asia/Tokyo' },
  { code: 'FUK', city: '후쿠오카', name: '후쿠오카공항', country: 'JP', tz: 'Asia/Tokyo' },
  { code: 'CTS', city: '삿포로', name: '신치토세공항', country: 'JP', tz: 'Asia/Tokyo' },
  { code: 'OKA', city: '오키나와', name: '나하공항', country: 'JP', tz: 'Asia/Tokyo' },
  // 중국/홍콩/대만
  { code: 'PEK', city: '베이징', name: '수도국제공항', country: 'CN', tz: 'Asia/Shanghai' },
  { code: 'PVG', city: '상하이', name: '푸둥국제공항', country: 'CN', tz: 'Asia/Shanghai' },
  { code: 'HKG', city: '홍콩', name: '홍콩국제공항', country: 'HK', tz: 'Asia/Hong_Kong' },
  { code: 'TPE', city: '타이베이', name: '타오위안국제공항', country: 'TW', tz: 'Asia/Taipei' },
  // 동남아
  { code: 'BKK', city: '방콕', name: '수완나품국제공항', country: 'TH', tz: 'Asia/Bangkok' },
  { code: 'DMK', city: '방콕', name: '돈므앙국제공항', country: 'TH', tz: 'Asia/Bangkok' },
  { code: 'SIN', city: '싱가포르', name: '창이국제공항', country: 'SG', tz: 'Asia/Singapore' },
  { code: 'KUL', city: '쿠알라룸푸르', name: '쿠알라룸푸르국제공항', country: 'MY', tz: 'Asia/Kuala_Lumpur' },
  { code: 'DPS', city: '발리', name: '응우라라이국제공항', country: 'ID', tz: 'Asia/Makassar' },
  { code: 'MNL', city: '마닐라', name: '니노이아키노국제공항', country: 'PH', tz: 'Asia/Manila' },
  { code: 'CEB', city: '세부', name: '막탄세부국제공항', country: 'PH', tz: 'Asia/Manila' },
  { code: 'HAN', city: '하노이', name: '노이바이국제공항', country: 'VN', tz: 'Asia/Ho_Chi_Minh' },
  { code: 'SGN', city: '호치민', name: '탄손낫국제공항', country: 'VN', tz: 'Asia/Ho_Chi_Minh' },
  { code: 'DAD', city: '다낭', name: '다낭국제공항', country: 'VN', tz: 'Asia/Ho_Chi_Minh' },
  { code: 'REP', city: '씨엠립', name: '씨엠립국제공항', country: 'KH', tz: 'Asia/Phnom_Penh' },
  // 유럽
  { code: 'CDG', city: '파리', name: '샤를드골국제공항', country: 'FR', tz: 'Europe/Paris' },
  { code: 'LHR', city: '런던', name: '히드로공항', country: 'GB', tz: 'Europe/London' },
  { code: 'FCO', city: '로마', name: '피우미치노공항', country: 'IT', tz: 'Europe/Rome' },
  { code: 'MXP', city: '밀라노', name: '말펜사국제공항', country: 'IT', tz: 'Europe/Rome' },
  { code: 'VCE', city: '베네치아', name: '마르코폴로공항', country: 'IT', tz: 'Europe/Rome' },
  { code: 'BCN', city: '바르셀로나', name: '엘프라트공항', country: 'ES', tz: 'Europe/Madrid' },
  { code: 'MAD', city: '마드리드', name: '바라하스국제공항', country: 'ES', tz: 'Europe/Madrid' },
  { code: 'VIE', city: '빈', name: '빈국제공항', country: 'AT', tz: 'Europe/Vienna' },
  { code: 'ZRH', city: '취리히', name: '취리히공항', country: 'CH', tz: 'Europe/Zurich' },
  { code: 'AMS', city: '암스테르담', name: '스키폴공항', country: 'NL', tz: 'Europe/Amsterdam' },
  { code: 'FRA', city: '프랑크푸르트', name: '프랑크푸르트공항', country: 'DE', tz: 'Europe/Berlin' },
  { code: 'MUC', city: '뮌헨', name: '뮌헨공항', country: 'DE', tz: 'Europe/Berlin' },
  { code: 'PRG', city: '프라하', name: '바츨라프하벨공항', country: 'CZ', tz: 'Europe/Prague' },
  { code: 'BUD', city: '부다페스트', name: '페렌츠리스트국제공항', country: 'HU', tz: 'Europe/Budapest' },
  { code: 'IST', city: '이스탄불', name: '이스탄불공항', country: 'TR', tz: 'Europe/Istanbul' },
  { code: 'ATH', city: '아테네', name: '엘레프테리오스베니젤로스공항', country: 'GR', tz: 'Europe/Athens' },
  // 미주
  { code: 'JFK', city: '뉴욕', name: '존F케네디국제공항', country: 'US', tz: 'America/New_York' },
  { code: 'LAX', city: '로스앤젤레스', name: '로스앤젤레스국제공항', country: 'US', tz: 'America/Los_Angeles' },
  { code: 'SFO', city: '샌프란시스코', name: '샌프란시스코국제공항', country: 'US', tz: 'America/Los_Angeles' },
  { code: 'YVR', city: '밴쿠버', name: '밴쿠버국제공항', country: 'CA', tz: 'America/Vancouver' },
  { code: 'YYZ', city: '토론토', name: '토론토피어슨국제공항', country: 'CA', tz: 'America/Toronto' },
  // 오세아니아/중동
  { code: 'SYD', city: '시드니', name: '킹스포드스미스공항', country: 'AU', tz: 'Australia/Sydney' },
  { code: 'MEL', city: '멜버른', name: '멜버른공항', country: 'AU', tz: 'Australia/Melbourne' },
  { code: 'AKL', city: '오클랜드', name: '오클랜드국제공항', country: 'NZ', tz: 'Pacific/Auckland' },
  { code: 'DXB', city: '두바이', name: '두바이국제공항', country: 'AE', tz: 'Asia/Dubai' },
  { code: 'DOH', city: '도하', name: '하마드국제공항', country: 'QA', tz: 'Asia/Qatar' },
]
