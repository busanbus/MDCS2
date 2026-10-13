# MDCS 프로젝트 작업 맥락

## 프로젝트 개요
운행전 자가점검시스템 (MDCS) - 부산 세진여객 운전기사용 웹 애플리케이션

## 최종 프로젝트 구조
```
MDCS_NEW/
├── index.html          (메인 HTML)
├── app.js              (메인 JavaScript 로직)
├── header.js           (Header 컴포넌트 모듈)
├── styles.css          (모든 CSS 스타일)
├── logo.png            (로고 이미지)
├── bus_illustration.png (버스 일러스트)
└── README.md
```

## 주요 기능
1. 기사님 이름 입력
2. 근무지 선택 (노포/정관)
3. 노선번호 선택
4. 차량번호 선택 (구글 시트 연동)
5. 복장 상태 확인 (양호/불량, 불량 시 사유 입력)
6. 제출 완료

## 기술 스택
- 순수 HTML/CSS/JavaScript (빌드 없이 Live Server로 실행)
- Tailwind CSS CDN 사용
- localStorage로 기사님 이름 저장

## 주요 작업 내역

### 1. 프로젝트 단순화
- Vite 빌드 시스템 제거
- 모든 JavaScript를 app.js로 통합
- Tailwind CSS CDN으로 변경
- 불필요한 파일/폴더 삭제

### 2. Header 모듈화
- header.js로 Header 컴포넌트 분리
- 동적 생성 방식으로 구현

### 3. Breadcrumb 제거 및 정보 모달 추가
- Breadcrumb 영역 제거
- 헤더에 정보 아이콘 버튼(📋) 추가
- 클릭 시 선택 정보 모달 표시

### 4. 복장 상태 확인 페이지 변경
- 사진 업로드 → 복장 상태 확인으로 변경
- 체크리스트 표시
- 양호/불량 버튼
- 불량 시 사유 입력 모달

### 5. 스타일 조정
- Header 레이아웃: Grid 레이아웃 (로고 | 제목 | 버튼)
- Header 높이 조정
- 버튼 크기 및 위치 미세 조정
- 복장 체크리스트 스타일링

## 현재 Header 레이아웃
- Grid 3열: `auto 1fr auto`
- 로고: 오른쪽으로 약간 이동 (margin-left: 0.5rem)
- 제목: 왼쪽으로 약간 이동 (margin-left: -0.5rem)
- 정보 버튼: 크기 1.9rem

## 주요 CSS 클래스
- `.page`: 페이지 컨테이너
- `.card`: 카드 스타일
- `.site-btn`, `.busno-btn`: 근무지/노선 버튼
- `.plate-btn`: 차량번호 버튼
- `.uniform-btn`: 복장 상태 버튼
- `.modal-overlay`, `.modal-box`: 모달 스타일
- `.info-btn`: 헤더 정보 버튼

## 주요 JavaScript 함수
- `showPage(pageIndex)`: 페이지 전환
- `showModal(message, onConfirm)`: 확인 모달
- `showReasonModal()`: 불량 사유 입력 모달
- `showInfoModal()`: 선택 정보 표시 모달
- `initHeader()`: Header 초기화
- `renderBusNoButtons(site)`: 노선 버튼 생성
- `renderPlateGrid()`: 차량번호 그리드 생성

## 외부 연동
- 구글 앱스 스크립트: 차량번호 데이터 로드
  - URL: `https://script.google.com/macros/s/AKfycbxKXmbLSOl64gNdOoYIORQs1fpdHOHZuX7LGypDLlgacjKtNhiVTWef6_pBNNkd2cWE/exec`

## 다음 작업 시 참고사항
- 모든 스타일은 `styles.css`에 통합되어 있음
- Header는 `header.js`에서 동적으로 생성됨
- Tailwind CDN 사용 중 (빌드 불필요)
- Live Server로 바로 실행 가능

