# Triplet ✈️

트리플(Triple) 앱에서 영감을 받은 나만의 여행 일정 계획 · 기록 앱.

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | React Native + Expo (SDK 51) |
| 언어 | TypeScript |
| 네비게이션 | React Navigation v6 (Stack + BottomTab) |
| 상태 관리 | Zustand |
| 서버 상태 | TanStack Query (React Query) |
| HTTP 클라이언트 | Axios |
| 날짜 처리 | date-fns |
| 스토리지 | Expo SecureStore (토큰) + AsyncStorage (설정) |

## 프로젝트 구조

```
src/
├── components/          # 재사용 UI 컴포넌트
│   ├── common/          # Button, Input, Card, EmptyState, LoadingSpinner
│   ├── trip/            # TripCard
│   ├── place/           # PlaceCard
│   └── schedule/        # ScheduleItem, DayTab
│
├── screens/             # 화면 컴포넌트
│   ├── auth/            # LoginScreen, RegisterScreen
│   ├── home/            # HomeScreen
│   ├── trip/            # TripList, TripDetail, CreateTrip, AddSchedule
│   ├── place/           # PlaceSearch
│   └── diary/           # DiaryScreen, DiaryEditScreen
│
├── navigation/          # 네비게이터 구성
│   ├── RootNavigator    # 인증 상태에 따른 분기
│   ├── AuthNavigator    # 로그인/회원가입 스택
│   ├── MainTabNavigator # 홈/여행/장소/프로필 탭
│   ├── TripStackNavigator
│   ├── PlaceStackNavigator
│   └── types.ts         # 네비게이션 파라미터 타입
│
├── store/               # Zustand 전역 상태
│   ├── useAuthStore     # 사용자 인증 상태
│   ├── useTripStore     # 여행 목록 및 일정
│   └── usePlaceStore    # 장소 검색 및 저장
│
├── services/            # API 통신 레이어
│   ├── api.ts           # Axios 인스턴스 + 토큰 자동 갱신
│   ├── authService      # 로그인/회원가입/로그아웃
│   ├── tripService      # 여행 CRUD, 일정 CRUD
│   ├── placeService     # 장소 검색, 저장
│   └── diaryService     # 여행 일기 CRUD
│
├── hooks/               # 커스텀 훅 (React Query 연동)
│   ├── useAuth          # 자동 로그인(bootstrap), 로그아웃
│   ├── useTrips         # 여행 조회/생성/삭제
│   └── usePlaces        # 장소 저장/토글
│
├── types/               # TypeScript 타입 정의
│   ├── user.ts
│   ├── trip.ts
│   ├── place.ts
│   └── diary.ts
│
├── constants/           # 앱 전역 상수
│   ├── colors.ts        # 컬러 팔레트
│   ├── typography.ts    # 폰트 크기/패밀리
│   ├── layout.ts        # 간격, 그림자, 반경
│   └── api.ts           # API 엔드포인트
│
└── utils/               # 유틸리티 함수
    ├── dateUtils        # 날짜 포맷, D-Day, 여행 기간
    ├── formatUtils      # 통화, 전화번호, 텍스트 처리
    └── storageUtils     # AsyncStorage 래퍼
```

## 주요 기능

- **여행 관리** : 여행 생성/조회/수정/삭제, 상태별 필터링 (예정/진행중/완료)
- **일정 계획** : Day별 일정 추가·편집·재정렬, 카테고리·시간·예산 설정
- **장소 검색** : 키워드 검색, 최근 검색어, 장소 저장/북마크
- **여행 일기** : 기분·날씨와 함께 여행 기록 작성, 사진 첨부
- **예산 관리** : 항목별 지출 추가, 총 예산 대비 현황 (예정)
- **여행 공유** : 공개/비공개 설정, 멤버 초대 (예정)

## 개발 환경 설정

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm start

# iOS 시뮬레이터
npm run ios

# Android 에뮬레이터
npm run android
```

### 환경 변수

프로젝트 루트에 `.env` 파일을 만들고 아래 항목을 설정하세요.

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

## 앞으로 개발할 것들

- [ ] 지도 뷰 (react-native-maps)
- [ ] 여행 멤버 초대 & 공동 편집
- [ ] 예산 관리 상세 화면
- [ ] 장소 상세 화면 (리뷰, 영업시간)
- [ ] 프로필 화면
- [ ] 푸시 알림
- [ ] 오프라인 지원
