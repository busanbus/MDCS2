# 운행전 자가점검시스템 (MDCS)

**MDCS (Mobile Drive Pre-Care System)** - 운행전 자가점검시스템 프로젝트

## 📋 프로젝트 개요

- **목적**: 운전기사가 간단한 자가점검을 통해 근무지, 노선번호, 차량번호, 복장 상태, 건강 상태, 음주 여부를 입력하고 제출
- **완료 시간**: 약 2-3분 내 목표표
- **대상 사용자**: 평균 50~60대 운전기사
- **UI 방식**: 한 화면 = 한 입력 (Wizard UI)
- **기술 스택**: HTML/CSS/JavaScript (Vanilla JS)

## 📁 파일 구조

```
MDCS_NEW/
├── index.html              # 메인 HTML 파일 (모든 페이지 섹션 포함)
├── app.js                 # 메인 애플리케이션 로직
├── header.js              # 헤더 컴포넌트 모듈
├── styles.css             # 커스텀 CSS 스타일
├── logo1.png              # 스플래시 화면 로고
├── logo.png               # 헤더 로고
├── images/                # 페이지 일러스트 이미지
│   ├── bus_illustration.png
│   ├── id-card.png
│   ├── route.png
│   ├── plate-number.png
│   ├── uniform.png
│   ├── health.png
│   └── no-drinks.png
├── notice/                # 공지사항 관련 이미지 (향후 사용)
│   ├── complaint.png
│   ├── free_riding01.png
│   ├── free_riding02.png
│   ├── free_riding03.png
│   └── uniform_request.png
├── README.md              # 프로젝트 문서
├── MDCS_NEW_WorkHistory.md # 작업 이력
├── CONTEXT.md             # 컨텍스트 문서
└── PERFORMANCE_ANALYSIS.md # 성능 분석 문서
```

## 🚀 주요 기능

### ✅ 구현 완료

#### 1. 스플래시 화면
- [x] 앱 시작 시 MDCS 로고와 타이틀 표시
- [x] 1.2초 대기 후 1.2초 페이드아웃 애니메이션
- [x] 탭하여 즉시 닫기 기능

#### 2. 랜딩 페이지
- [x] 메인 일러스트 표시
- [x] 공지사항 게시판 (더보기 버튼 포함)
- [x] "자가점검 시작하기" 버튼
- [x] localStorage에 기사 이름이 있으면 근무지 선택부터, 없으면 이름 입력부터 시작

#### 3. 기사 이름 입력
- [x] 이름 입력 및 localStorage 저장
- [x] 재접속 시 저장된 이름으로 자동 진행

#### 4. 근무지 선택
- [x] 노포 / 정관 선택
- [x] 선택 확인 모달

#### 5. 노선번호 선택
- [x] 근무지별 동적 노선번호 버튼 생성
- [x] 선택 확인 모달

#### 6. 차량번호 선택
- [x] 2열 그리드 레이아웃
- [x] 차량번호 검색 기능 (숫자만 입력)
- [x] Google Apps Script API 연동 (지연 로딩)
- [x] 하드코딩된 차량번호 리스트 (폴백)

#### 7. 복장 상태 확인
- [x] 양호 / 불량 선택
- [x] 불량 선택 시 사유 입력 모달 (최대 100자, 글자수 카운터)

#### 8. 건강 상태 확인
- [x] 양호 / 증상 있음 선택
- [x] 증상 선택 모달 (몸살, 감기, 장염, 기타)
- [x] 기타 선택 시 직접 입력 (최대 100자, 글자수 카운터)

#### 9. 24시간 이내 음주 여부
- [x] 예 / 아니오 선택
- [x] 예 선택 시 경고 모달

#### 10. 제출 완료
- [x] 완료 메시지 표시

#### 11. 기타 기능
- [x] 헤더 컴포넌트 (모듈화, `header.js`)
- [x] 정보 확인 모달 (선택한 정보 전체 확인)
- [x] 이전 버튼 (브라우저 히스토리 활용)
- [x] 모바일 퍼스트 반응형 디자인
- [x] PC 화면에서도 모바일 너비(375px) 고정 표시
- [x] 각 페이지별 일러스트 이미지 (130x130px 통일)
- [x] 입력 필드 자동완성 비활성화

### 🔄 진행 예정
- [ ] 공지사항 동적 데이터 연동
- [ ] Google Apps Script 백엔드 연동 (데이터 제출)
- [ ] 오프라인 지원 (Service Worker)
- [ ] PWA 지원 (앱 설치 기능)
- [ ] 데이터 시각화 대시보드


## 🛠️ 설치 및 실행

### 1. 파일 다운로드
프로젝트 폴더를 다운로드하거나 클론합니다.

### 2. 로컬 서버 실행
정적 파일 서버가 필요합니다. 다음 중 하나를 사용하세요:

#### 방법 1: Python (권장)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### 방법 2: Node.js (http-server)
```bash
npx http-server -p 8000
```

