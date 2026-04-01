# Triplet ✈️

나만의 여행 일정 플래너. React + Firebase + GitHub Pages로 구동되는 웹앱.

**라이브 URL**: `https://ha-kunamatata.github.io/Triplet/`

## 기술 스택

| 분류 | 기술 |
|------|------|
| UI | React 18 + Vite |
| 라우팅 | React Router v6 (HashRouter) |
| 데이터베이스 | Firebase Firestore |
| 인증 | Firebase Authentication |
| 호스팅 | GitHub Pages |

## 주요 기능

- **여행 관리** — 여행 생성/조회/삭제, 이모지 커버, D-Day, 상태 자동 계산
- **일정 계획** — Day별 일정 추가·수정·삭제, 카테고리·시간·예산 입력
- **여행 일기** — 기분·날씨와 함께 일기 작성, 수정, 삭제
- **장소 저장** — 가고 싶은 장소 저장·관리

## Firebase 설정 방법

### 1. Firebase 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 새 프로젝트 생성
3. **Authentication** → 이메일/비밀번호 및 Google 로그인 활성화
4. **Firestore Database** → 데이터베이스 생성 (테스트 모드로 시작)

### 2. 환경 변수 설정
`.env.example`을 복사해 `.env.local` 파일 생성 후 Firebase 설정값 입력:

```bash
cp .env.example .env.local
```

Firebase Console → 프로젝트 설정 → 웹 앱 추가에서 config 값을 복사하세요.

### 3. Firestore 인덱스 설정
`firestore.indexes.json`의 인덱스를 Firebase Console에서 생성하거나:
```bash
firebase deploy --only firestore:indexes
```

### 4. GitHub Pages 배포
```bash
npm run deploy
```

GitHub 저장소 Settings → Pages → Source를 `gh-pages` 브랜치로 설정하세요.

## 로컬 개발

```bash
npm install
npm run dev   # http://localhost:5173/Triplet/
```

## Firestore 보안 규칙

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /trips/{tripId} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    match /schedules/{scheduleId} {
      allow read, write: if request.auth != null;
    }
    match /diary/{diaryId} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    match /savedPlaces/{placeId} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
  }
}
```

## 앞으로 개발할 것들

- [ ] 지도 연동 (카카오맵 / 구글맵)
- [ ] 여행 예산 통계 차트
- [ ] 사진 첨부 (Firebase Storage)
- [ ] 여행 공유 기능
- [ ] 오프라인 지원 (PWA)