#### 방법 3: Live Server (VS Code 확장)
VS Code에서 `index.html` 우클릭 → "Open with Live Server"

### 3. 브라우저 접속
```
http://localhost:8000
```

### 4. IIS 호스팅 (Windows)
1. IIS 관리자에서 새 웹사이트 추가
2. 물리적 경로를 프로젝트 폴더로 설정
3. 포트 번호 지정 (예: 8080)
4. 브라우저에서 `http://localhost:8080` 접속

## 🎨 디자인 시스템

### 색상 팔레트
- **Primary**: `#2563eb` (파란색)
- **Primary Dark**: `#1d4ed8`
- **Accent**: `#059669` (초록색)
- **Accent Dark**: `#047857`
- **Text**: `#1f2937` (진한 회색)
- **Text Light**: `#6b7280`
- **Background**: `#f9fafb` (연한 회색)
- **Card Background**: `#ffffff` (흰색)

### 타이포그래피
- **기본 폰트**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif`
- **스플래시 폰트**: `Nunito` (Google Fonts)
- **제목 (h1)**: `clamp(1.5rem, 5vw, 1.85rem)` (반응형)
- **본문**: `1rem` (16px)
- **버튼**: `1.1rem` (18px)

### 레이아웃
- **모바일 너비**: 375px (기본)
- **PC 화면**: 375px 고정 (모바일과 동일한 UI)
- **헤더 높이**: 60px
- **카드 패딩**: 1.5rem
- **일러스트 크기**: 130x130px

## 📱 페이지 플로우

```
스플래시 화면 (1.2초)
    ↓
랜딩 페이지 (공지사항 + 시작 버튼)
    ↓
[localStorage에 이름이 있는가?]
    ├─ YES → 근무지 선택 (p0)
    └─ NO  → 기사 이름 입력 (p-driver-name) → 근무지 선택 (p0)
    ↓
노선번호 선택 (p1)
    ↓
차량번호 선택 (p2)
    ↓
복장 상태 확인 (p3)
    ↓
건강 상태 확인 (p4)
    ↓
24시간 이내 음주 여부 (p5)
    ↓
제출 완료 화면
```

## 🔧 주요 설정

### 스플래시 화면
```javascript
// app.js
const SPLASH_AUTO_HIDE_DELAY = 1200; // ms
const SPLASH_FADE_DURATION = 1200;   // ms
const SPLASH_DEBUG_HOLD = false;     // 디버그 모드
```

### localStorage 키
```javascript
const DRIVER_NAME_KEY = 'mdcsDriverName';
```

### 근무지별 노선번호
```javascript
const BUSNO_LIST = {
  '노포': ['29', '80', '300'],
  '정관': ['73', '73 (오전)', '106', '107', '184', '188']
};
```

### Google Apps Script API
```javascript
// 차량번호 데이터 (지연 로딩)
const PLATE_API_URL = 'https://script.google.com/macros/s/AKfycbxKXmbLSOl64gNdOoYIORQs1fpdHOHZuX7LGypDLlgacjKtNhiVTWef6_pBNNkd2cWE/exec';
```

## 📊 성능 최적화

### 현재 구현
- [x] Tailwind CSS CDN 제거 (로딩 속도 개선)
- [x] 이미지 지연 로딩 (`loading="lazy"`)
- [x] Google Apps Script API 지연 로딩 (차량번호 페이지 도달 시)
- [x] 모바일 퍼스트 CSS 설계
- [x] 입력 필드 자동완성 비활성화
- [x] 모바일 탭 하이라이트 제거

### 향후 개선사항
- [ ] 이미지 CDN처리 필요
- [ ] 이미지 WebP 포맷 변환
- [ ] Critical CSS 인라인화
- [ ] Service Worker 캐싱
- [ ] 번들 최적화 (필요 시)

## 🔒 보안 고려사항

### 현재 상태
- 프론트엔드 전용 프로토타입
- 클라이언트 사이드 검증만 구현
- localStorage에 기사 이름만 저장

### 향후 개선사항
- [ ] HTTPS 강제 적용
- [ ] API 요청 제한 (Rate Limiting)
- [ ] 입력값 서버 사이드 검증
- [ ] 민감 정보 암호화

## 🐛 문제 해결

### 일반적인 문제들

**Q: 스플래시 화면이 너무 빨리 사라져요**
A: `app.js`에서 `SPLASH_DEBUG_HOLD = true`로 설정하면 자동으로 사라지지 않습니다.

**Q: 차량번호가 로드되지 않아요**
A: Google Apps Script API 연결을 확인하세요. 네트워크 오류 시 하드코딩된 리스트가 표시됩니다.

**Q: PC에서 화면이 너무 작아요**
A: 의도된 동작입니다. PC에서도 모바일 너비(375px)로 고정되어 모바일과 동일한 UI를 제공합니다.

**Q: localStorage에 저장된 이름을 초기화하고 싶어요**
A: 브라우저 개발자 도구(F12) → Application → Local Storage → `mdcsDriverName` 삭제


