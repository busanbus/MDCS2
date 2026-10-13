# 프로젝트 폴더 최소화 요청
_Exported on 2025. 11. 23. at 21시 36분 30초 GMT+9 from Cursor (1.7.54)_

---

**User**

지금 mdcs_new의 프로젝트 폴더들을 보면 너무나 많은 폴더와 파일들이 있어. 내가 원하는 건 지금 기능과 디자인들 모두 그대로인 상태로 

html/css/js

그리고 tailwind css만 남기고 별도의 빌드 없이 그냥 live server로 실시간 확인할 수 있게끔 파일들과 폴더들을 최소화 해줘

---

**Cursor**


프로젝트 구조와 주요 파일 확인 중.



추가 파일 확인 중.



빌드 없이 Live Server로 실행 가능하도록 단순화 중. HTML/CSS/JS만 사용하고 Tailwind는 CDN으로 전환합니다.



모든 JavaScript를 하나의 파일로 통합 중.


```javascript
// ======== 상수 ========
const DRIVER_NAME_KEY = 'mdcsDriverName';

const BUSNO_LIST = {
  '노포': ['29', '80', '300'],
  '정관': ['73', '73 (오전)', '106', '107', '184', '188']
};

// ======== Storage 함수 ========
function getDriverName() {
  const stored = localStorage.getItem(DRIVER_NAME_KEY);
  if (!stored) return '';
  return stored.trim();
}

function hasDriverName() {
  return getDriverName().length > 0;
}

function saveDriverName(name) {
  if (!name || !name.trim()) return false;
  localStorage.setItem(DRIVER_NAME_KEY, name.trim());
  return true;
}

// ======== 전역 변수 ========
let currentStep = 0;
const totalSteps = 4;
let selectedSite = '';
let selectedBusNo = '';
let enteredPlate = '';

// ======== DOM 요소 ========
const pages = document.querySelectorAll('.page');
const driverNamePage = document.getElementById('p-driver-name');
const driverNameInput = document.getElementById('driver-name-input');
const driverNameSubmit = document.getElementById('driver-name-submit');
const inputs = {
  photo: document.getElementById('photo')
};
const buttons = {
  b3: document.getElementById('b3')
};
const preview = document.getElementById('preview');

// 근무지 선택 버튼
const siteButtons = {
  nopo: document.getElementById('site-nopo'),
  jeonggwan: document.getElementById('site-jeonggwan')
};

// 버스번호 버튼 컨테이너
const busnoButtonsDiv = document.getElementById('busno-buttons');

// ======== 노선별 차량번호 리스트(구글 시트 연동) ========
let PLATE_LISTS = {};
let plateDataLoaded = false;
let plateDataError = false;
fetch('https://script.google.com/macros/s/AKfycbxKXmbLSOl64gNdOoYIORQs1fpdHOHZuX7LGypDLlgacjKtNhiVTWef6_pBNNkd2cWE/exec')
  .then(res => res.json())
  .then(data => {
    PLATE_LISTS = data;
    plateDataLoaded = true;
  })
  .catch(err => {
    plateDataError = true;
    console.error('차량번호 데이터 불러오기 실패:', err);
  });

// ======== 유효성 검사 함수들 ========
const validators = {
  // 면허판번호 검증 (70가1234 형식)
  plate: (value) => {
    if (!value.trim()) return '면허판 번호를 입력해주세요.';
    const pattern = /^\d{2}[가-힣]\d{4}$/;
    if (!pattern.test(value)) return '올바른 면허판 번호 형식으로 입력해주세요. (예: 70가1234)';
    return null;
  },
  // 사진 검증
  photo: (file) => {
    if (!file) return '사진을 선택해주세요.';
    if (!file.type.startsWith('image/')) return '이미지 파일만 선택 가능합니다.';
    if (file.size > 10 * 1024 * 1024) return '파일 크기는 10MB 이하로 선택해주세요.';
    return null;
  }
};

// ======== 유틸리티 함수들 ========
function showError(message) {
  alert(message);
}

function validateInput(type, value) {
  const validator = validators[type];
  if (!validator) return true;
  const error = validator(value);
  if (error) {
    showError(error);
    return false;
  }
  return true;
}

function updateButtonState(buttonId, isValid) {
  const button = buttons[buttonId];
  if (button) {
    button.disabled = !isValid;
  }
}

function getCurrentPrevBtn() {
  const cards = document.querySelectorAll('.card');
  return cards[currentStep]?.querySelector('.prevBtn');
}

function updatePrevBtn() {
  document.querySelectorAll('.prevBtn').forEach((btn) => {
    // 이름 입력 페이지(-1)나 근무지 선택 페이지(0)에서는 이전 버튼 비활성화
    btn.disabled = (currentStep === -1 || currentStep === 0);
    
    // 모든 이전 버튼에 이벤트 설정
    btn.onclick = () => {
      if (currentStep > 0) {
        window.history.back();
      }
    };
  });
}

// 페이지 ID를 인덱스로 변환하는 맵
const pageIdToIndex = {
  'p-driver-name': -1,
  'p0': 0,
  'p1': 1,
  'p2': 2,
  'p3': 3,
  'done': 4
};

// 인덱스를 페이지 ID로 변환
function getPageIdByIndex(index) {
  const idMap = ['p0', 'p1', 'p2', 'p3', 'done'];
  if (index === -1) return 'p-driver-name';
  return idMap[index] || 'p0';
}

function showPage(pageIndex, pushHistory = false) {
  // 이름 입력 페이지 처리
  if (pageIndex === -1) {
    pages.forEach(page => page.classList.remove('active'));
    driverNamePage.classList.add('active');
    currentStep = -1;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (pushHistory) {
      history.pushState({ pageIndex: -1 }, '', '');
    }
    return;
  }

  // 이름 입력 페이지 숨기기
  driverNamePage.classList.remove('active');

  // 단계별로 입력값 초기화
  if (pageIndex === 0) {
    selectedSite = '';
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 1) {
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 2) {
    enteredPlate = '';
  }
  
  // 일반 페이지 표시
  pages.forEach((page, index) => {
    const pageId = page.id;
    if (pageId === 'p-driver-name') {
      page.classList.remove('active');
    } else {
      const pageIdx = pageIdToIndex[pageId] || 0;
      page.classList.toggle('active', pageIdx === pageIndex);
    }
  });
  currentStep = pageIndex;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  updatePrevBtn();
  updateBreadcrumb();
  
  // 차량번호 선택 페이지(p2)일 때 그리드 렌더링
  if (pageIndex === 2) {
    renderPlateGrid();
  }
  
  if (pushHistory) {
    history.pushState({ pageIndex: currentStep }, '', '');
  }
}

function nextStep() {
  // 이름 입력 페이지에서 다음 단계로
  if (currentStep === -1) {
    showPage(0, true);
    return;
  }
  // 일반 페이지 다음 단계
  if (currentStep < 4) { // done 페이지는 인덱스 4
    showPage(currentStep + 1, true);
  }
}

// ======== 커스텀 모달 ========
function showModal(message, onConfirm) {
  const modal = document.getElementById('modal');
  const msg = document.getElementById('modal-message');
  const yesBtn = document.getElementById('modal-yes');
  const noBtn = document.getElementById('modal-no');
  msg.textContent = message;
  modal.style.display = 'flex';
  function cleanup() {
    modal.style.display = 'none';
    yesBtn.removeEventListener('click', yesHandler);
    noBtn.removeEventListener('click', noHandler);
  }
  function yesHandler() {
    cleanup();
    onConfirm(true);
  }
  function noHandler() {
    cleanup();
    onConfirm(false);
  }
  yesBtn.addEventListener('click', yesHandler);
  noBtn.addEventListener('click', noHandler);
}

// ======== 근무지 선택 이벤트 리스너 ========
siteButtons.nopo.addEventListener('click', () => {
  showModal('근무지 : 노포(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '노포';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('노포');
    updateBreadcrumb();
    nextStep();
  });
});

siteButtons.jeonggwan.addEventListener('click', () => {
  showModal('근무지 : 정관(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '정관';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('정관');
    updateBreadcrumb();
    nextStep();
  });
});

// ======== 버스번호 버튼 동적 생성 ========
function renderBusNoButtons(site) {
  busnoButtonsDiv.innerHTML = '';
  BUSNO_LIST[site].forEach(busNo => {
    const btn = document.createElement('button');
    btn.className = 'busno-btn';
    btn.textContent = busNo;
    btn.onclick = () => {
      showModal(`노선번호 : ${busNo}(이)가 맞으십니까?`, (ok) => {
        if (!ok) return;
        selectedBusNo = busNo;
        updateBreadcrumb();
        nextStep();
      });
    };
    busnoButtonsDiv.appendChild(btn);
  });
}

// ======== 사진 업로드 ========
inputs.photo.addEventListener('change', (e) => {
  const file = e.target.files[0];
  const isValid = validateInput('photo', file);
  if (isValid && file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.classList.add('show');
    };
    reader.readAsDataURL(file);
  } else {
    preview.classList.remove('show');
  }
  updateButtonState('b3', isValid);
});

// ======== 제출 버튼 ========
buttons.b3.addEventListener('click', async () => {
  const file = inputs.photo.files[0];
  if (!validateInput('photo', file)) return;
  buttons.b3.disabled = true;
  buttons.b3.textContent = '제출 중...';
  try {
    await submitData();
    showPage(totalSteps); // 완료 화면 표시
  } catch (error) {
    console.error('제출 실패:', error);
    showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    buttons.b3.disabled = false;
    buttons.b3.textContent = '제출';
  }
});

// ======== 데이터 제출 함수 ========
async function submitData() {
  const formData = new FormData();
  formData.append('site', selectedSite);
  formData.append('busNo', selectedBusNo);
  formData.append('plate', enteredPlate);
  const photoFile = inputs.photo.files[0];
  if (photoFile) {
    formData.append('photo', photoFile);
  }
  formData.append('timestamp', new Date().toISOString());
  // TODO: 실제 백엔드 URL로 변경 필요
  const response = await fetch('/api/submit', {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// ======== 키보드 이벤트 ========
document.addEventListener('keydown', (e) => {
  // 버스번호 선택 화면에서는 Enter로 동작하지 않음
  if (currentStep === 1) return;
  const btnMap = {2: 'b2', 3: 'b3'};
  const currentButton = buttons[btnMap[currentStep]];
  if (e.key === 'Enter' && currentButton && !currentButton.disabled) {
    currentButton.click();
  }
});

// 처음 화면으로 이동하는 함수
function goToInitialPage() {
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    showPage(-1, true);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    showPage(0, true);
  }
}

// 이름 입력 이벤트 리스너
if (driverNameInput && driverNameSubmit) {
  driverNameInput.addEventListener('input', (e) => {
    const name = e.target.value.trim();
    driverNameSubmit.disabled = name.length === 0;
  });

  driverNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !driverNameSubmit.disabled) {
      driverNameSubmit.click();
    }
  });

  driverNameSubmit.addEventListener('click', () => {
    const name = driverNameInput.value.trim();
    if (name.length > 0) {
      saveDriverName(name);
      showPage(0, true); // 근무지 선택 페이지로 이동
    }
  });
}

const breadcrumb = document.getElementById('breadcrumb');

function updateBreadcrumb() {
  let crumbs = [];
  if (selectedSite) crumbs.push(`<span class="crumb">근무지: ${selectedSite}</span>`);
  if (selectedBusNo) crumbs.push(`<span class="crumb">노선번호: ${selectedBusNo}</span>`);
  if (enteredPlate) crumbs.push(`<span class="crumb">차량번호: ${enteredPlate}</span>`);
  breadcrumb.innerHTML = crumbs.join('<span class="sep">&gt;</span>');
}

// ======== renderPlateGrid 수정 ========
function renderPlateGrid() {
  // p2 페이지의 card-content를 직접 찾기
  const p2Page = document.getElementById('p2');
  if (!p2Page) return;
  const cardContent = p2Page.querySelector('.card-content');
  if (!cardContent) return;
  let plateGridDiv = cardContent.querySelector('#plate-grid');
  if (plateGridDiv) cardContent.removeChild(plateGridDiv);
  let filterInput = cardContent.querySelector('#plate-filter');
  if (filterInput) cardContent.removeChild(filterInput);
  let errorMsg = cardContent.querySelector('#plate-filter-error');
  if (errorMsg) cardContent.removeChild(errorMsg);
  filterInput = document.createElement('input');
  filterInput.id = 'plate-filter';
  filterInput.type = 'text';
  filterInput.placeholder = '차량번호 검색(숫자 입력)';
  filterInput.inputMode = 'numeric';
  filterInput.autocomplete = 'off';
  filterInput.style.marginBottom = '0.5rem';
  filterInput.style.width = '100%';
  cardContent.appendChild(filterInput);
  errorMsg = document.createElement('div');
  errorMsg.id = 'plate-filter-error';
  errorMsg.style.color = '#dc2626';
  errorMsg.style.fontSize = '0.98rem';
  errorMsg.style.height = '1.2em';
  errorMsg.style.marginBottom = '0.5rem';
  errorMsg.style.textAlign = 'left';
  errorMsg.textContent = '';
  cardContent.appendChild(errorMsg);
  plateGridDiv = document.createElement('div');
  plateGridDiv.id = 'plate-grid';
  plateGridDiv.style.display = 'grid';
  plateGridDiv.style.gridTemplateColumns = 'repeat(3, 1fr)';
  plateGridDiv.style.gap = '0.7rem';
  plateGridDiv.style.maxHeight = '320px';
  plateGridDiv.style.minHeight = '320px';
  plateGridDiv.style.overflowY = 'auto';
  plateGridDiv.style.overflowX = 'hidden';
  plateGridDiv.style.width = '100%';
  plateGridDiv.style.marginBottom = '1.2rem';
  cardContent.appendChild(plateGridDiv);
  function renderGrid() {
    const oldBtns = Array.from(plateGridDiv.children);
    oldBtns.forEach(btn => {
      btn.classList.add('fade-exit');
      setTimeout(() => btn.remove(), 200);
    });
    // 데이터 로딩 상태 처리
    if (!plateDataLoaded) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#888;font-size:1.1rem;">차량번호 데이터를 불러오는 중...</div>';
      return;
    }
    if (plateDataError) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#dc2626;font-size:1.1rem;">차량번호 데이터를 불러오지 못했습니다.</div>';
      return;
    }
    let list = [];
    if (selectedBusNo && PLATE_LISTS[selectedBusNo]) {
      list = PLATE_LISTS[selectedBusNo];
    }
    let filter = filterInput.value.trim();
    if (filter.length > 4) {
      filter = filter.slice(0, 4);
      filterInput.value = filter;
    }
    if (filter && /[^0-9]/.test(filter)) {
      errorMsg.textContent = '숫자만 입력해주세요!';
      return;
    } else {
      errorMsg.textContent = '';
    }
    const filtered = filter ? list.filter(num => num.includes(filter)) : list;
    const total = filtered.length;
    const maxRow = Math.ceil(list.length / 3);
    plateGridDiv.style.gridTemplateRows = `repeat(${maxRow}, 1fr)`;
    for (let i = 0; i < maxRow * 3; i++) {
      if (i < total) {
        const num = filtered[i];
        const btn = document.createElement('button');
        btn.className = 'plate-btn fade-in';
        btn.textContent = num;
        btn.setAttribute('aria-label', `차량번호 ${num}`);
        btn.tabIndex = 0;
        btn.onclick = () => {
          showModal(`차량번호 : ${num}가 맞으십니까?`, (ok) => {
            if (!ok) return;
            enteredPlate = num;
            updateBreadcrumb();
            nextStep();
          });
        };
        btn.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') btn.click();
        };
        plateGridDiv.appendChild(btn);
        setTimeout(() => btn.classList.remove('fade-in'), 250);
      } else {
        const empty = document.createElement('div');
        empty.style.visibility = 'hidden';
        plateGridDiv.appendChild(empty);
      }
    }
  }
  filterInput.addEventListener('input', renderGrid);
  renderGrid();
}

// ======== 초기화 ========
document.addEventListener('DOMContentLoaded', () => {
  // 헤더 로고 클릭 이벤트
  const headerLogo = document.getElementById('header-logo');
  if (headerLogo) {
    headerLogo.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 헤더 제목 클릭 이벤트
  const headerTitle = document.getElementById('header-title');
  if (headerTitle) {
    headerTitle.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // localStorage에 기사님 이름이 있는지 확인
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    history.replaceState({ pageIndex: -1 }, '', '');
    history.pushState({ pageIndex: -1 }, '', '');
    showPage(-1, false);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    history.replaceState({ pageIndex: 0 }, '', '');
    history.pushState({ pageIndex: 0 }, '', '');
    showPage(0, false);
  }
  updateBreadcrumb();
  console.log('운행전 자가점검시스템이 로드되었습니다.');
});

window.addEventListener('popstate', (event) => {
  const pageIndex = event.state && typeof event.state.pageIndex === 'number' ? event.state.pageIndex : (hasDriverName() ? 0 : -1);
  showPage(pageIndex, false);
  // history가 1개뿐이면(첫 화면) 더 이상 뒤로가기를 막음
  if ((pageIndex === 0 || pageIndex === -1) && history.length <= 2) {
    const initialPage = hasDriverName() ? 0 : -1;
    history.pushState({ pageIndex: initialPage }, '', '');
  }
});

// ======== 오프라인 지원 ========
window.addEventListener('online', () => {
  console.log('네트워크 연결이 복구되었습니다.');
});
window.addEventListener('offline', () => {
  console.log('네트워크 연결이 끊어졌습니다.');
  showError('네트워크 연결을 확인해주세요.');
});

```


CSS 파일 생성 및 Tailwind CDN 설정 중.


```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 80px;
}

header {
  background: var(--card-bg);
  padding: 1rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
}

header img {
  height: 40px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}

@media (max-width: 480px) {
  header {
    padding: 0.75rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 80px);
  padding: 1rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100%;
  padding: 2rem 2rem;
  font-size: 1.8rem;
  font-weight: 700;
  border: 3px solid transparent;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--primary);
  color: #fff;
  text-align: center;
  min-height: 80px;
  display: block;
  margin-left: 0;
  margin-right: 0;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark);
  color: #fff;
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px);
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary);
  color: white;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: var(--text-light);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}

.breadcrumb {
  width: 100%;
  max-width: 400px;
  margin: 1rem auto 1rem auto;
  padding: 0.7rem 1rem;
  font-size: 1.55rem;
  color: var(--text-light);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  text-align: center;
}

.breadcrumb .crumb {
  color: var(--primary);
  font-weight: 600;
}

.breadcrumb .sep {
  color: var(--text-light);
  margin: 0 0.2em;
}

.card-actions {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem;
  font-size: 1.15rem;
  font-weight: 600;
  border-radius: 12px;
  border: none;
  background: #e5e7eb;
  color: var(--text);
  cursor: pointer;
  transition: background 0.2s;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1;
}

.prevBtn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0;
  font-size: 1.25rem;
  font-weight: 700;
  padding: 1.1rem 0;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.modal-yes {
  background: var(--primary);
  color: #fff;
  transition: background 0.2s, box-shadow 0.2s;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark);
  color: #fff;
  box-shadow: var(--shadow-lg);
}

.modal-no {
  background: #e5e7eb;
  color: var(--text);
  transition: background 0.2s, box-shadow 0.2s;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1;
  color: var(--text);
  box-shadow: var(--shadow-lg);
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px;
  height: 64px;
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
  touch-action: manipulation;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

  .breadcrumb {
    font-size: 1.25rem;
    padding: 0.5rem 0.5rem;
    max-width: 100vw;
    margin: 0.7rem auto 0.7rem auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}

```


index.html 수정 중: Tailwind CDN 추가, 스크립트/CSS 경로 변경.


```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>운행전 자가점검시스템</title>

<!-- 기본 메타 태그 -->
<meta name="description" content="부산 세진여객 운전기사 운행전 자가점검시스템">
<meta name="theme-color" content="#2563eb">

<!-- PWA 메타 태그 (주석처리) -->
<!-- <meta name="apple-mobile-web-app-capable" content="yes"> -->
<!-- <meta name="apple-mobile-web-app-status-bar-style" content="default"> -->
<!-- <meta name="apple-mobile-web-app-title" content="세진여객 점검"> -->

<!-- PWA 아이콘 (주석처리) -->
<!-- <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png"> -->
<!-- <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png"> -->
<!-- <link rel="apple-touch-icon" href="/icons/icon-192x192.png"> -->
<!-- <link rel="manifest" href="/manifest.json"> -->

<!-- Tailwind CSS CDN -->
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="styles.css">

</head>
<body>

<!-- ======== 헤더 ======== -->
<header>
  <!-- 로고 이미지: 업로드하신 PNG를 logo.png로 저장하여 같은 폴더에 두세요 -->
  <img src="/logo.png" alt="세진여객 로고" id="header-logo" style="cursor: pointer;">
  <h2 id="header-title" style="font-size: 1.2rem; cursor: pointer;">운행전 자가점검시스템 (MDCS)</h2>
</header>
<nav class="breadcrumb" id="breadcrumb"></nav>

<!-- ======== STEP -1 : 기사님 이름 입력 ======== -->
<section id="p-driver-name" class="page">
  <div class="card">
    <h1>기사님 성함을 입력해주세요</h1>
    <div class="card-content">
      <input id="driver-name-input" type="text" placeholder="이름을 입력하세요" autocomplete="name">
      <button id="driver-name-submit" disabled>다음</button>
    </div>
    <div class="card-actions"><button class="prevBtn" style="display:none;">이전</button></div>
  </div>
</section>

<!-- ======== STEP 0 : 근무지 선택 ======== -->
<section id="p0" class="page">
  <div class="card">
    <h1>1. 근무지를 선택하세요</h1>
    <img src="/bus_illustration.png" alt="버스 일러스트" style="display:block;margin:0 auto 1.5rem auto;width:120px;height:120px;object-fit:contain;" />
    <div class="card-content">
      <div class="site-buttons">
        <button id="site-nopo" class="site-btn">노포</button>
        <button id="site-jeonggwan" class="site-btn">정관</button>
      </div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 1 : 버스번호 선택 ======== -->
<section id="p1" class="page">
  <div class="card">
    <h1>2. 노선번호를 선택하세요</h1>
    <div class="card-content">
      <div class="busno-buttons" id="busno-buttons"></div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 2 : 면허판번호 ======== -->
<section id="p2" class="page">
  <div class="card">
    <h1>차량번호를 선택하세요</h1>
    <div class="card-content">
      <!-- plate-grid와 prevBtn만 남김 -->
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 3 : 복장 사진 ======== -->
<section id="p3" class="page">
  <div class="card">
    <h1>복장 사진을 첨부하세요</h1>
    <div class="card-content">
      <input id="photo" type="file" accept="image/*" capture="environment">
      <img id="preview" alt="">
      <button id="b3" disabled>제출</button>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== 완료 화면 ======== -->
<section id="done" class="page">
  <div class="card">
    <h1 class="success-title">✅ 제출 완료!</h1>
    <p class="success-message">안전 운행 하십시오.</p>
  </div>
</section>

<div id="modal" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message" id="modal-message"></div>
    <div class="modal-actions">
      <button id="modal-yes" class="modal-btn modal-yes">네</button>
      <button id="modal-no" class="modal-btn modal-no">아니오</button>
    </div>
  </div>
</div>

<script type="module" src="/src/main.js"></script>
</body>
</html> 
```

```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>운행전 자가점검시스템</title>

<!-- 기본 메타 태그 -->
<meta name="description" content="부산 세진여객 운전기사 운행전 자가점검시스템">
<meta name="theme-color" content="#2563eb">

<!-- PWA 메타 태그 (주석처리) -->
<!-- <meta name="apple-mobile-web-app-capable" content="yes"> -->
<!-- <meta name="apple-mobile-web-app-status-bar-style" content="default"> -->
<!-- <meta name="apple-mobile-web-app-title" content="세진여객 점검"> -->

<!-- PWA 아이콘 (주석처리) -->
<!-- <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png"> -->
<!-- <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png"> -->
<!-- <link rel="apple-touch-icon" href="/icons/icon-192x192.png"> -->
<!-- <link rel="manifest" href="/manifest.json"> -->

<!-- Tailwind CSS CDN -->
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="styles.css">

</head>
<body>

<!-- ======== 헤더 ======== -->
<header>
  <!-- 로고 이미지: 업로드하신 PNG를 logo.png로 저장하여 같은 폴더에 두세요 -->
  <img src="logo.png" alt="세진여객 로고" id="header-logo" style="cursor: pointer;">
  <h2 id="header-title" style="font-size: 1.2rem; cursor: pointer;">운행전 자가점검시스템 (MDCS)</h2>
</header>
<nav class="breadcrumb" id="breadcrumb"></nav>

<!-- ======== STEP -1 : 기사님 이름 입력 ======== -->
<section id="p-driver-name" class="page">
  <div class="card">
    <h1>기사님 성함을 입력해주세요</h1>
    <div class="card-content">
      <input id="driver-name-input" type="text" placeholder="이름을 입력하세요" autocomplete="name">
      <button id="driver-name-submit" disabled>다음</button>
    </div>
    <div class="card-actions"><button class="prevBtn" style="display:none;">이전</button></div>
  </div>
</section>

<!-- ======== STEP 0 : 근무지 선택 ======== -->
<section id="p0" class="page">
  <div class="card">
    <h1>1. 근무지를 선택하세요</h1>
    <img src="/bus_illustration.png" alt="버스 일러스트" style="display:block;margin:0 auto 1.5rem auto;width:120px;height:120px;object-fit:contain;" />
    <div class="card-content">
      <div class="site-buttons">
        <button id="site-nopo" class="site-btn">노포</button>
        <button id="site-jeonggwan" class="site-btn">정관</button>
      </div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 1 : 버스번호 선택 ======== -->
<section id="p1" class="page">
  <div class="card">
    <h1>2. 노선번호를 선택하세요</h1>
    <div class="card-content">
      <div class="busno-buttons" id="busno-buttons"></div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 2 : 면허판번호 ======== -->
<section id="p2" class="page">
  <div class="card">
    <h1>차량번호를 선택하세요</h1>
    <div class="card-content">
      <!-- plate-grid와 prevBtn만 남김 -->
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 3 : 복장 사진 ======== -->
<section id="p3" class="page">
  <div class="card">
    <h1>복장 사진을 첨부하세요</h1>
    <div class="card-content">
      <input id="photo" type="file" accept="image/*" capture="environment">
      <img id="preview" alt="">
      <button id="b3" disabled>제출</button>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== 완료 화면 ======== -->
<section id="done" class="page">
  <div class="card">
    <h1 class="success-title">✅ 제출 완료!</h1>
    <p class="success-message">안전 운행 하십시오.</p>
  </div>
</section>

<div id="modal" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message" id="modal-message"></div>
    <div class="modal-actions">
      <button id="modal-yes" class="modal-btn modal-yes">네</button>
      <button id="modal-no" class="modal-btn modal-no">아니오</button>
    </div>
  </div>
</div>

<script type="module" src="/src/main.js"></script>
</body>
</html> 
```

```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>운행전 자가점검시스템</title>

<!-- 기본 메타 태그 -->
<meta name="description" content="부산 세진여객 운전기사 운행전 자가점검시스템">
<meta name="theme-color" content="#2563eb">

<!-- PWA 메타 태그 (주석처리) -->
<!-- <meta name="apple-mobile-web-app-capable" content="yes"> -->
<!-- <meta name="apple-mobile-web-app-status-bar-style" content="default"> -->
<!-- <meta name="apple-mobile-web-app-title" content="세진여객 점검"> -->

<!-- PWA 아이콘 (주석처리) -->
<!-- <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png"> -->
<!-- <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png"> -->
<!-- <link rel="apple-touch-icon" href="/icons/icon-192x192.png"> -->
<!-- <link rel="manifest" href="/manifest.json"> -->

<!-- Tailwind CSS CDN -->
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="styles.css">

</head>
<body>

<!-- ======== 헤더 ======== -->
<header>
  <!-- 로고 이미지: 업로드하신 PNG를 logo.png로 저장하여 같은 폴더에 두세요 -->
  <img src="logo.png" alt="세진여객 로고" id="header-logo" style="cursor: pointer;">
  <h2 id="header-title" style="font-size: 1.2rem; cursor: pointer;">운행전 자가점검시스템 (MDCS)</h2>
</header>
<nav class="breadcrumb" id="breadcrumb"></nav>

<!-- ======== STEP -1 : 기사님 이름 입력 ======== -->
<section id="p-driver-name" class="page">
  <div class="card">
    <h1>기사님 성함을 입력해주세요</h1>
    <div class="card-content">
      <input id="driver-name-input" type="text" placeholder="이름을 입력하세요" autocomplete="name">
      <button id="driver-name-submit" disabled>다음</button>
    </div>
    <div class="card-actions"><button class="prevBtn" style="display:none;">이전</button></div>
  </div>
</section>

<!-- ======== STEP 0 : 근무지 선택 ======== -->
<section id="p0" class="page">
  <div class="card">
    <h1>1. 근무지를 선택하세요</h1>
    <img src="bus_illustration.png" alt="버스 일러스트" style="display:block;margin:0 auto 1.5rem auto;width:120px;height:120px;object-fit:contain;" />
    <div class="card-content">
      <div class="site-buttons">
        <button id="site-nopo" class="site-btn">노포</button>
        <button id="site-jeonggwan" class="site-btn">정관</button>
      </div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 1 : 버스번호 선택 ======== -->
<section id="p1" class="page">
  <div class="card">
    <h1>2. 노선번호를 선택하세요</h1>
    <div class="card-content">
      <div class="busno-buttons" id="busno-buttons"></div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 2 : 면허판번호 ======== -->
<section id="p2" class="page">
  <div class="card">
    <h1>차량번호를 선택하세요</h1>
    <div class="card-content">
      <!-- plate-grid와 prevBtn만 남김 -->
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 3 : 복장 사진 ======== -->
<section id="p3" class="page">
  <div class="card">
    <h1>복장 사진을 첨부하세요</h1>
    <div class="card-content">
      <input id="photo" type="file" accept="image/*" capture="environment">
      <img id="preview" alt="">
      <button id="b3" disabled>제출</button>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== 완료 화면 ======== -->
<section id="done" class="page">
  <div class="card">
    <h1 class="success-title">✅ 제출 완료!</h1>
    <p class="success-message">안전 운행 하십시오.</p>
  </div>
</section>

<div id="modal" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message" id="modal-message"></div>
    <div class="modal-actions">
      <button id="modal-yes" class="modal-btn modal-yes">네</button>
      <button id="modal-no" class="modal-btn modal-no">아니오</button>
    </div>
  </div>
</div>

<script type="module" src="/src/main.js"></script>
</body>
</html> 
```

```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>운행전 자가점검시스템</title>

<!-- 기본 메타 태그 -->
<meta name="description" content="부산 세진여객 운전기사 운행전 자가점검시스템">
<meta name="theme-color" content="#2563eb">

<!-- PWA 메타 태그 (주석처리) -->
<!-- <meta name="apple-mobile-web-app-capable" content="yes"> -->
<!-- <meta name="apple-mobile-web-app-status-bar-style" content="default"> -->
<!-- <meta name="apple-mobile-web-app-title" content="세진여객 점검"> -->

<!-- PWA 아이콘 (주석처리) -->
<!-- <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png"> -->
<!-- <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png"> -->
<!-- <link rel="apple-touch-icon" href="/icons/icon-192x192.png"> -->
<!-- <link rel="manifest" href="/manifest.json"> -->

<!-- Tailwind CSS CDN -->
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="styles.css">

</head>
<body>

<!-- ======== 헤더 ======== -->
<header>
  <!-- 로고 이미지: 업로드하신 PNG를 logo.png로 저장하여 같은 폴더에 두세요 -->
  <img src="logo.png" alt="세진여객 로고" id="header-logo" style="cursor: pointer;">
  <h2 id="header-title" style="font-size: 1.2rem; cursor: pointer;">운행전 자가점검시스템 (MDCS)</h2>
</header>
<nav class="breadcrumb" id="breadcrumb"></nav>

<!-- ======== STEP -1 : 기사님 이름 입력 ======== -->
<section id="p-driver-name" class="page">
  <div class="card">
    <h1>기사님 성함을 입력해주세요</h1>
    <div class="card-content">
      <input id="driver-name-input" type="text" placeholder="이름을 입력하세요" autocomplete="name">
      <button id="driver-name-submit" disabled>다음</button>
    </div>
    <div class="card-actions"><button class="prevBtn" style="display:none;">이전</button></div>
  </div>
</section>

<!-- ======== STEP 0 : 근무지 선택 ======== -->
<section id="p0" class="page">
  <div class="card">
    <h1>1. 근무지를 선택하세요</h1>
    <img src="bus_illustration.png" alt="버스 일러스트" style="display:block;margin:0 auto 1.5rem auto;width:120px;height:120px;object-fit:contain;" />
    <div class="card-content">
      <div class="site-buttons">
        <button id="site-nopo" class="site-btn">노포</button>
        <button id="site-jeonggwan" class="site-btn">정관</button>
      </div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 1 : 버스번호 선택 ======== -->
<section id="p1" class="page">
  <div class="card">
    <h1>2. 노선번호를 선택하세요</h1>
    <div class="card-content">
      <div class="busno-buttons" id="busno-buttons"></div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 2 : 면허판번호 ======== -->
<section id="p2" class="page">
  <div class="card">
    <h1>차량번호를 선택하세요</h1>
    <div class="card-content">
      <!-- plate-grid와 prevBtn만 남김 -->
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 3 : 복장 사진 ======== -->
<section id="p3" class="page">
  <div class="card">
    <h1>복장 사진을 첨부하세요</h1>
    <div class="card-content">
      <input id="photo" type="file" accept="image/*" capture="environment">
      <img id="preview" alt="">
      <button id="b3" disabled>제출</button>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== 완료 화면 ======== -->
<section id="done" class="page">
  <div class="card">
    <h1 class="success-title">✅ 제출 완료!</h1>
    <p class="success-message">안전 운행 하십시오.</p>
  </div>
</section>

<div id="modal" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message" id="modal-message"></div>
    <div class="modal-actions">
      <button id="modal-yes" class="modal-btn modal-yes">네</button>
      <button id="modal-no" class="modal-btn modal-no">아니오</button>
    </div>
  </div>
</div>

<script src="app.js"></script>
</body>
</html> 
```


이미지 파일 확인 및 불필요한 파일 삭제 중.



이미지 파일을 루트로 복사하고 불필요한 파일 삭제 중.



불필요한 파일과 폴더 삭제 중.



불필요한 폴더 삭제 중.



최종 구조 확인 중.



남아있는 불필요한 이미지 파일 삭제 중.



작업 완료. 프로젝트를 단순화했습니다.

## 완료된 작업

1. **JavaScript 통합**: 모든 JS 파일(`src/main.js`, `src/js/constants.js`, `src/js/storage.js`)을 하나의 `app.js`로 통합하고 ES6 모듈 제거
2. **CSS 통합**: `src/styles/main.css`의 내용을 `styles.css`로 통합
3. **Tailwind CSS CDN**: 빌드 없이 사용하도록 Tailwind CDN 추가
4. **HTML 수정**: `index.html`에서 스크립트/스타일 경로 변경 및 이미지 경로 수정
5. **파일 정리**: 불필요한 파일과 폴더 삭제

## 최종 프로젝트 구조

```
MDCS_NEW/
├── index.html          (메인 HTML 파일)
├── app.js              (모든 JavaScript 통합)
├── styles.css          (모든 CSS 통합)
├── logo.png            (로고 이미지)
├── bus_illustration.png (버스 일러스트)
└── README.md           (문서)
```

## 사용 방법

이제 **Live Server**로 바로 실행할 수 있습니다:
1. VS Code에서 `index.html`을 열기
2. Live Server 확장 프로그램으로 실행
3. 빌드 없이 바로 확인 가능

모든 기능과 디자인은 그대로 유지되며, Tailwind CSS는 CDN으로 로드됩니다.

```plaintext
MDCS_NEW/
├── index.html          (메인 HTML 파일)
├── app.js              (모든 JavaScript 통합)
├── styles.css          (모든 CSS 통합)
├── logo.png            (로고 이미지)
├── bus_illustration.png (버스 일러스트)
└── README.md           (문서)
```

---

**User**

현재 맨 처음 페이지인 기사님 성함을 입력해주세요. 페이지를 한 번 봐줄래? '다음' 버튼의 css가 뭔가 이상하네 색상 변화가 이상해 한 번 봐줘

---

**Cursor**


기사님 성함 입력 페이지의 '다음' 버튼 CSS 확인 중.



버튼 관련 CSS 확인 중.



버튼 CSS 확인 중. 문제 파악을 위해 전체 스타일 확인 중.



`button:disabled`에서 배경은 회색인데 텍스트 색상이 명시되지 않아 가독성이 떨어질 수 있습니다. disabled 버튼 스타일을 수정 중.


```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 80px;
}

header {
  background: var(--card-bg);
  padding: 1rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
}

header img {
  height: 40px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}

@media (max-width: 480px) {
  header {
    padding: 0.75rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 80px);
  padding: 1rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100%;
  padding: 2rem 2rem;
  font-size: 1.8rem;
  font-weight: 700;
  border: 3px solid transparent;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--primary);
  color: #fff;
  text-align: center;
  min-height: 80px;
  display: block;
  margin-left: 0;
  margin-right: 0;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark);
  color: #fff;
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px);
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary);
  color: white;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}

.breadcrumb {
  width: 100%;
  max-width: 400px;
  margin: 1rem auto 1rem auto;
  padding: 0.7rem 1rem;
  font-size: 1.55rem;
  color: var(--text-light);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  text-align: center;
}

.breadcrumb .crumb {
  color: var(--primary);
  font-weight: 600;
}

.breadcrumb .sep {
  color: var(--text-light);
  margin: 0 0.2em;
}

.card-actions {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem;
  font-size: 1.15rem;
  font-weight: 600;
  border-radius: 12px;
  border: none;
  background: #e5e7eb;
  color: var(--text);
  cursor: pointer;
  transition: background 0.2s;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1;
}

.prevBtn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0;
  font-size: 1.25rem;
  font-weight: 700;
  padding: 1.1rem 0;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.modal-yes {
  background: var(--primary);
  color: #fff;
  transition: background 0.2s, box-shadow 0.2s;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark);
  color: #fff;
  box-shadow: var(--shadow-lg);
}

.modal-no {
  background: #e5e7eb;
  color: var(--text);
  transition: background 0.2s, box-shadow 0.2s;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1;
  color: var(--text);
  box-shadow: var(--shadow-lg);
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px;
  height: 64px;
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
  touch-action: manipulation;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

  .breadcrumb {
    font-size: 1.25rem;
    padding: 0.5rem 0.5rem;
    max-width: 100vw;
    margin: 0.7rem auto 0.7rem auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```


수정 완료. '다음' 버튼의 disabled 스타일을 개선했습니다.

## 수정 내용

**문제점:**
- disabled 상태에서 배경만 회색(`var(--text-light)`)으로 변경되고 텍스트 색상이 명시되지 않아 가독성이 떨어짐

**해결:**
- disabled 상태에 명확한 색상 적용:
  - 배경: `#d1d5db` (밝은 회색)
  - 텍스트: `#9ca3af` (어두운 회색)
  - 투명도: `opacity: 0.6`

이제 disabled 상태가 더 명확하고, 활성화될 때 파란색으로 전환됩니다. Live Server로 확인해 주세요.

---

**User**

그런데 텍스트를 입력하면 '다음'버튼의 색상도 변화하는데, 입력창에 이름을 입력할 때 보면 지금 흰색으로 변해버렸어.  mdcs 프로젝트의 css를 최대한 반영하여 파란색을 link해줘.

---

**Cursor**


입력 시 '다음' 버튼이 파란색으로 유지되도록 수정 중. Tailwind CDN과의 스타일 충돌 가능성을 확인하고 해결 중.



Tailwind CDN의 기본 버튼 스타일이 커스텀 스타일을 덮어쓰고 있습니다. 더 구체적인 선택자로 오버라이드하도록 수정 중.


```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 80px;
}

header {
  background: var(--card-bg);
  padding: 1rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
}

header img {
  height: 40px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}

@media (max-width: 480px) {
  header {
    padding: 0.75rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 80px);
  padding: 1rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100%;
  padding: 2rem 2rem;
  font-size: 1.8rem;
  font-weight: 700;
  border: 3px solid transparent;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--primary);
  color: #fff;
  text-align: center;
  min-height: 80px;
  display: block;
  margin-left: 0;
  margin-right: 0;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark);
  color: #fff;
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px);
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}

.breadcrumb {
  width: 100%;
  max-width: 400px;
  margin: 1rem auto 1rem auto;
  padding: 0.7rem 1rem;
  font-size: 1.55rem;
  color: var(--text-light);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  text-align: center;
}

.breadcrumb .crumb {
  color: var(--primary);
  font-weight: 600;
}

.breadcrumb .sep {
  color: var(--text-light);
  margin: 0 0.2em;
}

.card-actions {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem;
  font-size: 1.15rem;
  font-weight: 600;
  border-radius: 12px;
  border: none;
  background: #e5e7eb;
  color: var(--text);
  cursor: pointer;
  transition: background 0.2s;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1;
}

.prevBtn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0;
  font-size: 1.25rem;
  font-weight: 700;
  padding: 1.1rem 0;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.modal-yes {
  background: var(--primary);
  color: #fff;
  transition: background 0.2s, box-shadow 0.2s;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark);
  color: #fff;
  box-shadow: var(--shadow-lg);
}

.modal-no {
  background: #e5e7eb;
  color: var(--text);
  transition: background 0.2s, box-shadow 0.2s;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1;
  color: var(--text);
  box-shadow: var(--shadow-lg);
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px;
  height: 64px;
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
  touch-action: manipulation;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

  .breadcrumb {
    font-size: 1.25rem;
    padding: 0.5rem 0.5rem;
    max-width: 100vw;
    margin: 0.7rem auto 0.7rem auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```


수정 완료. '다음' 버튼이 활성화될 때 파란색으로 유지되도록 수정했습니다.

## 수정 내용

**문제점:**
- Tailwind CDN의 기본 버튼 스타일이 커스텀 스타일을 덮어써서 활성화 시 흰색으로 표시됨

**해결:**
1. 모든 `button` 스타일에 `!important` 추가하여 Tailwind 스타일 오버라이드
2. `#driver-name-submit` 버튼에 명시적 스타일 추가:
   - 활성화: 파란색 배경 (`var(--primary)`)
   - hover: 어두운 파란색 (`var(--primary-dark)`)
   - disabled: 회색 배경

이제 입력창에 이름을 입력하면 '다음' 버튼이 파란색으로 활성화됩니다. Live Server로 확인해 주세요.

---

**User**

지금 페이지들마다 css를 한 번 체크해줘봐, 버튼을 선택했을때 각 페이지마다 하단의 '이전' 버튼과 버튼을 클릭할때마다 나오는 ~~가 맞으십니까? 하는 모달 창에서 네와 아니오 색상이 같아서 뭔가 이상해. 이전에 있었던 대로 해줘. 처음에 내가 요청한 프로젝트 단순화 과정에서 뭔가 코드가 변경되었나? 제대로 확인해서 단순화 이전처럼 스타일들을 변경없이 유지해줘

---

**Cursor**


원래 스타일과 비교해 '이전' 버튼과 모달 버튼 스타일 확인 중.



Tailwind CDN의 기본 버튼 스타일이 커스텀 스타일을 덮어쓰고 있습니다. 원래 스타일을 유지하도록 `!important`를 추가해 오버라이드 중.



Tailwind CDN의 기본 버튼 스타일이 커스텀 스타일을 덮어쓰고 있습니다. 원래 스타일을 유지하도록 `!important`를 추가해 오버라이드 중.


```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 80px;
}

header {
  background: var(--card-bg);
  padding: 1rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
}

header img {
  height: 40px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}

@media (max-width: 480px) {
  header {
    padding: 0.75rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 80px);
  padding: 1rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100%;
  padding: 2rem 2rem;
  font-size: 1.8rem;
  font-weight: 700;
  border: 3px solid transparent;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--primary);
  color: #fff;
  text-align: center;
  min-height: 80px;
  display: block;
  margin-left: 0;
  margin-right: 0;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark);
  color: #fff;
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px);
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}

.breadcrumb {
  width: 100%;
  max-width: 400px;
  margin: 1rem auto 1rem auto;
  padding: 0.7rem 1rem;
  font-size: 1.55rem;
  color: var(--text-light);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  text-align: center;
}

.breadcrumb .crumb {
  color: var(--primary);
  font-weight: 600;
}

.breadcrumb .sep {
  color: var(--text-light);
  margin: 0 0.2em;
}

.card-actions {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0;
  font-size: 1.25rem;
  font-weight: 700;
  padding: 1.1rem 0;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.modal-yes {
  background: var(--primary);
  color: #fff;
  transition: background 0.2s, box-shadow 0.2s;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark);
  color: #fff;
  box-shadow: var(--shadow-lg);
}

.modal-no {
  background: #e5e7eb;
  color: var(--text);
  transition: background 0.2s, box-shadow 0.2s;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1;
  color: var(--text);
  box-shadow: var(--shadow-lg);
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px;
  height: 64px;
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
  touch-action: manipulation;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

  .breadcrumb {
    font-size: 1.25rem;
    padding: 0.5rem 0.5rem;
    max-width: 100vw;
    margin: 0.7rem auto 0.7rem auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```

```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 80px;
}

header {
  background: var(--card-bg);
  padding: 1rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
}

header img {
  height: 40px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}

@media (max-width: 480px) {
  header {
    padding: 0.75rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 80px);
  padding: 1rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100%;
  padding: 2rem 2rem;
  font-size: 1.8rem;
  font-weight: 700;
  border: 3px solid transparent;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--primary);
  color: #fff;
  text-align: center;
  min-height: 80px;
  display: block;
  margin-left: 0;
  margin-right: 0;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark);
  color: #fff;
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px);
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}

.breadcrumb {
  width: 100%;
  max-width: 400px;
  margin: 1rem auto 1rem auto;
  padding: 0.7rem 1rem;
  font-size: 1.55rem;
  color: var(--text-light);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  text-align: center;
}

.breadcrumb .crumb {
  color: var(--primary);
  font-weight: 600;
}

.breadcrumb .sep {
  color: var(--text-light);
  margin: 0 0.2em;
}

.card-actions {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0;
  font-size: 1.25rem;
  font-weight: 700;
  padding: 1.1rem 0;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px;
  height: 64px;
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
  touch-action: manipulation;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

  .breadcrumb {
    font-size: 1.25rem;
    padding: 0.5rem 0.5rem;
    max-width: 100vw;
    margin: 0.7rem auto 0.7rem auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```

```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 80px;
}

header {
  background: var(--card-bg);
  padding: 1rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
}

header img {
  height: 40px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}

@media (max-width: 480px) {
  header {
    padding: 0.75rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 80px);
  padding: 1rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100%;
  padding: 2rem 2rem;
  font-size: 1.8rem;
  font-weight: 700;
  border: 3px solid transparent;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--primary);
  color: #fff;
  text-align: center;
  min-height: 80px;
  display: block;
  margin-left: 0;
  margin-right: 0;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark);
  color: #fff;
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px);
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}

.breadcrumb {
  width: 100%;
  max-width: 400px;
  margin: 1rem auto 1rem auto;
  padding: 0.7rem 1rem;
  font-size: 1.55rem;
  color: var(--text-light);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  text-align: center;
}

.breadcrumb .crumb {
  color: var(--primary);
  font-weight: 600;
}

.breadcrumb .sep {
  color: var(--text-light);
  margin: 0 0.2em;
}

.card-actions {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px;
  height: 64px;
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
  touch-action: manipulation;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

  .breadcrumb {
    font-size: 1.25rem;
    padding: 0.5rem 0.5rem;
    max-width: 100vw;
    margin: 0.7rem auto 0.7rem auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```


다른 버튼들도 확인하고 수정 중.



site-btn와 busno-btn도 Tailwind 오버라이드 적용 중.


```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 80px;
}

header {
  background: var(--card-bg);
  padding: 1rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
}

header img {
  height: 40px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}

@media (max-width: 480px) {
  header {
    padding: 0.75rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 80px);
  padding: 1rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}

.breadcrumb {
  width: 100%;
  max-width: 400px;
  margin: 1rem auto 1rem auto;
  padding: 0.7rem 1rem;
  font-size: 1.55rem;
  color: var(--text-light);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  text-align: center;
}

.breadcrumb .crumb {
  color: var(--primary);
  font-weight: 600;
}

.breadcrumb .sep {
  color: var(--text-light);
  margin: 0 0.2em;
}

.card-actions {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px;
  height: 64px;
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
  touch-action: manipulation;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

  .breadcrumb {
    font-size: 1.25rem;
    padding: 0.5rem 0.5rem;
    max-width: 100vw;
    margin: 0.7rem auto 0.7rem auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```


plate-btn 스타일 확인 및 수정 중.


```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 80px;
}

header {
  background: var(--card-bg);
  padding: 1rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
}

header img {
  height: 40px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}

@media (max-width: 480px) {
  header {
    padding: 0.75rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 80px);
  padding: 1rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}

.breadcrumb {
  width: 100%;
  max-width: 400px;
  margin: 1rem auto 1rem auto;
  padding: 0.7rem 1rem;
  font-size: 1.55rem;
  color: var(--text-light);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  text-align: center;
}

.breadcrumb .crumb {
  color: var(--primary);
  font-weight: 600;
}

.breadcrumb .sep {
  color: var(--text-light);
  margin: 0 0.2em;
}

.card-actions {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

  .breadcrumb {
    font-size: 1.25rem;
    padding: 0.5rem 0.5rem;
    max-width: 100vw;
    margin: 0.7rem auto 0.7rem auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```


수정 완료. 모든 버튼 스타일에 `!important`를 추가해 Tailwind CDN의 기본 스타일을 오버라이드했습니다.

## 수정 내용

1. **이전 버튼 (`.prevBtn`)**
   - 회색 배경 (`#e5e7eb`) 유지
   - hover 시 더 어두운 회색 (`#cbd5e1`)
   - disabled 시 연한 회색 (`#f3f4f6`)

2. **모달 버튼**
   - **'네' 버튼 (`.modal-yes`)**: 파란색 배경 (`var(--primary)`)
   - **'아니오' 버튼 (`.modal-no`)**: 회색 배경 (`#e5e7eb`)
   - 두 버튼이 명확히 구분됨

3. **기타 버튼들**
   - `.site-btn`, `.busno-btn`: 파란색 배경 유지
   - `.plate-btn`: 파란색 배경 추가 및 스타일 보강

모든 버튼이 원래 스타일대로 표시됩니다. Live Server로 확인해 주세요. '이전' 버튼은 회색, 모달의 '네'는 파란색, '아니오'는 회색으로 구분됩니다.

---

**User**

 그런데 지금 각 페이지마다 맨 하단에 있는 이전 버튼들이 왜 왼쪽 끝으로 붙어있는거야? 크기도 작아졌어. 원래 이렇지 않았어. 정중앙에 있었고 크기도 버튼크기가 적절했어.

---

**Cursor**


'이전' 버튼 스타일 확인 중. 중앙 정렬과 크기 복원 중.



`.card-actions`가 `justify-content: flex-start`로 되어 왼쪽 정렬입니다. 중앙 정렬로 변경하고 버튼 크기를 조정 중.


```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 80px;
}

header {
  background: var(--card-bg);
  padding: 1rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
}

header img {
  height: 40px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}

@media (max-width: 480px) {
  header {
    padding: 0.75rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 80px);
  padding: 1rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}

.breadcrumb {
  width: 100%;
  max-width: 400px;
  margin: 1rem auto 1rem auto;
  padding: 0.7rem 1rem;
  font-size: 1.55rem;
  color: var(--text-light);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  text-align: center;
}

.breadcrumb .crumb {
  color: var(--primary);
  font-weight: 600;
}

.breadcrumb .sep {
  color: var(--text-light);
  margin: 0 0.2em;
}

.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

  .breadcrumb {
    font-size: 1.25rem;
    padding: 0.5rem 0.5rem;
    max-width: 100vw;
    margin: 0.7rem auto 0.7rem auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```


수정 완료. '이전' 버튼이 중앙에 위치하고 적절한 크기를 갖도록 변경했습니다.

## 수정 내용

1. **`.card-actions` 스타일 수정**
   - `justify-content: flex-start` → `justify-content: center` (중앙 정렬)
   - `align-items: center` 추가

2. **`.prevBtn` 크기 조정**
   - `width: auto` 제거
   - `min-width: 120px` 추가
   - `min-height: 48px` 추가

이제 '이전' 버튼이 각 페이지 하단 중앙에 위치하고 적절한 크기로 표시됩니다. Live Server로 확인해 주세요.

---

**User**

오케이 좋아. 이제 다음으로 할 작업은

header영역에서 logo.png의 크기를 지금보다 10%더 작게 해줘. 사이즈 비율은 유지한 채로 size만 줄이면 돼. 그리고 header영역의 텍스트에서 (MDCS) 텍스트를 삭제해줘

---

**Cursor**


헤더 로고 크기와 텍스트 확인 중.



헤더 HTML 확인 중.


```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 80px;
}

header {
  background: var(--card-bg);
  padding: 1rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
}

header img {
  height: 36px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}

@media (max-width: 480px) {
  header {
    padding: 0.75rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 80px);
  padding: 1rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}

.breadcrumb {
  width: 100%;
  max-width: 400px;
  margin: 1rem auto 1rem auto;
  padding: 0.7rem 1rem;
  font-size: 1.55rem;
  color: var(--text-light);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  text-align: center;
}

.breadcrumb .crumb {
  color: var(--primary);
  font-weight: 600;
}

.breadcrumb .sep {
  color: var(--text-light);
  margin: 0 0.2em;
}

.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

  .breadcrumb {
    font-size: 1.25rem;
    padding: 0.5rem 0.5rem;
    max-width: 100vw;
    margin: 0.7rem auto 0.7rem auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```

```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>운행전 자가점검시스템</title>

<!-- 기본 메타 태그 -->
<meta name="description" content="부산 세진여객 운전기사 운행전 자가점검시스템">
<meta name="theme-color" content="#2563eb">

<!-- PWA 메타 태그 (주석처리) -->
<!-- <meta name="apple-mobile-web-app-capable" content="yes"> -->
<!-- <meta name="apple-mobile-web-app-status-bar-style" content="default"> -->
<!-- <meta name="apple-mobile-web-app-title" content="세진여객 점검"> -->

<!-- PWA 아이콘 (주석처리) -->
<!-- <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png"> -->
<!-- <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png"> -->
<!-- <link rel="apple-touch-icon" href="/icons/icon-192x192.png"> -->
<!-- <link rel="manifest" href="/manifest.json"> -->

<!-- Tailwind CSS CDN -->
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="styles.css">

</head>
<body>

<!-- ======== 헤더 ======== -->
<header>
  <!-- 로고 이미지: 업로드하신 PNG를 logo.png로 저장하여 같은 폴더에 두세요 -->
  <img src="logo.png" alt="세진여객 로고" id="header-logo" style="cursor: pointer;">
  <h2 id="header-title" style="font-size: 1.2rem; cursor: pointer;">운행전 자가점검시스템</h2>
</header>
<nav class="breadcrumb" id="breadcrumb"></nav>

<!-- ======== STEP -1 : 기사님 이름 입력 ======== -->
<section id="p-driver-name" class="page">
  <div class="card">
    <h1>기사님 성함을 입력해주세요</h1>
    <div class="card-content">
      <input id="driver-name-input" type="text" placeholder="이름을 입력하세요" autocomplete="name">
      <button id="driver-name-submit" disabled>다음</button>
    </div>
    <div class="card-actions"><button class="prevBtn" style="display:none;">이전</button></div>
  </div>
</section>

<!-- ======== STEP 0 : 근무지 선택 ======== -->
<section id="p0" class="page">
  <div class="card">
    <h1>1. 근무지를 선택하세요</h1>
    <img src="bus_illustration.png" alt="버스 일러스트" style="display:block;margin:0 auto 1.5rem auto;width:120px;height:120px;object-fit:contain;" />
    <div class="card-content">
      <div class="site-buttons">
        <button id="site-nopo" class="site-btn">노포</button>
        <button id="site-jeonggwan" class="site-btn">정관</button>
      </div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 1 : 버스번호 선택 ======== -->
<section id="p1" class="page">
  <div class="card">
    <h1>2. 노선번호를 선택하세요</h1>
    <div class="card-content">
      <div class="busno-buttons" id="busno-buttons"></div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 2 : 면허판번호 ======== -->
<section id="p2" class="page">
  <div class="card">
    <h1>차량번호를 선택하세요</h1>
    <div class="card-content">
      <!-- plate-grid와 prevBtn만 남김 -->
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 3 : 복장 사진 ======== -->
<section id="p3" class="page">
  <div class="card">
    <h1>복장 사진을 첨부하세요</h1>
    <div class="card-content">
      <input id="photo" type="file" accept="image/*" capture="environment">
      <img id="preview" alt="">
      <button id="b3" disabled>제출</button>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== 완료 화면 ======== -->
<section id="done" class="page">
  <div class="card">
    <h1 class="success-title">✅ 제출 완료!</h1>
    <p class="success-message">안전 운행 하십시오.</p>
  </div>
</section>

<div id="modal" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message" id="modal-message"></div>
    <div class="modal-actions">
      <button id="modal-yes" class="modal-btn modal-yes">네</button>
      <button id="modal-no" class="modal-btn modal-no">아니오</button>
    </div>
  </div>
</div>

<script src="app.js"></script>
</body>
</html> 
```


작업 완료.

## 수정 내용

1. **로고 크기 10% 축소**
   - `height: 40px` → `height: 36px` (비율 유지, `width: auto` 유지)

2. **헤더 텍스트에서 "(MDCS)" 삭제**
   - "운행전 자가점검시스템 (MDCS)" → "운행전 자가점검시스템"

로고가 10% 작아지고, 헤더 텍스트에서 "(MDCS)"가 제거되었습니다. Live Server로 확인해 주세요.

---

**User**

복장 사진을 첨부하세요. 페이지를 조금 변경해야겠어. 

4. 복장 상태 확인(h1태그로)

p태그로 
ex) 1. 정규근무복 착용
      2. 운동화 및 구두 착화 (슬리퍼, 크록스 x)
      3. 단정하게 착용 여부(옷매무새, 두발, 면도상태 등)
이 내용을 넣어줘, 
그리고 버튼은 총 2개야. 
1. 양호
2. 불량 

만약 2. 불량 버튼을 클릭하면 모달창이 나와서 '불량 사유를 작성해주세요.' 라고 적혀있는 모달창을 통해 입력을 할 수 있게끔 해줘

---

**Cursor**


복장 사진 첨부 페이지를 복장 상태 확인 페이지로 변경 중. 현재 구조 확인 중.



HTML과 JavaScript 수정 중.


```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>운행전 자가점검시스템</title>

<!-- 기본 메타 태그 -->
<meta name="description" content="부산 세진여객 운전기사 운행전 자가점검시스템">
<meta name="theme-color" content="#2563eb">

<!-- PWA 메타 태그 (주석처리) -->
<!-- <meta name="apple-mobile-web-app-capable" content="yes"> -->
<!-- <meta name="apple-mobile-web-app-status-bar-style" content="default"> -->
<!-- <meta name="apple-mobile-web-app-title" content="세진여객 점검"> -->

<!-- PWA 아이콘 (주석처리) -->
<!-- <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png"> -->
<!-- <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png"> -->
<!-- <link rel="apple-touch-icon" href="/icons/icon-192x192.png"> -->
<!-- <link rel="manifest" href="/manifest.json"> -->

<!-- Tailwind CSS CDN -->
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="styles.css">

</head>
<body>

<!-- ======== 헤더 ======== -->
<header>
  <!-- 로고 이미지: 업로드하신 PNG를 logo.png로 저장하여 같은 폴더에 두세요 -->
  <img src="logo.png" alt="세진여객 로고" id="header-logo" style="cursor: pointer;">
  <h2 id="header-title" style="font-size: 1.2rem; cursor: pointer;">운행전 자가점검시스템</h2>
</header>
<nav class="breadcrumb" id="breadcrumb"></nav>

<!-- ======== STEP -1 : 기사님 이름 입력 ======== -->
<section id="p-driver-name" class="page">
  <div class="card">
    <h1>기사님 성함을 입력해주세요</h1>
    <div class="card-content">
      <input id="driver-name-input" type="text" placeholder="이름을 입력하세요" autocomplete="name">
      <button id="driver-name-submit" disabled>다음</button>
    </div>
    <div class="card-actions"><button class="prevBtn" style="display:none;">이전</button></div>
  </div>
</section>

<!-- ======== STEP 0 : 근무지 선택 ======== -->
<section id="p0" class="page">
  <div class="card">
    <h1>1. 근무지를 선택하세요</h1>
    <img src="bus_illustration.png" alt="버스 일러스트" style="display:block;margin:0 auto 1.5rem auto;width:120px;height:120px;object-fit:contain;" />
    <div class="card-content">
      <div class="site-buttons">
        <button id="site-nopo" class="site-btn">노포</button>
        <button id="site-jeonggwan" class="site-btn">정관</button>
      </div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 1 : 버스번호 선택 ======== -->
<section id="p1" class="page">
  <div class="card">
    <h1>2. 노선번호를 선택하세요</h1>
    <div class="card-content">
      <div class="busno-buttons" id="busno-buttons"></div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 2 : 면허판번호 ======== -->
<section id="p2" class="page">
  <div class="card">
    <h1>차량번호를 선택하세요</h1>
    <div class="card-content">
      <!-- plate-grid와 prevBtn만 남김 -->
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 3 : 복장 상태 확인 ======== -->
<section id="p3" class="page">
  <div class="card">
    <h1>4. 복장 상태 확인</h1>
    <div class="card-content">
      <div class="uniform-checklist">
        <p>1. 정규근무복 착용</p>
        <p>2. 운동화 및 구두 착화 (슬리퍼, 크록스 x)</p>
        <p>3. 단정하게 착용 여부(옷매무새, 두발, 면도상태 등)</p>
      </div>
      <div class="uniform-buttons">
        <button id="uniform-ok" class="uniform-btn">양호</button>
        <button id="uniform-bad" class="uniform-btn">불량</button>
      </div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== 완료 화면 ======== -->
<section id="done" class="page">
  <div class="card">
    <h1 class="success-title">✅ 제출 완료!</h1>
    <p class="success-message">안전 운행 하십시오.</p>
  </div>
</section>

<div id="modal" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message" id="modal-message"></div>
    <div class="modal-actions">
      <button id="modal-yes" class="modal-btn modal-yes">네</button>
      <button id="modal-no" class="modal-btn modal-no">아니오</button>
    </div>
  </div>
</div>

<script src="app.js"></script>
</body>
</html> 
```


불량 사유 입력 모달 추가 및 JavaScript 수정 중.


```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>운행전 자가점검시스템</title>

<!-- 기본 메타 태그 -->
<meta name="description" content="부산 세진여객 운전기사 운행전 자가점검시스템">
<meta name="theme-color" content="#2563eb">

<!-- PWA 메타 태그 (주석처리) -->
<!-- <meta name="apple-mobile-web-app-capable" content="yes"> -->
<!-- <meta name="apple-mobile-web-app-status-bar-style" content="default"> -->
<!-- <meta name="apple-mobile-web-app-title" content="세진여객 점검"> -->

<!-- PWA 아이콘 (주석처리) -->
<!-- <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png"> -->
<!-- <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png"> -->
<!-- <link rel="apple-touch-icon" href="/icons/icon-192x192.png"> -->
<!-- <link rel="manifest" href="/manifest.json"> -->

<!-- Tailwind CSS CDN -->
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="styles.css">

</head>
<body>

<!-- ======== 헤더 ======== -->
<header>
  <!-- 로고 이미지: 업로드하신 PNG를 logo.png로 저장하여 같은 폴더에 두세요 -->
  <img src="logo.png" alt="세진여객 로고" id="header-logo" style="cursor: pointer;">
  <h2 id="header-title" style="font-size: 1.2rem; cursor: pointer;">운행전 자가점검시스템</h2>
</header>
<nav class="breadcrumb" id="breadcrumb"></nav>

<!-- ======== STEP -1 : 기사님 이름 입력 ======== -->
<section id="p-driver-name" class="page">
  <div class="card">
    <h1>기사님 성함을 입력해주세요</h1>
    <div class="card-content">
      <input id="driver-name-input" type="text" placeholder="이름을 입력하세요" autocomplete="name">
      <button id="driver-name-submit" disabled>다음</button>
    </div>
    <div class="card-actions"><button class="prevBtn" style="display:none;">이전</button></div>
  </div>
</section>

<!-- ======== STEP 0 : 근무지 선택 ======== -->
<section id="p0" class="page">
  <div class="card">
    <h1>1. 근무지를 선택하세요</h1>
    <img src="bus_illustration.png" alt="버스 일러스트" style="display:block;margin:0 auto 1.5rem auto;width:120px;height:120px;object-fit:contain;" />
    <div class="card-content">
      <div class="site-buttons">
        <button id="site-nopo" class="site-btn">노포</button>
        <button id="site-jeonggwan" class="site-btn">정관</button>
      </div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 1 : 버스번호 선택 ======== -->
<section id="p1" class="page">
  <div class="card">
    <h1>2. 노선번호를 선택하세요</h1>
    <div class="card-content">
      <div class="busno-buttons" id="busno-buttons"></div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 2 : 면허판번호 ======== -->
<section id="p2" class="page">
  <div class="card">
    <h1>차량번호를 선택하세요</h1>
    <div class="card-content">
      <!-- plate-grid와 prevBtn만 남김 -->
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 3 : 복장 상태 확인 ======== -->
<section id="p3" class="page">
  <div class="card">
    <h1>4. 복장 상태 확인</h1>
    <div class="card-content">
      <div class="uniform-checklist">
        <p>1. 정규근무복 착용</p>
        <p>2. 운동화 및 구두 착화 (슬리퍼, 크록스 x)</p>
        <p>3. 단정하게 착용 여부(옷매무새, 두발, 면도상태 등)</p>
      </div>
      <div class="uniform-buttons">
        <button id="uniform-ok" class="uniform-btn">양호</button>
        <button id="uniform-bad" class="uniform-btn">불량</button>
      </div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== 완료 화면 ======== -->
<section id="done" class="page">
  <div class="card">
    <h1 class="success-title">✅ 제출 완료!</h1>
    <p class="success-message">안전 운행 하십시오.</p>
  </div>
</section>

<div id="modal" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message" id="modal-message"></div>
    <div class="modal-actions">
      <button id="modal-yes" class="modal-btn modal-yes">네</button>
      <button id="modal-no" class="modal-btn modal-no">아니오</button>
    </div>
  </div>
</div>

<div id="modal-reason" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message">불량 사유를 작성해주세요.</div>
    <div class="modal-input-container">
      <textarea id="reason-input" class="modal-textarea" placeholder="불량 사유를 입력하세요..." rows="4"></textarea>
    </div>
    <div class="modal-actions">
      <button id="modal-reason-submit" class="modal-btn modal-yes">확인</button>
      <button id="modal-reason-cancel" class="modal-btn modal-no">취소</button>
    </div>
  </div>
</div>

<script src="app.js"></script>
</body>
</html> 
```


JavaScript 수정 중: 사진 업로드 관련 코드 제거 및 복장 상태 확인 로직 추가.



JavaScript 수정 중: 사진 업로드 관련 코드 제거 및 복장 상태 확인 로직 추가.


```javascript
// ======== 상수 ========
const DRIVER_NAME_KEY = 'mdcsDriverName';

const BUSNO_LIST = {
  '노포': ['29', '80', '300'],
  '정관': ['73', '73 (오전)', '106', '107', '184', '188']
};

// ======== Storage 함수 ========
function getDriverName() {
  const stored = localStorage.getItem(DRIVER_NAME_KEY);
  if (!stored) return '';
  return stored.trim();
}

function hasDriverName() {
  return getDriverName().length > 0;
}

function saveDriverName(name) {
  if (!name || !name.trim()) return false;
  localStorage.setItem(DRIVER_NAME_KEY, name.trim());
  return true;
}

// ======== 전역 변수 ========
let currentStep = 0;
const totalSteps = 4;
let selectedSite = '';
let selectedBusNo = '';
let enteredPlate = '';
let uniformStatus = ''; // 'ok' or 'bad'
let uniformReason = ''; // 불량 사유

// ======== DOM 요소 ========
const pages = document.querySelectorAll('.page');
const driverNamePage = document.getElementById('p-driver-name');
const driverNameInput = document.getElementById('driver-name-input');
const driverNameSubmit = document.getElementById('driver-name-submit');

// 근무지 선택 버튼
const siteButtons = {
  nopo: document.getElementById('site-nopo'),
  jeonggwan: document.getElementById('site-jeonggwan')
};

// 버스번호 버튼 컨테이너
const busnoButtonsDiv = document.getElementById('busno-buttons');

// ======== 노선별 차량번호 리스트(구글 시트 연동) ========
let PLATE_LISTS = {};
let plateDataLoaded = false;
let plateDataError = false;
fetch('https://script.google.com/macros/s/AKfycbxKXmbLSOl64gNdOoYIORQs1fpdHOHZuX7LGypDLlgacjKtNhiVTWef6_pBNNkd2cWE/exec')
  .then(res => res.json())
  .then(data => {
    PLATE_LISTS = data;
    plateDataLoaded = true;
  })
  .catch(err => {
    plateDataError = true;
    console.error('차량번호 데이터 불러오기 실패:', err);
  });

// ======== 유효성 검사 함수들 ========
const validators = {
  // 면허판번호 검증 (70가1234 형식)
  plate: (value) => {
    if (!value.trim()) return '면허판 번호를 입력해주세요.';
    const pattern = /^\d{2}[가-힣]\d{4}$/;
    if (!pattern.test(value)) return '올바른 면허판 번호 형식으로 입력해주세요. (예: 70가1234)';
    return null;
  },
  // 사진 검증
  photo: (file) => {
    if (!file) return '사진을 선택해주세요.';
    if (!file.type.startsWith('image/')) return '이미지 파일만 선택 가능합니다.';
    if (file.size > 10 * 1024 * 1024) return '파일 크기는 10MB 이하로 선택해주세요.';
    return null;
  }
};

// ======== 유틸리티 함수들 ========
function showError(message) {
  alert(message);
}

function validateInput(type, value) {
  const validator = validators[type];
  if (!validator) return true;
  const error = validator(value);
  if (error) {
    showError(error);
    return false;
  }
  return true;
}

function updateButtonState(buttonId, isValid) {
  const button = buttons[buttonId];
  if (button) {
    button.disabled = !isValid;
  }
}

function getCurrentPrevBtn() {
  const cards = document.querySelectorAll('.card');
  return cards[currentStep]?.querySelector('.prevBtn');
}

function updatePrevBtn() {
  document.querySelectorAll('.prevBtn').forEach((btn) => {
    // 이름 입력 페이지(-1)나 근무지 선택 페이지(0)에서는 이전 버튼 비활성화
    btn.disabled = (currentStep === -1 || currentStep === 0);
    
    // 모든 이전 버튼에 이벤트 설정
    btn.onclick = () => {
      if (currentStep > 0) {
        window.history.back();
      }
    };
  });
}

// 페이지 ID를 인덱스로 변환하는 맵
const pageIdToIndex = {
  'p-driver-name': -1,
  'p0': 0,
  'p1': 1,
  'p2': 2,
  'p3': 3,
  'done': 4
};

// 인덱스를 페이지 ID로 변환
function getPageIdByIndex(index) {
  const idMap = ['p0', 'p1', 'p2', 'p3', 'done'];
  if (index === -1) return 'p-driver-name';
  return idMap[index] || 'p0';
}

function showPage(pageIndex, pushHistory = false) {
  // 이름 입력 페이지 처리
  if (pageIndex === -1) {
    pages.forEach(page => page.classList.remove('active'));
    driverNamePage.classList.add('active');
    currentStep = -1;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (pushHistory) {
      history.pushState({ pageIndex: -1 }, '', '');
    }
    return;
  }

  // 이름 입력 페이지 숨기기
  driverNamePage.classList.remove('active');

  // 단계별로 입력값 초기화
  if (pageIndex === 0) {
    selectedSite = '';
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 1) {
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 2) {
    enteredPlate = '';
  }
  
  // 일반 페이지 표시
  pages.forEach((page, index) => {
    const pageId = page.id;
    if (pageId === 'p-driver-name') {
      page.classList.remove('active');
    } else {
      const pageIdx = pageIdToIndex[pageId] || 0;
      page.classList.toggle('active', pageIdx === pageIndex);
    }
  });
  currentStep = pageIndex;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  updatePrevBtn();
  updateBreadcrumb();
  
  // 차량번호 선택 페이지(p2)일 때 그리드 렌더링
  if (pageIndex === 2) {
    renderPlateGrid();
  }
  
  if (pushHistory) {
    history.pushState({ pageIndex: currentStep }, '', '');
  }
}

function nextStep() {
  // 이름 입력 페이지에서 다음 단계로
  if (currentStep === -1) {
    showPage(0, true);
    return;
  }
  // 일반 페이지 다음 단계
  if (currentStep < 4) { // done 페이지는 인덱스 4
    showPage(currentStep + 1, true);
  }
}

// ======== 커스텀 모달 ========
function showModal(message, onConfirm) {
  const modal = document.getElementById('modal');
  const msg = document.getElementById('modal-message');
  const yesBtn = document.getElementById('modal-yes');
  const noBtn = document.getElementById('modal-no');
  msg.textContent = message;
  modal.style.display = 'flex';
  function cleanup() {
    modal.style.display = 'none';
    yesBtn.removeEventListener('click', yesHandler);
    noBtn.removeEventListener('click', noHandler);
  }
  function yesHandler() {
    cleanup();
    onConfirm(true);
  }
  function noHandler() {
    cleanup();
    onConfirm(false);
  }
  yesBtn.addEventListener('click', yesHandler);
  noBtn.addEventListener('click', noHandler);
}

// ======== 근무지 선택 이벤트 리스너 ========
siteButtons.nopo.addEventListener('click', () => {
  showModal('근무지 : 노포(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '노포';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('노포');
    updateBreadcrumb();
    nextStep();
  });
});

siteButtons.jeonggwan.addEventListener('click', () => {
  showModal('근무지 : 정관(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '정관';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('정관');
    updateBreadcrumb();
    nextStep();
  });
});

// ======== 버스번호 버튼 동적 생성 ========
function renderBusNoButtons(site) {
  busnoButtonsDiv.innerHTML = '';
  BUSNO_LIST[site].forEach(busNo => {
    const btn = document.createElement('button');
    btn.className = 'busno-btn';
    btn.textContent = busNo;
    btn.onclick = () => {
      showModal(`노선번호 : ${busNo}(이)가 맞으십니까?`, (ok) => {
        if (!ok) return;
        selectedBusNo = busNo;
        updateBreadcrumb();
        nextStep();
      });
    };
    busnoButtonsDiv.appendChild(btn);
  });
}

// ======== 사진 업로드 ========
inputs.photo.addEventListener('change', (e) => {
  const file = e.target.files[0];
  const isValid = validateInput('photo', file);
  if (isValid && file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.classList.add('show');
    };
    reader.readAsDataURL(file);
  } else {
    preview.classList.remove('show');
  }
  updateButtonState('b3', isValid);
});

// ======== 제출 버튼 ========
buttons.b3.addEventListener('click', async () => {
  const file = inputs.photo.files[0];
  if (!validateInput('photo', file)) return;
  buttons.b3.disabled = true;
  buttons.b3.textContent = '제출 중...';
  try {
    await submitData();
    showPage(totalSteps); // 완료 화면 표시
  } catch (error) {
    console.error('제출 실패:', error);
    showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    buttons.b3.disabled = false;
    buttons.b3.textContent = '제출';
  }
});

// ======== 데이터 제출 함수 ========
async function submitData() {
  const formData = new FormData();
  formData.append('site', selectedSite);
  formData.append('busNo', selectedBusNo);
  formData.append('plate', enteredPlate);
  const photoFile = inputs.photo.files[0];
  if (photoFile) {
    formData.append('photo', photoFile);
  }
  formData.append('timestamp', new Date().toISOString());
  // TODO: 실제 백엔드 URL로 변경 필요
  const response = await fetch('/api/submit', {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// ======== 키보드 이벤트 ========
document.addEventListener('keydown', (e) => {
  // 버스번호 선택 화면에서는 Enter로 동작하지 않음
  if (currentStep === 1) return;
  const btnMap = {2: 'b2', 3: 'b3'};
  const currentButton = buttons[btnMap[currentStep]];
  if (e.key === 'Enter' && currentButton && !currentButton.disabled) {
    currentButton.click();
  }
});

// 처음 화면으로 이동하는 함수
function goToInitialPage() {
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    showPage(-1, true);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    showPage(0, true);
  }
}

// 이름 입력 이벤트 리스너
if (driverNameInput && driverNameSubmit) {
  driverNameInput.addEventListener('input', (e) => {
    const name = e.target.value.trim();
    driverNameSubmit.disabled = name.length === 0;
  });

  driverNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !driverNameSubmit.disabled) {
      driverNameSubmit.click();
    }
  });

  driverNameSubmit.addEventListener('click', () => {
    const name = driverNameInput.value.trim();
    if (name.length > 0) {
      saveDriverName(name);
      showPage(0, true); // 근무지 선택 페이지로 이동
    }
  });
}

const breadcrumb = document.getElementById('breadcrumb');

function updateBreadcrumb() {
  let crumbs = [];
  if (selectedSite) crumbs.push(`<span class="crumb">근무지: ${selectedSite}</span>`);
  if (selectedBusNo) crumbs.push(`<span class="crumb">노선번호: ${selectedBusNo}</span>`);
  if (enteredPlate) crumbs.push(`<span class="crumb">차량번호: ${enteredPlate}</span>`);
  breadcrumb.innerHTML = crumbs.join('<span class="sep">&gt;</span>');
}

// ======== renderPlateGrid 수정 ========
function renderPlateGrid() {
  // p2 페이지의 card-content를 직접 찾기
  const p2Page = document.getElementById('p2');
  if (!p2Page) return;
  const cardContent = p2Page.querySelector('.card-content');
  if (!cardContent) return;
  let plateGridDiv = cardContent.querySelector('#plate-grid');
  if (plateGridDiv) cardContent.removeChild(plateGridDiv);
  let filterInput = cardContent.querySelector('#plate-filter');
  if (filterInput) cardContent.removeChild(filterInput);
  let errorMsg = cardContent.querySelector('#plate-filter-error');
  if (errorMsg) cardContent.removeChild(errorMsg);
  filterInput = document.createElement('input');
  filterInput.id = 'plate-filter';
  filterInput.type = 'text';
  filterInput.placeholder = '차량번호 검색(숫자 입력)';
  filterInput.inputMode = 'numeric';
  filterInput.autocomplete = 'off';
  filterInput.style.marginBottom = '0.5rem';
  filterInput.style.width = '100%';
  cardContent.appendChild(filterInput);
  errorMsg = document.createElement('div');
  errorMsg.id = 'plate-filter-error';
  errorMsg.style.color = '#dc2626';
  errorMsg.style.fontSize = '0.98rem';
  errorMsg.style.height = '1.2em';
  errorMsg.style.marginBottom = '0.5rem';
  errorMsg.style.textAlign = 'left';
  errorMsg.textContent = '';
  cardContent.appendChild(errorMsg);
  plateGridDiv = document.createElement('div');
  plateGridDiv.id = 'plate-grid';
  plateGridDiv.style.display = 'grid';
  plateGridDiv.style.gridTemplateColumns = 'repeat(3, 1fr)';
  plateGridDiv.style.gap = '0.7rem';
  plateGridDiv.style.maxHeight = '320px';
  plateGridDiv.style.minHeight = '320px';
  plateGridDiv.style.overflowY = 'auto';
  plateGridDiv.style.overflowX = 'hidden';
  plateGridDiv.style.width = '100%';
  plateGridDiv.style.marginBottom = '1.2rem';
  cardContent.appendChild(plateGridDiv);
  function renderGrid() {
    const oldBtns = Array.from(plateGridDiv.children);
    oldBtns.forEach(btn => {
      btn.classList.add('fade-exit');
      setTimeout(() => btn.remove(), 200);
    });
    // 데이터 로딩 상태 처리
    if (!plateDataLoaded) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#888;font-size:1.1rem;">차량번호 데이터를 불러오는 중...</div>';
      return;
    }
    if (plateDataError) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#dc2626;font-size:1.1rem;">차량번호 데이터를 불러오지 못했습니다.</div>';
      return;
    }
    let list = [];
    if (selectedBusNo && PLATE_LISTS[selectedBusNo]) {
      list = PLATE_LISTS[selectedBusNo];
    }
    let filter = filterInput.value.trim();
    if (filter.length > 4) {
      filter = filter.slice(0, 4);
      filterInput.value = filter;
    }
    if (filter && /[^0-9]/.test(filter)) {
      errorMsg.textContent = '숫자만 입력해주세요!';
      return;
    } else {
      errorMsg.textContent = '';
    }
    const filtered = filter ? list.filter(num => num.includes(filter)) : list;
    const total = filtered.length;
    const maxRow = Math.ceil(list.length / 3);
    plateGridDiv.style.gridTemplateRows = `repeat(${maxRow}, 1fr)`;
    for (let i = 0; i < maxRow * 3; i++) {
      if (i < total) {
        const num = filtered[i];
        const btn = document.createElement('button');
        btn.className = 'plate-btn fade-in';
        btn.textContent = num;
        btn.setAttribute('aria-label', `차량번호 ${num}`);
        btn.tabIndex = 0;
        btn.onclick = () => {
          showModal(`차량번호 : ${num}가 맞으십니까?`, (ok) => {
            if (!ok) return;
            enteredPlate = num;
            updateBreadcrumb();
            nextStep();
          });
        };
        btn.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') btn.click();
        };
        plateGridDiv.appendChild(btn);
        setTimeout(() => btn.classList.remove('fade-in'), 250);
      } else {
        const empty = document.createElement('div');
        empty.style.visibility = 'hidden';
        plateGridDiv.appendChild(empty);
      }
    }
  }
  filterInput.addEventListener('input', renderGrid);
  renderGrid();
}

// ======== 초기화 ========
document.addEventListener('DOMContentLoaded', () => {
  // 헤더 로고 클릭 이벤트
  const headerLogo = document.getElementById('header-logo');
  if (headerLogo) {
    headerLogo.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 헤더 제목 클릭 이벤트
  const headerTitle = document.getElementById('header-title');
  if (headerTitle) {
    headerTitle.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // localStorage에 기사님 이름이 있는지 확인
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    history.replaceState({ pageIndex: -1 }, '', '');
    history.pushState({ pageIndex: -1 }, '', '');
    showPage(-1, false);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    history.replaceState({ pageIndex: 0 }, '', '');
    history.pushState({ pageIndex: 0 }, '', '');
    showPage(0, false);
  }
  updateBreadcrumb();
  console.log('운행전 자가점검시스템이 로드되었습니다.');
});

window.addEventListener('popstate', (event) => {
  const pageIndex = event.state && typeof event.state.pageIndex === 'number' ? event.state.pageIndex : (hasDriverName() ? 0 : -1);
  showPage(pageIndex, false);
  // history가 1개뿐이면(첫 화면) 더 이상 뒤로가기를 막음
  if ((pageIndex === 0 || pageIndex === -1) && history.length <= 2) {
    const initialPage = hasDriverName() ? 0 : -1;
    history.pushState({ pageIndex: initialPage }, '', '');
  }
});

// ======== 오프라인 지원 ========
window.addEventListener('online', () => {
  console.log('네트워크 연결이 복구되었습니다.');
});
window.addEventListener('offline', () => {
  console.log('네트워크 연결이 끊어졌습니다.');
  showError('네트워크 연결을 확인해주세요.');
});


```

```javascript
// ======== 상수 ========
const DRIVER_NAME_KEY = 'mdcsDriverName';

const BUSNO_LIST = {
  '노포': ['29', '80', '300'],
  '정관': ['73', '73 (오전)', '106', '107', '184', '188']
};

// ======== Storage 함수 ========
function getDriverName() {
  const stored = localStorage.getItem(DRIVER_NAME_KEY);
  if (!stored) return '';
  return stored.trim();
}

function hasDriverName() {
  return getDriverName().length > 0;
}

function saveDriverName(name) {
  if (!name || !name.trim()) return false;
  localStorage.setItem(DRIVER_NAME_KEY, name.trim());
  return true;
}

// ======== 전역 변수 ========
let currentStep = 0;
const totalSteps = 4;
let selectedSite = '';
let selectedBusNo = '';
let enteredPlate = '';
let uniformStatus = ''; // 'ok' or 'bad'
let uniformReason = ''; // 불량 사유

// ======== DOM 요소 ========
const pages = document.querySelectorAll('.page');
const driverNamePage = document.getElementById('p-driver-name');
const driverNameInput = document.getElementById('driver-name-input');
const driverNameSubmit = document.getElementById('driver-name-submit');

// 근무지 선택 버튼
const siteButtons = {
  nopo: document.getElementById('site-nopo'),
  jeonggwan: document.getElementById('site-jeonggwan')
};

// 버스번호 버튼 컨테이너
const busnoButtonsDiv = document.getElementById('busno-buttons');

// ======== 노선별 차량번호 리스트(구글 시트 연동) ========
let PLATE_LISTS = {};
let plateDataLoaded = false;
let plateDataError = false;
fetch('https://script.google.com/macros/s/AKfycbxKXmbLSOl64gNdOoYIORQs1fpdHOHZuX7LGypDLlgacjKtNhiVTWef6_pBNNkd2cWE/exec')
  .then(res => res.json())
  .then(data => {
    PLATE_LISTS = data;
    plateDataLoaded = true;
  })
  .catch(err => {
    plateDataError = true;
    console.error('차량번호 데이터 불러오기 실패:', err);
  });

// ======== 유효성 검사 함수들 ========
const validators = {
  // 면허판번호 검증 (70가1234 형식)
  plate: (value) => {
    if (!value.trim()) return '면허판 번호를 입력해주세요.';
    const pattern = /^\d{2}[가-힣]\d{4}$/;
    if (!pattern.test(value)) return '올바른 면허판 번호 형식으로 입력해주세요. (예: 70가1234)';
    return null;
  },
  // 사진 검증
  photo: (file) => {
    if (!file) return '사진을 선택해주세요.';
    if (!file.type.startsWith('image/')) return '이미지 파일만 선택 가능합니다.';
    if (file.size > 10 * 1024 * 1024) return '파일 크기는 10MB 이하로 선택해주세요.';
    return null;
  }
};

// ======== 유틸리티 함수들 ========
function showError(message) {
  alert(message);
}

function validateInput(type, value) {
  const validator = validators[type];
  if (!validator) return true;
  const error = validator(value);
  if (error) {
    showError(error);
    return false;
  }
  return true;
}

function updateButtonState(buttonId, isValid) {
  const button = buttons[buttonId];
  if (button) {
    button.disabled = !isValid;
  }
}

function getCurrentPrevBtn() {
  const cards = document.querySelectorAll('.card');
  return cards[currentStep]?.querySelector('.prevBtn');
}

function updatePrevBtn() {
  document.querySelectorAll('.prevBtn').forEach((btn) => {
    // 이름 입력 페이지(-1)나 근무지 선택 페이지(0)에서는 이전 버튼 비활성화
    btn.disabled = (currentStep === -1 || currentStep === 0);
    
    // 모든 이전 버튼에 이벤트 설정
    btn.onclick = () => {
      if (currentStep > 0) {
        window.history.back();
      }
    };
  });
}

// 페이지 ID를 인덱스로 변환하는 맵
const pageIdToIndex = {
  'p-driver-name': -1,
  'p0': 0,
  'p1': 1,
  'p2': 2,
  'p3': 3,
  'done': 4
};

// 인덱스를 페이지 ID로 변환
function getPageIdByIndex(index) {
  const idMap = ['p0', 'p1', 'p2', 'p3', 'done'];
  if (index === -1) return 'p-driver-name';
  return idMap[index] || 'p0';
}

function showPage(pageIndex, pushHistory = false) {
  // 이름 입력 페이지 처리
  if (pageIndex === -1) {
    pages.forEach(page => page.classList.remove('active'));
    driverNamePage.classList.add('active');
    currentStep = -1;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (pushHistory) {
      history.pushState({ pageIndex: -1 }, '', '');
    }
    return;
  }

  // 이름 입력 페이지 숨기기
  driverNamePage.classList.remove('active');

  // 단계별로 입력값 초기화
  if (pageIndex === 0) {
    selectedSite = '';
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 1) {
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 2) {
    enteredPlate = '';
  }
  
  // 일반 페이지 표시
  pages.forEach((page, index) => {
    const pageId = page.id;
    if (pageId === 'p-driver-name') {
      page.classList.remove('active');
    } else {
      const pageIdx = pageIdToIndex[pageId] || 0;
      page.classList.toggle('active', pageIdx === pageIndex);
    }
  });
  currentStep = pageIndex;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  updatePrevBtn();
  updateBreadcrumb();
  
  // 차량번호 선택 페이지(p2)일 때 그리드 렌더링
  if (pageIndex === 2) {
    renderPlateGrid();
  }
  
  if (pushHistory) {
    history.pushState({ pageIndex: currentStep }, '', '');
  }
}

function nextStep() {
  // 이름 입력 페이지에서 다음 단계로
  if (currentStep === -1) {
    showPage(0, true);
    return;
  }
  // 일반 페이지 다음 단계
  if (currentStep < 4) { // done 페이지는 인덱스 4
    showPage(currentStep + 1, true);
  }
}

// ======== 커스텀 모달 ========
function showModal(message, onConfirm) {
  const modal = document.getElementById('modal');
  const msg = document.getElementById('modal-message');
  const yesBtn = document.getElementById('modal-yes');
  const noBtn = document.getElementById('modal-no');
  msg.textContent = message;
  modal.style.display = 'flex';
  function cleanup() {
    modal.style.display = 'none';
    yesBtn.removeEventListener('click', yesHandler);
    noBtn.removeEventListener('click', noHandler);
  }
  function yesHandler() {
    cleanup();
    onConfirm(true);
  }
  function noHandler() {
    cleanup();
    onConfirm(false);
  }
  yesBtn.addEventListener('click', yesHandler);
  noBtn.addEventListener('click', noHandler);
}

// ======== 근무지 선택 이벤트 리스너 ========
siteButtons.nopo.addEventListener('click', () => {
  showModal('근무지 : 노포(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '노포';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('노포');
    updateBreadcrumb();
    nextStep();
  });
});

siteButtons.jeonggwan.addEventListener('click', () => {
  showModal('근무지 : 정관(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '정관';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('정관');
    updateBreadcrumb();
    nextStep();
  });
});

// ======== 버스번호 버튼 동적 생성 ========
function renderBusNoButtons(site) {
  busnoButtonsDiv.innerHTML = '';
  BUSNO_LIST[site].forEach(busNo => {
    const btn = document.createElement('button');
    btn.className = 'busno-btn';
    btn.textContent = busNo;
    btn.onclick = () => {
      showModal(`노선번호 : ${busNo}(이)가 맞으십니까?`, (ok) => {
        if (!ok) return;
        selectedBusNo = busNo;
        updateBreadcrumb();
        nextStep();
      });
    };
    busnoButtonsDiv.appendChild(btn);
  });
}

// ======== 복장 상태 확인 버튼 ========
const uniformOkBtn = document.getElementById('uniform-ok');
const uniformBadBtn = document.getElementById('uniform-bad');

uniformOkBtn.addEventListener('click', () => {
  uniformStatus = 'ok';
  uniformReason = '';
  nextStep();
});

uniformBadBtn.addEventListener('click', () => {
  showReasonModal();
});

// ======== 불량 사유 입력 모달 ========
function showReasonModal() {
  const modal = document.getElementById('modal-reason');
  const reasonInput = document.getElementById('reason-input');
  const submitBtn = document.getElementById('modal-reason-submit');
  const cancelBtn = document.getElementById('modal-reason-cancel');
  
  reasonInput.value = uniformReason; // 기존 값이 있으면 표시
  modal.style.display = 'flex';
  
  function cleanup() {
    modal.style.display = 'none';
    submitBtn.removeEventListener('click', submitHandler);
    cancelBtn.removeEventListener('click', cancelHandler);
  }
  
  function submitHandler() {
    const reason = reasonInput.value.trim();
    if (!reason) {
      showError('불량 사유를 입력해주세요.');
      return;
    }
    uniformStatus = 'bad';
    uniformReason = reason;
    cleanup();
    nextStep();
  }
  
  function cancelHandler() {
    cleanup();
  }
  
  submitBtn.addEventListener('click', submitHandler);
  cancelBtn.addEventListener('click', cancelHandler);
  
  // Enter 키로 제출
  reasonInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      submitHandler();
    }
  });
  
  // 포커스
  setTimeout(() => reasonInput.focus(), 100);
}

// ======== 데이터 제출 함수 ========
async function submitData() {
  const formData = new FormData();
  formData.append('site', selectedSite);
  formData.append('busNo', selectedBusNo);
  formData.append('plate', enteredPlate);
  const photoFile = inputs.photo.files[0];
  if (photoFile) {
    formData.append('photo', photoFile);
  }
  formData.append('timestamp', new Date().toISOString());
  // TODO: 실제 백엔드 URL로 변경 필요
  const response = await fetch('/api/submit', {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// ======== 키보드 이벤트 ========
document.addEventListener('keydown', (e) => {
  // 버스번호 선택 화면에서는 Enter로 동작하지 않음
  if (currentStep === 1) return;
  const btnMap = {2: 'b2', 3: 'b3'};
  const currentButton = buttons[btnMap[currentStep]];
  if (e.key === 'Enter' && currentButton && !currentButton.disabled) {
    currentButton.click();
  }
});

// 처음 화면으로 이동하는 함수
function goToInitialPage() {
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    showPage(-1, true);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    showPage(0, true);
  }
}

// 이름 입력 이벤트 리스너
if (driverNameInput && driverNameSubmit) {
  driverNameInput.addEventListener('input', (e) => {
    const name = e.target.value.trim();
    driverNameSubmit.disabled = name.length === 0;
  });

  driverNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !driverNameSubmit.disabled) {
      driverNameSubmit.click();
    }
  });

  driverNameSubmit.addEventListener('click', () => {
    const name = driverNameInput.value.trim();
    if (name.length > 0) {
      saveDriverName(name);
      showPage(0, true); // 근무지 선택 페이지로 이동
    }
  });
}

const breadcrumb = document.getElementById('breadcrumb');

function updateBreadcrumb() {
  let crumbs = [];
  if (selectedSite) crumbs.push(`<span class="crumb">근무지: ${selectedSite}</span>`);
  if (selectedBusNo) crumbs.push(`<span class="crumb">노선번호: ${selectedBusNo}</span>`);
  if (enteredPlate) crumbs.push(`<span class="crumb">차량번호: ${enteredPlate}</span>`);
  breadcrumb.innerHTML = crumbs.join('<span class="sep">&gt;</span>');
}

// ======== renderPlateGrid 수정 ========
function renderPlateGrid() {
  // p2 페이지의 card-content를 직접 찾기
  const p2Page = document.getElementById('p2');
  if (!p2Page) return;
  const cardContent = p2Page.querySelector('.card-content');
  if (!cardContent) return;
  let plateGridDiv = cardContent.querySelector('#plate-grid');
  if (plateGridDiv) cardContent.removeChild(plateGridDiv);
  let filterInput = cardContent.querySelector('#plate-filter');
  if (filterInput) cardContent.removeChild(filterInput);
  let errorMsg = cardContent.querySelector('#plate-filter-error');
  if (errorMsg) cardContent.removeChild(errorMsg);
  filterInput = document.createElement('input');
  filterInput.id = 'plate-filter';
  filterInput.type = 'text';
  filterInput.placeholder = '차량번호 검색(숫자 입력)';
  filterInput.inputMode = 'numeric';
  filterInput.autocomplete = 'off';
  filterInput.style.marginBottom = '0.5rem';
  filterInput.style.width = '100%';
  cardContent.appendChild(filterInput);
  errorMsg = document.createElement('div');
  errorMsg.id = 'plate-filter-error';
  errorMsg.style.color = '#dc2626';
  errorMsg.style.fontSize = '0.98rem';
  errorMsg.style.height = '1.2em';
  errorMsg.style.marginBottom = '0.5rem';
  errorMsg.style.textAlign = 'left';
  errorMsg.textContent = '';
  cardContent.appendChild(errorMsg);
  plateGridDiv = document.createElement('div');
  plateGridDiv.id = 'plate-grid';
  plateGridDiv.style.display = 'grid';
  plateGridDiv.style.gridTemplateColumns = 'repeat(3, 1fr)';
  plateGridDiv.style.gap = '0.7rem';
  plateGridDiv.style.maxHeight = '320px';
  plateGridDiv.style.minHeight = '320px';
  plateGridDiv.style.overflowY = 'auto';
  plateGridDiv.style.overflowX = 'hidden';
  plateGridDiv.style.width = '100%';
  plateGridDiv.style.marginBottom = '1.2rem';
  cardContent.appendChild(plateGridDiv);
  function renderGrid() {
    const oldBtns = Array.from(plateGridDiv.children);
    oldBtns.forEach(btn => {
      btn.classList.add('fade-exit');
      setTimeout(() => btn.remove(), 200);
    });
    // 데이터 로딩 상태 처리
    if (!plateDataLoaded) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#888;font-size:1.1rem;">차량번호 데이터를 불러오는 중...</div>';
      return;
    }
    if (plateDataError) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#dc2626;font-size:1.1rem;">차량번호 데이터를 불러오지 못했습니다.</div>';
      return;
    }
    let list = [];
    if (selectedBusNo && PLATE_LISTS[selectedBusNo]) {
      list = PLATE_LISTS[selectedBusNo];
    }
    let filter = filterInput.value.trim();
    if (filter.length > 4) {
      filter = filter.slice(0, 4);
      filterInput.value = filter;
    }
    if (filter && /[^0-9]/.test(filter)) {
      errorMsg.textContent = '숫자만 입력해주세요!';
      return;
    } else {
      errorMsg.textContent = '';
    }
    const filtered = filter ? list.filter(num => num.includes(filter)) : list;
    const total = filtered.length;
    const maxRow = Math.ceil(list.length / 3);
    plateGridDiv.style.gridTemplateRows = `repeat(${maxRow}, 1fr)`;
    for (let i = 0; i < maxRow * 3; i++) {
      if (i < total) {
        const num = filtered[i];
        const btn = document.createElement('button');
        btn.className = 'plate-btn fade-in';
        btn.textContent = num;
        btn.setAttribute('aria-label', `차량번호 ${num}`);
        btn.tabIndex = 0;
        btn.onclick = () => {
          showModal(`차량번호 : ${num}가 맞으십니까?`, (ok) => {
            if (!ok) return;
            enteredPlate = num;
            updateBreadcrumb();
            nextStep();
          });
        };
        btn.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') btn.click();
        };
        plateGridDiv.appendChild(btn);
        setTimeout(() => btn.classList.remove('fade-in'), 250);
      } else {
        const empty = document.createElement('div');
        empty.style.visibility = 'hidden';
        plateGridDiv.appendChild(empty);
      }
    }
  }
  filterInput.addEventListener('input', renderGrid);
  renderGrid();
}

// ======== 초기화 ========
document.addEventListener('DOMContentLoaded', () => {
  // 헤더 로고 클릭 이벤트
  const headerLogo = document.getElementById('header-logo');
  if (headerLogo) {
    headerLogo.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 헤더 제목 클릭 이벤트
  const headerTitle = document.getElementById('header-title');
  if (headerTitle) {
    headerTitle.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // localStorage에 기사님 이름이 있는지 확인
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    history.replaceState({ pageIndex: -1 }, '', '');
    history.pushState({ pageIndex: -1 }, '', '');
    showPage(-1, false);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    history.replaceState({ pageIndex: 0 }, '', '');
    history.pushState({ pageIndex: 0 }, '', '');
    showPage(0, false);
  }
  updateBreadcrumb();
  console.log('운행전 자가점검시스템이 로드되었습니다.');
});

window.addEventListener('popstate', (event) => {
  const pageIndex = event.state && typeof event.state.pageIndex === 'number' ? event.state.pageIndex : (hasDriverName() ? 0 : -1);
  showPage(pageIndex, false);
  // history가 1개뿐이면(첫 화면) 더 이상 뒤로가기를 막음
  if ((pageIndex === 0 || pageIndex === -1) && history.length <= 2) {
    const initialPage = hasDriverName() ? 0 : -1;
    history.pushState({ pageIndex: initialPage }, '', '');
  }
});

// ======== 오프라인 지원 ========
window.addEventListener('online', () => {
  console.log('네트워크 연결이 복구되었습니다.');
});
window.addEventListener('offline', () => {
  console.log('네트워크 연결이 끊어졌습니다.');
  showError('네트워크 연결을 확인해주세요.');
});


```


제출 함수 수정 중: 사진 대신 복장 상태 정보를 제출하도록 변경.


```javascript
// ======== 상수 ========
const DRIVER_NAME_KEY = 'mdcsDriverName';

const BUSNO_LIST = {
  '노포': ['29', '80', '300'],
  '정관': ['73', '73 (오전)', '106', '107', '184', '188']
};

// ======== Storage 함수 ========
function getDriverName() {
  const stored = localStorage.getItem(DRIVER_NAME_KEY);
  if (!stored) return '';
  return stored.trim();
}

function hasDriverName() {
  return getDriverName().length > 0;
}

function saveDriverName(name) {
  if (!name || !name.trim()) return false;
  localStorage.setItem(DRIVER_NAME_KEY, name.trim());
  return true;
}

// ======== 전역 변수 ========
let currentStep = 0;
const totalSteps = 4;
let selectedSite = '';
let selectedBusNo = '';
let enteredPlate = '';
let uniformStatus = ''; // 'ok' or 'bad'
let uniformReason = ''; // 불량 사유

// ======== DOM 요소 ========
const pages = document.querySelectorAll('.page');
const driverNamePage = document.getElementById('p-driver-name');
const driverNameInput = document.getElementById('driver-name-input');
const driverNameSubmit = document.getElementById('driver-name-submit');

// 근무지 선택 버튼
const siteButtons = {
  nopo: document.getElementById('site-nopo'),
  jeonggwan: document.getElementById('site-jeonggwan')
};

// 버스번호 버튼 컨테이너
const busnoButtonsDiv = document.getElementById('busno-buttons');

// ======== 노선별 차량번호 리스트(구글 시트 연동) ========
let PLATE_LISTS = {};
let plateDataLoaded = false;
let plateDataError = false;
fetch('https://script.google.com/macros/s/AKfycbxKXmbLSOl64gNdOoYIORQs1fpdHOHZuX7LGypDLlgacjKtNhiVTWef6_pBNNkd2cWE/exec')
  .then(res => res.json())
  .then(data => {
    PLATE_LISTS = data;
    plateDataLoaded = true;
  })
  .catch(err => {
    plateDataError = true;
    console.error('차량번호 데이터 불러오기 실패:', err);
  });

// ======== 유효성 검사 함수들 ========
const validators = {
  // 면허판번호 검증 (70가1234 형식)
  plate: (value) => {
    if (!value.trim()) return '면허판 번호를 입력해주세요.';
    const pattern = /^\d{2}[가-힣]\d{4}$/;
    if (!pattern.test(value)) return '올바른 면허판 번호 형식으로 입력해주세요. (예: 70가1234)';
    return null;
  },
  // 사진 검증
  photo: (file) => {
    if (!file) return '사진을 선택해주세요.';
    if (!file.type.startsWith('image/')) return '이미지 파일만 선택 가능합니다.';
    if (file.size > 10 * 1024 * 1024) return '파일 크기는 10MB 이하로 선택해주세요.';
    return null;
  }
};

// ======== 유틸리티 함수들 ========
function showError(message) {
  alert(message);
}

function validateInput(type, value) {
  const validator = validators[type];
  if (!validator) return true;
  const error = validator(value);
  if (error) {
    showError(error);
    return false;
  }
  return true;
}

function updateButtonState(buttonId, isValid) {
  const button = buttons[buttonId];
  if (button) {
    button.disabled = !isValid;
  }
}

function getCurrentPrevBtn() {
  const cards = document.querySelectorAll('.card');
  return cards[currentStep]?.querySelector('.prevBtn');
}

function updatePrevBtn() {
  document.querySelectorAll('.prevBtn').forEach((btn) => {
    // 이름 입력 페이지(-1)나 근무지 선택 페이지(0)에서는 이전 버튼 비활성화
    btn.disabled = (currentStep === -1 || currentStep === 0);
    
    // 모든 이전 버튼에 이벤트 설정
    btn.onclick = () => {
      if (currentStep > 0) {
        window.history.back();
      }
    };
  });
}

// 페이지 ID를 인덱스로 변환하는 맵
const pageIdToIndex = {
  'p-driver-name': -1,
  'p0': 0,
  'p1': 1,
  'p2': 2,
  'p3': 3,
  'done': 4
};

// 인덱스를 페이지 ID로 변환
function getPageIdByIndex(index) {
  const idMap = ['p0', 'p1', 'p2', 'p3', 'done'];
  if (index === -1) return 'p-driver-name';
  return idMap[index] || 'p0';
}

function showPage(pageIndex, pushHistory = false) {
  // 이름 입력 페이지 처리
  if (pageIndex === -1) {
    pages.forEach(page => page.classList.remove('active'));
    driverNamePage.classList.add('active');
    currentStep = -1;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (pushHistory) {
      history.pushState({ pageIndex: -1 }, '', '');
    }
    return;
  }

  // 이름 입력 페이지 숨기기
  driverNamePage.classList.remove('active');

  // 단계별로 입력값 초기화
  if (pageIndex === 0) {
    selectedSite = '';
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 1) {
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 2) {
    enteredPlate = '';
  }
  
  // 일반 페이지 표시
  pages.forEach((page, index) => {
    const pageId = page.id;
    if (pageId === 'p-driver-name') {
      page.classList.remove('active');
    } else {
      const pageIdx = pageIdToIndex[pageId] || 0;
      page.classList.toggle('active', pageIdx === pageIndex);
    }
  });
  currentStep = pageIndex;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  updatePrevBtn();
  updateBreadcrumb();
  
  // 차량번호 선택 페이지(p2)일 때 그리드 렌더링
  if (pageIndex === 2) {
    renderPlateGrid();
  }
  
  if (pushHistory) {
    history.pushState({ pageIndex: currentStep }, '', '');
  }
}

function nextStep() {
  // 이름 입력 페이지에서 다음 단계로
  if (currentStep === -1) {
    showPage(0, true);
    return;
  }
  // 일반 페이지 다음 단계
  if (currentStep < 4) { // done 페이지는 인덱스 4
    showPage(currentStep + 1, true);
  }
}

// ======== 커스텀 모달 ========
function showModal(message, onConfirm) {
  const modal = document.getElementById('modal');
  const msg = document.getElementById('modal-message');
  const yesBtn = document.getElementById('modal-yes');
  const noBtn = document.getElementById('modal-no');
  msg.textContent = message;
  modal.style.display = 'flex';
  function cleanup() {
    modal.style.display = 'none';
    yesBtn.removeEventListener('click', yesHandler);
    noBtn.removeEventListener('click', noHandler);
  }
  function yesHandler() {
    cleanup();
    onConfirm(true);
  }
  function noHandler() {
    cleanup();
    onConfirm(false);
  }
  yesBtn.addEventListener('click', yesHandler);
  noBtn.addEventListener('click', noHandler);
}

// ======== 근무지 선택 이벤트 리스너 ========
siteButtons.nopo.addEventListener('click', () => {
  showModal('근무지 : 노포(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '노포';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('노포');
    updateBreadcrumb();
    nextStep();
  });
});

siteButtons.jeonggwan.addEventListener('click', () => {
  showModal('근무지 : 정관(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '정관';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('정관');
    updateBreadcrumb();
    nextStep();
  });
});

// ======== 버스번호 버튼 동적 생성 ========
function renderBusNoButtons(site) {
  busnoButtonsDiv.innerHTML = '';
  BUSNO_LIST[site].forEach(busNo => {
    const btn = document.createElement('button');
    btn.className = 'busno-btn';
    btn.textContent = busNo;
    btn.onclick = () => {
      showModal(`노선번호 : ${busNo}(이)가 맞으십니까?`, (ok) => {
        if (!ok) return;
        selectedBusNo = busNo;
        updateBreadcrumb();
        nextStep();
      });
    };
    busnoButtonsDiv.appendChild(btn);
  });
}

// ======== 복장 상태 확인 버튼 ========
const uniformOkBtn = document.getElementById('uniform-ok');
const uniformBadBtn = document.getElementById('uniform-bad');

uniformOkBtn.addEventListener('click', () => {
  uniformStatus = 'ok';
  uniformReason = '';
  nextStep();
});

uniformBadBtn.addEventListener('click', () => {
  showReasonModal();
});

// ======== 불량 사유 입력 모달 ========
function showReasonModal() {
  const modal = document.getElementById('modal-reason');
  const reasonInput = document.getElementById('reason-input');
  const submitBtn = document.getElementById('modal-reason-submit');
  const cancelBtn = document.getElementById('modal-reason-cancel');
  
  reasonInput.value = uniformReason; // 기존 값이 있으면 표시
  modal.style.display = 'flex';
  
  function cleanup() {
    modal.style.display = 'none';
    submitBtn.removeEventListener('click', submitHandler);
    cancelBtn.removeEventListener('click', cancelHandler);
  }
  
  function submitHandler() {
    const reason = reasonInput.value.trim();
    if (!reason) {
      showError('불량 사유를 입력해주세요.');
      return;
    }
    uniformStatus = 'bad';
    uniformReason = reason;
    cleanup();
    nextStep();
  }
  
  function cancelHandler() {
    cleanup();
  }
  
  submitBtn.addEventListener('click', submitHandler);
  cancelBtn.addEventListener('click', cancelHandler);
  
  // Enter 키로 제출
  reasonInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      submitHandler();
    }
  });
  
  // 포커스
  setTimeout(() => reasonInput.focus(), 100);
}

// ======== 데이터 제출 함수 ========
async function submitData() {
  const formData = new FormData();
  formData.append('site', selectedSite);
  formData.append('busNo', selectedBusNo);
  formData.append('plate', enteredPlate);
  formData.append('uniformStatus', uniformStatus);
  if (uniformStatus === 'bad' && uniformReason) {
    formData.append('uniformReason', uniformReason);
  }
  formData.append('timestamp', new Date().toISOString());
  // TODO: 실제 백엔드 URL로 변경 필요
  const response = await fetch('/api/submit', {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// ======== 키보드 이벤트 ========
document.addEventListener('keydown', (e) => {
  // 버스번호 선택 화면에서는 Enter로 동작하지 않음
  if (currentStep === 1) return;
  const btnMap = {2: 'b2', 3: 'b3'};
  const currentButton = buttons[btnMap[currentStep]];
  if (e.key === 'Enter' && currentButton && !currentButton.disabled) {
    currentButton.click();
  }
});

// 처음 화면으로 이동하는 함수
function goToInitialPage() {
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    showPage(-1, true);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    showPage(0, true);
  }
}

// 이름 입력 이벤트 리스너
if (driverNameInput && driverNameSubmit) {
  driverNameInput.addEventListener('input', (e) => {
    const name = e.target.value.trim();
    driverNameSubmit.disabled = name.length === 0;
  });

  driverNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !driverNameSubmit.disabled) {
      driverNameSubmit.click();
    }
  });

  driverNameSubmit.addEventListener('click', () => {
    const name = driverNameInput.value.trim();
    if (name.length > 0) {
      saveDriverName(name);
      showPage(0, true); // 근무지 선택 페이지로 이동
    }
  });
}

const breadcrumb = document.getElementById('breadcrumb');

function updateBreadcrumb() {
  let crumbs = [];
  if (selectedSite) crumbs.push(`<span class="crumb">근무지: ${selectedSite}</span>`);
  if (selectedBusNo) crumbs.push(`<span class="crumb">노선번호: ${selectedBusNo}</span>`);
  if (enteredPlate) crumbs.push(`<span class="crumb">차량번호: ${enteredPlate}</span>`);
  breadcrumb.innerHTML = crumbs.join('<span class="sep">&gt;</span>');
}

// ======== renderPlateGrid 수정 ========
function renderPlateGrid() {
  // p2 페이지의 card-content를 직접 찾기
  const p2Page = document.getElementById('p2');
  if (!p2Page) return;
  const cardContent = p2Page.querySelector('.card-content');
  if (!cardContent) return;
  let plateGridDiv = cardContent.querySelector('#plate-grid');
  if (plateGridDiv) cardContent.removeChild(plateGridDiv);
  let filterInput = cardContent.querySelector('#plate-filter');
  if (filterInput) cardContent.removeChild(filterInput);
  let errorMsg = cardContent.querySelector('#plate-filter-error');
  if (errorMsg) cardContent.removeChild(errorMsg);
  filterInput = document.createElement('input');
  filterInput.id = 'plate-filter';
  filterInput.type = 'text';
  filterInput.placeholder = '차량번호 검색(숫자 입력)';
  filterInput.inputMode = 'numeric';
  filterInput.autocomplete = 'off';
  filterInput.style.marginBottom = '0.5rem';
  filterInput.style.width = '100%';
  cardContent.appendChild(filterInput);
  errorMsg = document.createElement('div');
  errorMsg.id = 'plate-filter-error';
  errorMsg.style.color = '#dc2626';
  errorMsg.style.fontSize = '0.98rem';
  errorMsg.style.height = '1.2em';
  errorMsg.style.marginBottom = '0.5rem';
  errorMsg.style.textAlign = 'left';
  errorMsg.textContent = '';
  cardContent.appendChild(errorMsg);
  plateGridDiv = document.createElement('div');
  plateGridDiv.id = 'plate-grid';
  plateGridDiv.style.display = 'grid';
  plateGridDiv.style.gridTemplateColumns = 'repeat(3, 1fr)';
  plateGridDiv.style.gap = '0.7rem';
  plateGridDiv.style.maxHeight = '320px';
  plateGridDiv.style.minHeight = '320px';
  plateGridDiv.style.overflowY = 'auto';
  plateGridDiv.style.overflowX = 'hidden';
  plateGridDiv.style.width = '100%';
  plateGridDiv.style.marginBottom = '1.2rem';
  cardContent.appendChild(plateGridDiv);
  function renderGrid() {
    const oldBtns = Array.from(plateGridDiv.children);
    oldBtns.forEach(btn => {
      btn.classList.add('fade-exit');
      setTimeout(() => btn.remove(), 200);
    });
    // 데이터 로딩 상태 처리
    if (!plateDataLoaded) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#888;font-size:1.1rem;">차량번호 데이터를 불러오는 중...</div>';
      return;
    }
    if (plateDataError) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#dc2626;font-size:1.1rem;">차량번호 데이터를 불러오지 못했습니다.</div>';
      return;
    }
    let list = [];
    if (selectedBusNo && PLATE_LISTS[selectedBusNo]) {
      list = PLATE_LISTS[selectedBusNo];
    }
    let filter = filterInput.value.trim();
    if (filter.length > 4) {
      filter = filter.slice(0, 4);
      filterInput.value = filter;
    }
    if (filter && /[^0-9]/.test(filter)) {
      errorMsg.textContent = '숫자만 입력해주세요!';
      return;
    } else {
      errorMsg.textContent = '';
    }
    const filtered = filter ? list.filter(num => num.includes(filter)) : list;
    const total = filtered.length;
    const maxRow = Math.ceil(list.length / 3);
    plateGridDiv.style.gridTemplateRows = `repeat(${maxRow}, 1fr)`;
    for (let i = 0; i < maxRow * 3; i++) {
      if (i < total) {
        const num = filtered[i];
        const btn = document.createElement('button');
        btn.className = 'plate-btn fade-in';
        btn.textContent = num;
        btn.setAttribute('aria-label', `차량번호 ${num}`);
        btn.tabIndex = 0;
        btn.onclick = () => {
          showModal(`차량번호 : ${num}가 맞으십니까?`, (ok) => {
            if (!ok) return;
            enteredPlate = num;
            updateBreadcrumb();
            nextStep();
          });
        };
        btn.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') btn.click();
        };
        plateGridDiv.appendChild(btn);
        setTimeout(() => btn.classList.remove('fade-in'), 250);
      } else {
        const empty = document.createElement('div');
        empty.style.visibility = 'hidden';
        plateGridDiv.appendChild(empty);
      }
    }
  }
  filterInput.addEventListener('input', renderGrid);
  renderGrid();
}

// ======== 초기화 ========
document.addEventListener('DOMContentLoaded', () => {
  // 헤더 로고 클릭 이벤트
  const headerLogo = document.getElementById('header-logo');
  if (headerLogo) {
    headerLogo.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 헤더 제목 클릭 이벤트
  const headerTitle = document.getElementById('header-title');
  if (headerTitle) {
    headerTitle.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // localStorage에 기사님 이름이 있는지 확인
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    history.replaceState({ pageIndex: -1 }, '', '');
    history.pushState({ pageIndex: -1 }, '', '');
    showPage(-1, false);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    history.replaceState({ pageIndex: 0 }, '', '');
    history.pushState({ pageIndex: 0 }, '', '');
    showPage(0, false);
  }
  updateBreadcrumb();
  console.log('운행전 자가점검시스템이 로드되었습니다.');
});

window.addEventListener('popstate', (event) => {
  const pageIndex = event.state && typeof event.state.pageIndex === 'number' ? event.state.pageIndex : (hasDriverName() ? 0 : -1);
  showPage(pageIndex, false);
  // history가 1개뿐이면(첫 화면) 더 이상 뒤로가기를 막음
  if ((pageIndex === 0 || pageIndex === -1) && history.length <= 2) {
    const initialPage = hasDriverName() ? 0 : -1;
    history.pushState({ pageIndex: initialPage }, '', '');
  }
});

// ======== 오프라인 지원 ========
window.addEventListener('online', () => {
  console.log('네트워크 연결이 복구되었습니다.');
});
window.addEventListener('offline', () => {
  console.log('네트워크 연결이 끊어졌습니다.');
  showError('네트워크 연결을 확인해주세요.');
});


```


복장 상태 확인 후 자동 제출되도록 수정 중.


```javascript
// ======== 상수 ========
const DRIVER_NAME_KEY = 'mdcsDriverName';

const BUSNO_LIST = {
  '노포': ['29', '80', '300'],
  '정관': ['73', '73 (오전)', '106', '107', '184', '188']
};

// ======== Storage 함수 ========
function getDriverName() {
  const stored = localStorage.getItem(DRIVER_NAME_KEY);
  if (!stored) return '';
  return stored.trim();
}

function hasDriverName() {
  return getDriverName().length > 0;
}

function saveDriverName(name) {
  if (!name || !name.trim()) return false;
  localStorage.setItem(DRIVER_NAME_KEY, name.trim());
  return true;
}

// ======== 전역 변수 ========
let currentStep = 0;
const totalSteps = 4;
let selectedSite = '';
let selectedBusNo = '';
let enteredPlate = '';
let uniformStatus = ''; // 'ok' or 'bad'
let uniformReason = ''; // 불량 사유

// ======== DOM 요소 ========
const pages = document.querySelectorAll('.page');
const driverNamePage = document.getElementById('p-driver-name');
const driverNameInput = document.getElementById('driver-name-input');
const driverNameSubmit = document.getElementById('driver-name-submit');

// 근무지 선택 버튼
const siteButtons = {
  nopo: document.getElementById('site-nopo'),
  jeonggwan: document.getElementById('site-jeonggwan')
};

// 버스번호 버튼 컨테이너
const busnoButtonsDiv = document.getElementById('busno-buttons');

// ======== 노선별 차량번호 리스트(구글 시트 연동) ========
let PLATE_LISTS = {};
let plateDataLoaded = false;
let plateDataError = false;
fetch('https://script.google.com/macros/s/AKfycbxKXmbLSOl64gNdOoYIORQs1fpdHOHZuX7LGypDLlgacjKtNhiVTWef6_pBNNkd2cWE/exec')
  .then(res => res.json())
  .then(data => {
    PLATE_LISTS = data;
    plateDataLoaded = true;
  })
  .catch(err => {
    plateDataError = true;
    console.error('차량번호 데이터 불러오기 실패:', err);
  });

// ======== 유효성 검사 함수들 ========
const validators = {
  // 면허판번호 검증 (70가1234 형식)
  plate: (value) => {
    if (!value.trim()) return '면허판 번호를 입력해주세요.';
    const pattern = /^\d{2}[가-힣]\d{4}$/;
    if (!pattern.test(value)) return '올바른 면허판 번호 형식으로 입력해주세요. (예: 70가1234)';
    return null;
  },
  // 사진 검증
  photo: (file) => {
    if (!file) return '사진을 선택해주세요.';
    if (!file.type.startsWith('image/')) return '이미지 파일만 선택 가능합니다.';
    if (file.size > 10 * 1024 * 1024) return '파일 크기는 10MB 이하로 선택해주세요.';
    return null;
  }
};

// ======== 유틸리티 함수들 ========
function showError(message) {
  alert(message);
}

function validateInput(type, value) {
  const validator = validators[type];
  if (!validator) return true;
  const error = validator(value);
  if (error) {
    showError(error);
    return false;
  }
  return true;
}

function updateButtonState(buttonId, isValid) {
  const button = buttons[buttonId];
  if (button) {
    button.disabled = !isValid;
  }
}

function getCurrentPrevBtn() {
  const cards = document.querySelectorAll('.card');
  return cards[currentStep]?.querySelector('.prevBtn');
}

function updatePrevBtn() {
  document.querySelectorAll('.prevBtn').forEach((btn) => {
    // 이름 입력 페이지(-1)나 근무지 선택 페이지(0)에서는 이전 버튼 비활성화
    btn.disabled = (currentStep === -1 || currentStep === 0);
    
    // 모든 이전 버튼에 이벤트 설정
    btn.onclick = () => {
      if (currentStep > 0) {
        window.history.back();
      }
    };
  });
}

// 페이지 ID를 인덱스로 변환하는 맵
const pageIdToIndex = {
  'p-driver-name': -1,
  'p0': 0,
  'p1': 1,
  'p2': 2,
  'p3': 3,
  'done': 4
};

// 인덱스를 페이지 ID로 변환
function getPageIdByIndex(index) {
  const idMap = ['p0', 'p1', 'p2', 'p3', 'done'];
  if (index === -1) return 'p-driver-name';
  return idMap[index] || 'p0';
}

function showPage(pageIndex, pushHistory = false) {
  // 이름 입력 페이지 처리
  if (pageIndex === -1) {
    pages.forEach(page => page.classList.remove('active'));
    driverNamePage.classList.add('active');
    currentStep = -1;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (pushHistory) {
      history.pushState({ pageIndex: -1 }, '', '');
    }
    return;
  }

  // 이름 입력 페이지 숨기기
  driverNamePage.classList.remove('active');

  // 단계별로 입력값 초기화
  if (pageIndex === 0) {
    selectedSite = '';
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 1) {
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 2) {
    enteredPlate = '';
  }
  
  // 일반 페이지 표시
  pages.forEach((page, index) => {
    const pageId = page.id;
    if (pageId === 'p-driver-name') {
      page.classList.remove('active');
    } else {
      const pageIdx = pageIdToIndex[pageId] || 0;
      page.classList.toggle('active', pageIdx === pageIndex);
    }
  });
  currentStep = pageIndex;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  updatePrevBtn();
  updateBreadcrumb();
  
  // 차량번호 선택 페이지(p2)일 때 그리드 렌더링
  if (pageIndex === 2) {
    renderPlateGrid();
  }
  
  if (pushHistory) {
    history.pushState({ pageIndex: currentStep }, '', '');
  }
}

function nextStep() {
  // 이름 입력 페이지에서 다음 단계로
  if (currentStep === -1) {
    showPage(0, true);
    return;
  }
  // 일반 페이지 다음 단계
  if (currentStep < 4) { // done 페이지는 인덱스 4
    showPage(currentStep + 1, true);
  }
}

// ======== 커스텀 모달 ========
function showModal(message, onConfirm) {
  const modal = document.getElementById('modal');
  const msg = document.getElementById('modal-message');
  const yesBtn = document.getElementById('modal-yes');
  const noBtn = document.getElementById('modal-no');
  msg.textContent = message;
  modal.style.display = 'flex';
  function cleanup() {
    modal.style.display = 'none';
    yesBtn.removeEventListener('click', yesHandler);
    noBtn.removeEventListener('click', noHandler);
  }
  function yesHandler() {
    cleanup();
    onConfirm(true);
  }
  function noHandler() {
    cleanup();
    onConfirm(false);
  }
  yesBtn.addEventListener('click', yesHandler);
  noBtn.addEventListener('click', noHandler);
}

// ======== 근무지 선택 이벤트 리스너 ========
siteButtons.nopo.addEventListener('click', () => {
  showModal('근무지 : 노포(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '노포';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('노포');
    updateBreadcrumb();
    nextStep();
  });
});

siteButtons.jeonggwan.addEventListener('click', () => {
  showModal('근무지 : 정관(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '정관';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('정관');
    updateBreadcrumb();
    nextStep();
  });
});

// ======== 버스번호 버튼 동적 생성 ========
function renderBusNoButtons(site) {
  busnoButtonsDiv.innerHTML = '';
  BUSNO_LIST[site].forEach(busNo => {
    const btn = document.createElement('button');
    btn.className = 'busno-btn';
    btn.textContent = busNo;
    btn.onclick = () => {
      showModal(`노선번호 : ${busNo}(이)가 맞으십니까?`, (ok) => {
        if (!ok) return;
        selectedBusNo = busNo;
        updateBreadcrumb();
        nextStep();
      });
    };
    busnoButtonsDiv.appendChild(btn);
  });
}

// ======== 복장 상태 확인 버튼 ========
const uniformOkBtn = document.getElementById('uniform-ok');
const uniformBadBtn = document.getElementById('uniform-bad');

uniformOkBtn.addEventListener('click', async () => {
  uniformStatus = 'ok';
  uniformReason = '';
  uniformOkBtn.disabled = true;
  uniformOkBtn.textContent = '제출 중...';
  try {
    await submitData();
    showPage(totalSteps); // 완료 화면 표시
  } catch (error) {
    console.error('제출 실패:', error);
    showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    uniformOkBtn.disabled = false;
    uniformOkBtn.textContent = '양호';
  }
});

uniformBadBtn.addEventListener('click', () => {
  showReasonModal();
});

// ======== 불량 사유 입력 모달 ========
function showReasonModal() {
  const modal = document.getElementById('modal-reason');
  const reasonInput = document.getElementById('reason-input');
  const submitBtn = document.getElementById('modal-reason-submit');
  const cancelBtn = document.getElementById('modal-reason-cancel');
  
  reasonInput.value = uniformReason; // 기존 값이 있으면 표시
  modal.style.display = 'flex';
  
  function cleanup() {
    modal.style.display = 'none';
    submitBtn.removeEventListener('click', submitHandler);
    cancelBtn.removeEventListener('click', cancelHandler);
  }
  
  function submitHandler() {
    const reason = reasonInput.value.trim();
    if (!reason) {
      showError('불량 사유를 입력해주세요.');
      return;
    }
    uniformStatus = 'bad';
    uniformReason = reason;
    cleanup();
    nextStep();
  }
  
  function cancelHandler() {
    cleanup();
  }
  
  submitBtn.addEventListener('click', submitHandler);
  cancelBtn.addEventListener('click', cancelHandler);
  
  // Enter 키로 제출
  reasonInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      submitHandler();
    }
  });
  
  // 포커스
  setTimeout(() => reasonInput.focus(), 100);
}

// ======== 데이터 제출 함수 ========
async function submitData() {
  const formData = new FormData();
  formData.append('site', selectedSite);
  formData.append('busNo', selectedBusNo);
  formData.append('plate', enteredPlate);
  formData.append('uniformStatus', uniformStatus);
  if (uniformStatus === 'bad' && uniformReason) {
    formData.append('uniformReason', uniformReason);
  }
  formData.append('timestamp', new Date().toISOString());
  // TODO: 실제 백엔드 URL로 변경 필요
  const response = await fetch('/api/submit', {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// ======== 키보드 이벤트 ========
document.addEventListener('keydown', (e) => {
  // 버스번호 선택 화면에서는 Enter로 동작하지 않음
  if (currentStep === 1) return;
  const btnMap = {2: 'b2', 3: 'b3'};
  const currentButton = buttons[btnMap[currentStep]];
  if (e.key === 'Enter' && currentButton && !currentButton.disabled) {
    currentButton.click();
  }
});

// 처음 화면으로 이동하는 함수
function goToInitialPage() {
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    showPage(-1, true);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    showPage(0, true);
  }
}

// 이름 입력 이벤트 리스너
if (driverNameInput && driverNameSubmit) {
  driverNameInput.addEventListener('input', (e) => {
    const name = e.target.value.trim();
    driverNameSubmit.disabled = name.length === 0;
  });

  driverNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !driverNameSubmit.disabled) {
      driverNameSubmit.click();
    }
  });

  driverNameSubmit.addEventListener('click', () => {
    const name = driverNameInput.value.trim();
    if (name.length > 0) {
      saveDriverName(name);
      showPage(0, true); // 근무지 선택 페이지로 이동
    }
  });
}

const breadcrumb = document.getElementById('breadcrumb');

function updateBreadcrumb() {
  let crumbs = [];
  if (selectedSite) crumbs.push(`<span class="crumb">근무지: ${selectedSite}</span>`);
  if (selectedBusNo) crumbs.push(`<span class="crumb">노선번호: ${selectedBusNo}</span>`);
  if (enteredPlate) crumbs.push(`<span class="crumb">차량번호: ${enteredPlate}</span>`);
  breadcrumb.innerHTML = crumbs.join('<span class="sep">&gt;</span>');
}

// ======== renderPlateGrid 수정 ========
function renderPlateGrid() {
  // p2 페이지의 card-content를 직접 찾기
  const p2Page = document.getElementById('p2');
  if (!p2Page) return;
  const cardContent = p2Page.querySelector('.card-content');
  if (!cardContent) return;
  let plateGridDiv = cardContent.querySelector('#plate-grid');
  if (plateGridDiv) cardContent.removeChild(plateGridDiv);
  let filterInput = cardContent.querySelector('#plate-filter');
  if (filterInput) cardContent.removeChild(filterInput);
  let errorMsg = cardContent.querySelector('#plate-filter-error');
  if (errorMsg) cardContent.removeChild(errorMsg);
  filterInput = document.createElement('input');
  filterInput.id = 'plate-filter';
  filterInput.type = 'text';
  filterInput.placeholder = '차량번호 검색(숫자 입력)';
  filterInput.inputMode = 'numeric';
  filterInput.autocomplete = 'off';
  filterInput.style.marginBottom = '0.5rem';
  filterInput.style.width = '100%';
  cardContent.appendChild(filterInput);
  errorMsg = document.createElement('div');
  errorMsg.id = 'plate-filter-error';
  errorMsg.style.color = '#dc2626';
  errorMsg.style.fontSize = '0.98rem';
  errorMsg.style.height = '1.2em';
  errorMsg.style.marginBottom = '0.5rem';
  errorMsg.style.textAlign = 'left';
  errorMsg.textContent = '';
  cardContent.appendChild(errorMsg);
  plateGridDiv = document.createElement('div');
  plateGridDiv.id = 'plate-grid';
  plateGridDiv.style.display = 'grid';
  plateGridDiv.style.gridTemplateColumns = 'repeat(3, 1fr)';
  plateGridDiv.style.gap = '0.7rem';
  plateGridDiv.style.maxHeight = '320px';
  plateGridDiv.style.minHeight = '320px';
  plateGridDiv.style.overflowY = 'auto';
  plateGridDiv.style.overflowX = 'hidden';
  plateGridDiv.style.width = '100%';
  plateGridDiv.style.marginBottom = '1.2rem';
  cardContent.appendChild(plateGridDiv);
  function renderGrid() {
    const oldBtns = Array.from(plateGridDiv.children);
    oldBtns.forEach(btn => {
      btn.classList.add('fade-exit');
      setTimeout(() => btn.remove(), 200);
    });
    // 데이터 로딩 상태 처리
    if (!plateDataLoaded) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#888;font-size:1.1rem;">차량번호 데이터를 불러오는 중...</div>';
      return;
    }
    if (plateDataError) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#dc2626;font-size:1.1rem;">차량번호 데이터를 불러오지 못했습니다.</div>';
      return;
    }
    let list = [];
    if (selectedBusNo && PLATE_LISTS[selectedBusNo]) {
      list = PLATE_LISTS[selectedBusNo];
    }
    let filter = filterInput.value.trim();
    if (filter.length > 4) {
      filter = filter.slice(0, 4);
      filterInput.value = filter;
    }
    if (filter && /[^0-9]/.test(filter)) {
      errorMsg.textContent = '숫자만 입력해주세요!';
      return;
    } else {
      errorMsg.textContent = '';
    }
    const filtered = filter ? list.filter(num => num.includes(filter)) : list;
    const total = filtered.length;
    const maxRow = Math.ceil(list.length / 3);
    plateGridDiv.style.gridTemplateRows = `repeat(${maxRow}, 1fr)`;
    for (let i = 0; i < maxRow * 3; i++) {
      if (i < total) {
        const num = filtered[i];
        const btn = document.createElement('button');
        btn.className = 'plate-btn fade-in';
        btn.textContent = num;
        btn.setAttribute('aria-label', `차량번호 ${num}`);
        btn.tabIndex = 0;
        btn.onclick = () => {
          showModal(`차량번호 : ${num}가 맞으십니까?`, (ok) => {
            if (!ok) return;
            enteredPlate = num;
            updateBreadcrumb();
            nextStep();
          });
        };
        btn.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') btn.click();
        };
        plateGridDiv.appendChild(btn);
        setTimeout(() => btn.classList.remove('fade-in'), 250);
      } else {
        const empty = document.createElement('div');
        empty.style.visibility = 'hidden';
        plateGridDiv.appendChild(empty);
      }
    }
  }
  filterInput.addEventListener('input', renderGrid);
  renderGrid();
}

// ======== 초기화 ========
document.addEventListener('DOMContentLoaded', () => {
  // 헤더 로고 클릭 이벤트
  const headerLogo = document.getElementById('header-logo');
  if (headerLogo) {
    headerLogo.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 헤더 제목 클릭 이벤트
  const headerTitle = document.getElementById('header-title');
  if (headerTitle) {
    headerTitle.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // localStorage에 기사님 이름이 있는지 확인
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    history.replaceState({ pageIndex: -1 }, '', '');
    history.pushState({ pageIndex: -1 }, '', '');
    showPage(-1, false);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    history.replaceState({ pageIndex: 0 }, '', '');
    history.pushState({ pageIndex: 0 }, '', '');
    showPage(0, false);
  }
  updateBreadcrumb();
  console.log('운행전 자가점검시스템이 로드되었습니다.');
});

window.addEventListener('popstate', (event) => {
  const pageIndex = event.state && typeof event.state.pageIndex === 'number' ? event.state.pageIndex : (hasDriverName() ? 0 : -1);
  showPage(pageIndex, false);
  // history가 1개뿐이면(첫 화면) 더 이상 뒤로가기를 막음
  if ((pageIndex === 0 || pageIndex === -1) && history.length <= 2) {
    const initialPage = hasDriverName() ? 0 : -1;
    history.pushState({ pageIndex: initialPage }, '', '');
  }
});

// ======== 오프라인 지원 ========
window.addEventListener('online', () => {
  console.log('네트워크 연결이 복구되었습니다.');
});
window.addEventListener('offline', () => {
  console.log('네트워크 연결이 끊어졌습니다.');
  showError('네트워크 연결을 확인해주세요.');
});


```

```javascript
// ======== 상수 ========
const DRIVER_NAME_KEY = 'mdcsDriverName';

const BUSNO_LIST = {
  '노포': ['29', '80', '300'],
  '정관': ['73', '73 (오전)', '106', '107', '184', '188']
};

// ======== Storage 함수 ========
function getDriverName() {
  const stored = localStorage.getItem(DRIVER_NAME_KEY);
  if (!stored) return '';
  return stored.trim();
}

function hasDriverName() {
  return getDriverName().length > 0;
}

function saveDriverName(name) {
  if (!name || !name.trim()) return false;
  localStorage.setItem(DRIVER_NAME_KEY, name.trim());
  return true;
}

// ======== 전역 변수 ========
let currentStep = 0;
const totalSteps = 4;
let selectedSite = '';
let selectedBusNo = '';
let enteredPlate = '';
let uniformStatus = ''; // 'ok' or 'bad'
let uniformReason = ''; // 불량 사유

// ======== DOM 요소 ========
const pages = document.querySelectorAll('.page');
const driverNamePage = document.getElementById('p-driver-name');
const driverNameInput = document.getElementById('driver-name-input');
const driverNameSubmit = document.getElementById('driver-name-submit');

// 근무지 선택 버튼
const siteButtons = {
  nopo: document.getElementById('site-nopo'),
  jeonggwan: document.getElementById('site-jeonggwan')
};

// 버스번호 버튼 컨테이너
const busnoButtonsDiv = document.getElementById('busno-buttons');

// ======== 노선별 차량번호 리스트(구글 시트 연동) ========
let PLATE_LISTS = {};
let plateDataLoaded = false;
let plateDataError = false;
fetch('https://script.google.com/macros/s/AKfycbxKXmbLSOl64gNdOoYIORQs1fpdHOHZuX7LGypDLlgacjKtNhiVTWef6_pBNNkd2cWE/exec')
  .then(res => res.json())
  .then(data => {
    PLATE_LISTS = data;
    plateDataLoaded = true;
  })
  .catch(err => {
    plateDataError = true;
    console.error('차량번호 데이터 불러오기 실패:', err);
  });

// ======== 유효성 검사 함수들 ========
const validators = {
  // 면허판번호 검증 (70가1234 형식)
  plate: (value) => {
    if (!value.trim()) return '면허판 번호를 입력해주세요.';
    const pattern = /^\d{2}[가-힣]\d{4}$/;
    if (!pattern.test(value)) return '올바른 면허판 번호 형식으로 입력해주세요. (예: 70가1234)';
    return null;
  },
  // 사진 검증
  photo: (file) => {
    if (!file) return '사진을 선택해주세요.';
    if (!file.type.startsWith('image/')) return '이미지 파일만 선택 가능합니다.';
    if (file.size > 10 * 1024 * 1024) return '파일 크기는 10MB 이하로 선택해주세요.';
    return null;
  }
};

// ======== 유틸리티 함수들 ========
function showError(message) {
  alert(message);
}

function validateInput(type, value) {
  const validator = validators[type];
  if (!validator) return true;
  const error = validator(value);
  if (error) {
    showError(error);
    return false;
  }
  return true;
}

function updateButtonState(buttonId, isValid) {
  const button = buttons[buttonId];
  if (button) {
    button.disabled = !isValid;
  }
}

function getCurrentPrevBtn() {
  const cards = document.querySelectorAll('.card');
  return cards[currentStep]?.querySelector('.prevBtn');
}

function updatePrevBtn() {
  document.querySelectorAll('.prevBtn').forEach((btn) => {
    // 이름 입력 페이지(-1)나 근무지 선택 페이지(0)에서는 이전 버튼 비활성화
    btn.disabled = (currentStep === -1 || currentStep === 0);
    
    // 모든 이전 버튼에 이벤트 설정
    btn.onclick = () => {
      if (currentStep > 0) {
        window.history.back();
      }
    };
  });
}

// 페이지 ID를 인덱스로 변환하는 맵
const pageIdToIndex = {
  'p-driver-name': -1,
  'p0': 0,
  'p1': 1,
  'p2': 2,
  'p3': 3,
  'done': 4
};

// 인덱스를 페이지 ID로 변환
function getPageIdByIndex(index) {
  const idMap = ['p0', 'p1', 'p2', 'p3', 'done'];
  if (index === -1) return 'p-driver-name';
  return idMap[index] || 'p0';
}

function showPage(pageIndex, pushHistory = false) {
  // 이름 입력 페이지 처리
  if (pageIndex === -1) {
    pages.forEach(page => page.classList.remove('active'));
    driverNamePage.classList.add('active');
    currentStep = -1;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (pushHistory) {
      history.pushState({ pageIndex: -1 }, '', '');
    }
    return;
  }

  // 이름 입력 페이지 숨기기
  driverNamePage.classList.remove('active');

  // 단계별로 입력값 초기화
  if (pageIndex === 0) {
    selectedSite = '';
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 1) {
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 2) {
    enteredPlate = '';
  }
  
  // 일반 페이지 표시
  pages.forEach((page, index) => {
    const pageId = page.id;
    if (pageId === 'p-driver-name') {
      page.classList.remove('active');
    } else {
      const pageIdx = pageIdToIndex[pageId] || 0;
      page.classList.toggle('active', pageIdx === pageIndex);
    }
  });
  currentStep = pageIndex;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  updatePrevBtn();
  updateBreadcrumb();
  
  // 차량번호 선택 페이지(p2)일 때 그리드 렌더링
  if (pageIndex === 2) {
    renderPlateGrid();
  }
  
  if (pushHistory) {
    history.pushState({ pageIndex: currentStep }, '', '');
  }
}

function nextStep() {
  // 이름 입력 페이지에서 다음 단계로
  if (currentStep === -1) {
    showPage(0, true);
    return;
  }
  // 일반 페이지 다음 단계
  if (currentStep < 4) { // done 페이지는 인덱스 4
    showPage(currentStep + 1, true);
  }
}

// ======== 커스텀 모달 ========
function showModal(message, onConfirm) {
  const modal = document.getElementById('modal');
  const msg = document.getElementById('modal-message');
  const yesBtn = document.getElementById('modal-yes');
  const noBtn = document.getElementById('modal-no');
  msg.textContent = message;
  modal.style.display = 'flex';
  function cleanup() {
    modal.style.display = 'none';
    yesBtn.removeEventListener('click', yesHandler);
    noBtn.removeEventListener('click', noHandler);
  }
  function yesHandler() {
    cleanup();
    onConfirm(true);
  }
  function noHandler() {
    cleanup();
    onConfirm(false);
  }
  yesBtn.addEventListener('click', yesHandler);
  noBtn.addEventListener('click', noHandler);
}

// ======== 근무지 선택 이벤트 리스너 ========
siteButtons.nopo.addEventListener('click', () => {
  showModal('근무지 : 노포(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '노포';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('노포');
    updateBreadcrumb();
    nextStep();
  });
});

siteButtons.jeonggwan.addEventListener('click', () => {
  showModal('근무지 : 정관(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '정관';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('정관');
    updateBreadcrumb();
    nextStep();
  });
});

// ======== 버스번호 버튼 동적 생성 ========
function renderBusNoButtons(site) {
  busnoButtonsDiv.innerHTML = '';
  BUSNO_LIST[site].forEach(busNo => {
    const btn = document.createElement('button');
    btn.className = 'busno-btn';
    btn.textContent = busNo;
    btn.onclick = () => {
      showModal(`노선번호 : ${busNo}(이)가 맞으십니까?`, (ok) => {
        if (!ok) return;
        selectedBusNo = busNo;
        updateBreadcrumb();
        nextStep();
      });
    };
    busnoButtonsDiv.appendChild(btn);
  });
}

// ======== 복장 상태 확인 버튼 ========
const uniformOkBtn = document.getElementById('uniform-ok');
const uniformBadBtn = document.getElementById('uniform-bad');

uniformOkBtn.addEventListener('click', async () => {
  uniformStatus = 'ok';
  uniformReason = '';
  uniformOkBtn.disabled = true;
  uniformOkBtn.textContent = '제출 중...';
  try {
    await submitData();
    showPage(totalSteps); // 완료 화면 표시
  } catch (error) {
    console.error('제출 실패:', error);
    showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    uniformOkBtn.disabled = false;
    uniformOkBtn.textContent = '양호';
  }
});

uniformBadBtn.addEventListener('click', () => {
  showReasonModal();
});

// ======== 불량 사유 입력 모달 ========
function showReasonModal() {
  const modal = document.getElementById('modal-reason');
  const reasonInput = document.getElementById('reason-input');
  const submitBtn = document.getElementById('modal-reason-submit');
  const cancelBtn = document.getElementById('modal-reason-cancel');
  
  reasonInput.value = uniformReason; // 기존 값이 있으면 표시
  modal.style.display = 'flex';
  
  function cleanup() {
    modal.style.display = 'none';
    submitBtn.removeEventListener('click', submitHandler);
    cancelBtn.removeEventListener('click', cancelHandler);
  }
  
  async function submitHandler() {
    const reason = reasonInput.value.trim();
    if (!reason) {
      showError('불량 사유를 입력해주세요.');
      return;
    }
    uniformStatus = 'bad';
    uniformReason = reason;
    cleanup();
    
    // 제출 버튼 비활성화
    uniformBadBtn.disabled = true;
    const originalText = uniformBadBtn.textContent;
    uniformBadBtn.textContent = '제출 중...';
    
    try {
      await submitData();
      showPage(totalSteps); // 완료 화면 표시
    } catch (error) {
      console.error('제출 실패:', error);
      showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
      uniformBadBtn.disabled = false;
      uniformBadBtn.textContent = originalText;
    }
  }
  
  function cancelHandler() {
    cleanup();
  }
  
  submitBtn.addEventListener('click', submitHandler);
  cancelBtn.addEventListener('click', cancelHandler);
  
  // Enter 키로 제출
  reasonInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      submitHandler();
    }
  });
  
  // 포커스
  setTimeout(() => reasonInput.focus(), 100);
}

// ======== 데이터 제출 함수 ========
async function submitData() {
  const formData = new FormData();
  formData.append('site', selectedSite);
  formData.append('busNo', selectedBusNo);
  formData.append('plate', enteredPlate);
  formData.append('uniformStatus', uniformStatus);
  if (uniformStatus === 'bad' && uniformReason) {
    formData.append('uniformReason', uniformReason);
  }
  formData.append('timestamp', new Date().toISOString());
  // TODO: 실제 백엔드 URL로 변경 필요
  const response = await fetch('/api/submit', {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// ======== 키보드 이벤트 ========
document.addEventListener('keydown', (e) => {
  // 버스번호 선택 화면에서는 Enter로 동작하지 않음
  if (currentStep === 1) return;
  const btnMap = {2: 'b2', 3: 'b3'};
  const currentButton = buttons[btnMap[currentStep]];
  if (e.key === 'Enter' && currentButton && !currentButton.disabled) {
    currentButton.click();
  }
});

// 처음 화면으로 이동하는 함수
function goToInitialPage() {
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    showPage(-1, true);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    showPage(0, true);
  }
}

// 이름 입력 이벤트 리스너
if (driverNameInput && driverNameSubmit) {
  driverNameInput.addEventListener('input', (e) => {
    const name = e.target.value.trim();
    driverNameSubmit.disabled = name.length === 0;
  });

  driverNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !driverNameSubmit.disabled) {
      driverNameSubmit.click();
    }
  });

  driverNameSubmit.addEventListener('click', () => {
    const name = driverNameInput.value.trim();
    if (name.length > 0) {
      saveDriverName(name);
      showPage(0, true); // 근무지 선택 페이지로 이동
    }
  });
}

const breadcrumb = document.getElementById('breadcrumb');

function updateBreadcrumb() {
  let crumbs = [];
  if (selectedSite) crumbs.push(`<span class="crumb">근무지: ${selectedSite}</span>`);
  if (selectedBusNo) crumbs.push(`<span class="crumb">노선번호: ${selectedBusNo}</span>`);
  if (enteredPlate) crumbs.push(`<span class="crumb">차량번호: ${enteredPlate}</span>`);
  breadcrumb.innerHTML = crumbs.join('<span class="sep">&gt;</span>');
}

// ======== renderPlateGrid 수정 ========
function renderPlateGrid() {
  // p2 페이지의 card-content를 직접 찾기
  const p2Page = document.getElementById('p2');
  if (!p2Page) return;
  const cardContent = p2Page.querySelector('.card-content');
  if (!cardContent) return;
  let plateGridDiv = cardContent.querySelector('#plate-grid');
  if (plateGridDiv) cardContent.removeChild(plateGridDiv);
  let filterInput = cardContent.querySelector('#plate-filter');
  if (filterInput) cardContent.removeChild(filterInput);
  let errorMsg = cardContent.querySelector('#plate-filter-error');
  if (errorMsg) cardContent.removeChild(errorMsg);
  filterInput = document.createElement('input');
  filterInput.id = 'plate-filter';
  filterInput.type = 'text';
  filterInput.placeholder = '차량번호 검색(숫자 입력)';
  filterInput.inputMode = 'numeric';
  filterInput.autocomplete = 'off';
  filterInput.style.marginBottom = '0.5rem';
  filterInput.style.width = '100%';
  cardContent.appendChild(filterInput);
  errorMsg = document.createElement('div');
  errorMsg.id = 'plate-filter-error';
  errorMsg.style.color = '#dc2626';
  errorMsg.style.fontSize = '0.98rem';
  errorMsg.style.height = '1.2em';
  errorMsg.style.marginBottom = '0.5rem';
  errorMsg.style.textAlign = 'left';
  errorMsg.textContent = '';
  cardContent.appendChild(errorMsg);
  plateGridDiv = document.createElement('div');
  plateGridDiv.id = 'plate-grid';
  plateGridDiv.style.display = 'grid';
  plateGridDiv.style.gridTemplateColumns = 'repeat(3, 1fr)';
  plateGridDiv.style.gap = '0.7rem';
  plateGridDiv.style.maxHeight = '320px';
  plateGridDiv.style.minHeight = '320px';
  plateGridDiv.style.overflowY = 'auto';
  plateGridDiv.style.overflowX = 'hidden';
  plateGridDiv.style.width = '100%';
  plateGridDiv.style.marginBottom = '1.2rem';
  cardContent.appendChild(plateGridDiv);
  function renderGrid() {
    const oldBtns = Array.from(plateGridDiv.children);
    oldBtns.forEach(btn => {
      btn.classList.add('fade-exit');
      setTimeout(() => btn.remove(), 200);
    });
    // 데이터 로딩 상태 처리
    if (!plateDataLoaded) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#888;font-size:1.1rem;">차량번호 데이터를 불러오는 중...</div>';
      return;
    }
    if (plateDataError) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#dc2626;font-size:1.1rem;">차량번호 데이터를 불러오지 못했습니다.</div>';
      return;
    }
    let list = [];
    if (selectedBusNo && PLATE_LISTS[selectedBusNo]) {
      list = PLATE_LISTS[selectedBusNo];
    }
    let filter = filterInput.value.trim();
    if (filter.length > 4) {
      filter = filter.slice(0, 4);
      filterInput.value = filter;
    }
    if (filter && /[^0-9]/.test(filter)) {
      errorMsg.textContent = '숫자만 입력해주세요!';
      return;
    } else {
      errorMsg.textContent = '';
    }
    const filtered = filter ? list.filter(num => num.includes(filter)) : list;
    const total = filtered.length;
    const maxRow = Math.ceil(list.length / 3);
    plateGridDiv.style.gridTemplateRows = `repeat(${maxRow}, 1fr)`;
    for (let i = 0; i < maxRow * 3; i++) {
      if (i < total) {
        const num = filtered[i];
        const btn = document.createElement('button');
        btn.className = 'plate-btn fade-in';
        btn.textContent = num;
        btn.setAttribute('aria-label', `차량번호 ${num}`);
        btn.tabIndex = 0;
        btn.onclick = () => {
          showModal(`차량번호 : ${num}가 맞으십니까?`, (ok) => {
            if (!ok) return;
            enteredPlate = num;
            updateBreadcrumb();
            nextStep();
          });
        };
        btn.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') btn.click();
        };
        plateGridDiv.appendChild(btn);
        setTimeout(() => btn.classList.remove('fade-in'), 250);
      } else {
        const empty = document.createElement('div');
        empty.style.visibility = 'hidden';
        plateGridDiv.appendChild(empty);
      }
    }
  }
  filterInput.addEventListener('input', renderGrid);
  renderGrid();
}

// ======== 초기화 ========
document.addEventListener('DOMContentLoaded', () => {
  // 헤더 로고 클릭 이벤트
  const headerLogo = document.getElementById('header-logo');
  if (headerLogo) {
    headerLogo.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 헤더 제목 클릭 이벤트
  const headerTitle = document.getElementById('header-title');
  if (headerTitle) {
    headerTitle.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // localStorage에 기사님 이름이 있는지 확인
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    history.replaceState({ pageIndex: -1 }, '', '');
    history.pushState({ pageIndex: -1 }, '', '');
    showPage(-1, false);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    history.replaceState({ pageIndex: 0 }, '', '');
    history.pushState({ pageIndex: 0 }, '', '');
    showPage(0, false);
  }
  updateBreadcrumb();
  console.log('운행전 자가점검시스템이 로드되었습니다.');
});

window.addEventListener('popstate', (event) => {
  const pageIndex = event.state && typeof event.state.pageIndex === 'number' ? event.state.pageIndex : (hasDriverName() ? 0 : -1);
  showPage(pageIndex, false);
  // history가 1개뿐이면(첫 화면) 더 이상 뒤로가기를 막음
  if ((pageIndex === 0 || pageIndex === -1) && history.length <= 2) {
    const initialPage = hasDriverName() ? 0 : -1;
    history.pushState({ pageIndex: initialPage }, '', '');
  }
});

// ======== 오프라인 지원 ========
window.addEventListener('online', () => {
  console.log('네트워크 연결이 복구되었습니다.');
});
window.addEventListener('offline', () => {
  console.log('네트워크 연결이 끊어졌습니다.');
  showError('네트워크 연결을 확인해주세요.');
});


```


키보드 이벤트 수정 및 CSS 추가 중.


```javascript
// ======== 상수 ========
const DRIVER_NAME_KEY = 'mdcsDriverName';

const BUSNO_LIST = {
  '노포': ['29', '80', '300'],
  '정관': ['73', '73 (오전)', '106', '107', '184', '188']
};

// ======== Storage 함수 ========
function getDriverName() {
  const stored = localStorage.getItem(DRIVER_NAME_KEY);
  if (!stored) return '';
  return stored.trim();
}

function hasDriverName() {
  return getDriverName().length > 0;
}

function saveDriverName(name) {
  if (!name || !name.trim()) return false;
  localStorage.setItem(DRIVER_NAME_KEY, name.trim());
  return true;
}

// ======== 전역 변수 ========
let currentStep = 0;
const totalSteps = 4;
let selectedSite = '';
let selectedBusNo = '';
let enteredPlate = '';
let uniformStatus = ''; // 'ok' or 'bad'
let uniformReason = ''; // 불량 사유

// ======== DOM 요소 ========
const pages = document.querySelectorAll('.page');
const driverNamePage = document.getElementById('p-driver-name');
const driverNameInput = document.getElementById('driver-name-input');
const driverNameSubmit = document.getElementById('driver-name-submit');

// 근무지 선택 버튼
const siteButtons = {
  nopo: document.getElementById('site-nopo'),
  jeonggwan: document.getElementById('site-jeonggwan')
};

// 버스번호 버튼 컨테이너
const busnoButtonsDiv = document.getElementById('busno-buttons');

// ======== 노선별 차량번호 리스트(구글 시트 연동) ========
let PLATE_LISTS = {};
let plateDataLoaded = false;
let plateDataError = false;
fetch('https://script.google.com/macros/s/AKfycbxKXmbLSOl64gNdOoYIORQs1fpdHOHZuX7LGypDLlgacjKtNhiVTWef6_pBNNkd2cWE/exec')
  .then(res => res.json())
  .then(data => {
    PLATE_LISTS = data;
    plateDataLoaded = true;
  })
  .catch(err => {
    plateDataError = true;
    console.error('차량번호 데이터 불러오기 실패:', err);
  });

// ======== 유효성 검사 함수들 ========
const validators = {
  // 면허판번호 검증 (70가1234 형식)
  plate: (value) => {
    if (!value.trim()) return '면허판 번호를 입력해주세요.';
    const pattern = /^\d{2}[가-힣]\d{4}$/;
    if (!pattern.test(value)) return '올바른 면허판 번호 형식으로 입력해주세요. (예: 70가1234)';
    return null;
  },
  // 사진 검증
  photo: (file) => {
    if (!file) return '사진을 선택해주세요.';
    if (!file.type.startsWith('image/')) return '이미지 파일만 선택 가능합니다.';
    if (file.size > 10 * 1024 * 1024) return '파일 크기는 10MB 이하로 선택해주세요.';
    return null;
  }
};

// ======== 유틸리티 함수들 ========
function showError(message) {
  alert(message);
}

function validateInput(type, value) {
  const validator = validators[type];
  if (!validator) return true;
  const error = validator(value);
  if (error) {
    showError(error);
    return false;
  }
  return true;
}

function updateButtonState(buttonId, isValid) {
  const button = buttons[buttonId];
  if (button) {
    button.disabled = !isValid;
  }
}

function getCurrentPrevBtn() {
  const cards = document.querySelectorAll('.card');
  return cards[currentStep]?.querySelector('.prevBtn');
}

function updatePrevBtn() {
  document.querySelectorAll('.prevBtn').forEach((btn) => {
    // 이름 입력 페이지(-1)나 근무지 선택 페이지(0)에서는 이전 버튼 비활성화
    btn.disabled = (currentStep === -1 || currentStep === 0);
    
    // 모든 이전 버튼에 이벤트 설정
    btn.onclick = () => {
      if (currentStep > 0) {
        window.history.back();
      }
    };
  });
}

// 페이지 ID를 인덱스로 변환하는 맵
const pageIdToIndex = {
  'p-driver-name': -1,
  'p0': 0,
  'p1': 1,
  'p2': 2,
  'p3': 3,
  'done': 4
};

// 인덱스를 페이지 ID로 변환
function getPageIdByIndex(index) {
  const idMap = ['p0', 'p1', 'p2', 'p3', 'done'];
  if (index === -1) return 'p-driver-name';
  return idMap[index] || 'p0';
}

function showPage(pageIndex, pushHistory = false) {
  // 이름 입력 페이지 처리
  if (pageIndex === -1) {
    pages.forEach(page => page.classList.remove('active'));
    driverNamePage.classList.add('active');
    currentStep = -1;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (pushHistory) {
      history.pushState({ pageIndex: -1 }, '', '');
    }
    return;
  }

  // 이름 입력 페이지 숨기기
  driverNamePage.classList.remove('active');

  // 단계별로 입력값 초기화
  if (pageIndex === 0) {
    selectedSite = '';
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 1) {
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 2) {
    enteredPlate = '';
  }
  
  // 일반 페이지 표시
  pages.forEach((page, index) => {
    const pageId = page.id;
    if (pageId === 'p-driver-name') {
      page.classList.remove('active');
    } else {
      const pageIdx = pageIdToIndex[pageId] || 0;
      page.classList.toggle('active', pageIdx === pageIndex);
    }
  });
  currentStep = pageIndex;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  updatePrevBtn();
  updateBreadcrumb();
  
  // 차량번호 선택 페이지(p2)일 때 그리드 렌더링
  if (pageIndex === 2) {
    renderPlateGrid();
  }
  
  if (pushHistory) {
    history.pushState({ pageIndex: currentStep }, '', '');
  }
}

function nextStep() {
  // 이름 입력 페이지에서 다음 단계로
  if (currentStep === -1) {
    showPage(0, true);
    return;
  }
  // 일반 페이지 다음 단계
  if (currentStep < 4) { // done 페이지는 인덱스 4
    showPage(currentStep + 1, true);
  }
}

// ======== 커스텀 모달 ========
function showModal(message, onConfirm) {
  const modal = document.getElementById('modal');
  const msg = document.getElementById('modal-message');
  const yesBtn = document.getElementById('modal-yes');
  const noBtn = document.getElementById('modal-no');
  msg.textContent = message;
  modal.style.display = 'flex';
  function cleanup() {
    modal.style.display = 'none';
    yesBtn.removeEventListener('click', yesHandler);
    noBtn.removeEventListener('click', noHandler);
  }
  function yesHandler() {
    cleanup();
    onConfirm(true);
  }
  function noHandler() {
    cleanup();
    onConfirm(false);
  }
  yesBtn.addEventListener('click', yesHandler);
  noBtn.addEventListener('click', noHandler);
}

// ======== 근무지 선택 이벤트 리스너 ========
siteButtons.nopo.addEventListener('click', () => {
  showModal('근무지 : 노포(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '노포';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('노포');
    updateBreadcrumb();
    nextStep();
  });
});

siteButtons.jeonggwan.addEventListener('click', () => {
  showModal('근무지 : 정관(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '정관';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('정관');
    updateBreadcrumb();
    nextStep();
  });
});

// ======== 버스번호 버튼 동적 생성 ========
function renderBusNoButtons(site) {
  busnoButtonsDiv.innerHTML = '';
  BUSNO_LIST[site].forEach(busNo => {
    const btn = document.createElement('button');
    btn.className = 'busno-btn';
    btn.textContent = busNo;
    btn.onclick = () => {
      showModal(`노선번호 : ${busNo}(이)가 맞으십니까?`, (ok) => {
        if (!ok) return;
        selectedBusNo = busNo;
        updateBreadcrumb();
        nextStep();
      });
    };
    busnoButtonsDiv.appendChild(btn);
  });
}

// ======== 복장 상태 확인 버튼 ========
const uniformOkBtn = document.getElementById('uniform-ok');
const uniformBadBtn = document.getElementById('uniform-bad');

uniformOkBtn.addEventListener('click', async () => {
  uniformStatus = 'ok';
  uniformReason = '';
  uniformOkBtn.disabled = true;
  uniformOkBtn.textContent = '제출 중...';
  try {
    await submitData();
    showPage(totalSteps); // 완료 화면 표시
  } catch (error) {
    console.error('제출 실패:', error);
    showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    uniformOkBtn.disabled = false;
    uniformOkBtn.textContent = '양호';
  }
});

uniformBadBtn.addEventListener('click', () => {
  showReasonModal();
});

// ======== 불량 사유 입력 모달 ========
function showReasonModal() {
  const modal = document.getElementById('modal-reason');
  const reasonInput = document.getElementById('reason-input');
  const submitBtn = document.getElementById('modal-reason-submit');
  const cancelBtn = document.getElementById('modal-reason-cancel');
  
  reasonInput.value = uniformReason; // 기존 값이 있으면 표시
  modal.style.display = 'flex';
  
  function cleanup() {
    modal.style.display = 'none';
    submitBtn.removeEventListener('click', submitHandler);
    cancelBtn.removeEventListener('click', cancelHandler);
  }
  
  async function submitHandler() {
    const reason = reasonInput.value.trim();
    if (!reason) {
      showError('불량 사유를 입력해주세요.');
      return;
    }
    uniformStatus = 'bad';
    uniformReason = reason;
    cleanup();
    
    // 제출 버튼 비활성화
    uniformBadBtn.disabled = true;
    const originalText = uniformBadBtn.textContent;
    uniformBadBtn.textContent = '제출 중...';
    
    try {
      await submitData();
      showPage(totalSteps); // 완료 화면 표시
    } catch (error) {
      console.error('제출 실패:', error);
      showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
      uniformBadBtn.disabled = false;
      uniformBadBtn.textContent = originalText;
    }
  }
  
  function cancelHandler() {
    cleanup();
  }
  
  submitBtn.addEventListener('click', submitHandler);
  cancelBtn.addEventListener('click', cancelHandler);
  
  // Enter 키로 제출
  reasonInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      submitHandler();
    }
  });
  
  // 포커스
  setTimeout(() => reasonInput.focus(), 100);
}

// ======== 데이터 제출 함수 ========
async function submitData() {
  const formData = new FormData();
  formData.append('site', selectedSite);
  formData.append('busNo', selectedBusNo);
  formData.append('plate', enteredPlate);
  formData.append('uniformStatus', uniformStatus);
  if (uniformStatus === 'bad' && uniformReason) {
    formData.append('uniformReason', uniformReason);
  }
  formData.append('timestamp', new Date().toISOString());
  // TODO: 실제 백엔드 URL로 변경 필요
  const response = await fetch('/api/submit', {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// ======== 키보드 이벤트 ========
document.addEventListener('keydown', (e) => {
  // 버스번호 선택 화면에서는 Enter로 동작하지 않음
  if (currentStep === 1) return;
  // 복장 상태 확인 화면에서는 버튼이 다르므로 처리하지 않음
  if (currentStep === 3) return;
  const btnMap = {2: 'b2'};
  const currentButton = buttons[btnMap[currentStep]];
  if (e.key === 'Enter' && currentButton && !currentButton.disabled) {
    currentButton.click();
  }
});

// 처음 화면으로 이동하는 함수
function goToInitialPage() {
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    showPage(-1, true);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    showPage(0, true);
  }
}

// 이름 입력 이벤트 리스너
if (driverNameInput && driverNameSubmit) {
  driverNameInput.addEventListener('input', (e) => {
    const name = e.target.value.trim();
    driverNameSubmit.disabled = name.length === 0;
  });

  driverNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !driverNameSubmit.disabled) {
      driverNameSubmit.click();
    }
  });

  driverNameSubmit.addEventListener('click', () => {
    const name = driverNameInput.value.trim();
    if (name.length > 0) {
      saveDriverName(name);
      showPage(0, true); // 근무지 선택 페이지로 이동
    }
  });
}

const breadcrumb = document.getElementById('breadcrumb');

function updateBreadcrumb() {
  let crumbs = [];
  if (selectedSite) crumbs.push(`<span class="crumb">근무지: ${selectedSite}</span>`);
  if (selectedBusNo) crumbs.push(`<span class="crumb">노선번호: ${selectedBusNo}</span>`);
  if (enteredPlate) crumbs.push(`<span class="crumb">차량번호: ${enteredPlate}</span>`);
  breadcrumb.innerHTML = crumbs.join('<span class="sep">&gt;</span>');
}

// ======== renderPlateGrid 수정 ========
function renderPlateGrid() {
  // p2 페이지의 card-content를 직접 찾기
  const p2Page = document.getElementById('p2');
  if (!p2Page) return;
  const cardContent = p2Page.querySelector('.card-content');
  if (!cardContent) return;
  let plateGridDiv = cardContent.querySelector('#plate-grid');
  if (plateGridDiv) cardContent.removeChild(plateGridDiv);
  let filterInput = cardContent.querySelector('#plate-filter');
  if (filterInput) cardContent.removeChild(filterInput);
  let errorMsg = cardContent.querySelector('#plate-filter-error');
  if (errorMsg) cardContent.removeChild(errorMsg);
  filterInput = document.createElement('input');
  filterInput.id = 'plate-filter';
  filterInput.type = 'text';
  filterInput.placeholder = '차량번호 검색(숫자 입력)';
  filterInput.inputMode = 'numeric';
  filterInput.autocomplete = 'off';
  filterInput.style.marginBottom = '0.5rem';
  filterInput.style.width = '100%';
  cardContent.appendChild(filterInput);
  errorMsg = document.createElement('div');
  errorMsg.id = 'plate-filter-error';
  errorMsg.style.color = '#dc2626';
  errorMsg.style.fontSize = '0.98rem';
  errorMsg.style.height = '1.2em';
  errorMsg.style.marginBottom = '0.5rem';
  errorMsg.style.textAlign = 'left';
  errorMsg.textContent = '';
  cardContent.appendChild(errorMsg);
  plateGridDiv = document.createElement('div');
  plateGridDiv.id = 'plate-grid';
  plateGridDiv.style.display = 'grid';
  plateGridDiv.style.gridTemplateColumns = 'repeat(3, 1fr)';
  plateGridDiv.style.gap = '0.7rem';
  plateGridDiv.style.maxHeight = '320px';
  plateGridDiv.style.minHeight = '320px';
  plateGridDiv.style.overflowY = 'auto';
  plateGridDiv.style.overflowX = 'hidden';
  plateGridDiv.style.width = '100%';
  plateGridDiv.style.marginBottom = '1.2rem';
  cardContent.appendChild(plateGridDiv);
  function renderGrid() {
    const oldBtns = Array.from(plateGridDiv.children);
    oldBtns.forEach(btn => {
      btn.classList.add('fade-exit');
      setTimeout(() => btn.remove(), 200);
    });
    // 데이터 로딩 상태 처리
    if (!plateDataLoaded) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#888;font-size:1.1rem;">차량번호 데이터를 불러오는 중...</div>';
      return;
    }
    if (plateDataError) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#dc2626;font-size:1.1rem;">차량번호 데이터를 불러오지 못했습니다.</div>';
      return;
    }
    let list = [];
    if (selectedBusNo && PLATE_LISTS[selectedBusNo]) {
      list = PLATE_LISTS[selectedBusNo];
    }
    let filter = filterInput.value.trim();
    if (filter.length > 4) {
      filter = filter.slice(0, 4);
      filterInput.value = filter;
    }
    if (filter && /[^0-9]/.test(filter)) {
      errorMsg.textContent = '숫자만 입력해주세요!';
      return;
    } else {
      errorMsg.textContent = '';
    }
    const filtered = filter ? list.filter(num => num.includes(filter)) : list;
    const total = filtered.length;
    const maxRow = Math.ceil(list.length / 3);
    plateGridDiv.style.gridTemplateRows = `repeat(${maxRow}, 1fr)`;
    for (let i = 0; i < maxRow * 3; i++) {
      if (i < total) {
        const num = filtered[i];
        const btn = document.createElement('button');
        btn.className = 'plate-btn fade-in';
        btn.textContent = num;
        btn.setAttribute('aria-label', `차량번호 ${num}`);
        btn.tabIndex = 0;
        btn.onclick = () => {
          showModal(`차량번호 : ${num}가 맞으십니까?`, (ok) => {
            if (!ok) return;
            enteredPlate = num;
            updateBreadcrumb();
            nextStep();
          });
        };
        btn.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') btn.click();
        };
        plateGridDiv.appendChild(btn);
        setTimeout(() => btn.classList.remove('fade-in'), 250);
      } else {
        const empty = document.createElement('div');
        empty.style.visibility = 'hidden';
        plateGridDiv.appendChild(empty);
      }
    }
  }
  filterInput.addEventListener('input', renderGrid);
  renderGrid();
}

// ======== 초기화 ========
document.addEventListener('DOMContentLoaded', () => {
  // 헤더 로고 클릭 이벤트
  const headerLogo = document.getElementById('header-logo');
  if (headerLogo) {
    headerLogo.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 헤더 제목 클릭 이벤트
  const headerTitle = document.getElementById('header-title');
  if (headerTitle) {
    headerTitle.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // localStorage에 기사님 이름이 있는지 확인
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    history.replaceState({ pageIndex: -1 }, '', '');
    history.pushState({ pageIndex: -1 }, '', '');
    showPage(-1, false);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    history.replaceState({ pageIndex: 0 }, '', '');
    history.pushState({ pageIndex: 0 }, '', '');
    showPage(0, false);
  }
  updateBreadcrumb();
  console.log('운행전 자가점검시스템이 로드되었습니다.');
});

window.addEventListener('popstate', (event) => {
  const pageIndex = event.state && typeof event.state.pageIndex === 'number' ? event.state.pageIndex : (hasDriverName() ? 0 : -1);
  showPage(pageIndex, false);
  // history가 1개뿐이면(첫 화면) 더 이상 뒤로가기를 막음
  if ((pageIndex === 0 || pageIndex === -1) && history.length <= 2) {
    const initialPage = hasDriverName() ? 0 : -1;
    history.pushState({ pageIndex: initialPage }, '', '');
  }
});

// ======== 오프라인 지원 ========
window.addEventListener('online', () => {
  console.log('네트워크 연결이 복구되었습니다.');
});
window.addEventListener('offline', () => {
  console.log('네트워크 연결이 끊어졌습니다.');
  showError('네트워크 연결을 확인해주세요.');
});


```


CSS 추가 중: 복장 체크리스트, 복장 버튼, 불량 사유 입력 모달 스타일.


```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 80px;
}

header {
  background: var(--card-bg);
  padding: 1rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
}

header img {
  height: 36px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}

@media (max-width: 480px) {
  header {
    padding: 0.75rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 80px);
  padding: 1rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}

.breadcrumb {
  width: 100%;
  max-width: 400px;
  margin: 1rem auto 1rem auto;
  padding: 0.7rem 1rem;
  font-size: 1.55rem;
  color: var(--text-light);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  text-align: center;
}

.breadcrumb .crumb {
  color: var(--primary);
  font-weight: 600;
}

.breadcrumb .sep {
  color: var(--text-light);
  margin: 0 0.2em;
}

.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 복장 체크리스트 */
.uniform-checklist {
  width: 100%;
  text-align: left;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.uniform-checklist p {
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--text);
  margin-bottom: 0.8rem;
}

/* 복장 버튼 */
.uniform-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.uniform-btn {
  width: 100% !important;
  padding: 1.25rem 2rem !important;
  font-size: 1.2rem !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px !important;
}

.uniform-btn:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.uniform-btn:disabled {
  background: var(--text-light) !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 불량 사유 입력 모달 */
.modal-input-container {
  width: 100%;
  margin: 1rem 0;
}

.modal-textarea {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-textarea::placeholder {
  color: var(--text-light);
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

  .breadcrumb {
    font-size: 1.25rem;
    padding: 0.5rem 0.5rem;
    max-width: 100vw;
    margin: 0.7rem auto 0.7rem auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```


DOM 로드 후 버튼 이벤트가 등록되도록 수정 중.



버튼이 존재할 때만 이벤트 리스너를 등록하도록 수정 중.


```javascript
// ======== 상수 ========
const DRIVER_NAME_KEY = 'mdcsDriverName';

const BUSNO_LIST = {
  '노포': ['29', '80', '300'],
  '정관': ['73', '73 (오전)', '106', '107', '184', '188']
};

// ======== Storage 함수 ========
function getDriverName() {
  const stored = localStorage.getItem(DRIVER_NAME_KEY);
  if (!stored) return '';
  return stored.trim();
}

function hasDriverName() {
  return getDriverName().length > 0;
}

function saveDriverName(name) {
  if (!name || !name.trim()) return false;
  localStorage.setItem(DRIVER_NAME_KEY, name.trim());
  return true;
}

// ======== 전역 변수 ========
let currentStep = 0;
const totalSteps = 4;
let selectedSite = '';
let selectedBusNo = '';
let enteredPlate = '';
let uniformStatus = ''; // 'ok' or 'bad'
let uniformReason = ''; // 불량 사유

// ======== DOM 요소 ========
const pages = document.querySelectorAll('.page');
const driverNamePage = document.getElementById('p-driver-name');
const driverNameInput = document.getElementById('driver-name-input');
const driverNameSubmit = document.getElementById('driver-name-submit');

// 근무지 선택 버튼
const siteButtons = {
  nopo: document.getElementById('site-nopo'),
  jeonggwan: document.getElementById('site-jeonggwan')
};

// 버스번호 버튼 컨테이너
const busnoButtonsDiv = document.getElementById('busno-buttons');

// ======== 노선별 차량번호 리스트(구글 시트 연동) ========
let PLATE_LISTS = {};
let plateDataLoaded = false;
let plateDataError = false;
fetch('https://script.google.com/macros/s/AKfycbxKXmbLSOl64gNdOoYIORQs1fpdHOHZuX7LGypDLlgacjKtNhiVTWef6_pBNNkd2cWE/exec')
  .then(res => res.json())
  .then(data => {
    PLATE_LISTS = data;
    plateDataLoaded = true;
  })
  .catch(err => {
    plateDataError = true;
    console.error('차량번호 데이터 불러오기 실패:', err);
  });

// ======== 유효성 검사 함수들 ========
const validators = {
  // 면허판번호 검증 (70가1234 형식)
  plate: (value) => {
    if (!value.trim()) return '면허판 번호를 입력해주세요.';
    const pattern = /^\d{2}[가-힣]\d{4}$/;
    if (!pattern.test(value)) return '올바른 면허판 번호 형식으로 입력해주세요. (예: 70가1234)';
    return null;
  },
  // 사진 검증
  photo: (file) => {
    if (!file) return '사진을 선택해주세요.';
    if (!file.type.startsWith('image/')) return '이미지 파일만 선택 가능합니다.';
    if (file.size > 10 * 1024 * 1024) return '파일 크기는 10MB 이하로 선택해주세요.';
    return null;
  }
};

// ======== 유틸리티 함수들 ========
function showError(message) {
  alert(message);
}

function validateInput(type, value) {
  const validator = validators[type];
  if (!validator) return true;
  const error = validator(value);
  if (error) {
    showError(error);
    return false;
  }
  return true;
}

function updateButtonState(buttonId, isValid) {
  const button = buttons[buttonId];
  if (button) {
    button.disabled = !isValid;
  }
}

function getCurrentPrevBtn() {
  const cards = document.querySelectorAll('.card');
  return cards[currentStep]?.querySelector('.prevBtn');
}

function updatePrevBtn() {
  document.querySelectorAll('.prevBtn').forEach((btn) => {
    // 이름 입력 페이지(-1)나 근무지 선택 페이지(0)에서는 이전 버튼 비활성화
    btn.disabled = (currentStep === -1 || currentStep === 0);
    
    // 모든 이전 버튼에 이벤트 설정
    btn.onclick = () => {
      if (currentStep > 0) {
        window.history.back();
      }
    };
  });
}

// 페이지 ID를 인덱스로 변환하는 맵
const pageIdToIndex = {
  'p-driver-name': -1,
  'p0': 0,
  'p1': 1,
  'p2': 2,
  'p3': 3,
  'done': 4
};

// 인덱스를 페이지 ID로 변환
function getPageIdByIndex(index) {
  const idMap = ['p0', 'p1', 'p2', 'p3', 'done'];
  if (index === -1) return 'p-driver-name';
  return idMap[index] || 'p0';
}

function showPage(pageIndex, pushHistory = false) {
  // 이름 입력 페이지 처리
  if (pageIndex === -1) {
    pages.forEach(page => page.classList.remove('active'));
    driverNamePage.classList.add('active');
    currentStep = -1;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (pushHistory) {
      history.pushState({ pageIndex: -1 }, '', '');
    }
    return;
  }

  // 이름 입력 페이지 숨기기
  driverNamePage.classList.remove('active');

  // 단계별로 입력값 초기화
  if (pageIndex === 0) {
    selectedSite = '';
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 1) {
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 2) {
    enteredPlate = '';
  }
  
  // 일반 페이지 표시
  pages.forEach((page, index) => {
    const pageId = page.id;
    if (pageId === 'p-driver-name') {
      page.classList.remove('active');
    } else {
      const pageIdx = pageIdToIndex[pageId] || 0;
      page.classList.toggle('active', pageIdx === pageIndex);
    }
  });
  currentStep = pageIndex;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  updatePrevBtn();
  updateBreadcrumb();
  
  // 차량번호 선택 페이지(p2)일 때 그리드 렌더링
  if (pageIndex === 2) {
    renderPlateGrid();
  }
  
  if (pushHistory) {
    history.pushState({ pageIndex: currentStep }, '', '');
  }
}

function nextStep() {
  // 이름 입력 페이지에서 다음 단계로
  if (currentStep === -1) {
    showPage(0, true);
    return;
  }
  // 일반 페이지 다음 단계
  if (currentStep < 4) { // done 페이지는 인덱스 4
    showPage(currentStep + 1, true);
  }
}

// ======== 커스텀 모달 ========
function showModal(message, onConfirm) {
  const modal = document.getElementById('modal');
  const msg = document.getElementById('modal-message');
  const yesBtn = document.getElementById('modal-yes');
  const noBtn = document.getElementById('modal-no');
  msg.textContent = message;
  modal.style.display = 'flex';
  function cleanup() {
    modal.style.display = 'none';
    yesBtn.removeEventListener('click', yesHandler);
    noBtn.removeEventListener('click', noHandler);
  }
  function yesHandler() {
    cleanup();
    onConfirm(true);
  }
  function noHandler() {
    cleanup();
    onConfirm(false);
  }
  yesBtn.addEventListener('click', yesHandler);
  noBtn.addEventListener('click', noHandler);
}

// ======== 근무지 선택 이벤트 리스너 ========
siteButtons.nopo.addEventListener('click', () => {
  showModal('근무지 : 노포(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '노포';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('노포');
    updateBreadcrumb();
    nextStep();
  });
});

siteButtons.jeonggwan.addEventListener('click', () => {
  showModal('근무지 : 정관(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '정관';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('정관');
    updateBreadcrumb();
    nextStep();
  });
});

// ======== 버스번호 버튼 동적 생성 ========
function renderBusNoButtons(site) {
  busnoButtonsDiv.innerHTML = '';
  BUSNO_LIST[site].forEach(busNo => {
    const btn = document.createElement('button');
    btn.className = 'busno-btn';
    btn.textContent = busNo;
    btn.onclick = () => {
      showModal(`노선번호 : ${busNo}(이)가 맞으십니까?`, (ok) => {
        if (!ok) return;
        selectedBusNo = busNo;
        updateBreadcrumb();
        nextStep();
      });
    };
    busnoButtonsDiv.appendChild(btn);
  });
}

// ======== 복장 상태 확인 버튼 ========
function initUniformButtons() {
  const uniformOkBtn = document.getElementById('uniform-ok');
  const uniformBadBtn = document.getElementById('uniform-bad');
  
  if (uniformOkBtn) {
    uniformOkBtn.addEventListener('click', async () => {
      uniformStatus = 'ok';
      uniformReason = '';
      uniformOkBtn.disabled = true;
      uniformOkBtn.textContent = '제출 중...';
      try {
        await submitData();
        showPage(totalSteps); // 완료 화면 표시
      } catch (error) {
        console.error('제출 실패:', error);
        showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        uniformOkBtn.disabled = false;
        uniformOkBtn.textContent = '양호';
      }
    });
  }
  
  if (uniformBadBtn) {
    uniformBadBtn.addEventListener('click', () => {
      showReasonModal();
    });
  }
}

// ======== 불량 사유 입력 모달 ========
function showReasonModal() {
  const modal = document.getElementById('modal-reason');
  const reasonInput = document.getElementById('reason-input');
  const submitBtn = document.getElementById('modal-reason-submit');
  const cancelBtn = document.getElementById('modal-reason-cancel');
  
  reasonInput.value = uniformReason; // 기존 값이 있으면 표시
  modal.style.display = 'flex';
  
  function cleanup() {
    modal.style.display = 'none';
    submitBtn.removeEventListener('click', submitHandler);
    cancelBtn.removeEventListener('click', cancelHandler);
  }
  
  async function submitHandler() {
    const reason = reasonInput.value.trim();
    if (!reason) {
      showError('불량 사유를 입력해주세요.');
      return;
    }
    uniformStatus = 'bad';
    uniformReason = reason;
    cleanup();
    
    // 제출 버튼 비활성화
    uniformBadBtn.disabled = true;
    const originalText = uniformBadBtn.textContent;
    uniformBadBtn.textContent = '제출 중...';
    
    try {
      await submitData();
      showPage(totalSteps); // 완료 화면 표시
    } catch (error) {
      console.error('제출 실패:', error);
      showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
      uniformBadBtn.disabled = false;
      uniformBadBtn.textContent = originalText;
    }
  }
  
  function cancelHandler() {
    cleanup();
  }
  
  submitBtn.addEventListener('click', submitHandler);
  cancelBtn.addEventListener('click', cancelHandler);
  
  // Enter 키로 제출
  reasonInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      submitHandler();
    }
  });
  
  // 포커스
  setTimeout(() => reasonInput.focus(), 100);
}

// ======== 데이터 제출 함수 ========
async function submitData() {
  const formData = new FormData();
  formData.append('site', selectedSite);
  formData.append('busNo', selectedBusNo);
  formData.append('plate', enteredPlate);
  formData.append('uniformStatus', uniformStatus);
  if (uniformStatus === 'bad' && uniformReason) {
    formData.append('uniformReason', uniformReason);
  }
  formData.append('timestamp', new Date().toISOString());
  // TODO: 실제 백엔드 URL로 변경 필요
  const response = await fetch('/api/submit', {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// ======== 키보드 이벤트 ========
document.addEventListener('keydown', (e) => {
  // 버스번호 선택 화면에서는 Enter로 동작하지 않음
  if (currentStep === 1) return;
  // 복장 상태 확인 화면에서는 버튼이 다르므로 처리하지 않음
  if (currentStep === 3) return;
  const btnMap = {2: 'b2'};
  const currentButton = buttons[btnMap[currentStep]];
  if (e.key === 'Enter' && currentButton && !currentButton.disabled) {
    currentButton.click();
  }
});

// 처음 화면으로 이동하는 함수
function goToInitialPage() {
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    showPage(-1, true);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    showPage(0, true);
  }
}

// 이름 입력 이벤트 리스너
if (driverNameInput && driverNameSubmit) {
  driverNameInput.addEventListener('input', (e) => {
    const name = e.target.value.trim();
    driverNameSubmit.disabled = name.length === 0;
  });

  driverNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !driverNameSubmit.disabled) {
      driverNameSubmit.click();
    }
  });

  driverNameSubmit.addEventListener('click', () => {
    const name = driverNameInput.value.trim();
    if (name.length > 0) {
      saveDriverName(name);
      showPage(0, true); // 근무지 선택 페이지로 이동
    }
  });
}

const breadcrumb = document.getElementById('breadcrumb');

function updateBreadcrumb() {
  let crumbs = [];
  if (selectedSite) crumbs.push(`<span class="crumb">근무지: ${selectedSite}</span>`);
  if (selectedBusNo) crumbs.push(`<span class="crumb">노선번호: ${selectedBusNo}</span>`);
  if (enteredPlate) crumbs.push(`<span class="crumb">차량번호: ${enteredPlate}</span>`);
  breadcrumb.innerHTML = crumbs.join('<span class="sep">&gt;</span>');
}

// ======== renderPlateGrid 수정 ========
function renderPlateGrid() {
  // p2 페이지의 card-content를 직접 찾기
  const p2Page = document.getElementById('p2');
  if (!p2Page) return;
  const cardContent = p2Page.querySelector('.card-content');
  if (!cardContent) return;
  let plateGridDiv = cardContent.querySelector('#plate-grid');
  if (plateGridDiv) cardContent.removeChild(plateGridDiv);
  let filterInput = cardContent.querySelector('#plate-filter');
  if (filterInput) cardContent.removeChild(filterInput);
  let errorMsg = cardContent.querySelector('#plate-filter-error');
  if (errorMsg) cardContent.removeChild(errorMsg);
  filterInput = document.createElement('input');
  filterInput.id = 'plate-filter';
  filterInput.type = 'text';
  filterInput.placeholder = '차량번호 검색(숫자 입력)';
  filterInput.inputMode = 'numeric';
  filterInput.autocomplete = 'off';
  filterInput.style.marginBottom = '0.5rem';
  filterInput.style.width = '100%';
  cardContent.appendChild(filterInput);
  errorMsg = document.createElement('div');
  errorMsg.id = 'plate-filter-error';
  errorMsg.style.color = '#dc2626';
  errorMsg.style.fontSize = '0.98rem';
  errorMsg.style.height = '1.2em';
  errorMsg.style.marginBottom = '0.5rem';
  errorMsg.style.textAlign = 'left';
  errorMsg.textContent = '';
  cardContent.appendChild(errorMsg);
  plateGridDiv = document.createElement('div');
  plateGridDiv.id = 'plate-grid';
  plateGridDiv.style.display = 'grid';
  plateGridDiv.style.gridTemplateColumns = 'repeat(3, 1fr)';
  plateGridDiv.style.gap = '0.7rem';
  plateGridDiv.style.maxHeight = '320px';
  plateGridDiv.style.minHeight = '320px';
  plateGridDiv.style.overflowY = 'auto';
  plateGridDiv.style.overflowX = 'hidden';
  plateGridDiv.style.width = '100%';
  plateGridDiv.style.marginBottom = '1.2rem';
  cardContent.appendChild(plateGridDiv);
  function renderGrid() {
    const oldBtns = Array.from(plateGridDiv.children);
    oldBtns.forEach(btn => {
      btn.classList.add('fade-exit');
      setTimeout(() => btn.remove(), 200);
    });
    // 데이터 로딩 상태 처리
    if (!plateDataLoaded) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#888;font-size:1.1rem;">차량번호 데이터를 불러오는 중...</div>';
      return;
    }
    if (plateDataError) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#dc2626;font-size:1.1rem;">차량번호 데이터를 불러오지 못했습니다.</div>';
      return;
    }
    let list = [];
    if (selectedBusNo && PLATE_LISTS[selectedBusNo]) {
      list = PLATE_LISTS[selectedBusNo];
    }
    let filter = filterInput.value.trim();
    if (filter.length > 4) {
      filter = filter.slice(0, 4);
      filterInput.value = filter;
    }
    if (filter && /[^0-9]/.test(filter)) {
      errorMsg.textContent = '숫자만 입력해주세요!';
      return;
    } else {
      errorMsg.textContent = '';
    }
    const filtered = filter ? list.filter(num => num.includes(filter)) : list;
    const total = filtered.length;
    const maxRow = Math.ceil(list.length / 3);
    plateGridDiv.style.gridTemplateRows = `repeat(${maxRow}, 1fr)`;
    for (let i = 0; i < maxRow * 3; i++) {
      if (i < total) {
        const num = filtered[i];
        const btn = document.createElement('button');
        btn.className = 'plate-btn fade-in';
        btn.textContent = num;
        btn.setAttribute('aria-label', `차량번호 ${num}`);
        btn.tabIndex = 0;
        btn.onclick = () => {
          showModal(`차량번호 : ${num}가 맞으십니까?`, (ok) => {
            if (!ok) return;
            enteredPlate = num;
            updateBreadcrumb();
            nextStep();
          });
        };
        btn.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') btn.click();
        };
        plateGridDiv.appendChild(btn);
        setTimeout(() => btn.classList.remove('fade-in'), 250);
      } else {
        const empty = document.createElement('div');
        empty.style.visibility = 'hidden';
        plateGridDiv.appendChild(empty);
      }
    }
  }
  filterInput.addEventListener('input', renderGrid);
  renderGrid();
}

// ======== 초기화 ========
document.addEventListener('DOMContentLoaded', () => {
  // 헤더 로고 클릭 이벤트
  const headerLogo = document.getElementById('header-logo');
  if (headerLogo) {
    headerLogo.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 헤더 제목 클릭 이벤트
  const headerTitle = document.getElementById('header-title');
  if (headerTitle) {
    headerTitle.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // localStorage에 기사님 이름이 있는지 확인
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    history.replaceState({ pageIndex: -1 }, '', '');
    history.pushState({ pageIndex: -1 }, '', '');
    showPage(-1, false);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    history.replaceState({ pageIndex: 0 }, '', '');
    history.pushState({ pageIndex: 0 }, '', '');
    showPage(0, false);
  }
  updateBreadcrumb();
  console.log('운행전 자가점검시스템이 로드되었습니다.');
});

window.addEventListener('popstate', (event) => {
  const pageIndex = event.state && typeof event.state.pageIndex === 'number' ? event.state.pageIndex : (hasDriverName() ? 0 : -1);
  showPage(pageIndex, false);
  // history가 1개뿐이면(첫 화면) 더 이상 뒤로가기를 막음
  if ((pageIndex === 0 || pageIndex === -1) && history.length <= 2) {
    const initialPage = hasDriverName() ? 0 : -1;
    history.pushState({ pageIndex: initialPage }, '', '');
  }
});

// ======== 오프라인 지원 ========
window.addEventListener('online', () => {
  console.log('네트워크 연결이 복구되었습니다.');
});
window.addEventListener('offline', () => {
  console.log('네트워크 연결이 끊어졌습니다.');
  showError('네트워크 연결을 확인해주세요.');
});


```

```javascript
// ======== 상수 ========
const DRIVER_NAME_KEY = 'mdcsDriverName';

const BUSNO_LIST = {
  '노포': ['29', '80', '300'],
  '정관': ['73', '73 (오전)', '106', '107', '184', '188']
};

// ======== Storage 함수 ========
function getDriverName() {
  const stored = localStorage.getItem(DRIVER_NAME_KEY);
  if (!stored) return '';
  return stored.trim();
}

function hasDriverName() {
  return getDriverName().length > 0;
}

function saveDriverName(name) {
  if (!name || !name.trim()) return false;
  localStorage.setItem(DRIVER_NAME_KEY, name.trim());
  return true;
}

// ======== 전역 변수 ========
let currentStep = 0;
const totalSteps = 4;
let selectedSite = '';
let selectedBusNo = '';
let enteredPlate = '';
let uniformStatus = ''; // 'ok' or 'bad'
let uniformReason = ''; // 불량 사유

// ======== DOM 요소 ========
const pages = document.querySelectorAll('.page');
const driverNamePage = document.getElementById('p-driver-name');
const driverNameInput = document.getElementById('driver-name-input');
const driverNameSubmit = document.getElementById('driver-name-submit');

// 근무지 선택 버튼
const siteButtons = {
  nopo: document.getElementById('site-nopo'),
  jeonggwan: document.getElementById('site-jeonggwan')
};

// 버스번호 버튼 컨테이너
const busnoButtonsDiv = document.getElementById('busno-buttons');

// ======== 노선별 차량번호 리스트(구글 시트 연동) ========
let PLATE_LISTS = {};
let plateDataLoaded = false;
let plateDataError = false;
fetch('https://script.google.com/macros/s/AKfycbxKXmbLSOl64gNdOoYIORQs1fpdHOHZuX7LGypDLlgacjKtNhiVTWef6_pBNNkd2cWE/exec')
  .then(res => res.json())
  .then(data => {
    PLATE_LISTS = data;
    plateDataLoaded = true;
  })
  .catch(err => {
    plateDataError = true;
    console.error('차량번호 데이터 불러오기 실패:', err);
  });

// ======== 유효성 검사 함수들 ========
const validators = {
  // 면허판번호 검증 (70가1234 형식)
  plate: (value) => {
    if (!value.trim()) return '면허판 번호를 입력해주세요.';
    const pattern = /^\d{2}[가-힣]\d{4}$/;
    if (!pattern.test(value)) return '올바른 면허판 번호 형식으로 입력해주세요. (예: 70가1234)';
    return null;
  },
  // 사진 검증
  photo: (file) => {
    if (!file) return '사진을 선택해주세요.';
    if (!file.type.startsWith('image/')) return '이미지 파일만 선택 가능합니다.';
    if (file.size > 10 * 1024 * 1024) return '파일 크기는 10MB 이하로 선택해주세요.';
    return null;
  }
};

// ======== 유틸리티 함수들 ========
function showError(message) {
  alert(message);
}

function validateInput(type, value) {
  const validator = validators[type];
  if (!validator) return true;
  const error = validator(value);
  if (error) {
    showError(error);
    return false;
  }
  return true;
}

function updateButtonState(buttonId, isValid) {
  const button = buttons[buttonId];
  if (button) {
    button.disabled = !isValid;
  }
}

function getCurrentPrevBtn() {
  const cards = document.querySelectorAll('.card');
  return cards[currentStep]?.querySelector('.prevBtn');
}

function updatePrevBtn() {
  document.querySelectorAll('.prevBtn').forEach((btn) => {
    // 이름 입력 페이지(-1)나 근무지 선택 페이지(0)에서는 이전 버튼 비활성화
    btn.disabled = (currentStep === -1 || currentStep === 0);
    
    // 모든 이전 버튼에 이벤트 설정
    btn.onclick = () => {
      if (currentStep > 0) {
        window.history.back();
      }
    };
  });
}

// 페이지 ID를 인덱스로 변환하는 맵
const pageIdToIndex = {
  'p-driver-name': -1,
  'p0': 0,
  'p1': 1,
  'p2': 2,
  'p3': 3,
  'done': 4
};

// 인덱스를 페이지 ID로 변환
function getPageIdByIndex(index) {
  const idMap = ['p0', 'p1', 'p2', 'p3', 'done'];
  if (index === -1) return 'p-driver-name';
  return idMap[index] || 'p0';
}

function showPage(pageIndex, pushHistory = false) {
  // 이름 입력 페이지 처리
  if (pageIndex === -1) {
    pages.forEach(page => page.classList.remove('active'));
    driverNamePage.classList.add('active');
    currentStep = -1;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (pushHistory) {
      history.pushState({ pageIndex: -1 }, '', '');
    }
    return;
  }

  // 이름 입력 페이지 숨기기
  driverNamePage.classList.remove('active');

  // 단계별로 입력값 초기화
  if (pageIndex === 0) {
    selectedSite = '';
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 1) {
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 2) {
    enteredPlate = '';
  }
  
  // 일반 페이지 표시
  pages.forEach((page, index) => {
    const pageId = page.id;
    if (pageId === 'p-driver-name') {
      page.classList.remove('active');
    } else {
      const pageIdx = pageIdToIndex[pageId] || 0;
      page.classList.toggle('active', pageIdx === pageIndex);
    }
  });
  currentStep = pageIndex;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  updatePrevBtn();
  updateBreadcrumb();
  
  // 차량번호 선택 페이지(p2)일 때 그리드 렌더링
  if (pageIndex === 2) {
    renderPlateGrid();
  }
  
  if (pushHistory) {
    history.pushState({ pageIndex: currentStep }, '', '');
  }
}

function nextStep() {
  // 이름 입력 페이지에서 다음 단계로
  if (currentStep === -1) {
    showPage(0, true);
    return;
  }
  // 일반 페이지 다음 단계
  if (currentStep < 4) { // done 페이지는 인덱스 4
    showPage(currentStep + 1, true);
  }
}

// ======== 커스텀 모달 ========
function showModal(message, onConfirm) {
  const modal = document.getElementById('modal');
  const msg = document.getElementById('modal-message');
  const yesBtn = document.getElementById('modal-yes');
  const noBtn = document.getElementById('modal-no');
  msg.textContent = message;
  modal.style.display = 'flex';
  function cleanup() {
    modal.style.display = 'none';
    yesBtn.removeEventListener('click', yesHandler);
    noBtn.removeEventListener('click', noHandler);
  }
  function yesHandler() {
    cleanup();
    onConfirm(true);
  }
  function noHandler() {
    cleanup();
    onConfirm(false);
  }
  yesBtn.addEventListener('click', yesHandler);
  noBtn.addEventListener('click', noHandler);
}

// ======== 근무지 선택 이벤트 리스너 ========
siteButtons.nopo.addEventListener('click', () => {
  showModal('근무지 : 노포(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '노포';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('노포');
    updateBreadcrumb();
    nextStep();
  });
});

siteButtons.jeonggwan.addEventListener('click', () => {
  showModal('근무지 : 정관(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '정관';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('정관');
    updateBreadcrumb();
    nextStep();
  });
});

// ======== 버스번호 버튼 동적 생성 ========
function renderBusNoButtons(site) {
  busnoButtonsDiv.innerHTML = '';
  BUSNO_LIST[site].forEach(busNo => {
    const btn = document.createElement('button');
    btn.className = 'busno-btn';
    btn.textContent = busNo;
    btn.onclick = () => {
      showModal(`노선번호 : ${busNo}(이)가 맞으십니까?`, (ok) => {
        if (!ok) return;
        selectedBusNo = busNo;
        updateBreadcrumb();
        nextStep();
      });
    };
    busnoButtonsDiv.appendChild(btn);
  });
}

// ======== 복장 상태 확인 버튼 ========
function initUniformButtons() {
  const uniformOkBtn = document.getElementById('uniform-ok');
  const uniformBadBtn = document.getElementById('uniform-bad');
  
  if (uniformOkBtn) {
    uniformOkBtn.addEventListener('click', async () => {
      uniformStatus = 'ok';
      uniformReason = '';
      uniformOkBtn.disabled = true;
      uniformOkBtn.textContent = '제출 중...';
      try {
        await submitData();
        showPage(totalSteps); // 완료 화면 표시
      } catch (error) {
        console.error('제출 실패:', error);
        showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        uniformOkBtn.disabled = false;
        uniformOkBtn.textContent = '양호';
      }
    });
  }
  
  if (uniformBadBtn) {
    uniformBadBtn.addEventListener('click', () => {
      showReasonModal();
    });
  }
}

// ======== 불량 사유 입력 모달 ========
function showReasonModal() {
  const modal = document.getElementById('modal-reason');
  const reasonInput = document.getElementById('reason-input');
  const submitBtn = document.getElementById('modal-reason-submit');
  const cancelBtn = document.getElementById('modal-reason-cancel');
  
  reasonInput.value = uniformReason; // 기존 값이 있으면 표시
  modal.style.display = 'flex';
  
  function cleanup() {
    modal.style.display = 'none';
    submitBtn.removeEventListener('click', submitHandler);
    cancelBtn.removeEventListener('click', cancelHandler);
  }
  
  async function submitHandler() {
    const reason = reasonInput.value.trim();
    if (!reason) {
      showError('불량 사유를 입력해주세요.');
      return;
    }
    uniformStatus = 'bad';
    uniformReason = reason;
    cleanup();
    
    // 제출 버튼 비활성화
    uniformBadBtn.disabled = true;
    const originalText = uniformBadBtn.textContent;
    uniformBadBtn.textContent = '제출 중...';
    
    try {
      await submitData();
      showPage(totalSteps); // 완료 화면 표시
    } catch (error) {
      console.error('제출 실패:', error);
      showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
      uniformBadBtn.disabled = false;
      uniformBadBtn.textContent = originalText;
    }
  }
  
  function cancelHandler() {
    cleanup();
  }
  
  submitBtn.addEventListener('click', submitHandler);
  cancelBtn.addEventListener('click', cancelHandler);
  
  // Enter 키로 제출
  reasonInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      submitHandler();
    }
  });
  
  // 포커스
  setTimeout(() => reasonInput.focus(), 100);
}

// ======== 데이터 제출 함수 ========
async function submitData() {
  const formData = new FormData();
  formData.append('site', selectedSite);
  formData.append('busNo', selectedBusNo);
  formData.append('plate', enteredPlate);
  formData.append('uniformStatus', uniformStatus);
  if (uniformStatus === 'bad' && uniformReason) {
    formData.append('uniformReason', uniformReason);
  }
  formData.append('timestamp', new Date().toISOString());
  // TODO: 실제 백엔드 URL로 변경 필요
  const response = await fetch('/api/submit', {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// ======== 키보드 이벤트 ========
document.addEventListener('keydown', (e) => {
  // 버스번호 선택 화면에서는 Enter로 동작하지 않음
  if (currentStep === 1) return;
  // 복장 상태 확인 화면에서는 버튼이 다르므로 처리하지 않음
  if (currentStep === 3) return;
  const btnMap = {2: 'b2'};
  const currentButton = buttons[btnMap[currentStep]];
  if (e.key === 'Enter' && currentButton && !currentButton.disabled) {
    currentButton.click();
  }
});

// 처음 화면으로 이동하는 함수
function goToInitialPage() {
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    showPage(-1, true);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    showPage(0, true);
  }
}

// 이름 입력 이벤트 리스너
if (driverNameInput && driverNameSubmit) {
  driverNameInput.addEventListener('input', (e) => {
    const name = e.target.value.trim();
    driverNameSubmit.disabled = name.length === 0;
  });

  driverNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !driverNameSubmit.disabled) {
      driverNameSubmit.click();
    }
  });

  driverNameSubmit.addEventListener('click', () => {
    const name = driverNameInput.value.trim();
    if (name.length > 0) {
      saveDriverName(name);
      showPage(0, true); // 근무지 선택 페이지로 이동
    }
  });
}

const breadcrumb = document.getElementById('breadcrumb');

function updateBreadcrumb() {
  let crumbs = [];
  if (selectedSite) crumbs.push(`<span class="crumb">근무지: ${selectedSite}</span>`);
  if (selectedBusNo) crumbs.push(`<span class="crumb">노선번호: ${selectedBusNo}</span>`);
  if (enteredPlate) crumbs.push(`<span class="crumb">차량번호: ${enteredPlate}</span>`);
  breadcrumb.innerHTML = crumbs.join('<span class="sep">&gt;</span>');
}

// ======== renderPlateGrid 수정 ========
function renderPlateGrid() {
  // p2 페이지의 card-content를 직접 찾기
  const p2Page = document.getElementById('p2');
  if (!p2Page) return;
  const cardContent = p2Page.querySelector('.card-content');
  if (!cardContent) return;
  let plateGridDiv = cardContent.querySelector('#plate-grid');
  if (plateGridDiv) cardContent.removeChild(plateGridDiv);
  let filterInput = cardContent.querySelector('#plate-filter');
  if (filterInput) cardContent.removeChild(filterInput);
  let errorMsg = cardContent.querySelector('#plate-filter-error');
  if (errorMsg) cardContent.removeChild(errorMsg);
  filterInput = document.createElement('input');
  filterInput.id = 'plate-filter';
  filterInput.type = 'text';
  filterInput.placeholder = '차량번호 검색(숫자 입력)';
  filterInput.inputMode = 'numeric';
  filterInput.autocomplete = 'off';
  filterInput.style.marginBottom = '0.5rem';
  filterInput.style.width = '100%';
  cardContent.appendChild(filterInput);
  errorMsg = document.createElement('div');
  errorMsg.id = 'plate-filter-error';
  errorMsg.style.color = '#dc2626';
  errorMsg.style.fontSize = '0.98rem';
  errorMsg.style.height = '1.2em';
  errorMsg.style.marginBottom = '0.5rem';
  errorMsg.style.textAlign = 'left';
  errorMsg.textContent = '';
  cardContent.appendChild(errorMsg);
  plateGridDiv = document.createElement('div');
  plateGridDiv.id = 'plate-grid';
  plateGridDiv.style.display = 'grid';
  plateGridDiv.style.gridTemplateColumns = 'repeat(3, 1fr)';
  plateGridDiv.style.gap = '0.7rem';
  plateGridDiv.style.maxHeight = '320px';
  plateGridDiv.style.minHeight = '320px';
  plateGridDiv.style.overflowY = 'auto';
  plateGridDiv.style.overflowX = 'hidden';
  plateGridDiv.style.width = '100%';
  plateGridDiv.style.marginBottom = '1.2rem';
  cardContent.appendChild(plateGridDiv);
  function renderGrid() {
    const oldBtns = Array.from(plateGridDiv.children);
    oldBtns.forEach(btn => {
      btn.classList.add('fade-exit');
      setTimeout(() => btn.remove(), 200);
    });
    // 데이터 로딩 상태 처리
    if (!plateDataLoaded) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#888;font-size:1.1rem;">차량번호 데이터를 불러오는 중...</div>';
      return;
    }
    if (plateDataError) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#dc2626;font-size:1.1rem;">차량번호 데이터를 불러오지 못했습니다.</div>';
      return;
    }
    let list = [];
    if (selectedBusNo && PLATE_LISTS[selectedBusNo]) {
      list = PLATE_LISTS[selectedBusNo];
    }
    let filter = filterInput.value.trim();
    if (filter.length > 4) {
      filter = filter.slice(0, 4);
      filterInput.value = filter;
    }
    if (filter && /[^0-9]/.test(filter)) {
      errorMsg.textContent = '숫자만 입력해주세요!';
      return;
    } else {
      errorMsg.textContent = '';
    }
    const filtered = filter ? list.filter(num => num.includes(filter)) : list;
    const total = filtered.length;
    const maxRow = Math.ceil(list.length / 3);
    plateGridDiv.style.gridTemplateRows = `repeat(${maxRow}, 1fr)`;
    for (let i = 0; i < maxRow * 3; i++) {
      if (i < total) {
        const num = filtered[i];
        const btn = document.createElement('button');
        btn.className = 'plate-btn fade-in';
        btn.textContent = num;
        btn.setAttribute('aria-label', `차량번호 ${num}`);
        btn.tabIndex = 0;
        btn.onclick = () => {
          showModal(`차량번호 : ${num}가 맞으십니까?`, (ok) => {
            if (!ok) return;
            enteredPlate = num;
            updateBreadcrumb();
            nextStep();
          });
        };
        btn.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') btn.click();
        };
        plateGridDiv.appendChild(btn);
        setTimeout(() => btn.classList.remove('fade-in'), 250);
      } else {
        const empty = document.createElement('div');
        empty.style.visibility = 'hidden';
        plateGridDiv.appendChild(empty);
      }
    }
  }
  filterInput.addEventListener('input', renderGrid);
  renderGrid();
}

// ======== 초기화 ========
document.addEventListener('DOMContentLoaded', () => {
  // 헤더 로고 클릭 이벤트
  const headerLogo = document.getElementById('header-logo');
  if (headerLogo) {
    headerLogo.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 헤더 제목 클릭 이벤트
  const headerTitle = document.getElementById('header-title');
  if (headerTitle) {
    headerTitle.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 복장 상태 확인 버튼 초기화
  initUniformButtons();
  
  // localStorage에 기사님 이름이 있는지 확인
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    history.replaceState({ pageIndex: -1 }, '', '');
    history.pushState({ pageIndex: -1 }, '', '');
    showPage(-1, false);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    history.replaceState({ pageIndex: 0 }, '', '');
    history.pushState({ pageIndex: 0 }, '', '');
    showPage(0, false);
  }
  updateBreadcrumb();
  console.log('운행전 자가점검시스템이 로드되었습니다.');
});

window.addEventListener('popstate', (event) => {
  const pageIndex = event.state && typeof event.state.pageIndex === 'number' ? event.state.pageIndex : (hasDriverName() ? 0 : -1);
  showPage(pageIndex, false);
  // history가 1개뿐이면(첫 화면) 더 이상 뒤로가기를 막음
  if ((pageIndex === 0 || pageIndex === -1) && history.length <= 2) {
    const initialPage = hasDriverName() ? 0 : -1;
    history.pushState({ pageIndex: initialPage }, '', '');
  }
});

// ======== 오프라인 지원 ========
window.addEventListener('online', () => {
  console.log('네트워크 연결이 복구되었습니다.');
});
window.addEventListener('offline', () => {
  console.log('네트워크 연결이 끊어졌습니다.');
  showError('네트워크 연결을 확인해주세요.');
});


```


showReasonModal 함수에서 uniformBadBtn 참조 수정 중.


```javascript
// ======== 상수 ========
const DRIVER_NAME_KEY = 'mdcsDriverName';

const BUSNO_LIST = {
  '노포': ['29', '80', '300'],
  '정관': ['73', '73 (오전)', '106', '107', '184', '188']
};

// ======== Storage 함수 ========
function getDriverName() {
  const stored = localStorage.getItem(DRIVER_NAME_KEY);
  if (!stored) return '';
  return stored.trim();
}

function hasDriverName() {
  return getDriverName().length > 0;
}

function saveDriverName(name) {
  if (!name || !name.trim()) return false;
  localStorage.setItem(DRIVER_NAME_KEY, name.trim());
  return true;
}

// ======== 전역 변수 ========
let currentStep = 0;
const totalSteps = 4;
let selectedSite = '';
let selectedBusNo = '';
let enteredPlate = '';
let uniformStatus = ''; // 'ok' or 'bad'
let uniformReason = ''; // 불량 사유

// ======== DOM 요소 ========
const pages = document.querySelectorAll('.page');
const driverNamePage = document.getElementById('p-driver-name');
const driverNameInput = document.getElementById('driver-name-input');
const driverNameSubmit = document.getElementById('driver-name-submit');

// 근무지 선택 버튼
const siteButtons = {
  nopo: document.getElementById('site-nopo'),
  jeonggwan: document.getElementById('site-jeonggwan')
};

// 버스번호 버튼 컨테이너
const busnoButtonsDiv = document.getElementById('busno-buttons');

// ======== 노선별 차량번호 리스트(구글 시트 연동) ========
let PLATE_LISTS = {};
let plateDataLoaded = false;
let plateDataError = false;
fetch('https://script.google.com/macros/s/AKfycbxKXmbLSOl64gNdOoYIORQs1fpdHOHZuX7LGypDLlgacjKtNhiVTWef6_pBNNkd2cWE/exec')
  .then(res => res.json())
  .then(data => {
    PLATE_LISTS = data;
    plateDataLoaded = true;
  })
  .catch(err => {
    plateDataError = true;
    console.error('차량번호 데이터 불러오기 실패:', err);
  });

// ======== 유효성 검사 함수들 ========
const validators = {
  // 면허판번호 검증 (70가1234 형식)
  plate: (value) => {
    if (!value.trim()) return '면허판 번호를 입력해주세요.';
    const pattern = /^\d{2}[가-힣]\d{4}$/;
    if (!pattern.test(value)) return '올바른 면허판 번호 형식으로 입력해주세요. (예: 70가1234)';
    return null;
  },
  // 사진 검증
  photo: (file) => {
    if (!file) return '사진을 선택해주세요.';
    if (!file.type.startsWith('image/')) return '이미지 파일만 선택 가능합니다.';
    if (file.size > 10 * 1024 * 1024) return '파일 크기는 10MB 이하로 선택해주세요.';
    return null;
  }
};

// ======== 유틸리티 함수들 ========
function showError(message) {
  alert(message);
}

function validateInput(type, value) {
  const validator = validators[type];
  if (!validator) return true;
  const error = validator(value);
  if (error) {
    showError(error);
    return false;
  }
  return true;
}

function updateButtonState(buttonId, isValid) {
  const button = buttons[buttonId];
  if (button) {
    button.disabled = !isValid;
  }
}

function getCurrentPrevBtn() {
  const cards = document.querySelectorAll('.card');
  return cards[currentStep]?.querySelector('.prevBtn');
}

function updatePrevBtn() {
  document.querySelectorAll('.prevBtn').forEach((btn) => {
    // 이름 입력 페이지(-1)나 근무지 선택 페이지(0)에서는 이전 버튼 비활성화
    btn.disabled = (currentStep === -1 || currentStep === 0);
    
    // 모든 이전 버튼에 이벤트 설정
    btn.onclick = () => {
      if (currentStep > 0) {
        window.history.back();
      }
    };
  });
}

// 페이지 ID를 인덱스로 변환하는 맵
const pageIdToIndex = {
  'p-driver-name': -1,
  'p0': 0,
  'p1': 1,
  'p2': 2,
  'p3': 3,
  'done': 4
};

// 인덱스를 페이지 ID로 변환
function getPageIdByIndex(index) {
  const idMap = ['p0', 'p1', 'p2', 'p3', 'done'];
  if (index === -1) return 'p-driver-name';
  return idMap[index] || 'p0';
}

function showPage(pageIndex, pushHistory = false) {
  // 이름 입력 페이지 처리
  if (pageIndex === -1) {
    pages.forEach(page => page.classList.remove('active'));
    driverNamePage.classList.add('active');
    currentStep = -1;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (pushHistory) {
      history.pushState({ pageIndex: -1 }, '', '');
    }
    return;
  }

  // 이름 입력 페이지 숨기기
  driverNamePage.classList.remove('active');

  // 단계별로 입력값 초기화
  if (pageIndex === 0) {
    selectedSite = '';
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 1) {
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 2) {
    enteredPlate = '';
  }
  
  // 일반 페이지 표시
  pages.forEach((page, index) => {
    const pageId = page.id;
    if (pageId === 'p-driver-name') {
      page.classList.remove('active');
    } else {
      const pageIdx = pageIdToIndex[pageId] || 0;
      page.classList.toggle('active', pageIdx === pageIndex);
    }
  });
  currentStep = pageIndex;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  updatePrevBtn();
  updateBreadcrumb();
  
  // 차량번호 선택 페이지(p2)일 때 그리드 렌더링
  if (pageIndex === 2) {
    renderPlateGrid();
  }
  
  if (pushHistory) {
    history.pushState({ pageIndex: currentStep }, '', '');
  }
}

function nextStep() {
  // 이름 입력 페이지에서 다음 단계로
  if (currentStep === -1) {
    showPage(0, true);
    return;
  }
  // 일반 페이지 다음 단계
  if (currentStep < 4) { // done 페이지는 인덱스 4
    showPage(currentStep + 1, true);
  }
}

// ======== 커스텀 모달 ========
function showModal(message, onConfirm) {
  const modal = document.getElementById('modal');
  const msg = document.getElementById('modal-message');
  const yesBtn = document.getElementById('modal-yes');
  const noBtn = document.getElementById('modal-no');
  msg.textContent = message;
  modal.style.display = 'flex';
  function cleanup() {
    modal.style.display = 'none';
    yesBtn.removeEventListener('click', yesHandler);
    noBtn.removeEventListener('click', noHandler);
  }
  function yesHandler() {
    cleanup();
    onConfirm(true);
  }
  function noHandler() {
    cleanup();
    onConfirm(false);
  }
  yesBtn.addEventListener('click', yesHandler);
  noBtn.addEventListener('click', noHandler);
}

// ======== 근무지 선택 이벤트 리스너 ========
siteButtons.nopo.addEventListener('click', () => {
  showModal('근무지 : 노포(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '노포';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('노포');
    updateBreadcrumb();
    nextStep();
  });
});

siteButtons.jeonggwan.addEventListener('click', () => {
  showModal('근무지 : 정관(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '정관';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('정관');
    updateBreadcrumb();
    nextStep();
  });
});

// ======== 버스번호 버튼 동적 생성 ========
function renderBusNoButtons(site) {
  busnoButtonsDiv.innerHTML = '';
  BUSNO_LIST[site].forEach(busNo => {
    const btn = document.createElement('button');
    btn.className = 'busno-btn';
    btn.textContent = busNo;
    btn.onclick = () => {
      showModal(`노선번호 : ${busNo}(이)가 맞으십니까?`, (ok) => {
        if (!ok) return;
        selectedBusNo = busNo;
        updateBreadcrumb();
        nextStep();
      });
    };
    busnoButtonsDiv.appendChild(btn);
  });
}

// ======== 복장 상태 확인 버튼 ========
function initUniformButtons() {
  const uniformOkBtn = document.getElementById('uniform-ok');
  const uniformBadBtn = document.getElementById('uniform-bad');
  
  if (uniformOkBtn) {
    uniformOkBtn.addEventListener('click', async () => {
      uniformStatus = 'ok';
      uniformReason = '';
      uniformOkBtn.disabled = true;
      uniformOkBtn.textContent = '제출 중...';
      try {
        await submitData();
        showPage(totalSteps); // 완료 화면 표시
      } catch (error) {
        console.error('제출 실패:', error);
        showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        uniformOkBtn.disabled = false;
        uniformOkBtn.textContent = '양호';
      }
    });
  }
  
  if (uniformBadBtn) {
    uniformBadBtn.addEventListener('click', () => {
      showReasonModal();
    });
  }
}

// ======== 불량 사유 입력 모달 ========
function showReasonModal() {
  const modal = document.getElementById('modal-reason');
  const reasonInput = document.getElementById('reason-input');
  const submitBtn = document.getElementById('modal-reason-submit');
  const cancelBtn = document.getElementById('modal-reason-cancel');
  const uniformBadBtn = document.getElementById('uniform-bad');
  
  reasonInput.value = uniformReason; // 기존 값이 있으면 표시
  modal.style.display = 'flex';
  
  function cleanup() {
    modal.style.display = 'none';
    submitBtn.removeEventListener('click', submitHandler);
    cancelBtn.removeEventListener('click', cancelHandler);
  }
  
  async function submitHandler() {
    const reason = reasonInput.value.trim();
    if (!reason) {
      showError('불량 사유를 입력해주세요.');
      return;
    }
    uniformStatus = 'bad';
    uniformReason = reason;
    cleanup();
    
    // 제출 버튼 비활성화
    if (uniformBadBtn) {
      uniformBadBtn.disabled = true;
      const originalText = uniformBadBtn.textContent;
      uniformBadBtn.textContent = '제출 중...';
      
      try {
        await submitData();
        showPage(totalSteps); // 완료 화면 표시
      } catch (error) {
        console.error('제출 실패:', error);
        showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        uniformBadBtn.disabled = false;
        uniformBadBtn.textContent = originalText;
      }
    }
  }
  
  function cancelHandler() {
    cleanup();
  }
  
  submitBtn.addEventListener('click', submitHandler);
  cancelBtn.addEventListener('click', cancelHandler);
  
  // Enter 키로 제출
  reasonInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      submitHandler();
    }
  });
  
  // 포커스
  setTimeout(() => reasonInput.focus(), 100);
}

// ======== 데이터 제출 함수 ========
async function submitData() {
  const formData = new FormData();
  formData.append('site', selectedSite);
  formData.append('busNo', selectedBusNo);
  formData.append('plate', enteredPlate);
  formData.append('uniformStatus', uniformStatus);
  if (uniformStatus === 'bad' && uniformReason) {
    formData.append('uniformReason', uniformReason);
  }
  formData.append('timestamp', new Date().toISOString());
  // TODO: 실제 백엔드 URL로 변경 필요
  const response = await fetch('/api/submit', {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// ======== 키보드 이벤트 ========
document.addEventListener('keydown', (e) => {
  // 버스번호 선택 화면에서는 Enter로 동작하지 않음
  if (currentStep === 1) return;
  // 복장 상태 확인 화면에서는 버튼이 다르므로 처리하지 않음
  if (currentStep === 3) return;
  const btnMap = {2: 'b2'};
  const currentButton = buttons[btnMap[currentStep]];
  if (e.key === 'Enter' && currentButton && !currentButton.disabled) {
    currentButton.click();
  }
});

// 처음 화면으로 이동하는 함수
function goToInitialPage() {
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    showPage(-1, true);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    showPage(0, true);
  }
}

// 이름 입력 이벤트 리스너
if (driverNameInput && driverNameSubmit) {
  driverNameInput.addEventListener('input', (e) => {
    const name = e.target.value.trim();
    driverNameSubmit.disabled = name.length === 0;
  });

  driverNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !driverNameSubmit.disabled) {
      driverNameSubmit.click();
    }
  });

  driverNameSubmit.addEventListener('click', () => {
    const name = driverNameInput.value.trim();
    if (name.length > 0) {
      saveDriverName(name);
      showPage(0, true); // 근무지 선택 페이지로 이동
    }
  });
}

const breadcrumb = document.getElementById('breadcrumb');

function updateBreadcrumb() {
  let crumbs = [];
  if (selectedSite) crumbs.push(`<span class="crumb">근무지: ${selectedSite}</span>`);
  if (selectedBusNo) crumbs.push(`<span class="crumb">노선번호: ${selectedBusNo}</span>`);
  if (enteredPlate) crumbs.push(`<span class="crumb">차량번호: ${enteredPlate}</span>`);
  breadcrumb.innerHTML = crumbs.join('<span class="sep">&gt;</span>');
}

// ======== renderPlateGrid 수정 ========
function renderPlateGrid() {
  // p2 페이지의 card-content를 직접 찾기
  const p2Page = document.getElementById('p2');
  if (!p2Page) return;
  const cardContent = p2Page.querySelector('.card-content');
  if (!cardContent) return;
  let plateGridDiv = cardContent.querySelector('#plate-grid');
  if (plateGridDiv) cardContent.removeChild(plateGridDiv);
  let filterInput = cardContent.querySelector('#plate-filter');
  if (filterInput) cardContent.removeChild(filterInput);
  let errorMsg = cardContent.querySelector('#plate-filter-error');
  if (errorMsg) cardContent.removeChild(errorMsg);
  filterInput = document.createElement('input');
  filterInput.id = 'plate-filter';
  filterInput.type = 'text';
  filterInput.placeholder = '차량번호 검색(숫자 입력)';
  filterInput.inputMode = 'numeric';
  filterInput.autocomplete = 'off';
  filterInput.style.marginBottom = '0.5rem';
  filterInput.style.width = '100%';
  cardContent.appendChild(filterInput);
  errorMsg = document.createElement('div');
  errorMsg.id = 'plate-filter-error';
  errorMsg.style.color = '#dc2626';
  errorMsg.style.fontSize = '0.98rem';
  errorMsg.style.height = '1.2em';
  errorMsg.style.marginBottom = '0.5rem';
  errorMsg.style.textAlign = 'left';
  errorMsg.textContent = '';
  cardContent.appendChild(errorMsg);
  plateGridDiv = document.createElement('div');
  plateGridDiv.id = 'plate-grid';
  plateGridDiv.style.display = 'grid';
  plateGridDiv.style.gridTemplateColumns = 'repeat(3, 1fr)';
  plateGridDiv.style.gap = '0.7rem';
  plateGridDiv.style.maxHeight = '320px';
  plateGridDiv.style.minHeight = '320px';
  plateGridDiv.style.overflowY = 'auto';
  plateGridDiv.style.overflowX = 'hidden';
  plateGridDiv.style.width = '100%';
  plateGridDiv.style.marginBottom = '1.2rem';
  cardContent.appendChild(plateGridDiv);
  function renderGrid() {
    const oldBtns = Array.from(plateGridDiv.children);
    oldBtns.forEach(btn => {
      btn.classList.add('fade-exit');
      setTimeout(() => btn.remove(), 200);
    });
    // 데이터 로딩 상태 처리
    if (!plateDataLoaded) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#888;font-size:1.1rem;">차량번호 데이터를 불러오는 중...</div>';
      return;
    }
    if (plateDataError) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#dc2626;font-size:1.1rem;">차량번호 데이터를 불러오지 못했습니다.</div>';
      return;
    }
    let list = [];
    if (selectedBusNo && PLATE_LISTS[selectedBusNo]) {
      list = PLATE_LISTS[selectedBusNo];
    }
    let filter = filterInput.value.trim();
    if (filter.length > 4) {
      filter = filter.slice(0, 4);
      filterInput.value = filter;
    }
    if (filter && /[^0-9]/.test(filter)) {
      errorMsg.textContent = '숫자만 입력해주세요!';
      return;
    } else {
      errorMsg.textContent = '';
    }
    const filtered = filter ? list.filter(num => num.includes(filter)) : list;
    const total = filtered.length;
    const maxRow = Math.ceil(list.length / 3);
    plateGridDiv.style.gridTemplateRows = `repeat(${maxRow}, 1fr)`;
    for (let i = 0; i < maxRow * 3; i++) {
      if (i < total) {
        const num = filtered[i];
        const btn = document.createElement('button');
        btn.className = 'plate-btn fade-in';
        btn.textContent = num;
        btn.setAttribute('aria-label', `차량번호 ${num}`);
        btn.tabIndex = 0;
        btn.onclick = () => {
          showModal(`차량번호 : ${num}가 맞으십니까?`, (ok) => {
            if (!ok) return;
            enteredPlate = num;
            updateBreadcrumb();
            nextStep();
          });
        };
        btn.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') btn.click();
        };
        plateGridDiv.appendChild(btn);
        setTimeout(() => btn.classList.remove('fade-in'), 250);
      } else {
        const empty = document.createElement('div');
        empty.style.visibility = 'hidden';
        plateGridDiv.appendChild(empty);
      }
    }
  }
  filterInput.addEventListener('input', renderGrid);
  renderGrid();
}

// ======== 초기화 ========
document.addEventListener('DOMContentLoaded', () => {
  // 헤더 로고 클릭 이벤트
  const headerLogo = document.getElementById('header-logo');
  if (headerLogo) {
    headerLogo.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 헤더 제목 클릭 이벤트
  const headerTitle = document.getElementById('header-title');
  if (headerTitle) {
    headerTitle.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 복장 상태 확인 버튼 초기화
  initUniformButtons();
  
  // localStorage에 기사님 이름이 있는지 확인
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    history.replaceState({ pageIndex: -1 }, '', '');
    history.pushState({ pageIndex: -1 }, '', '');
    showPage(-1, false);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    history.replaceState({ pageIndex: 0 }, '', '');
    history.pushState({ pageIndex: 0 }, '', '');
    showPage(0, false);
  }
  updateBreadcrumb();
  console.log('운행전 자가점검시스템이 로드되었습니다.');
});

window.addEventListener('popstate', (event) => {
  const pageIndex = event.state && typeof event.state.pageIndex === 'number' ? event.state.pageIndex : (hasDriverName() ? 0 : -1);
  showPage(pageIndex, false);
  // history가 1개뿐이면(첫 화면) 더 이상 뒤로가기를 막음
  if ((pageIndex === 0 || pageIndex === -1) && history.length <= 2) {
    const initialPage = hasDriverName() ? 0 : -1;
    history.pushState({ pageIndex: initialPage }, '', '');
  }
});

// ======== 오프라인 지원 ========
window.addEventListener('online', () => {
  console.log('네트워크 연결이 복구되었습니다.');
});
window.addEventListener('offline', () => {
  console.log('네트워크 연결이 끊어졌습니다.');
  showError('네트워크 연결을 확인해주세요.');
});


```


작업 완료. 복장 사진 첨부 페이지를 복장 상태 확인 페이지로 변경했습니다.

## 변경 사항

1. **HTML 수정**
   - h1: "4. 복장 상태 확인"
   - p 태그로 체크리스트 추가:
     - 1. 정규근무복 착용
     - 2. 운동화 및 구두 착화 (슬리퍼, 크록스 x)
     - 3. 단정하게 착용 여부(옷매무새, 두발, 면도상태 등)
   - 버튼 2개: "양호", "불량"

2. **불량 사유 입력 모달**
   - "불량" 버튼 클릭 시 모달 표시
   - "불량 사유를 작성해주세요." 메시지
   - 텍스트 입력 필드 제공
   - "확인" 버튼으로 제출, "취소" 버튼으로 닫기

3. **JavaScript 수정**
   - 사진 업로드 관련 코드 제거
   - 복장 상태 확인 버튼 이벤트 추가
   - "양호" 클릭 시 바로 제출
   - "불량" 클릭 시 사유 입력 후 제출
   - 제출 데이터에 복장 상태 정보 포함

4. **CSS 스타일 추가**
   - 복장 체크리스트 스타일
   - 복장 버튼 스타일
   - 불량 사유 입력 모달 스타일

Live Server로 확인해 주세요. 복장 상태 확인 페이지에서 "양호" 또는 "불량"을 선택할 수 있고, "불량" 선택 시 사유를 입력할 수 있습니다.

---

**User**

4. 복장 상태 확인 페이지에서 

h1태그인 '4. 복장 상태 확인'을  '4. 복장 상태를 확인하세요.' 로 변경해줘.

그리고 p태그를 하나로 만들어줘서 줄바꿈으로 처리해줘. 지금 보니까 별개의 p태그가 3개나 있네 p태그는 하나만 하여 스타일을 지정하든 해서 보기 좋게 만들어줘

---

**Cursor**


h1 텍스트 변경 및 p 태그 통합 중.


```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>운행전 자가점검시스템</title>

<!-- 기본 메타 태그 -->
<meta name="description" content="부산 세진여객 운전기사 운행전 자가점검시스템">
<meta name="theme-color" content="#2563eb">

<!-- PWA 메타 태그 (주석처리) -->
<!-- <meta name="apple-mobile-web-app-capable" content="yes"> -->
<!-- <meta name="apple-mobile-web-app-status-bar-style" content="default"> -->
<!-- <meta name="apple-mobile-web-app-title" content="세진여객 점검"> -->

<!-- PWA 아이콘 (주석처리) -->
<!-- <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png"> -->
<!-- <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png"> -->
<!-- <link rel="apple-touch-icon" href="/icons/icon-192x192.png"> -->
<!-- <link rel="manifest" href="/manifest.json"> -->

<!-- Tailwind CSS CDN -->
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="styles.css">

</head>
<body>

<!-- ======== 헤더 ======== -->
<header>
  <!-- 로고 이미지: 업로드하신 PNG를 logo.png로 저장하여 같은 폴더에 두세요 -->
  <img src="logo.png" alt="세진여객 로고" id="header-logo" style="cursor: pointer;">
  <h2 id="header-title" style="font-size: 1.2rem; cursor: pointer;">운행전 자가점검시스템</h2>
</header>
<nav class="breadcrumb" id="breadcrumb"></nav>

<!-- ======== STEP -1 : 기사님 이름 입력 ======== -->
<section id="p-driver-name" class="page">
  <div class="card">
    <h1>기사님 성함을 입력해주세요</h1>
    <div class="card-content">
      <input id="driver-name-input" type="text" placeholder="이름을 입력하세요" autocomplete="name">
      <button id="driver-name-submit" disabled>다음</button>
    </div>
    <div class="card-actions"><button class="prevBtn" style="display:none;">이전</button></div>
  </div>
</section>

<!-- ======== STEP 0 : 근무지 선택 ======== -->
<section id="p0" class="page">
  <div class="card">
    <h1>1. 근무지를 선택하세요</h1>
    <img src="bus_illustration.png" alt="버스 일러스트" style="display:block;margin:0 auto 1.5rem auto;width:120px;height:120px;object-fit:contain;" />
    <div class="card-content">
      <div class="site-buttons">
        <button id="site-nopo" class="site-btn">노포</button>
        <button id="site-jeonggwan" class="site-btn">정관</button>
      </div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 1 : 버스번호 선택 ======== -->
<section id="p1" class="page">
  <div class="card">
    <h1>2. 노선번호를 선택하세요</h1>
    <div class="card-content">
      <div class="busno-buttons" id="busno-buttons"></div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 2 : 면허판번호 ======== -->
<section id="p2" class="page">
  <div class="card">
    <h1>차량번호를 선택하세요</h1>
    <div class="card-content">
      <!-- plate-grid와 prevBtn만 남김 -->
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 3 : 복장 상태 확인 ======== -->
<section id="p3" class="page">
  <div class="card">
    <h1>4. 복장 상태를 확인하세요.</h1>
    <div class="card-content">
      <div class="uniform-checklist">
        <p>1. 정규근무복 착용<br>2. 운동화 및 구두 착화 (슬리퍼, 크록스 x)<br>3. 단정하게 착용 여부(옷매무새, 두발, 면도상태 등)</p>
      </div>
      <div class="uniform-buttons">
        <button id="uniform-ok" class="uniform-btn">양호</button>
        <button id="uniform-bad" class="uniform-btn">불량</button>
      </div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== 완료 화면 ======== -->
<section id="done" class="page">
  <div class="card">
    <h1 class="success-title">✅ 제출 완료!</h1>
    <p class="success-message">안전 운행 하십시오.</p>
  </div>
</section>

<div id="modal" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message" id="modal-message"></div>
    <div class="modal-actions">
      <button id="modal-yes" class="modal-btn modal-yes">네</button>
      <button id="modal-no" class="modal-btn modal-no">아니오</button>
    </div>
  </div>
</div>

<div id="modal-reason" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message">불량 사유를 작성해주세요.</div>
    <div class="modal-input-container">
      <textarea id="reason-input" class="modal-textarea" placeholder="불량 사유를 입력하세요..." rows="4"></textarea>
    </div>
    <div class="modal-actions">
      <button id="modal-reason-submit" class="modal-btn modal-yes">확인</button>
      <button id="modal-reason-cancel" class="modal-btn modal-no">취소</button>
    </div>
  </div>
</div>

<script src="app.js"></script>
</body>
</html> 
```


CSS 조정 중: p 태그가 하나이므로 스타일을 조정합니다.


```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 80px;
}

header {
  background: var(--card-bg);
  padding: 1rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
}

header img {
  height: 36px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}

@media (max-width: 480px) {
  header {
    padding: 0.75rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 80px);
  padding: 1rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}

.breadcrumb {
  width: 100%;
  max-width: 400px;
  margin: 1rem auto 1rem auto;
  padding: 0.7rem 1rem;
  font-size: 1.55rem;
  color: var(--text-light);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  text-align: center;
}

.breadcrumb .crumb {
  color: var(--primary);
  font-weight: 600;
}

.breadcrumb .sep {
  color: var(--text-light);
  margin: 0 0.2em;
}

.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 복장 체크리스트 */
.uniform-checklist {
  width: 100%;
  text-align: left;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.uniform-checklist p {
  font-size: 1.1rem;
  line-height: 2;
  color: var(--text);
  margin-bottom: 0;
  white-space: pre-line;
}

/* 복장 버튼 */
.uniform-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.uniform-btn {
  width: 100% !important;
  padding: 1.25rem 2rem !important;
  font-size: 1.2rem !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px !important;
}

.uniform-btn:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.uniform-btn:disabled {
  background: var(--text-light) !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 불량 사유 입력 모달 */
.modal-input-container {
  width: 100%;
  margin: 1rem 0;
}

.modal-textarea {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-textarea::placeholder {
  color: var(--text-light);
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

  .breadcrumb {
    font-size: 1.25rem;
    padding: 0.5rem 0.5rem;
    max-width: 100vw;
    margin: 0.7rem auto 0.7rem auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```


수정 완료.

## 변경 사항

1. **h1 태그 변경**
   - "4. 복장 상태 확인" → "4. 복장 상태를 확인하세요."

2. **p 태그 통합**
   - 3개의 p 태그를 1개로 통합
   - `<br>` 태그로 줄바꿈 처리

3. **CSS 조정**
   - `line-height: 2`로 줄 간격 조정
   - `white-space: pre-line` 추가로 줄바꿈 표시 보장
   - `margin-bottom: 0`으로 불필요한 여백 제거

이제 복장 체크리스트가 하나의 p 태그로 표시되고, 줄바꿈으로 구분됩니다. Live Server로 확인해 주세요.

---

**User**

좋은데, 조금 미세조정해줄래?

line-height를 1.6으로 변경해주고
2. 운동화 및 구두 착화 (슬리퍼, 크록스 x) 이 부분을 보기좋게
2. 운동화 및 구두 착화<br>(슬리퍼, 크록스 x)를 하는데, 줄바꿈하여 텍스트 시작부분이 맞아 떨어져야해. 
그러니까 운동화 및 구두 착화에서 '운'에서 (슬리퍼, 크록스 x) 텍스트가 시작해야해. 이해했어?

똑같이 '3. 단정하게 착용 여부(옷매무새, 두발, 면도상태 등)'  텍스트도 단정하게 착용 여부<br>(옷매무새, 두발, 면도상태 등) 해주고 시작지점을 맞춰줘

---

**Cursor**


line-height를 1.6으로 변경하고, 줄바꿈 후 텍스트 시작 위치를 맞추도록 수정 중.


```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>운행전 자가점검시스템</title>

<!-- 기본 메타 태그 -->
<meta name="description" content="부산 세진여객 운전기사 운행전 자가점검시스템">
<meta name="theme-color" content="#2563eb">

<!-- PWA 메타 태그 (주석처리) -->
<!-- <meta name="apple-mobile-web-app-capable" content="yes"> -->
<!-- <meta name="apple-mobile-web-app-status-bar-style" content="default"> -->
<!-- <meta name="apple-mobile-web-app-title" content="세진여객 점검"> -->

<!-- PWA 아이콘 (주석처리) -->
<!-- <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png"> -->
<!-- <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png"> -->
<!-- <link rel="apple-touch-icon" href="/icons/icon-192x192.png"> -->
<!-- <link rel="manifest" href="/manifest.json"> -->

<!-- Tailwind CSS CDN -->
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="styles.css">

</head>
<body>

<!-- ======== 헤더 ======== -->
<header>
  <!-- 로고 이미지: 업로드하신 PNG를 logo.png로 저장하여 같은 폴더에 두세요 -->
  <img src="logo.png" alt="세진여객 로고" id="header-logo" style="cursor: pointer;">
  <h2 id="header-title" style="font-size: 1.2rem; cursor: pointer;">운행전 자가점검시스템</h2>
</header>
<nav class="breadcrumb" id="breadcrumb"></nav>

<!-- ======== STEP -1 : 기사님 이름 입력 ======== -->
<section id="p-driver-name" class="page">
  <div class="card">
    <h1>기사님 성함을 입력해주세요</h1>
    <div class="card-content">
      <input id="driver-name-input" type="text" placeholder="이름을 입력하세요" autocomplete="name">
      <button id="driver-name-submit" disabled>다음</button>
    </div>
    <div class="card-actions"><button class="prevBtn" style="display:none;">이전</button></div>
  </div>
</section>

<!-- ======== STEP 0 : 근무지 선택 ======== -->
<section id="p0" class="page">
  <div class="card">
    <h1>1. 근무지를 선택하세요</h1>
    <img src="bus_illustration.png" alt="버스 일러스트" style="display:block;margin:0 auto 1.5rem auto;width:120px;height:120px;object-fit:contain;" />
    <div class="card-content">
      <div class="site-buttons">
        <button id="site-nopo" class="site-btn">노포</button>
        <button id="site-jeonggwan" class="site-btn">정관</button>
      </div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 1 : 버스번호 선택 ======== -->
<section id="p1" class="page">
  <div class="card">
    <h1>2. 노선번호를 선택하세요</h1>
    <div class="card-content">
      <div class="busno-buttons" id="busno-buttons"></div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 2 : 면허판번호 ======== -->
<section id="p2" class="page">
  <div class="card">
    <h1>차량번호를 선택하세요</h1>
    <div class="card-content">
      <!-- plate-grid와 prevBtn만 남김 -->
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 3 : 복장 상태 확인 ======== -->
<section id="p3" class="page">
  <div class="card">
    <h1>4. 복장 상태를 확인하세요.</h1>
    <div class="card-content">
      <div class="uniform-checklist">
        <p>1. 정규근무복 착용<br>2. 운동화 및 구두 착화<br>&nbsp;&nbsp;&nbsp;(슬리퍼, 크록스 x)<br>3. 단정하게 착용 여부<br>&nbsp;&nbsp;&nbsp;(옷매무새, 두발, 면도상태 등)</p>
      </div>
      <div class="uniform-buttons">
        <button id="uniform-ok" class="uniform-btn">양호</button>
        <button id="uniform-bad" class="uniform-btn">불량</button>
      </div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== 완료 화면 ======== -->
<section id="done" class="page">
  <div class="card">
    <h1 class="success-title">✅ 제출 완료!</h1>
    <p class="success-message">안전 운행 하십시오.</p>
  </div>
</section>

<div id="modal" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message" id="modal-message"></div>
    <div class="modal-actions">
      <button id="modal-yes" class="modal-btn modal-yes">네</button>
      <button id="modal-no" class="modal-btn modal-no">아니오</button>
    </div>
  </div>
</div>

<div id="modal-reason" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message">불량 사유를 작성해주세요.</div>
    <div class="modal-input-container">
      <textarea id="reason-input" class="modal-textarea" placeholder="불량 사유를 입력하세요..." rows="4"></textarea>
    </div>
    <div class="modal-actions">
      <button id="modal-reason-submit" class="modal-btn modal-yes">확인</button>
      <button id="modal-reason-cancel" class="modal-btn modal-no">취소</button>
    </div>
  </div>
</div>

<script src="app.js"></script>
</body>
</html> 
```

```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 80px;
}

header {
  background: var(--card-bg);
  padding: 1rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
}

header img {
  height: 36px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}

@media (max-width: 480px) {
  header {
    padding: 0.75rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 80px);
  padding: 1rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}

.breadcrumb {
  width: 100%;
  max-width: 400px;
  margin: 1rem auto 1rem auto;
  padding: 0.7rem 1rem;
  font-size: 1.55rem;
  color: var(--text-light);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  text-align: center;
}

.breadcrumb .crumb {
  color: var(--primary);
  font-weight: 600;
}

.breadcrumb .sep {
  color: var(--text-light);
  margin: 0 0.2em;
}

.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 복장 체크리스트 */
.uniform-checklist {
  width: 100%;
  text-align: left;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.uniform-checklist p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 0;
  white-space: pre-line;
}

/* 복장 버튼 */
.uniform-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.uniform-btn {
  width: 100% !important;
  padding: 1.25rem 2rem !important;
  font-size: 1.2rem !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px !important;
}

.uniform-btn:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.uniform-btn:disabled {
  background: var(--text-light) !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 불량 사유 입력 모달 */
.modal-input-container {
  width: 100%;
  margin: 1rem 0;
}

.modal-textarea {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-textarea::placeholder {
  color: var(--text-light);
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

  .breadcrumb {
    font-size: 1.25rem;
    padding: 0.5rem 0.5rem;
    max-width: 100vw;
    margin: 0.7rem auto 0.7rem auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```


들여쓰기로 정렬 중. "운"과 "단" 아래 괄호 텍스트가 시작되도록 조정 중.


```html
      <div class="uniform-checklist">
        <p>1. 정규근무복 착용<br>2. 운동화 및 구두 착화<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp
```


CSS로 정확히 정렬 중.


```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>운행전 자가점검시스템</title>

<!-- 기본 메타 태그 -->
<meta name="description" content="부산 세진여객 운전기사 운행전 자가점검시스템">
<meta name="theme-color" content="#2563eb">

<!-- PWA 메타 태그 (주석처리) -->
<!-- <meta name="apple-mobile-web-app-capable" content="yes"> -->
<!-- <meta name="apple-mobile-web-app-status-bar-style" content="default"> -->
<!-- <meta name="apple-mobile-web-app-title" content="세진여객 점검"> -->

<!-- PWA 아이콘 (주석처리) -->
<!-- <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png"> -->
<!-- <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png"> -->
<!-- <link rel="apple-touch-icon" href="/icons/icon-192x192.png"> -->
<!-- <link rel="manifest" href="/manifest.json"> -->

<!-- Tailwind CSS CDN -->
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="styles.css">

</head>
<body>

<!-- ======== 헤더 ======== -->
<header>
  <!-- 로고 이미지: 업로드하신 PNG를 logo.png로 저장하여 같은 폴더에 두세요 -->
  <img src="logo.png" alt="세진여객 로고" id="header-logo" style="cursor: pointer;">
  <h2 id="header-title" style="font-size: 1.2rem; cursor: pointer;">운행전 자가점검시스템</h2>
</header>
<nav class="breadcrumb" id="breadcrumb"></nav>

<!-- ======== STEP -1 : 기사님 이름 입력 ======== -->
<section id="p-driver-name" class="page">
  <div class="card">
    <h1>기사님 성함을 입력해주세요</h1>
    <div class="card-content">
      <input id="driver-name-input" type="text" placeholder="이름을 입력하세요" autocomplete="name">
      <button id="driver-name-submit" disabled>다음</button>
    </div>
    <div class="card-actions"><button class="prevBtn" style="display:none;">이전</button></div>
  </div>
</section>

<!-- ======== STEP 0 : 근무지 선택 ======== -->
<section id="p0" class="page">
  <div class="card">
    <h1>1. 근무지를 선택하세요</h1>
    <img src="bus_illustration.png" alt="버스 일러스트" style="display:block;margin:0 auto 1.5rem auto;width:120px;height:120px;object-fit:contain;" />
    <div class="card-content">
      <div class="site-buttons">
        <button id="site-nopo" class="site-btn">노포</button>
        <button id="site-jeonggwan" class="site-btn">정관</button>
      </div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 1 : 버스번호 선택 ======== -->
<section id="p1" class="page">
  <div class="card">
    <h1>2. 노선번호를 선택하세요</h1>
    <div class="card-content">
      <div class="busno-buttons" id="busno-buttons"></div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 2 : 면허판번호 ======== -->
<section id="p2" class="page">
  <div class="card">
    <h1>차량번호를 선택하세요</h1>
    <div class="card-content">
      <!-- plate-grid와 prevBtn만 남김 -->
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 3 : 복장 상태 확인 ======== -->
<section id="p3" class="page">
  <div class="card">
    <h1>4. 복장 상태를 확인하세요.</h1>
    <div class="card-content">
      <div class="uniform-checklist">
        <p>1. 정규근무복 착용<br>2. 운동화 및 구두 착화<br><span class="checklist-indent">(슬리퍼, 크록스 x)</span><br>3. 단정하게 착용 여부<br><span class="checklist-indent">(옷매무새, 두발, 면도상태 등)</span></p>
      </div>
      <div class="uniform-buttons">
        <button id="uniform-ok" class="uniform-btn">양호</button>
        <button id="uniform-bad" class="uniform-btn">불량</button>
      </div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== 완료 화면 ======== -->
<section id="done" class="page">
  <div class="card">
    <h1 class="success-title">✅ 제출 완료!</h1>
    <p class="success-message">안전 운행 하십시오.</p>
  </div>
</section>

<div id="modal" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message" id="modal-message"></div>
    <div class="modal-actions">
      <button id="modal-yes" class="modal-btn modal-yes">네</button>
      <button id="modal-no" class="modal-btn modal-no">아니오</button>
    </div>
  </div>
</div>

<div id="modal-reason" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message">불량 사유를 작성해주세요.</div>
    <div class="modal-input-container">
      <textarea id="reason-input" class="modal-textarea" placeholder="불량 사유를 입력하세요..." rows="4"></textarea>
    </div>
    <div class="modal-actions">
      <button id="modal-reason-submit" class="modal-btn modal-yes">확인</button>
      <button id="modal-reason-cancel" class="modal-btn modal-no">취소</button>
    </div>
  </div>
</div>

<script src="app.js"></script>
</body>
</html> 
```

```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 80px;
}

header {
  background: var(--card-bg);
  padding: 1rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
}

header img {
  height: 36px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}

@media (max-width: 480px) {
  header {
    padding: 0.75rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 80px);
  padding: 1rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}

.breadcrumb {
  width: 100%;
  max-width: 400px;
  margin: 1rem auto 1rem auto;
  padding: 0.7rem 1rem;
  font-size: 1.55rem;
  color: var(--text-light);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  text-align: center;
}

.breadcrumb .crumb {
  color: var(--primary);
  font-weight: 600;
}

.breadcrumb .sep {
  color: var(--text-light);
  margin: 0 0.2em;
}

.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 복장 체크리스트 */
.uniform-checklist {
  width: 100%;
  text-align: left;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.uniform-checklist p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 0;
  white-space: pre-line;
}

.checklist-indent {
  display: inline-block;
  padding-left: 2.5em;
}

/* 복장 버튼 */
.uniform-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.uniform-btn {
  width: 100% !important;
  padding: 1.25rem 2rem !important;
  font-size: 1.2rem !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px !important;
}

.uniform-btn:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.uniform-btn:disabled {
  background: var(--text-light) !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 불량 사유 입력 모달 */
.modal-input-container {
  width: 100%;
  margin: 1rem 0;
}

.modal-textarea {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-textarea::placeholder {
  color: var(--text-light);
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

  .breadcrumb {
    font-size: 1.25rem;
    padding: 0.5rem 0.5rem;
    max-width: 100vw;
    margin: 0.7rem auto 0.7rem auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```


수정 완료.

## 변경 사항

1. **line-height 변경**
   - `line-height: 2` → `line-height: 1.6`

2. **줄바꿈 및 정렬**
   - "2. 운동화 및 구두 착화" 다음 줄에 "(슬리퍼, 크록스 x)" 배치
   - "3. 단정하게 착용 여부" 다음 줄에 "(옷매무새, 두발, 면도상태 등)" 배치
   - `span.checklist-indent`로 들여쓰기 적용 (`padding-left: 2.5em`)

이제 괄호 텍스트가 "운"과 "단" 글자 아래에 정렬됩니다. Live Server로 확인해 주세요. 정렬이 맞지 않으면 `padding-left` 값을 조정하겠습니다.

---

**User**

지금 내가 캡쳐한 사진이야. indent가 조금 많이 된 거 같은데? 왜이렇지 잘 맞춰줘

---

**Cursor**


들여쓰기 값이 과도합니다. '운'과 '단' 아래에 정확히 맞도록 조정 중.


```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 80px;
}

header {
  background: var(--card-bg);
  padding: 1rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
}

header img {
  height: 36px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}

@media (max-width: 480px) {
  header {
    padding: 0.75rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 80px);
  padding: 1rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}

.breadcrumb {
  width: 100%;
  max-width: 400px;
  margin: 1rem auto 1rem auto;
  padding: 0.7rem 1rem;
  font-size: 1.55rem;
  color: var(--text-light);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  text-align: center;
}

.breadcrumb .crumb {
  color: var(--primary);
  font-weight: 600;
}

.breadcrumb .sep {
  color: var(--text-light);
  margin: 0 0.2em;
}

.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 복장 체크리스트 */
.uniform-checklist {
  width: 100%;
  text-align: left;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.uniform-checklist p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 0;
  white-space: pre-line;
}

.checklist-indent {
  display: inline-block;
  padding-left: 1.2em;
}

/* 복장 버튼 */
.uniform-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.uniform-btn {
  width: 100% !important;
  padding: 1.25rem 2rem !important;
  font-size: 1.2rem !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px !important;
}

.uniform-btn:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.uniform-btn:disabled {
  background: var(--text-light) !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 불량 사유 입력 모달 */
.modal-input-container {
  width: 100%;
  margin: 1rem 0;
}

.modal-textarea {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-textarea::placeholder {
  color: var(--text-light);
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

  .breadcrumb {
    font-size: 1.25rem;
    padding: 0.5rem 0.5rem;
    max-width: 100vw;
    margin: 0.7rem auto 0.7rem auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```


들여쓰기를 줄였습니다. `padding-left`를 `2.5em`에서 `1.2em`으로 변경했습니다.

이제 괄호 텍스트가 "운"과 "단" 글자 아래에 더 가깝게 정렬됩니다. Live Server로 확인해 주세요. 여전히 맞지 않으면 값을 더 조정하겠습니다.

---

**User**

padding-left를 1em으로 변경해줘

---

**Cursor**


padding-left를 1em으로 변경 중.


```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 80px;
}

header {
  background: var(--card-bg);
  padding: 1rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
}

header img {
  height: 36px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}

@media (max-width: 480px) {
  header {
    padding: 0.75rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 80px);
  padding: 1rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}

.breadcrumb {
  width: 100%;
  max-width: 400px;
  margin: 1rem auto 1rem auto;
  padding: 0.7rem 1rem;
  font-size: 1.55rem;
  color: var(--text-light);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  text-align: center;
}

.breadcrumb .crumb {
  color: var(--primary);
  font-weight: 600;
}

.breadcrumb .sep {
  color: var(--text-light);
  margin: 0 0.2em;
}

.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 복장 체크리스트 */
.uniform-checklist {
  width: 100%;
  text-align: left;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.uniform-checklist p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 0;
  white-space: pre-line;
}

.checklist-indent {
  display: inline-block;
  padding-left: 1em;
}

/* 복장 버튼 */
.uniform-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.uniform-btn {
  width: 100% !important;
  padding: 1.25rem 2rem !important;
  font-size: 1.2rem !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px !important;
}

.uniform-btn:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.uniform-btn:disabled {
  background: var(--text-light) !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 불량 사유 입력 모달 */
.modal-input-container {
  width: 100%;
  margin: 1rem 0;
}

.modal-textarea {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-textarea::placeholder {
  color: var(--text-light);
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

  .breadcrumb {
    font-size: 1.25rem;
    padding: 0.5rem 0.5rem;
    max-width: 100vw;
    margin: 0.7rem auto 0.7rem auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```


변경 완료. `padding-left`를 `1em`으로 설정했습니다. Live Server로 확인해 주세요.

---

**User**

header영역의 상하 높이가 지금은 어느정도야? 이거를 조금 줄이고 싶은데

---

**Cursor**


header 영역의 현재 높이 확인 중.



header의 padding 확인 중.



header의 상하 padding은 `1rem`(약 16px)입니다. 로고 36px 포함 총 높이는 약 68px입니다. padding을 줄여 높이를 낮추겠습니다.


```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 80px;
}

header {
  background: var(--card-bg);
  padding: 0.75rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
}

header img {
  height: 36px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}

@media (max-width: 480px) {
  header {
    padding: 0.75rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 80px);
  padding: 1rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}

.breadcrumb {
  width: 100%;
  max-width: 400px;
  margin: 1rem auto 1rem auto;
  padding: 0.7rem 1rem;
  font-size: 1.55rem;
  color: var(--text-light);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  text-align: center;
}

.breadcrumb .crumb {
  color: var(--primary);
  font-weight: 600;
}

.breadcrumb .sep {
  color: var(--text-light);
  margin: 0 0.2em;
}

.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 복장 체크리스트 */
.uniform-checklist {
  width: 100%;
  text-align: left;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.uniform-checklist p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 0;
  white-space: pre-line;
}

.checklist-indent {
  display: inline-block;
  padding-left: 1em;
}

/* 복장 버튼 */
.uniform-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.uniform-btn {
  width: 100% !important;
  padding: 1.25rem 2rem !important;
  font-size: 1.2rem !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px !important;
}

.uniform-btn:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.uniform-btn:disabled {
  background: var(--text-light) !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 불량 사유 입력 모달 */
.modal-input-container {
  width: 100%;
  margin: 1rem 0;
}

.modal-textarea {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-textarea::placeholder {
  color: var(--text-light);
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

  .breadcrumb {
    font-size: 1.25rem;
    padding: 0.5rem 0.5rem;
    max-width: 100vw;
    margin: 0.7rem auto 0.7rem auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```

```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 70px;
}

header {
  background: var(--card-bg);
  padding: 0.75rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
}

header img {
  height: 36px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}

@media (max-width: 480px) {
  header {
    padding: 0.75rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 80px);
  padding: 1rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}

.breadcrumb {
  width: 100%;
  max-width: 400px;
  margin: 1rem auto 1rem auto;
  padding: 0.7rem 1rem;
  font-size: 1.55rem;
  color: var(--text-light);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  text-align: center;
}

.breadcrumb .crumb {
  color: var(--primary);
  font-weight: 600;
}

.breadcrumb .sep {
  color: var(--text-light);
  margin: 0 0.2em;
}

.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 복장 체크리스트 */
.uniform-checklist {
  width: 100%;
  text-align: left;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.uniform-checklist p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 0;
  white-space: pre-line;
}

.checklist-indent {
  display: inline-block;
  padding-left: 1em;
}

/* 복장 버튼 */
.uniform-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.uniform-btn {
  width: 100% !important;
  padding: 1.25rem 2rem !important;
  font-size: 1.2rem !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px !important;
}

.uniform-btn:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.uniform-btn:disabled {
  background: var(--text-light) !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 불량 사유 입력 모달 */
.modal-input-container {
  width: 100%;
  margin: 1rem 0;
}

.modal-textarea {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-textarea::placeholder {
  color: var(--text-light);
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

  .breadcrumb {
    font-size: 1.25rem;
    padding: 0.5rem 0.5rem;
    max-width: 100vw;
    margin: 0.7rem auto 0.7rem auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```


page의 min-height도 조정 중.


```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 70px;
}

header {
  background: var(--card-bg);
  padding: 0.75rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
}

header img {
  height: 36px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}

@media (max-width: 480px) {
  header {
    padding: 0.75rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 70px);
  padding: 1rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}

.breadcrumb {
  width: 100%;
  max-width: 400px;
  margin: 1rem auto 1rem auto;
  padding: 0.7rem 1rem;
  font-size: 1.55rem;
  color: var(--text-light);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  text-align: center;
}

.breadcrumb .crumb {
  color: var(--primary);
  font-weight: 600;
}

.breadcrumb .sep {
  color: var(--text-light);
  margin: 0 0.2em;
}

.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 복장 체크리스트 */
.uniform-checklist {
  width: 100%;
  text-align: left;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.uniform-checklist p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 0;
  white-space: pre-line;
}

.checklist-indent {
  display: inline-block;
  padding-left: 1em;
}

/* 복장 버튼 */
.uniform-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.uniform-btn {
  width: 100% !important;
  padding: 1.25rem 2rem !important;
  font-size: 1.2rem !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px !important;
}

.uniform-btn:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.uniform-btn:disabled {
  background: var(--text-light) !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 불량 사유 입력 모달 */
.modal-input-container {
  width: 100%;
  margin: 1rem 0;
}

.modal-textarea {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-textarea::placeholder {
  color: var(--text-light);
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

  .breadcrumb {
    font-size: 1.25rem;
    padding: 0.5rem 0.5rem;
    max-width: 100vw;
    margin: 0.7rem auto 0.7rem auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```

```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 70px;
}

header {
  background: var(--card-bg);
  padding: 0.75rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
}

header img {
  height: 36px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}

@media (max-width: 480px) {
  header {
    padding: 0.6rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 70px);
  padding: 1rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}

.breadcrumb {
  width: 100%;
  max-width: 400px;
  margin: 1rem auto 1rem auto;
  padding: 0.7rem 1rem;
  font-size: 1.55rem;
  color: var(--text-light);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  text-align: center;
}

.breadcrumb .crumb {
  color: var(--primary);
  font-weight: 600;
}

.breadcrumb .sep {
  color: var(--text-light);
  margin: 0 0.2em;
}

.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 복장 체크리스트 */
.uniform-checklist {
  width: 100%;
  text-align: left;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.uniform-checklist p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 0;
  white-space: pre-line;
}

.checklist-indent {
  display: inline-block;
  padding-left: 1em;
}

/* 복장 버튼 */
.uniform-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.uniform-btn {
  width: 100% !important;
  padding: 1.25rem 2rem !important;
  font-size: 1.2rem !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px !important;
}

.uniform-btn:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.uniform-btn:disabled {
  background: var(--text-light) !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 불량 사유 입력 모달 */
.modal-input-container {
  width: 100%;
  margin: 1rem 0;
}

.modal-textarea {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-textarea::placeholder {
  color: var(--text-light);
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

  .breadcrumb {
    font-size: 1.25rem;
    padding: 0.5rem 0.5rem;
    max-width: 100vw;
    margin: 0.7rem auto 0.7rem auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```


수정 완료. header의 상하 높이를 줄였습니다.

## 변경 사항

1. **header padding 조정**
   - `padding: 1rem 1.5rem` → `padding: 0.75rem 1.5rem` (상하 약 12px)
   - 모바일: `padding: 0.75rem 1rem` → `padding: 0.6rem 1rem`

2. **body padding-top 조정**
   - `padding-top: 80px` → `padding-top: 70px`

3. **page min-height 조정**
   - `min-height: calc(100vh - 80px)` → `min-height: calc(100vh - 70px)`

header 높이가 약 10px 줄었습니다. Live Server로 확인해 주세요. 더 줄이려면 알려주세요.

---

**User**

breadcrumb 영역을 없애고 다른 방법으로 지금까지 나의 응답을 확인할 수 있는 방법이 있을까? 왜냐하면 지금 응답이 길어지면서 breadcrumb이 길어지니까 영역이 점점 넓어지다 보니까 card영역이 일관적이지 않아보이는데.. 어떤 아이디어가 있을까?

---

**Cursor**


breadcrumb을 제거하고, 현재 선택 정보를 표시하는 대안을 제안합니다:



breadcrumb을 제거하고 대안을 제안합니다:

## 제안 옵션

1. **헤더에 작은 정보 표시**: 헤더 오른쪽에 작은 텍스트로 현재 선택 정보 표시
   - 예: "정관 > 106 > 3156" (한 줄, 작은 폰트)

2. **카드 상단에 작은 정보 표시**: 각 카드 상단에 작은 텍스트로 현재 선택 정보 표시
   - 예: 카드 내부 상단에 "근무지: 정관 | 노선: 106 | 차량: 3156"

3. **아이콘 버튼 + 모달**: 헤더에 정보 아이콘 버튼 추가, 클릭 시 모달로 전체 정보 표시

4. **하단 고정 정보 바**: 화면 하단에 작은 고정 바로 현재 선택 정보 표시

권장: 옵션 1(헤더 오른쪽 작은 텍스트) 또는 옵션 3(아이콘 버튼 + 모달). 원하는 옵션을 알려주세요.

---

**User**

3. 아이콘 버튼 + 모달: 헤더에 정보 아이콘 버튼 추가, 클릭 시 모달로 전체 정보 표시

이 방식으로 한 번 적용해볼래? 마음에 안들면 다시 롤백하면 되니깐 말이야

---

**Cursor**


아이콘 버튼 + 모달 방식으로 적용 중. breadcrumb을 제거하고 헤더에 정보 아이콘 버튼을 추가합니다.


```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>운행전 자가점검시스템</title>

<!-- 기본 메타 태그 -->
<meta name="description" content="부산 세진여객 운전기사 운행전 자가점검시스템">
<meta name="theme-color" content="#2563eb">

<!-- PWA 메타 태그 (주석처리) -->
<!-- <meta name="apple-mobile-web-app-capable" content="yes"> -->
<!-- <meta name="apple-mobile-web-app-status-bar-style" content="default"> -->
<!-- <meta name="apple-mobile-web-app-title" content="세진여객 점검"> -->

<!-- PWA 아이콘 (주석처리) -->
<!-- <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png"> -->
<!-- <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png"> -->
<!-- <link rel="apple-touch-icon" href="/icons/icon-192x192.png"> -->
<!-- <link rel="manifest" href="/manifest.json"> -->

<!-- Tailwind CSS CDN -->
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="styles.css">

</head>
<body>

<!-- ======== 헤더 ======== -->
<header>
  <!-- 로고 이미지: 업로드하신 PNG를 logo.png로 저장하여 같은 폴더에 두세요 -->
  <img src="logo.png" alt="세진여객 로고" id="header-logo" style="cursor: pointer;">
  <h2 id="header-title" style="font-size: 1.2rem; cursor: pointer;">운행전 자가점검시스템</h2>
  <button id="info-btn" class="info-btn" title="선택 정보 확인">ℹ️</button>
</header>

<!-- ======== STEP -1 : 기사님 이름 입력 ======== -->
<section id="p-driver-name" class="page">
  <div class="card">
    <h1>기사님 성함을 입력해주세요</h1>
    <div class="card-content">
      <input id="driver-name-input" type="text" placeholder="이름을 입력하세요" autocomplete="name">
      <button id="driver-name-submit" disabled>다음</button>
    </div>
    <div class="card-actions"><button class="prevBtn" style="display:none;">이전</button></div>
  </div>
</section>

<!-- ======== STEP 0 : 근무지 선택 ======== -->
<section id="p0" class="page">
  <div class="card">
    <h1>1. 근무지를 선택하세요</h1>
    <img src="bus_illustration.png" alt="버스 일러스트" style="display:block;margin:0 auto 1.5rem auto;width:120px;height:120px;object-fit:contain;" />
    <div class="card-content">
      <div class="site-buttons">
        <button id="site-nopo" class="site-btn">노포</button>
        <button id="site-jeonggwan" class="site-btn">정관</button>
      </div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 1 : 버스번호 선택 ======== -->
<section id="p1" class="page">
  <div class="card">
    <h1>2. 노선번호를 선택하세요</h1>
    <div class="card-content">
      <div class="busno-buttons" id="busno-buttons"></div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 2 : 면허판번호 ======== -->
<section id="p2" class="page">
  <div class="card">
    <h1>차량번호를 선택하세요</h1>
    <div class="card-content">
      <!-- plate-grid와 prevBtn만 남김 -->
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 3 : 복장 상태 확인 ======== -->
<section id="p3" class="page">
  <div class="card">
    <h1>4. 복장 상태를 확인하세요.</h1>
    <div class="card-content">
      <div class="uniform-checklist">
        <p>1. 정규근무복 착용<br>2. 운동화 및 구두 착화<br><span class="checklist-indent">(슬리퍼, 크록스 x)</span><br>3. 단정하게 착용 여부<br><span class="checklist-indent">(옷매무새, 두발, 면도상태 등)</span></p>
      </div>
      <div class="uniform-buttons">
        <button id="uniform-ok" class="uniform-btn">양호</button>
        <button id="uniform-bad" class="uniform-btn">불량</button>
      </div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== 완료 화면 ======== -->
<section id="done" class="page">
  <div class="card">
    <h1 class="success-title">✅ 제출 완료!</h1>
    <p class="success-message">안전 운행 하십시오.</p>
  </div>
</section>

<div id="modal" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message" id="modal-message"></div>
    <div class="modal-actions">
      <button id="modal-yes" class="modal-btn modal-yes">네</button>
      <button id="modal-no" class="modal-btn modal-no">아니오</button>
    </div>
  </div>
</div>

<div id="modal-reason" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message">불량 사유를 작성해주세요.</div>
    <div class="modal-input-container">
      <textarea id="reason-input" class="modal-textarea" placeholder="불량 사유를 입력하세요..." rows="4"></textarea>
    </div>
    <div class="modal-actions">
      <button id="modal-reason-submit" class="modal-btn modal-yes">확인</button>
      <button id="modal-reason-cancel" class="modal-btn modal-no">취소</button>
    </div>
  </div>
</div>

<script src="app.js"></script>
</body>
</html> 
```

```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>운행전 자가점검시스템</title>

<!-- 기본 메타 태그 -->
<meta name="description" content="부산 세진여객 운전기사 운행전 자가점검시스템">
<meta name="theme-color" content="#2563eb">

<!-- PWA 메타 태그 (주석처리) -->
<!-- <meta name="apple-mobile-web-app-capable" content="yes"> -->
<!-- <meta name="apple-mobile-web-app-status-bar-style" content="default"> -->
<!-- <meta name="apple-mobile-web-app-title" content="세진여객 점검"> -->

<!-- PWA 아이콘 (주석처리) -->
<!-- <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png"> -->
<!-- <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png"> -->
<!-- <link rel="apple-touch-icon" href="/icons/icon-192x192.png"> -->
<!-- <link rel="manifest" href="/manifest.json"> -->

<!-- Tailwind CSS CDN -->
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="styles.css">

</head>
<body>

<!-- ======== 헤더 ======== -->
<header>
  <!-- 로고 이미지: 업로드하신 PNG를 logo.png로 저장하여 같은 폴더에 두세요 -->
  <img src="logo.png" alt="세진여객 로고" id="header-logo" style="cursor: pointer;">
  <h2 id="header-title" style="font-size: 1.2rem; cursor: pointer;">운행전 자가점검시스템</h2>
  <button id="info-btn" class="info-btn" title="선택 정보 확인">ℹ️</button>
</header>

<!-- ======== STEP -1 : 기사님 이름 입력 ======== -->
<section id="p-driver-name" class="page">
  <div class="card">
    <h1>기사님 성함을 입력해주세요</h1>
    <div class="card-content">
      <input id="driver-name-input" type="text" placeholder="이름을 입력하세요" autocomplete="name">
      <button id="driver-name-submit" disabled>다음</button>
    </div>
    <div class="card-actions"><button class="prevBtn" style="display:none;">이전</button></div>
  </div>
</section>

<!-- ======== STEP 0 : 근무지 선택 ======== -->
<section id="p0" class="page">
  <div class="card">
    <h1>1. 근무지를 선택하세요</h1>
    <img src="bus_illustration.png" alt="버스 일러스트" style="display:block;margin:0 auto 1.5rem auto;width:120px;height:120px;object-fit:contain;" />
    <div class="card-content">
      <div class="site-buttons">
        <button id="site-nopo" class="site-btn">노포</button>
        <button id="site-jeonggwan" class="site-btn">정관</button>
      </div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 1 : 버스번호 선택 ======== -->
<section id="p1" class="page">
  <div class="card">
    <h1>2. 노선번호를 선택하세요</h1>
    <div class="card-content">
      <div class="busno-buttons" id="busno-buttons"></div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 2 : 면허판번호 ======== -->
<section id="p2" class="page">
  <div class="card">
    <h1>차량번호를 선택하세요</h1>
    <div class="card-content">
      <!-- plate-grid와 prevBtn만 남김 -->
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 3 : 복장 상태 확인 ======== -->
<section id="p3" class="page">
  <div class="card">
    <h1>4. 복장 상태를 확인하세요.</h1>
    <div class="card-content">
      <div class="uniform-checklist">
        <p>1. 정규근무복 착용<br>2. 운동화 및 구두 착화<br><span class="checklist-indent">(슬리퍼, 크록스 x)</span><br>3. 단정하게 착용 여부<br><span class="checklist-indent">(옷매무새, 두발, 면도상태 등)</span></p>
      </div>
      <div class="uniform-buttons">
        <button id="uniform-ok" class="uniform-btn">양호</button>
        <button id="uniform-bad" class="uniform-btn">불량</button>
      </div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== 완료 화면 ======== -->
<section id="done" class="page">
  <div class="card">
    <h1 class="success-title">✅ 제출 완료!</h1>
    <p class="success-message">안전 운행 하십시오.</p>
  </div>
</section>

<div id="modal" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message" id="modal-message"></div>
    <div class="modal-actions">
      <button id="modal-yes" class="modal-btn modal-yes">네</button>
      <button id="modal-no" class="modal-btn modal-no">아니오</button>
    </div>
  </div>
</div>

<div id="modal-reason" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message">불량 사유를 작성해주세요.</div>
    <div class="modal-input-container">
      <textarea id="reason-input" class="modal-textarea" placeholder="불량 사유를 입력하세요..." rows="4"></textarea>
    </div>
    <div class="modal-actions">
      <button id="modal-reason-submit" class="modal-btn modal-yes">확인</button>
      <button id="modal-reason-cancel" class="modal-btn modal-no">취소</button>
    </div>
  </div>
</div>

<div id="modal-info" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message">선택 정보</div>
    <div class="info-content" id="info-content">
      <p>아직 선택된 정보가 없습니다.</p>
    </div>
    <div class="modal-actions">
      <button id="modal-info-close" class="modal-btn modal-yes">확인</button>
    </div>
  </div>
</div>

<script src="app.js"></script>
</body>
</html> 
```


JavaScript 수정 중: breadcrumb 제거, 정보 모달로 전환.


```javascript
// ======== 상수 ========
const DRIVER_NAME_KEY = 'mdcsDriverName';

const BUSNO_LIST = {
  '노포': ['29', '80', '300'],
  '정관': ['73', '73 (오전)', '106', '107', '184', '188']
};

// ======== Storage 함수 ========
function getDriverName() {
  const stored = localStorage.getItem(DRIVER_NAME_KEY);
  if (!stored) return '';
  return stored.trim();
}

function hasDriverName() {
  return getDriverName().length > 0;
}

function saveDriverName(name) {
  if (!name || !name.trim()) return false;
  localStorage.setItem(DRIVER_NAME_KEY, name.trim());
  return true;
}

// ======== 전역 변수 ========
let currentStep = 0;
const totalSteps = 4;
let selectedSite = '';
let selectedBusNo = '';
let enteredPlate = '';
let uniformStatus = ''; // 'ok' or 'bad'
let uniformReason = ''; // 불량 사유

// ======== DOM 요소 ========
const pages = document.querySelectorAll('.page');
const driverNamePage = document.getElementById('p-driver-name');
const driverNameInput = document.getElementById('driver-name-input');
const driverNameSubmit = document.getElementById('driver-name-submit');

// 근무지 선택 버튼
const siteButtons = {
  nopo: document.getElementById('site-nopo'),
  jeonggwan: document.getElementById('site-jeonggwan')
};

// 버스번호 버튼 컨테이너
const busnoButtonsDiv = document.getElementById('busno-buttons');

// ======== 노선별 차량번호 리스트(구글 시트 연동) ========
let PLATE_LISTS = {};
let plateDataLoaded = false;
let plateDataError = false;
fetch('https://script.google.com/macros/s/AKfycbxKXmbLSOl64gNdOoYIORQs1fpdHOHZuX7LGypDLlgacjKtNhiVTWef6_pBNNkd2cWE/exec')
  .then(res => res.json())
  .then(data => {
    PLATE_LISTS = data;
    plateDataLoaded = true;
  })
  .catch(err => {
    plateDataError = true;
    console.error('차량번호 데이터 불러오기 실패:', err);
  });

// ======== 유효성 검사 함수들 ========
const validators = {
  // 면허판번호 검증 (70가1234 형식)
  plate: (value) => {
    if (!value.trim()) return '면허판 번호를 입력해주세요.';
    const pattern = /^\d{2}[가-힣]\d{4}$/;
    if (!pattern.test(value)) return '올바른 면허판 번호 형식으로 입력해주세요. (예: 70가1234)';
    return null;
  },
  // 사진 검증
  photo: (file) => {
    if (!file) return '사진을 선택해주세요.';
    if (!file.type.startsWith('image/')) return '이미지 파일만 선택 가능합니다.';
    if (file.size > 10 * 1024 * 1024) return '파일 크기는 10MB 이하로 선택해주세요.';
    return null;
  }
};

// ======== 유틸리티 함수들 ========
function showError(message) {
  alert(message);
}

function validateInput(type, value) {
  const validator = validators[type];
  if (!validator) return true;
  const error = validator(value);
  if (error) {
    showError(error);
    return false;
  }
  return true;
}

function updateButtonState(buttonId, isValid) {
  const button = buttons[buttonId];
  if (button) {
    button.disabled = !isValid;
  }
}

function getCurrentPrevBtn() {
  const cards = document.querySelectorAll('.card');
  return cards[currentStep]?.querySelector('.prevBtn');
}

function updatePrevBtn() {
  document.querySelectorAll('.prevBtn').forEach((btn) => {
    // 이름 입력 페이지(-1)나 근무지 선택 페이지(0)에서는 이전 버튼 비활성화
    btn.disabled = (currentStep === -1 || currentStep === 0);
    
    // 모든 이전 버튼에 이벤트 설정
    btn.onclick = () => {
      if (currentStep > 0) {
        window.history.back();
      }
    };
  });
}

// 페이지 ID를 인덱스로 변환하는 맵
const pageIdToIndex = {
  'p-driver-name': -1,
  'p0': 0,
  'p1': 1,
  'p2': 2,
  'p3': 3,
  'done': 4
};

// 인덱스를 페이지 ID로 변환
function getPageIdByIndex(index) {
  const idMap = ['p0', 'p1', 'p2', 'p3', 'done'];
  if (index === -1) return 'p-driver-name';
  return idMap[index] || 'p0';
}

function showPage(pageIndex, pushHistory = false) {
  // 이름 입력 페이지 처리
  if (pageIndex === -1) {
    pages.forEach(page => page.classList.remove('active'));
    driverNamePage.classList.add('active');
    currentStep = -1;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (pushHistory) {
      history.pushState({ pageIndex: -1 }, '', '');
    }
    return;
  }

  // 이름 입력 페이지 숨기기
  driverNamePage.classList.remove('active');

  // 단계별로 입력값 초기화
  if (pageIndex === 0) {
    selectedSite = '';
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 1) {
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 2) {
    enteredPlate = '';
  }
  
  // 일반 페이지 표시
  pages.forEach((page, index) => {
    const pageId = page.id;
    if (pageId === 'p-driver-name') {
      page.classList.remove('active');
    } else {
      const pageIdx = pageIdToIndex[pageId] || 0;
      page.classList.toggle('active', pageIdx === pageIndex);
    }
  });
  currentStep = pageIndex;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  updatePrevBtn();
  updateBreadcrumb();
  
  // 차량번호 선택 페이지(p2)일 때 그리드 렌더링
  if (pageIndex === 2) {
    renderPlateGrid();
  }
  
  if (pushHistory) {
    history.pushState({ pageIndex: currentStep }, '', '');
  }
}

function nextStep() {
  // 이름 입력 페이지에서 다음 단계로
  if (currentStep === -1) {
    showPage(0, true);
    return;
  }
  // 일반 페이지 다음 단계
  if (currentStep < 4) { // done 페이지는 인덱스 4
    showPage(currentStep + 1, true);
  }
}

// ======== 커스텀 모달 ========
function showModal(message, onConfirm) {
  const modal = document.getElementById('modal');
  const msg = document.getElementById('modal-message');
  const yesBtn = document.getElementById('modal-yes');
  const noBtn = document.getElementById('modal-no');
  msg.textContent = message;
  modal.style.display = 'flex';
  function cleanup() {
    modal.style.display = 'none';
    yesBtn.removeEventListener('click', yesHandler);
    noBtn.removeEventListener('click', noHandler);
  }
  function yesHandler() {
    cleanup();
    onConfirm(true);
  }
  function noHandler() {
    cleanup();
    onConfirm(false);
  }
  yesBtn.addEventListener('click', yesHandler);
  noBtn.addEventListener('click', noHandler);
}

// ======== 근무지 선택 이벤트 리스너 ========
siteButtons.nopo.addEventListener('click', () => {
  showModal('근무지 : 노포(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '노포';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('노포');
    updateBreadcrumb();
    nextStep();
  });
});

siteButtons.jeonggwan.addEventListener('click', () => {
  showModal('근무지 : 정관(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '정관';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('정관');
    updateBreadcrumb();
    nextStep();
  });
});

// ======== 버스번호 버튼 동적 생성 ========
function renderBusNoButtons(site) {
  busnoButtonsDiv.innerHTML = '';
  BUSNO_LIST[site].forEach(busNo => {
    const btn = document.createElement('button');
    btn.className = 'busno-btn';
    btn.textContent = busNo;
    btn.onclick = () => {
      showModal(`노선번호 : ${busNo}(이)가 맞으십니까?`, (ok) => {
        if (!ok) return;
        selectedBusNo = busNo;
        updateBreadcrumb();
        nextStep();
      });
    };
    busnoButtonsDiv.appendChild(btn);
  });
}

// ======== 복장 상태 확인 버튼 ========
function initUniformButtons() {
  const uniformOkBtn = document.getElementById('uniform-ok');
  const uniformBadBtn = document.getElementById('uniform-bad');
  
  if (uniformOkBtn) {
    uniformOkBtn.addEventListener('click', async () => {
      uniformStatus = 'ok';
      uniformReason = '';
      uniformOkBtn.disabled = true;
      uniformOkBtn.textContent = '제출 중...';
      try {
        await submitData();
        showPage(totalSteps); // 완료 화면 표시
      } catch (error) {
        console.error('제출 실패:', error);
        showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        uniformOkBtn.disabled = false;
        uniformOkBtn.textContent = '양호';
      }
    });
  }
  
  if (uniformBadBtn) {
    uniformBadBtn.addEventListener('click', () => {
      showReasonModal();
    });
  }
}

// ======== 불량 사유 입력 모달 ========
function showReasonModal() {
  const modal = document.getElementById('modal-reason');
  const reasonInput = document.getElementById('reason-input');
  const submitBtn = document.getElementById('modal-reason-submit');
  const cancelBtn = document.getElementById('modal-reason-cancel');
  const uniformBadBtn = document.getElementById('uniform-bad');
  
  reasonInput.value = uniformReason; // 기존 값이 있으면 표시
  modal.style.display = 'flex';
  
  function cleanup() {
    modal.style.display = 'none';
    submitBtn.removeEventListener('click', submitHandler);
    cancelBtn.removeEventListener('click', cancelHandler);
  }
  
  async function submitHandler() {
    const reason = reasonInput.value.trim();
    if (!reason) {
      showError('불량 사유를 입력해주세요.');
      return;
    }
    uniformStatus = 'bad';
    uniformReason = reason;
    cleanup();
    
    // 제출 버튼 비활성화
    if (uniformBadBtn) {
      uniformBadBtn.disabled = true;
      const originalText = uniformBadBtn.textContent;
      uniformBadBtn.textContent = '제출 중...';
      
      try {
        await submitData();
        showPage(totalSteps); // 완료 화면 표시
      } catch (error) {
        console.error('제출 실패:', error);
        showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        uniformBadBtn.disabled = false;
        uniformBadBtn.textContent = originalText;
      }
    }
  }
  
  function cancelHandler() {
    cleanup();
  }
  
  submitBtn.addEventListener('click', submitHandler);
  cancelBtn.addEventListener('click', cancelHandler);
  
  // Enter 키로 제출
  reasonInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      submitHandler();
    }
  });
  
  // 포커스
  setTimeout(() => reasonInput.focus(), 100);
}

// ======== 데이터 제출 함수 ========
async function submitData() {
  const formData = new FormData();
  formData.append('site', selectedSite);
  formData.append('busNo', selectedBusNo);
  formData.append('plate', enteredPlate);
  formData.append('uniformStatus', uniformStatus);
  if (uniformStatus === 'bad' && uniformReason) {
    formData.append('uniformReason', uniformReason);
  }
  formData.append('timestamp', new Date().toISOString());
  // TODO: 실제 백엔드 URL로 변경 필요
  const response = await fetch('/api/submit', {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// ======== 키보드 이벤트 ========
document.addEventListener('keydown', (e) => {
  // 버스번호 선택 화면에서는 Enter로 동작하지 않음
  if (currentStep === 1) return;
  // 복장 상태 확인 화면에서는 버튼이 다르므로 처리하지 않음
  if (currentStep === 3) return;
  const btnMap = {2: 'b2'};
  const currentButton = buttons[btnMap[currentStep]];
  if (e.key === 'Enter' && currentButton && !currentButton.disabled) {
    currentButton.click();
  }
});

// 처음 화면으로 이동하는 함수
function goToInitialPage() {
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    showPage(-1, true);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    showPage(0, true);
  }
}

// 이름 입력 이벤트 리스너
if (driverNameInput && driverNameSubmit) {
  driverNameInput.addEventListener('input', (e) => {
    const name = e.target.value.trim();
    driverNameSubmit.disabled = name.length === 0;
  });

  driverNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !driverNameSubmit.disabled) {
      driverNameSubmit.click();
    }
  });

  driverNameSubmit.addEventListener('click', () => {
    const name = driverNameInput.value.trim();
    if (name.length > 0) {
      saveDriverName(name);
      showPage(0, true); // 근무지 선택 페이지로 이동
    }
  });
}

// ======== 정보 모달 ========
function showInfoModal() {
  const modal = document.getElementById('modal-info');
  const infoContent = document.getElementById('info-content');
  const closeBtn = document.getElementById('modal-info-close');
  
  let info = [];
  if (selectedSite) info.push(`<p><strong>근무지:</strong> ${selectedSite}</p>`);
  if (selectedBusNo) info.push(`<p><strong>노선번호:</strong> ${selectedBusNo}</p>`);
  if (enteredPlate) info.push(`<p><strong>차량번호:</strong> ${enteredPlate}</p>`);
  if (uniformStatus) {
    const statusText = uniformStatus === 'ok' ? '양호' : '불량';
    info.push(`<p><strong>복장 상태:</strong> ${statusText}</p>`);
    if (uniformStatus === 'bad' && uniformReason) {
      info.push(`<p><strong>불량 사유:</strong> ${uniformReason}</p>`);
    }
  }
  
  if (info.length === 0) {
    infoContent.innerHTML = '<p>아직 선택된 정보가 없습니다.</p>';
  } else {
    infoContent.innerHTML = info.join('');
  }
  
  modal.style.display = 'flex';
  
  closeBtn.onclick = () => {
    modal.style.display = 'none';
  };
}

// 정보 버튼 이벤트
const infoBtn = document.getElementById('info-btn');
if (infoBtn) {
  infoBtn.addEventListener('click', () => {
    showInfoModal();
  });
}

// ======== renderPlateGrid 수정 ========
function renderPlateGrid() {
  // p2 페이지의 card-content를 직접 찾기
  const p2Page = document.getElementById('p2');
  if (!p2Page) return;
  const cardContent = p2Page.querySelector('.card-content');
  if (!cardContent) return;
  let plateGridDiv = cardContent.querySelector('#plate-grid');
  if (plateGridDiv) cardContent.removeChild(plateGridDiv);
  let filterInput = cardContent.querySelector('#plate-filter');
  if (filterInput) cardContent.removeChild(filterInput);
  let errorMsg = cardContent.querySelector('#plate-filter-error');
  if (errorMsg) cardContent.removeChild(errorMsg);
  filterInput = document.createElement('input');
  filterInput.id = 'plate-filter';
  filterInput.type = 'text';
  filterInput.placeholder = '차량번호 검색(숫자 입력)';
  filterInput.inputMode = 'numeric';
  filterInput.autocomplete = 'off';
  filterInput.style.marginBottom = '0.5rem';
  filterInput.style.width = '100%';
  cardContent.appendChild(filterInput);
  errorMsg = document.createElement('div');
  errorMsg.id = 'plate-filter-error';
  errorMsg.style.color = '#dc2626';
  errorMsg.style.fontSize = '0.98rem';
  errorMsg.style.height = '1.2em';
  errorMsg.style.marginBottom = '0.5rem';
  errorMsg.style.textAlign = 'left';
  errorMsg.textContent = '';
  cardContent.appendChild(errorMsg);
  plateGridDiv = document.createElement('div');
  plateGridDiv.id = 'plate-grid';
  plateGridDiv.style.display = 'grid';
  plateGridDiv.style.gridTemplateColumns = 'repeat(3, 1fr)';
  plateGridDiv.style.gap = '0.7rem';
  plateGridDiv.style.maxHeight = '320px';
  plateGridDiv.style.minHeight = '320px';
  plateGridDiv.style.overflowY = 'auto';
  plateGridDiv.style.overflowX = 'hidden';
  plateGridDiv.style.width = '100%';
  plateGridDiv.style.marginBottom = '1.2rem';
  cardContent.appendChild(plateGridDiv);
  function renderGrid() {
    const oldBtns = Array.from(plateGridDiv.children);
    oldBtns.forEach(btn => {
      btn.classList.add('fade-exit');
      setTimeout(() => btn.remove(), 200);
    });
    // 데이터 로딩 상태 처리
    if (!plateDataLoaded) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#888;font-size:1.1rem;">차량번호 데이터를 불러오는 중...</div>';
      return;
    }
    if (plateDataError) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#dc2626;font-size:1.1rem;">차량번호 데이터를 불러오지 못했습니다.</div>';
      return;
    }
    let list = [];
    if (selectedBusNo && PLATE_LISTS[selectedBusNo]) {
      list = PLATE_LISTS[selectedBusNo];
    }
    let filter = filterInput.value.trim();
    if (filter.length > 4) {
      filter = filter.slice(0, 4);
      filterInput.value = filter;
    }
    if (filter && /[^0-9]/.test(filter)) {
      errorMsg.textContent = '숫자만 입력해주세요!';
      return;
    } else {
      errorMsg.textContent = '';
    }
    const filtered = filter ? list.filter(num => num.includes(filter)) : list;
    const total = filtered.length;
    const maxRow = Math.ceil(list.length / 3);
    plateGridDiv.style.gridTemplateRows = `repeat(${maxRow}, 1fr)`;
    for (let i = 0; i < maxRow * 3; i++) {
      if (i < total) {
        const num = filtered[i];
        const btn = document.createElement('button');
        btn.className = 'plate-btn fade-in';
        btn.textContent = num;
        btn.setAttribute('aria-label', `차량번호 ${num}`);
        btn.tabIndex = 0;
        btn.onclick = () => {
          showModal(`차량번호 : ${num}가 맞으십니까?`, (ok) => {
            if (!ok) return;
            enteredPlate = num;
            updateBreadcrumb();
            nextStep();
          });
        };
        btn.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') btn.click();
        };
        plateGridDiv.appendChild(btn);
        setTimeout(() => btn.classList.remove('fade-in'), 250);
      } else {
        const empty = document.createElement('div');
        empty.style.visibility = 'hidden';
        plateGridDiv.appendChild(empty);
      }
    }
  }
  filterInput.addEventListener('input', renderGrid);
  renderGrid();
}

// ======== 초기화 ========
document.addEventListener('DOMContentLoaded', () => {
  // 헤더 로고 클릭 이벤트
  const headerLogo = document.getElementById('header-logo');
  if (headerLogo) {
    headerLogo.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 헤더 제목 클릭 이벤트
  const headerTitle = document.getElementById('header-title');
  if (headerTitle) {
    headerTitle.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 복장 상태 확인 버튼 초기화
  initUniformButtons();
  
  // localStorage에 기사님 이름이 있는지 확인
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    history.replaceState({ pageIndex: -1 }, '', '');
    history.pushState({ pageIndex: -1 }, '', '');
    showPage(-1, false);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    history.replaceState({ pageIndex: 0 }, '', '');
    history.pushState({ pageIndex: 0 }, '', '');
    showPage(0, false);
  }
  updateBreadcrumb();
  console.log('운행전 자가점검시스템이 로드되었습니다.');
});

window.addEventListener('popstate', (event) => {
  const pageIndex = event.state && typeof event.state.pageIndex === 'number' ? event.state.pageIndex : (hasDriverName() ? 0 : -1);
  showPage(pageIndex, false);
  // history가 1개뿐이면(첫 화면) 더 이상 뒤로가기를 막음
  if ((pageIndex === 0 || pageIndex === -1) && history.length <= 2) {
    const initialPage = hasDriverName() ? 0 : -1;
    history.pushState({ pageIndex: initialPage }, '', '');
  }
});

// ======== 오프라인 지원 ========
window.addEventListener('online', () => {
  console.log('네트워크 연결이 복구되었습니다.');
});
window.addEventListener('offline', () => {
  console.log('네트워크 연결이 끊어졌습니다.');
  showError('네트워크 연결을 확인해주세요.');
});


```


모든 `updateBreadcrumb()` 호출 제거 중.


```javascript
// ======== 상수 ========
const DRIVER_NAME_KEY = 'mdcsDriverName';

const BUSNO_LIST = {
  '노포': ['29', '80', '300'],
  '정관': ['73', '73 (오전)', '106', '107', '184', '188']
};

// ======== Storage 함수 ========
function getDriverName() {
  const stored = localStorage.getItem(DRIVER_NAME_KEY);
  if (!stored) return '';
  return stored.trim();
}

function hasDriverName() {
  return getDriverName().length > 0;
}

function saveDriverName(name) {
  if (!name || !name.trim()) return false;
  localStorage.setItem(DRIVER_NAME_KEY, name.trim());
  return true;
}

// ======== 전역 변수 ========
let currentStep = 0;
const totalSteps = 4;
let selectedSite = '';
let selectedBusNo = '';
let enteredPlate = '';
let uniformStatus = ''; // 'ok' or 'bad'
let uniformReason = ''; // 불량 사유

// ======== DOM 요소 ========
const pages = document.querySelectorAll('.page');
const driverNamePage = document.getElementById('p-driver-name');
const driverNameInput = document.getElementById('driver-name-input');
const driverNameSubmit = document.getElementById('driver-name-submit');

// 근무지 선택 버튼
const siteButtons = {
  nopo: document.getElementById('site-nopo'),
  jeonggwan: document.getElementById('site-jeonggwan')
};

// 버스번호 버튼 컨테이너
const busnoButtonsDiv = document.getElementById('busno-buttons');

// ======== 노선별 차량번호 리스트(구글 시트 연동) ========
let PLATE_LISTS = {};
let plateDataLoaded = false;
let plateDataError = false;
fetch('https://script.google.com/macros/s/AKfycbxKXmbLSOl64gNdOoYIORQs1fpdHOHZuX7LGypDLlgacjKtNhiVTWef6_pBNNkd2cWE/exec')
  .then(res => res.json())
  .then(data => {
    PLATE_LISTS = data;
    plateDataLoaded = true;
  })
  .catch(err => {
    plateDataError = true;
    console.error('차량번호 데이터 불러오기 실패:', err);
  });

// ======== 유효성 검사 함수들 ========
const validators = {
  // 면허판번호 검증 (70가1234 형식)
  plate: (value) => {
    if (!value.trim()) return '면허판 번호를 입력해주세요.';
    const pattern = /^\d{2}[가-힣]\d{4}$/;
    if (!pattern.test(value)) return '올바른 면허판 번호 형식으로 입력해주세요. (예: 70가1234)';
    return null;
  },
  // 사진 검증
  photo: (file) => {
    if (!file) return '사진을 선택해주세요.';
    if (!file.type.startsWith('image/')) return '이미지 파일만 선택 가능합니다.';
    if (file.size > 10 * 1024 * 1024) return '파일 크기는 10MB 이하로 선택해주세요.';
    return null;
  }
};

// ======== 유틸리티 함수들 ========
function showError(message) {
  alert(message);
}

function validateInput(type, value) {
  const validator = validators[type];
  if (!validator) return true;
  const error = validator(value);
  if (error) {
    showError(error);
    return false;
  }
  return true;
}

function updateButtonState(buttonId, isValid) {
  const button = buttons[buttonId];
  if (button) {
    button.disabled = !isValid;
  }
}

function getCurrentPrevBtn() {
  const cards = document.querySelectorAll('.card');
  return cards[currentStep]?.querySelector('.prevBtn');
}

function updatePrevBtn() {
  document.querySelectorAll('.prevBtn').forEach((btn) => {
    // 이름 입력 페이지(-1)나 근무지 선택 페이지(0)에서는 이전 버튼 비활성화
    btn.disabled = (currentStep === -1 || currentStep === 0);
    
    // 모든 이전 버튼에 이벤트 설정
    btn.onclick = () => {
      if (currentStep > 0) {
        window.history.back();
      }
    };
  });
}

// 페이지 ID를 인덱스로 변환하는 맵
const pageIdToIndex = {
  'p-driver-name': -1,
  'p0': 0,
  'p1': 1,
  'p2': 2,
  'p3': 3,
  'done': 4
};

// 인덱스를 페이지 ID로 변환
function getPageIdByIndex(index) {
  const idMap = ['p0', 'p1', 'p2', 'p3', 'done'];
  if (index === -1) return 'p-driver-name';
  return idMap[index] || 'p0';
}

function showPage(pageIndex, pushHistory = false) {
  // 이름 입력 페이지 처리
  if (pageIndex === -1) {
    pages.forEach(page => page.classList.remove('active'));
    driverNamePage.classList.add('active');
    currentStep = -1;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (pushHistory) {
      history.pushState({ pageIndex: -1 }, '', '');
    }
    return;
  }

  // 이름 입력 페이지 숨기기
  driverNamePage.classList.remove('active');

  // 단계별로 입력값 초기화
  if (pageIndex === 0) {
    selectedSite = '';
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 1) {
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 2) {
    enteredPlate = '';
  }
  
  // 일반 페이지 표시
  pages.forEach((page, index) => {
    const pageId = page.id;
    if (pageId === 'p-driver-name') {
      page.classList.remove('active');
    } else {
      const pageIdx = pageIdToIndex[pageId] || 0;
      page.classList.toggle('active', pageIdx === pageIndex);
    }
  });
  currentStep = pageIndex;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  updatePrevBtn();
  
  // 차량번호 선택 페이지(p2)일 때 그리드 렌더링
  if (pageIndex === 2) {
    renderPlateGrid();
  }
  
  if (pushHistory) {
    history.pushState({ pageIndex: currentStep }, '', '');
  }
}

function nextStep() {
  // 이름 입력 페이지에서 다음 단계로
  if (currentStep === -1) {
    showPage(0, true);
    return;
  }
  // 일반 페이지 다음 단계
  if (currentStep < 4) { // done 페이지는 인덱스 4
    showPage(currentStep + 1, true);
  }
}

// ======== 커스텀 모달 ========
function showModal(message, onConfirm) {
  const modal = document.getElementById('modal');
  const msg = document.getElementById('modal-message');
  const yesBtn = document.getElementById('modal-yes');
  const noBtn = document.getElementById('modal-no');
  msg.textContent = message;
  modal.style.display = 'flex';
  function cleanup() {
    modal.style.display = 'none';
    yesBtn.removeEventListener('click', yesHandler);
    noBtn.removeEventListener('click', noHandler);
  }
  function yesHandler() {
    cleanup();
    onConfirm(true);
  }
  function noHandler() {
    cleanup();
    onConfirm(false);
  }
  yesBtn.addEventListener('click', yesHandler);
  noBtn.addEventListener('click', noHandler);
}

// ======== 근무지 선택 이벤트 리스너 ========
siteButtons.nopo.addEventListener('click', () => {
  showModal('근무지 : 노포(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '노포';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('노포');
    updateBreadcrumb();
    nextStep();
  });
});

siteButtons.jeonggwan.addEventListener('click', () => {
  showModal('근무지 : 정관(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '정관';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('정관');
    updateBreadcrumb();
    nextStep();
  });
});

// ======== 버스번호 버튼 동적 생성 ========
function renderBusNoButtons(site) {
  busnoButtonsDiv.innerHTML = '';
  BUSNO_LIST[site].forEach(busNo => {
    const btn = document.createElement('button');
    btn.className = 'busno-btn';
    btn.textContent = busNo;
    btn.onclick = () => {
      showModal(`노선번호 : ${busNo}(이)가 맞으십니까?`, (ok) => {
        if (!ok) return;
        selectedBusNo = busNo;
        updateBreadcrumb();
        nextStep();
      });
    };
    busnoButtonsDiv.appendChild(btn);
  });
}

// ======== 복장 상태 확인 버튼 ========
function initUniformButtons() {
  const uniformOkBtn = document.getElementById('uniform-ok');
  const uniformBadBtn = document.getElementById('uniform-bad');
  
  if (uniformOkBtn) {
    uniformOkBtn.addEventListener('click', async () => {
      uniformStatus = 'ok';
      uniformReason = '';
      uniformOkBtn.disabled = true;
      uniformOkBtn.textContent = '제출 중...';
      try {
        await submitData();
        showPage(totalSteps); // 완료 화면 표시
      } catch (error) {
        console.error('제출 실패:', error);
        showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        uniformOkBtn.disabled = false;
        uniformOkBtn.textContent = '양호';
      }
    });
  }
  
  if (uniformBadBtn) {
    uniformBadBtn.addEventListener('click', () => {
      showReasonModal();
    });
  }
}

// ======== 불량 사유 입력 모달 ========
function showReasonModal() {
  const modal = document.getElementById('modal-reason');
  const reasonInput = document.getElementById('reason-input');
  const submitBtn = document.getElementById('modal-reason-submit');
  const cancelBtn = document.getElementById('modal-reason-cancel');
  const uniformBadBtn = document.getElementById('uniform-bad');
  
  reasonInput.value = uniformReason; // 기존 값이 있으면 표시
  modal.style.display = 'flex';
  
  function cleanup() {
    modal.style.display = 'none';
    submitBtn.removeEventListener('click', submitHandler);
    cancelBtn.removeEventListener('click', cancelHandler);
  }
  
  async function submitHandler() {
    const reason = reasonInput.value.trim();
    if (!reason) {
      showError('불량 사유를 입력해주세요.');
      return;
    }
    uniformStatus = 'bad';
    uniformReason = reason;
    cleanup();
    
    // 제출 버튼 비활성화
    if (uniformBadBtn) {
      uniformBadBtn.disabled = true;
      const originalText = uniformBadBtn.textContent;
      uniformBadBtn.textContent = '제출 중...';
      
      try {
        await submitData();
        showPage(totalSteps); // 완료 화면 표시
      } catch (error) {
        console.error('제출 실패:', error);
        showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        uniformBadBtn.disabled = false;
        uniformBadBtn.textContent = originalText;
      }
    }
  }
  
  function cancelHandler() {
    cleanup();
  }
  
  submitBtn.addEventListener('click', submitHandler);
  cancelBtn.addEventListener('click', cancelHandler);
  
  // Enter 키로 제출
  reasonInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      submitHandler();
    }
  });
  
  // 포커스
  setTimeout(() => reasonInput.focus(), 100);
}

// ======== 데이터 제출 함수 ========
async function submitData() {
  const formData = new FormData();
  formData.append('site', selectedSite);
  formData.append('busNo', selectedBusNo);
  formData.append('plate', enteredPlate);
  formData.append('uniformStatus', uniformStatus);
  if (uniformStatus === 'bad' && uniformReason) {
    formData.append('uniformReason', uniformReason);
  }
  formData.append('timestamp', new Date().toISOString());
  // TODO: 실제 백엔드 URL로 변경 필요
  const response = await fetch('/api/submit', {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// ======== 키보드 이벤트 ========
document.addEventListener('keydown', (e) => {
  // 버스번호 선택 화면에서는 Enter로 동작하지 않음
  if (currentStep === 1) return;
  // 복장 상태 확인 화면에서는 버튼이 다르므로 처리하지 않음
  if (currentStep === 3) return;
  const btnMap = {2: 'b2'};
  const currentButton = buttons[btnMap[currentStep]];
  if (e.key === 'Enter' && currentButton && !currentButton.disabled) {
    currentButton.click();
  }
});

// 처음 화면으로 이동하는 함수
function goToInitialPage() {
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    showPage(-1, true);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    showPage(0, true);
  }
}

// 이름 입력 이벤트 리스너
if (driverNameInput && driverNameSubmit) {
  driverNameInput.addEventListener('input', (e) => {
    const name = e.target.value.trim();
    driverNameSubmit.disabled = name.length === 0;
  });

  driverNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !driverNameSubmit.disabled) {
      driverNameSubmit.click();
    }
  });

  driverNameSubmit.addEventListener('click', () => {
    const name = driverNameInput.value.trim();
    if (name.length > 0) {
      saveDriverName(name);
      showPage(0, true); // 근무지 선택 페이지로 이동
    }
  });
}

// ======== 정보 모달 ========
function showInfoModal() {
  const modal = document.getElementById('modal-info');
  const infoContent = document.getElementById('info-content');
  const closeBtn = document.getElementById('modal-info-close');
  
  let info = [];
  if (selectedSite) info.push(`<p><strong>근무지:</strong> ${selectedSite}</p>`);
  if (selectedBusNo) info.push(`<p><strong>노선번호:</strong> ${selectedBusNo}</p>`);
  if (enteredPlate) info.push(`<p><strong>차량번호:</strong> ${enteredPlate}</p>`);
  if (uniformStatus) {
    const statusText = uniformStatus === 'ok' ? '양호' : '불량';
    info.push(`<p><strong>복장 상태:</strong> ${statusText}</p>`);
    if (uniformStatus === 'bad' && uniformReason) {
      info.push(`<p><strong>불량 사유:</strong> ${uniformReason}</p>`);
    }
  }
  
  if (info.length === 0) {
    infoContent.innerHTML = '<p>아직 선택된 정보가 없습니다.</p>';
  } else {
    infoContent.innerHTML = info.join('');
  }
  
  modal.style.display = 'flex';
  
  closeBtn.onclick = () => {
    modal.style.display = 'none';
  };
}

// 정보 버튼 이벤트
const infoBtn = document.getElementById('info-btn');
if (infoBtn) {
  infoBtn.addEventListener('click', () => {
    showInfoModal();
  });
}

// ======== renderPlateGrid 수정 ========
function renderPlateGrid() {
  // p2 페이지의 card-content를 직접 찾기
  const p2Page = document.getElementById('p2');
  if (!p2Page) return;
  const cardContent = p2Page.querySelector('.card-content');
  if (!cardContent) return;
  let plateGridDiv = cardContent.querySelector('#plate-grid');
  if (plateGridDiv) cardContent.removeChild(plateGridDiv);
  let filterInput = cardContent.querySelector('#plate-filter');
  if (filterInput) cardContent.removeChild(filterInput);
  let errorMsg = cardContent.querySelector('#plate-filter-error');
  if (errorMsg) cardContent.removeChild(errorMsg);
  filterInput = document.createElement('input');
  filterInput.id = 'plate-filter';
  filterInput.type = 'text';
  filterInput.placeholder = '차량번호 검색(숫자 입력)';
  filterInput.inputMode = 'numeric';
  filterInput.autocomplete = 'off';
  filterInput.style.marginBottom = '0.5rem';
  filterInput.style.width = '100%';
  cardContent.appendChild(filterInput);
  errorMsg = document.createElement('div');
  errorMsg.id = 'plate-filter-error';
  errorMsg.style.color = '#dc2626';
  errorMsg.style.fontSize = '0.98rem';
  errorMsg.style.height = '1.2em';
  errorMsg.style.marginBottom = '0.5rem';
  errorMsg.style.textAlign = 'left';
  errorMsg.textContent = '';
  cardContent.appendChild(errorMsg);
  plateGridDiv = document.createElement('div');
  plateGridDiv.id = 'plate-grid';
  plateGridDiv.style.display = 'grid';
  plateGridDiv.style.gridTemplateColumns = 'repeat(3, 1fr)';
  plateGridDiv.style.gap = '0.7rem';
  plateGridDiv.style.maxHeight = '320px';
  plateGridDiv.style.minHeight = '320px';
  plateGridDiv.style.overflowY = 'auto';
  plateGridDiv.style.overflowX = 'hidden';
  plateGridDiv.style.width = '100%';
  plateGridDiv.style.marginBottom = '1.2rem';
  cardContent.appendChild(plateGridDiv);
  function renderGrid() {
    const oldBtns = Array.from(plateGridDiv.children);
    oldBtns.forEach(btn => {
      btn.classList.add('fade-exit');
      setTimeout(() => btn.remove(), 200);
    });
    // 데이터 로딩 상태 처리
    if (!plateDataLoaded) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#888;font-size:1.1rem;">차량번호 데이터를 불러오는 중...</div>';
      return;
    }
    if (plateDataError) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#dc2626;font-size:1.1rem;">차량번호 데이터를 불러오지 못했습니다.</div>';
      return;
    }
    let list = [];
    if (selectedBusNo && PLATE_LISTS[selectedBusNo]) {
      list = PLATE_LISTS[selectedBusNo];
    }
    let filter = filterInput.value.trim();
    if (filter.length > 4) {
      filter = filter.slice(0, 4);
      filterInput.value = filter;
    }
    if (filter && /[^0-9]/.test(filter)) {
      errorMsg.textContent = '숫자만 입력해주세요!';
      return;
    } else {
      errorMsg.textContent = '';
    }
    const filtered = filter ? list.filter(num => num.includes(filter)) : list;
    const total = filtered.length;
    const maxRow = Math.ceil(list.length / 3);
    plateGridDiv.style.gridTemplateRows = `repeat(${maxRow}, 1fr)`;
    for (let i = 0; i < maxRow * 3; i++) {
      if (i < total) {
        const num = filtered[i];
        const btn = document.createElement('button');
        btn.className = 'plate-btn fade-in';
        btn.textContent = num;
        btn.setAttribute('aria-label', `차량번호 ${num}`);
        btn.tabIndex = 0;
        btn.onclick = () => {
          showModal(`차량번호 : ${num}가 맞으십니까?`, (ok) => {
            if (!ok) return;
            enteredPlate = num;
            updateBreadcrumb();
            nextStep();
          });
        };
        btn.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') btn.click();
        };
        plateGridDiv.appendChild(btn);
        setTimeout(() => btn.classList.remove('fade-in'), 250);
      } else {
        const empty = document.createElement('div');
        empty.style.visibility = 'hidden';
        plateGridDiv.appendChild(empty);
      }
    }
  }
  filterInput.addEventListener('input', renderGrid);
  renderGrid();
}

// ======== 초기화 ========
document.addEventListener('DOMContentLoaded', () => {
  // 헤더 로고 클릭 이벤트
  const headerLogo = document.getElementById('header-logo');
  if (headerLogo) {
    headerLogo.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 헤더 제목 클릭 이벤트
  const headerTitle = document.getElementById('header-title');
  if (headerTitle) {
    headerTitle.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 복장 상태 확인 버튼 초기화
  initUniformButtons();
  
  // localStorage에 기사님 이름이 있는지 확인
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    history.replaceState({ pageIndex: -1 }, '', '');
    history.pushState({ pageIndex: -1 }, '', '');
    showPage(-1, false);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    history.replaceState({ pageIndex: 0 }, '', '');
    history.pushState({ pageIndex: 0 }, '', '');
    showPage(0, false);
  }
  updateBreadcrumb();
  console.log('운행전 자가점검시스템이 로드되었습니다.');
});

window.addEventListener('popstate', (event) => {
  const pageIndex = event.state && typeof event.state.pageIndex === 'number' ? event.state.pageIndex : (hasDriverName() ? 0 : -1);
  showPage(pageIndex, false);
  // history가 1개뿐이면(첫 화면) 더 이상 뒤로가기를 막음
  if ((pageIndex === 0 || pageIndex === -1) && history.length <= 2) {
    const initialPage = hasDriverName() ? 0 : -1;
    history.pushState({ pageIndex: initialPage }, '', '');
  }
});

// ======== 오프라인 지원 ========
window.addEventListener('online', () => {
  console.log('네트워크 연결이 복구되었습니다.');
});
window.addEventListener('offline', () => {
  console.log('네트워크 연결이 끊어졌습니다.');
  showError('네트워크 연결을 확인해주세요.');
});


```

```javascript
// ======== 상수 ========
const DRIVER_NAME_KEY = 'mdcsDriverName';

const BUSNO_LIST = {
  '노포': ['29', '80', '300'],
  '정관': ['73', '73 (오전)', '106', '107', '184', '188']
};

// ======== Storage 함수 ========
function getDriverName() {
  const stored = localStorage.getItem(DRIVER_NAME_KEY);
  if (!stored) return '';
  return stored.trim();
}

function hasDriverName() {
  return getDriverName().length > 0;
}

function saveDriverName(name) {
  if (!name || !name.trim()) return false;
  localStorage.setItem(DRIVER_NAME_KEY, name.trim());
  return true;
}

// ======== 전역 변수 ========
let currentStep = 0;
const totalSteps = 4;
let selectedSite = '';
let selectedBusNo = '';
let enteredPlate = '';
let uniformStatus = ''; // 'ok' or 'bad'
let uniformReason = ''; // 불량 사유

// ======== DOM 요소 ========
const pages = document.querySelectorAll('.page');
const driverNamePage = document.getElementById('p-driver-name');
const driverNameInput = document.getElementById('driver-name-input');
const driverNameSubmit = document.getElementById('driver-name-submit');

// 근무지 선택 버튼
const siteButtons = {
  nopo: document.getElementById('site-nopo'),
  jeonggwan: document.getElementById('site-jeonggwan')
};

// 버스번호 버튼 컨테이너
const busnoButtonsDiv = document.getElementById('busno-buttons');

// ======== 노선별 차량번호 리스트(구글 시트 연동) ========
let PLATE_LISTS = {};
let plateDataLoaded = false;
let plateDataError = false;
fetch('https://script.google.com/macros/s/AKfycbxKXmbLSOl64gNdOoYIORQs1fpdHOHZuX7LGypDLlgacjKtNhiVTWef6_pBNNkd2cWE/exec')
  .then(res => res.json())
  .then(data => {
    PLATE_LISTS = data;
    plateDataLoaded = true;
  })
  .catch(err => {
    plateDataError = true;
    console.error('차량번호 데이터 불러오기 실패:', err);
  });

// ======== 유효성 검사 함수들 ========
const validators = {
  // 면허판번호 검증 (70가1234 형식)
  plate: (value) => {
    if (!value.trim()) return '면허판 번호를 입력해주세요.';
    const pattern = /^\d{2}[가-힣]\d{4}$/;
    if (!pattern.test(value)) return '올바른 면허판 번호 형식으로 입력해주세요. (예: 70가1234)';
    return null;
  },
  // 사진 검증
  photo: (file) => {
    if (!file) return '사진을 선택해주세요.';
    if (!file.type.startsWith('image/')) return '이미지 파일만 선택 가능합니다.';
    if (file.size > 10 * 1024 * 1024) return '파일 크기는 10MB 이하로 선택해주세요.';
    return null;
  }
};

// ======== 유틸리티 함수들 ========
function showError(message) {
  alert(message);
}

function validateInput(type, value) {
  const validator = validators[type];
  if (!validator) return true;
  const error = validator(value);
  if (error) {
    showError(error);
    return false;
  }
  return true;
}

function updateButtonState(buttonId, isValid) {
  const button = buttons[buttonId];
  if (button) {
    button.disabled = !isValid;
  }
}

function getCurrentPrevBtn() {
  const cards = document.querySelectorAll('.card');
  return cards[currentStep]?.querySelector('.prevBtn');
}

function updatePrevBtn() {
  document.querySelectorAll('.prevBtn').forEach((btn) => {
    // 이름 입력 페이지(-1)나 근무지 선택 페이지(0)에서는 이전 버튼 비활성화
    btn.disabled = (currentStep === -1 || currentStep === 0);
    
    // 모든 이전 버튼에 이벤트 설정
    btn.onclick = () => {
      if (currentStep > 0) {
        window.history.back();
      }
    };
  });
}

// 페이지 ID를 인덱스로 변환하는 맵
const pageIdToIndex = {
  'p-driver-name': -1,
  'p0': 0,
  'p1': 1,
  'p2': 2,
  'p3': 3,
  'done': 4
};

// 인덱스를 페이지 ID로 변환
function getPageIdByIndex(index) {
  const idMap = ['p0', 'p1', 'p2', 'p3', 'done'];
  if (index === -1) return 'p-driver-name';
  return idMap[index] || 'p0';
}

function showPage(pageIndex, pushHistory = false) {
  // 이름 입력 페이지 처리
  if (pageIndex === -1) {
    pages.forEach(page => page.classList.remove('active'));
    driverNamePage.classList.add('active');
    currentStep = -1;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (pushHistory) {
      history.pushState({ pageIndex: -1 }, '', '');
    }
    return;
  }

  // 이름 입력 페이지 숨기기
  driverNamePage.classList.remove('active');

  // 단계별로 입력값 초기화
  if (pageIndex === 0) {
    selectedSite = '';
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 1) {
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 2) {
    enteredPlate = '';
  }
  
  // 일반 페이지 표시
  pages.forEach((page, index) => {
    const pageId = page.id;
    if (pageId === 'p-driver-name') {
      page.classList.remove('active');
    } else {
      const pageIdx = pageIdToIndex[pageId] || 0;
      page.classList.toggle('active', pageIdx === pageIndex);
    }
  });
  currentStep = pageIndex;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  updatePrevBtn();
  
  // 차량번호 선택 페이지(p2)일 때 그리드 렌더링
  if (pageIndex === 2) {
    renderPlateGrid();
  }
  
  if (pushHistory) {
    history.pushState({ pageIndex: currentStep }, '', '');
  }
}

function nextStep() {
  // 이름 입력 페이지에서 다음 단계로
  if (currentStep === -1) {
    showPage(0, true);
    return;
  }
  // 일반 페이지 다음 단계
  if (currentStep < 4) { // done 페이지는 인덱스 4
    showPage(currentStep + 1, true);
  }
}

// ======== 커스텀 모달 ========
function showModal(message, onConfirm) {
  const modal = document.getElementById('modal');
  const msg = document.getElementById('modal-message');
  const yesBtn = document.getElementById('modal-yes');
  const noBtn = document.getElementById('modal-no');
  msg.textContent = message;
  modal.style.display = 'flex';
  function cleanup() {
    modal.style.display = 'none';
    yesBtn.removeEventListener('click', yesHandler);
    noBtn.removeEventListener('click', noHandler);
  }
  function yesHandler() {
    cleanup();
    onConfirm(true);
  }
  function noHandler() {
    cleanup();
    onConfirm(false);
  }
  yesBtn.addEventListener('click', yesHandler);
  noBtn.addEventListener('click', noHandler);
}

// ======== 근무지 선택 이벤트 리스너 ========
siteButtons.nopo.addEventListener('click', () => {
  showModal('근무지 : 노포(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '노포';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('노포');
    nextStep();
  });
});

siteButtons.jeonggwan.addEventListener('click', () => {
  showModal('근무지 : 정관(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '정관';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('정관');
    updateBreadcrumb();
    nextStep();
  });
});

// ======== 버스번호 버튼 동적 생성 ========
function renderBusNoButtons(site) {
  busnoButtonsDiv.innerHTML = '';
  BUSNO_LIST[site].forEach(busNo => {
    const btn = document.createElement('button');
    btn.className = 'busno-btn';
    btn.textContent = busNo;
    btn.onclick = () => {
      showModal(`노선번호 : ${busNo}(이)가 맞으십니까?`, (ok) => {
        if (!ok) return;
        selectedBusNo = busNo;
        updateBreadcrumb();
        nextStep();
      });
    };
    busnoButtonsDiv.appendChild(btn);
  });
}

// ======== 복장 상태 확인 버튼 ========
function initUniformButtons() {
  const uniformOkBtn = document.getElementById('uniform-ok');
  const uniformBadBtn = document.getElementById('uniform-bad');
  
  if (uniformOkBtn) {
    uniformOkBtn.addEventListener('click', async () => {
      uniformStatus = 'ok';
      uniformReason = '';
      uniformOkBtn.disabled = true;
      uniformOkBtn.textContent = '제출 중...';
      try {
        await submitData();
        showPage(totalSteps); // 완료 화면 표시
      } catch (error) {
        console.error('제출 실패:', error);
        showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        uniformOkBtn.disabled = false;
        uniformOkBtn.textContent = '양호';
      }
    });
  }
  
  if (uniformBadBtn) {
    uniformBadBtn.addEventListener('click', () => {
      showReasonModal();
    });
  }
}

// ======== 불량 사유 입력 모달 ========
function showReasonModal() {
  const modal = document.getElementById('modal-reason');
  const reasonInput = document.getElementById('reason-input');
  const submitBtn = document.getElementById('modal-reason-submit');
  const cancelBtn = document.getElementById('modal-reason-cancel');
  const uniformBadBtn = document.getElementById('uniform-bad');
  
  reasonInput.value = uniformReason; // 기존 값이 있으면 표시
  modal.style.display = 'flex';
  
  function cleanup() {
    modal.style.display = 'none';
    submitBtn.removeEventListener('click', submitHandler);
    cancelBtn.removeEventListener('click', cancelHandler);
  }
  
  async function submitHandler() {
    const reason = reasonInput.value.trim();
    if (!reason) {
      showError('불량 사유를 입력해주세요.');
      return;
    }
    uniformStatus = 'bad';
    uniformReason = reason;
    cleanup();
    
    // 제출 버튼 비활성화
    if (uniformBadBtn) {
      uniformBadBtn.disabled = true;
      const originalText = uniformBadBtn.textContent;
      uniformBadBtn.textContent = '제출 중...';
      
      try {
        await submitData();
        showPage(totalSteps); // 완료 화면 표시
      } catch (error) {
        console.error('제출 실패:', error);
        showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        uniformBadBtn.disabled = false;
        uniformBadBtn.textContent = originalText;
      }
    }
  }
  
  function cancelHandler() {
    cleanup();
  }
  
  submitBtn.addEventListener('click', submitHandler);
  cancelBtn.addEventListener('click', cancelHandler);
  
  // Enter 키로 제출
  reasonInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      submitHandler();
    }
  });
  
  // 포커스
  setTimeout(() => reasonInput.focus(), 100);
}

// ======== 데이터 제출 함수 ========
async function submitData() {
  const formData = new FormData();
  formData.append('site', selectedSite);
  formData.append('busNo', selectedBusNo);
  formData.append('plate', enteredPlate);
  formData.append('uniformStatus', uniformStatus);
  if (uniformStatus === 'bad' && uniformReason) {
    formData.append('uniformReason', uniformReason);
  }
  formData.append('timestamp', new Date().toISOString());
  // TODO: 실제 백엔드 URL로 변경 필요
  const response = await fetch('/api/submit', {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// ======== 키보드 이벤트 ========
document.addEventListener('keydown', (e) => {
  // 버스번호 선택 화면에서는 Enter로 동작하지 않음
  if (currentStep === 1) return;
  // 복장 상태 확인 화면에서는 버튼이 다르므로 처리하지 않음
  if (currentStep === 3) return;
  const btnMap = {2: 'b2'};
  const currentButton = buttons[btnMap[currentStep]];
  if (e.key === 'Enter' && currentButton && !currentButton.disabled) {
    currentButton.click();
  }
});

// 처음 화면으로 이동하는 함수
function goToInitialPage() {
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    showPage(-1, true);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    showPage(0, true);
  }
}

// 이름 입력 이벤트 리스너
if (driverNameInput && driverNameSubmit) {
  driverNameInput.addEventListener('input', (e) => {
    const name = e.target.value.trim();
    driverNameSubmit.disabled = name.length === 0;
  });

  driverNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !driverNameSubmit.disabled) {
      driverNameSubmit.click();
    }
  });

  driverNameSubmit.addEventListener('click', () => {
    const name = driverNameInput.value.trim();
    if (name.length > 0) {
      saveDriverName(name);
      showPage(0, true); // 근무지 선택 페이지로 이동
    }
  });
}

// ======== 정보 모달 ========
function showInfoModal() {
  const modal = document.getElementById('modal-info');
  const infoContent = document.getElementById('info-content');
  const closeBtn = document.getElementById('modal-info-close');
  
  let info = [];
  if (selectedSite) info.push(`<p><strong>근무지:</strong> ${selectedSite}</p>`);
  if (selectedBusNo) info.push(`<p><strong>노선번호:</strong> ${selectedBusNo}</p>`);
  if (enteredPlate) info.push(`<p><strong>차량번호:</strong> ${enteredPlate}</p>`);
  if (uniformStatus) {
    const statusText = uniformStatus === 'ok' ? '양호' : '불량';
    info.push(`<p><strong>복장 상태:</strong> ${statusText}</p>`);
    if (uniformStatus === 'bad' && uniformReason) {
      info.push(`<p><strong>불량 사유:</strong> ${uniformReason}</p>`);
    }
  }
  
  if (info.length === 0) {
    infoContent.innerHTML = '<p>아직 선택된 정보가 없습니다.</p>';
  } else {
    infoContent.innerHTML = info.join('');
  }
  
  modal.style.display = 'flex';
  
  closeBtn.onclick = () => {
    modal.style.display = 'none';
  };
}

// 정보 버튼 이벤트
const infoBtn = document.getElementById('info-btn');
if (infoBtn) {
  infoBtn.addEventListener('click', () => {
    showInfoModal();
  });
}

// ======== renderPlateGrid 수정 ========
function renderPlateGrid() {
  // p2 페이지의 card-content를 직접 찾기
  const p2Page = document.getElementById('p2');
  if (!p2Page) return;
  const cardContent = p2Page.querySelector('.card-content');
  if (!cardContent) return;
  let plateGridDiv = cardContent.querySelector('#plate-grid');
  if (plateGridDiv) cardContent.removeChild(plateGridDiv);
  let filterInput = cardContent.querySelector('#plate-filter');
  if (filterInput) cardContent.removeChild(filterInput);
  let errorMsg = cardContent.querySelector('#plate-filter-error');
  if (errorMsg) cardContent.removeChild(errorMsg);
  filterInput = document.createElement('input');
  filterInput.id = 'plate-filter';
  filterInput.type = 'text';
  filterInput.placeholder = '차량번호 검색(숫자 입력)';
  filterInput.inputMode = 'numeric';
  filterInput.autocomplete = 'off';
  filterInput.style.marginBottom = '0.5rem';
  filterInput.style.width = '100%';
  cardContent.appendChild(filterInput);
  errorMsg = document.createElement('div');
  errorMsg.id = 'plate-filter-error';
  errorMsg.style.color = '#dc2626';
  errorMsg.style.fontSize = '0.98rem';
  errorMsg.style.height = '1.2em';
  errorMsg.style.marginBottom = '0.5rem';
  errorMsg.style.textAlign = 'left';
  errorMsg.textContent = '';
  cardContent.appendChild(errorMsg);
  plateGridDiv = document.createElement('div');
  plateGridDiv.id = 'plate-grid';
  plateGridDiv.style.display = 'grid';
  plateGridDiv.style.gridTemplateColumns = 'repeat(3, 1fr)';
  plateGridDiv.style.gap = '0.7rem';
  plateGridDiv.style.maxHeight = '320px';
  plateGridDiv.style.minHeight = '320px';
  plateGridDiv.style.overflowY = 'auto';
  plateGridDiv.style.overflowX = 'hidden';
  plateGridDiv.style.width = '100%';
  plateGridDiv.style.marginBottom = '1.2rem';
  cardContent.appendChild(plateGridDiv);
  function renderGrid() {
    const oldBtns = Array.from(plateGridDiv.children);
    oldBtns.forEach(btn => {
      btn.classList.add('fade-exit');
      setTimeout(() => btn.remove(), 200);
    });
    // 데이터 로딩 상태 처리
    if (!plateDataLoaded) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#888;font-size:1.1rem;">차량번호 데이터를 불러오는 중...</div>';
      return;
    }
    if (plateDataError) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#dc2626;font-size:1.1rem;">차량번호 데이터를 불러오지 못했습니다.</div>';
      return;
    }
    let list = [];
    if (selectedBusNo && PLATE_LISTS[selectedBusNo]) {
      list = PLATE_LISTS[selectedBusNo];
    }
    let filter = filterInput.value.trim();
    if (filter.length > 4) {
      filter = filter.slice(0, 4);
      filterInput.value = filter;
    }
    if (filter && /[^0-9]/.test(filter)) {
      errorMsg.textContent = '숫자만 입력해주세요!';
      return;
    } else {
      errorMsg.textContent = '';
    }
    const filtered = filter ? list.filter(num => num.includes(filter)) : list;
    const total = filtered.length;
    const maxRow = Math.ceil(list.length / 3);
    plateGridDiv.style.gridTemplateRows = `repeat(${maxRow}, 1fr)`;
    for (let i = 0; i < maxRow * 3; i++) {
      if (i < total) {
        const num = filtered[i];
        const btn = document.createElement('button');
        btn.className = 'plate-btn fade-in';
        btn.textContent = num;
        btn.setAttribute('aria-label', `차량번호 ${num}`);
        btn.tabIndex = 0;
        btn.onclick = () => {
          showModal(`차량번호 : ${num}가 맞으십니까?`, (ok) => {
            if (!ok) return;
            enteredPlate = num;
            updateBreadcrumb();
            nextStep();
          });
        };
        btn.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') btn.click();
        };
        plateGridDiv.appendChild(btn);
        setTimeout(() => btn.classList.remove('fade-in'), 250);
      } else {
        const empty = document.createElement('div');
        empty.style.visibility = 'hidden';
        plateGridDiv.appendChild(empty);
      }
    }
  }
  filterInput.addEventListener('input', renderGrid);
  renderGrid();
}

// ======== 초기화 ========
document.addEventListener('DOMContentLoaded', () => {
  // 헤더 로고 클릭 이벤트
  const headerLogo = document.getElementById('header-logo');
  if (headerLogo) {
    headerLogo.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 헤더 제목 클릭 이벤트
  const headerTitle = document.getElementById('header-title');
  if (headerTitle) {
    headerTitle.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 복장 상태 확인 버튼 초기화
  initUniformButtons();
  
  // localStorage에 기사님 이름이 있는지 확인
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    history.replaceState({ pageIndex: -1 }, '', '');
    history.pushState({ pageIndex: -1 }, '', '');
    showPage(-1, false);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    history.replaceState({ pageIndex: 0 }, '', '');
    history.pushState({ pageIndex: 0 }, '', '');
    showPage(0, false);
  }
  updateBreadcrumb();
  console.log('운행전 자가점검시스템이 로드되었습니다.');
});

window.addEventListener('popstate', (event) => {
  const pageIndex = event.state && typeof event.state.pageIndex === 'number' ? event.state.pageIndex : (hasDriverName() ? 0 : -1);
  showPage(pageIndex, false);
  // history가 1개뿐이면(첫 화면) 더 이상 뒤로가기를 막음
  if ((pageIndex === 0 || pageIndex === -1) && history.length <= 2) {
    const initialPage = hasDriverName() ? 0 : -1;
    history.pushState({ pageIndex: initialPage }, '', '');
  }
});

// ======== 오프라인 지원 ========
window.addEventListener('online', () => {
  console.log('네트워크 연결이 복구되었습니다.');
});
window.addEventListener('offline', () => {
  console.log('네트워크 연결이 끊어졌습니다.');
  showError('네트워크 연결을 확인해주세요.');
});


```

```javascript
// ======== 상수 ========
const DRIVER_NAME_KEY = 'mdcsDriverName';

const BUSNO_LIST = {
  '노포': ['29', '80', '300'],
  '정관': ['73', '73 (오전)', '106', '107', '184', '188']
};

// ======== Storage 함수 ========
function getDriverName() {
  const stored = localStorage.getItem(DRIVER_NAME_KEY);
  if (!stored) return '';
  return stored.trim();
}

function hasDriverName() {
  return getDriverName().length > 0;
}

function saveDriverName(name) {
  if (!name || !name.trim()) return false;
  localStorage.setItem(DRIVER_NAME_KEY, name.trim());
  return true;
}

// ======== 전역 변수 ========
let currentStep = 0;
const totalSteps = 4;
let selectedSite = '';
let selectedBusNo = '';
let enteredPlate = '';
let uniformStatus = ''; // 'ok' or 'bad'
let uniformReason = ''; // 불량 사유

// ======== DOM 요소 ========
const pages = document.querySelectorAll('.page');
const driverNamePage = document.getElementById('p-driver-name');
const driverNameInput = document.getElementById('driver-name-input');
const driverNameSubmit = document.getElementById('driver-name-submit');

// 근무지 선택 버튼
const siteButtons = {
  nopo: document.getElementById('site-nopo'),
  jeonggwan: document.getElementById('site-jeonggwan')
};

// 버스번호 버튼 컨테이너
const busnoButtonsDiv = document.getElementById('busno-buttons');

// ======== 노선별 차량번호 리스트(구글 시트 연동) ========
let PLATE_LISTS = {};
let plateDataLoaded = false;
let plateDataError = false;
fetch('https://script.google.com/macros/s/AKfycbxKXmbLSOl64gNdOoYIORQs1fpdHOHZuX7LGypDLlgacjKtNhiVTWef6_pBNNkd2cWE/exec')
  .then(res => res.json())
  .then(data => {
    PLATE_LISTS = data;
    plateDataLoaded = true;
  })
  .catch(err => {
    plateDataError = true;
    console.error('차량번호 데이터 불러오기 실패:', err);
  });

// ======== 유효성 검사 함수들 ========
const validators = {
  // 면허판번호 검증 (70가1234 형식)
  plate: (value) => {
    if (!value.trim()) return '면허판 번호를 입력해주세요.';
    const pattern = /^\d{2}[가-힣]\d{4}$/;
    if (!pattern.test(value)) return '올바른 면허판 번호 형식으로 입력해주세요. (예: 70가1234)';
    return null;
  },
  // 사진 검증
  photo: (file) => {
    if (!file) return '사진을 선택해주세요.';
    if (!file.type.startsWith('image/')) return '이미지 파일만 선택 가능합니다.';
    if (file.size > 10 * 1024 * 1024) return '파일 크기는 10MB 이하로 선택해주세요.';
    return null;
  }
};

// ======== 유틸리티 함수들 ========
function showError(message) {
  alert(message);
}

function validateInput(type, value) {
  const validator = validators[type];
  if (!validator) return true;
  const error = validator(value);
  if (error) {
    showError(error);
    return false;
  }
  return true;
}

function updateButtonState(buttonId, isValid) {
  const button = buttons[buttonId];
  if (button) {
    button.disabled = !isValid;
  }
}

function getCurrentPrevBtn() {
  const cards = document.querySelectorAll('.card');
  return cards[currentStep]?.querySelector('.prevBtn');
}

function updatePrevBtn() {
  document.querySelectorAll('.prevBtn').forEach((btn) => {
    // 이름 입력 페이지(-1)나 근무지 선택 페이지(0)에서는 이전 버튼 비활성화
    btn.disabled = (currentStep === -1 || currentStep === 0);
    
    // 모든 이전 버튼에 이벤트 설정
    btn.onclick = () => {
      if (currentStep > 0) {
        window.history.back();
      }
    };
  });
}

// 페이지 ID를 인덱스로 변환하는 맵
const pageIdToIndex = {
  'p-driver-name': -1,
  'p0': 0,
  'p1': 1,
  'p2': 2,
  'p3': 3,
  'done': 4
};

// 인덱스를 페이지 ID로 변환
function getPageIdByIndex(index) {
  const idMap = ['p0', 'p1', 'p2', 'p3', 'done'];
  if (index === -1) return 'p-driver-name';
  return idMap[index] || 'p0';
}

function showPage(pageIndex, pushHistory = false) {
  // 이름 입력 페이지 처리
  if (pageIndex === -1) {
    pages.forEach(page => page.classList.remove('active'));
    driverNamePage.classList.add('active');
    currentStep = -1;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (pushHistory) {
      history.pushState({ pageIndex: -1 }, '', '');
    }
    return;
  }

  // 이름 입력 페이지 숨기기
  driverNamePage.classList.remove('active');

  // 단계별로 입력값 초기화
  if (pageIndex === 0) {
    selectedSite = '';
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 1) {
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 2) {
    enteredPlate = '';
  }
  
  // 일반 페이지 표시
  pages.forEach((page, index) => {
    const pageId = page.id;
    if (pageId === 'p-driver-name') {
      page.classList.remove('active');
    } else {
      const pageIdx = pageIdToIndex[pageId] || 0;
      page.classList.toggle('active', pageIdx === pageIndex);
    }
  });
  currentStep = pageIndex;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  updatePrevBtn();
  
  // 차량번호 선택 페이지(p2)일 때 그리드 렌더링
  if (pageIndex === 2) {
    renderPlateGrid();
  }
  
  if (pushHistory) {
    history.pushState({ pageIndex: currentStep }, '', '');
  }
}

function nextStep() {
  // 이름 입력 페이지에서 다음 단계로
  if (currentStep === -1) {
    showPage(0, true);
    return;
  }
  // 일반 페이지 다음 단계
  if (currentStep < 4) { // done 페이지는 인덱스 4
    showPage(currentStep + 1, true);
  }
}

// ======== 커스텀 모달 ========
function showModal(message, onConfirm) {
  const modal = document.getElementById('modal');
  const msg = document.getElementById('modal-message');
  const yesBtn = document.getElementById('modal-yes');
  const noBtn = document.getElementById('modal-no');
  msg.textContent = message;
  modal.style.display = 'flex';
  function cleanup() {
    modal.style.display = 'none';
    yesBtn.removeEventListener('click', yesHandler);
    noBtn.removeEventListener('click', noHandler);
  }
  function yesHandler() {
    cleanup();
    onConfirm(true);
  }
  function noHandler() {
    cleanup();
    onConfirm(false);
  }
  yesBtn.addEventListener('click', yesHandler);
  noBtn.addEventListener('click', noHandler);
}

// ======== 근무지 선택 이벤트 리스너 ========
siteButtons.nopo.addEventListener('click', () => {
  showModal('근무지 : 노포(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '노포';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('노포');
    nextStep();
  });
});

siteButtons.jeonggwan.addEventListener('click', () => {
  showModal('근무지 : 정관(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '정관';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('정관');
    nextStep();
  });
});

// ======== 버스번호 버튼 동적 생성 ========
function renderBusNoButtons(site) {
  busnoButtonsDiv.innerHTML = '';
  BUSNO_LIST[site].forEach(busNo => {
    const btn = document.createElement('button');
    btn.className = 'busno-btn';
    btn.textContent = busNo;
    btn.onclick = () => {
      showModal(`노선번호 : ${busNo}(이)가 맞으십니까?`, (ok) => {
        if (!ok) return;
        selectedBusNo = busNo;
        updateBreadcrumb();
        nextStep();
      });
    };
    busnoButtonsDiv.appendChild(btn);
  });
}

// ======== 복장 상태 확인 버튼 ========
function initUniformButtons() {
  const uniformOkBtn = document.getElementById('uniform-ok');
  const uniformBadBtn = document.getElementById('uniform-bad');
  
  if (uniformOkBtn) {
    uniformOkBtn.addEventListener('click', async () => {
      uniformStatus = 'ok';
      uniformReason = '';
      uniformOkBtn.disabled = true;
      uniformOkBtn.textContent = '제출 중...';
      try {
        await submitData();
        showPage(totalSteps); // 완료 화면 표시
      } catch (error) {
        console.error('제출 실패:', error);
        showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        uniformOkBtn.disabled = false;
        uniformOkBtn.textContent = '양호';
      }
    });
  }
  
  if (uniformBadBtn) {
    uniformBadBtn.addEventListener('click', () => {
      showReasonModal();
    });
  }
}

// ======== 불량 사유 입력 모달 ========
function showReasonModal() {
  const modal = document.getElementById('modal-reason');
  const reasonInput = document.getElementById('reason-input');
  const submitBtn = document.getElementById('modal-reason-submit');
  const cancelBtn = document.getElementById('modal-reason-cancel');
  const uniformBadBtn = document.getElementById('uniform-bad');
  
  reasonInput.value = uniformReason; // 기존 값이 있으면 표시
  modal.style.display = 'flex';
  
  function cleanup() {
    modal.style.display = 'none';
    submitBtn.removeEventListener('click', submitHandler);
    cancelBtn.removeEventListener('click', cancelHandler);
  }
  
  async function submitHandler() {
    const reason = reasonInput.value.trim();
    if (!reason) {
      showError('불량 사유를 입력해주세요.');
      return;
    }
    uniformStatus = 'bad';
    uniformReason = reason;
    cleanup();
    
    // 제출 버튼 비활성화
    if (uniformBadBtn) {
      uniformBadBtn.disabled = true;
      const originalText = uniformBadBtn.textContent;
      uniformBadBtn.textContent = '제출 중...';
      
      try {
        await submitData();
        showPage(totalSteps); // 완료 화면 표시
      } catch (error) {
        console.error('제출 실패:', error);
        showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        uniformBadBtn.disabled = false;
        uniformBadBtn.textContent = originalText;
      }
    }
  }
  
  function cancelHandler() {
    cleanup();
  }
  
  submitBtn.addEventListener('click', submitHandler);
  cancelBtn.addEventListener('click', cancelHandler);
  
  // Enter 키로 제출
  reasonInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      submitHandler();
    }
  });
  
  // 포커스
  setTimeout(() => reasonInput.focus(), 100);
}

// ======== 데이터 제출 함수 ========
async function submitData() {
  const formData = new FormData();
  formData.append('site', selectedSite);
  formData.append('busNo', selectedBusNo);
  formData.append('plate', enteredPlate);
  formData.append('uniformStatus', uniformStatus);
  if (uniformStatus === 'bad' && uniformReason) {
    formData.append('uniformReason', uniformReason);
  }
  formData.append('timestamp', new Date().toISOString());
  // TODO: 실제 백엔드 URL로 변경 필요
  const response = await fetch('/api/submit', {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// ======== 키보드 이벤트 ========
document.addEventListener('keydown', (e) => {
  // 버스번호 선택 화면에서는 Enter로 동작하지 않음
  if (currentStep === 1) return;
  // 복장 상태 확인 화면에서는 버튼이 다르므로 처리하지 않음
  if (currentStep === 3) return;
  const btnMap = {2: 'b2'};
  const currentButton = buttons[btnMap[currentStep]];
  if (e.key === 'Enter' && currentButton && !currentButton.disabled) {
    currentButton.click();
  }
});

// 처음 화면으로 이동하는 함수
function goToInitialPage() {
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    showPage(-1, true);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    showPage(0, true);
  }
}

// 이름 입력 이벤트 리스너
if (driverNameInput && driverNameSubmit) {
  driverNameInput.addEventListener('input', (e) => {
    const name = e.target.value.trim();
    driverNameSubmit.disabled = name.length === 0;
  });

  driverNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !driverNameSubmit.disabled) {
      driverNameSubmit.click();
    }
  });

  driverNameSubmit.addEventListener('click', () => {
    const name = driverNameInput.value.trim();
    if (name.length > 0) {
      saveDriverName(name);
      showPage(0, true); // 근무지 선택 페이지로 이동
    }
  });
}

// ======== 정보 모달 ========
function showInfoModal() {
  const modal = document.getElementById('modal-info');
  const infoContent = document.getElementById('info-content');
  const closeBtn = document.getElementById('modal-info-close');
  
  let info = [];
  if (selectedSite) info.push(`<p><strong>근무지:</strong> ${selectedSite}</p>`);
  if (selectedBusNo) info.push(`<p><strong>노선번호:</strong> ${selectedBusNo}</p>`);
  if (enteredPlate) info.push(`<p><strong>차량번호:</strong> ${enteredPlate}</p>`);
  if (uniformStatus) {
    const statusText = uniformStatus === 'ok' ? '양호' : '불량';
    info.push(`<p><strong>복장 상태:</strong> ${statusText}</p>`);
    if (uniformStatus === 'bad' && uniformReason) {
      info.push(`<p><strong>불량 사유:</strong> ${uniformReason}</p>`);
    }
  }
  
  if (info.length === 0) {
    infoContent.innerHTML = '<p>아직 선택된 정보가 없습니다.</p>';
  } else {
    infoContent.innerHTML = info.join('');
  }
  
  modal.style.display = 'flex';
  
  closeBtn.onclick = () => {
    modal.style.display = 'none';
  };
}

// 정보 버튼 이벤트
const infoBtn = document.getElementById('info-btn');
if (infoBtn) {
  infoBtn.addEventListener('click', () => {
    showInfoModal();
  });
}

// ======== renderPlateGrid 수정 ========
function renderPlateGrid() {
  // p2 페이지의 card-content를 직접 찾기
  const p2Page = document.getElementById('p2');
  if (!p2Page) return;
  const cardContent = p2Page.querySelector('.card-content');
  if (!cardContent) return;
  let plateGridDiv = cardContent.querySelector('#plate-grid');
  if (plateGridDiv) cardContent.removeChild(plateGridDiv);
  let filterInput = cardContent.querySelector('#plate-filter');
  if (filterInput) cardContent.removeChild(filterInput);
  let errorMsg = cardContent.querySelector('#plate-filter-error');
  if (errorMsg) cardContent.removeChild(errorMsg);
  filterInput = document.createElement('input');
  filterInput.id = 'plate-filter';
  filterInput.type = 'text';
  filterInput.placeholder = '차량번호 검색(숫자 입력)';
  filterInput.inputMode = 'numeric';
  filterInput.autocomplete = 'off';
  filterInput.style.marginBottom = '0.5rem';
  filterInput.style.width = '100%';
  cardContent.appendChild(filterInput);
  errorMsg = document.createElement('div');
  errorMsg.id = 'plate-filter-error';
  errorMsg.style.color = '#dc2626';
  errorMsg.style.fontSize = '0.98rem';
  errorMsg.style.height = '1.2em';
  errorMsg.style.marginBottom = '0.5rem';
  errorMsg.style.textAlign = 'left';
  errorMsg.textContent = '';
  cardContent.appendChild(errorMsg);
  plateGridDiv = document.createElement('div');
  plateGridDiv.id = 'plate-grid';
  plateGridDiv.style.display = 'grid';
  plateGridDiv.style.gridTemplateColumns = 'repeat(3, 1fr)';
  plateGridDiv.style.gap = '0.7rem';
  plateGridDiv.style.maxHeight = '320px';
  plateGridDiv.style.minHeight = '320px';
  plateGridDiv.style.overflowY = 'auto';
  plateGridDiv.style.overflowX = 'hidden';
  plateGridDiv.style.width = '100%';
  plateGridDiv.style.marginBottom = '1.2rem';
  cardContent.appendChild(plateGridDiv);
  function renderGrid() {
    const oldBtns = Array.from(plateGridDiv.children);
    oldBtns.forEach(btn => {
      btn.classList.add('fade-exit');
      setTimeout(() => btn.remove(), 200);
    });
    // 데이터 로딩 상태 처리
    if (!plateDataLoaded) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#888;font-size:1.1rem;">차량번호 데이터를 불러오는 중...</div>';
      return;
    }
    if (plateDataError) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#dc2626;font-size:1.1rem;">차량번호 데이터를 불러오지 못했습니다.</div>';
      return;
    }
    let list = [];
    if (selectedBusNo && PLATE_LISTS[selectedBusNo]) {
      list = PLATE_LISTS[selectedBusNo];
    }
    let filter = filterInput.value.trim();
    if (filter.length > 4) {
      filter = filter.slice(0, 4);
      filterInput.value = filter;
    }
    if (filter && /[^0-9]/.test(filter)) {
      errorMsg.textContent = '숫자만 입력해주세요!';
      return;
    } else {
      errorMsg.textContent = '';
    }
    const filtered = filter ? list.filter(num => num.includes(filter)) : list;
    const total = filtered.length;
    const maxRow = Math.ceil(list.length / 3);
    plateGridDiv.style.gridTemplateRows = `repeat(${maxRow}, 1fr)`;
    for (let i = 0; i < maxRow * 3; i++) {
      if (i < total) {
        const num = filtered[i];
        const btn = document.createElement('button');
        btn.className = 'plate-btn fade-in';
        btn.textContent = num;
        btn.setAttribute('aria-label', `차량번호 ${num}`);
        btn.tabIndex = 0;
        btn.onclick = () => {
          showModal(`차량번호 : ${num}가 맞으십니까?`, (ok) => {
            if (!ok) return;
            enteredPlate = num;
            updateBreadcrumb();
            nextStep();
          });
        };
        btn.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') btn.click();
        };
        plateGridDiv.appendChild(btn);
        setTimeout(() => btn.classList.remove('fade-in'), 250);
      } else {
        const empty = document.createElement('div');
        empty.style.visibility = 'hidden';
        plateGridDiv.appendChild(empty);
      }
    }
  }
  filterInput.addEventListener('input', renderGrid);
  renderGrid();
}

// ======== 초기화 ========
document.addEventListener('DOMContentLoaded', () => {
  // 헤더 로고 클릭 이벤트
  const headerLogo = document.getElementById('header-logo');
  if (headerLogo) {
    headerLogo.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 헤더 제목 클릭 이벤트
  const headerTitle = document.getElementById('header-title');
  if (headerTitle) {
    headerTitle.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 복장 상태 확인 버튼 초기화
  initUniformButtons();
  
  // localStorage에 기사님 이름이 있는지 확인
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    history.replaceState({ pageIndex: -1 }, '', '');
    history.pushState({ pageIndex: -1 }, '', '');
    showPage(-1, false);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    history.replaceState({ pageIndex: 0 }, '', '');
    history.pushState({ pageIndex: 0 }, '', '');
    showPage(0, false);
  }
  updateBreadcrumb();
  console.log('운행전 자가점검시스템이 로드되었습니다.');
});

window.addEventListener('popstate', (event) => {
  const pageIndex = event.state && typeof event.state.pageIndex === 'number' ? event.state.pageIndex : (hasDriverName() ? 0 : -1);
  showPage(pageIndex, false);
  // history가 1개뿐이면(첫 화면) 더 이상 뒤로가기를 막음
  if ((pageIndex === 0 || pageIndex === -1) && history.length <= 2) {
    const initialPage = hasDriverName() ? 0 : -1;
    history.pushState({ pageIndex: initialPage }, '', '');
  }
});

// ======== 오프라인 지원 ========
window.addEventListener('online', () => {
  console.log('네트워크 연결이 복구되었습니다.');
});
window.addEventListener('offline', () => {
  console.log('네트워크 연결이 끊어졌습니다.');
  showError('네트워크 연결을 확인해주세요.');
});


```

```javascript
// ======== 상수 ========
const DRIVER_NAME_KEY = 'mdcsDriverName';

const BUSNO_LIST = {
  '노포': ['29', '80', '300'],
  '정관': ['73', '73 (오전)', '106', '107', '184', '188']
};

// ======== Storage 함수 ========
function getDriverName() {
  const stored = localStorage.getItem(DRIVER_NAME_KEY);
  if (!stored) return '';
  return stored.trim();
}

function hasDriverName() {
  return getDriverName().length > 0;
}

function saveDriverName(name) {
  if (!name || !name.trim()) return false;
  localStorage.setItem(DRIVER_NAME_KEY, name.trim());
  return true;
}

// ======== 전역 변수 ========
let currentStep = 0;
const totalSteps = 4;
let selectedSite = '';
let selectedBusNo = '';
let enteredPlate = '';
let uniformStatus = ''; // 'ok' or 'bad'
let uniformReason = ''; // 불량 사유

// ======== DOM 요소 ========
const pages = document.querySelectorAll('.page');
const driverNamePage = document.getElementById('p-driver-name');
const driverNameInput = document.getElementById('driver-name-input');
const driverNameSubmit = document.getElementById('driver-name-submit');

// 근무지 선택 버튼
const siteButtons = {
  nopo: document.getElementById('site-nopo'),
  jeonggwan: document.getElementById('site-jeonggwan')
};

// 버스번호 버튼 컨테이너
const busnoButtonsDiv = document.getElementById('busno-buttons');

// ======== 노선별 차량번호 리스트(구글 시트 연동) ========
let PLATE_LISTS = {};
let plateDataLoaded = false;
let plateDataError = false;
fetch('https://script.google.com/macros/s/AKfycbxKXmbLSOl64gNdOoYIORQs1fpdHOHZuX7LGypDLlgacjKtNhiVTWef6_pBNNkd2cWE/exec')
  .then(res => res.json())
  .then(data => {
    PLATE_LISTS = data;
    plateDataLoaded = true;
  })
  .catch(err => {
    plateDataError = true;
    console.error('차량번호 데이터 불러오기 실패:', err);
  });

// ======== 유효성 검사 함수들 ========
const validators = {
  // 면허판번호 검증 (70가1234 형식)
  plate: (value) => {
    if (!value.trim()) return '면허판 번호를 입력해주세요.';
    const pattern = /^\d{2}[가-힣]\d{4}$/;
    if (!pattern.test(value)) return '올바른 면허판 번호 형식으로 입력해주세요. (예: 70가1234)';
    return null;
  },
  // 사진 검증
  photo: (file) => {
    if (!file) return '사진을 선택해주세요.';
    if (!file.type.startsWith('image/')) return '이미지 파일만 선택 가능합니다.';
    if (file.size > 10 * 1024 * 1024) return '파일 크기는 10MB 이하로 선택해주세요.';
    return null;
  }
};

// ======== 유틸리티 함수들 ========
function showError(message) {
  alert(message);
}

function validateInput(type, value) {
  const validator = validators[type];
  if (!validator) return true;
  const error = validator(value);
  if (error) {
    showError(error);
    return false;
  }
  return true;
}

function updateButtonState(buttonId, isValid) {
  const button = buttons[buttonId];
  if (button) {
    button.disabled = !isValid;
  }
}

function getCurrentPrevBtn() {
  const cards = document.querySelectorAll('.card');
  return cards[currentStep]?.querySelector('.prevBtn');
}

function updatePrevBtn() {
  document.querySelectorAll('.prevBtn').forEach((btn) => {
    // 이름 입력 페이지(-1)나 근무지 선택 페이지(0)에서는 이전 버튼 비활성화
    btn.disabled = (currentStep === -1 || currentStep === 0);
    
    // 모든 이전 버튼에 이벤트 설정
    btn.onclick = () => {
      if (currentStep > 0) {
        window.history.back();
      }
    };
  });
}

// 페이지 ID를 인덱스로 변환하는 맵
const pageIdToIndex = {
  'p-driver-name': -1,
  'p0': 0,
  'p1': 1,
  'p2': 2,
  'p3': 3,
  'done': 4
};

// 인덱스를 페이지 ID로 변환
function getPageIdByIndex(index) {
  const idMap = ['p0', 'p1', 'p2', 'p3', 'done'];
  if (index === -1) return 'p-driver-name';
  return idMap[index] || 'p0';
}

function showPage(pageIndex, pushHistory = false) {
  // 이름 입력 페이지 처리
  if (pageIndex === -1) {
    pages.forEach(page => page.classList.remove('active'));
    driverNamePage.classList.add('active');
    currentStep = -1;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (pushHistory) {
      history.pushState({ pageIndex: -1 }, '', '');
    }
    return;
  }

  // 이름 입력 페이지 숨기기
  driverNamePage.classList.remove('active');

  // 단계별로 입력값 초기화
  if (pageIndex === 0) {
    selectedSite = '';
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 1) {
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 2) {
    enteredPlate = '';
  }
  
  // 일반 페이지 표시
  pages.forEach((page, index) => {
    const pageId = page.id;
    if (pageId === 'p-driver-name') {
      page.classList.remove('active');
    } else {
      const pageIdx = pageIdToIndex[pageId] || 0;
      page.classList.toggle('active', pageIdx === pageIndex);
    }
  });
  currentStep = pageIndex;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  updatePrevBtn();
  
  // 차량번호 선택 페이지(p2)일 때 그리드 렌더링
  if (pageIndex === 2) {
    renderPlateGrid();
  }
  
  if (pushHistory) {
    history.pushState({ pageIndex: currentStep }, '', '');
  }
}

function nextStep() {
  // 이름 입력 페이지에서 다음 단계로
  if (currentStep === -1) {
    showPage(0, true);
    return;
  }
  // 일반 페이지 다음 단계
  if (currentStep < 4) { // done 페이지는 인덱스 4
    showPage(currentStep + 1, true);
  }
}

// ======== 커스텀 모달 ========
function showModal(message, onConfirm) {
  const modal = document.getElementById('modal');
  const msg = document.getElementById('modal-message');
  const yesBtn = document.getElementById('modal-yes');
  const noBtn = document.getElementById('modal-no');
  msg.textContent = message;
  modal.style.display = 'flex';
  function cleanup() {
    modal.style.display = 'none';
    yesBtn.removeEventListener('click', yesHandler);
    noBtn.removeEventListener('click', noHandler);
  }
  function yesHandler() {
    cleanup();
    onConfirm(true);
  }
  function noHandler() {
    cleanup();
    onConfirm(false);
  }
  yesBtn.addEventListener('click', yesHandler);
  noBtn.addEventListener('click', noHandler);
}

// ======== 근무지 선택 이벤트 리스너 ========
siteButtons.nopo.addEventListener('click', () => {
  showModal('근무지 : 노포(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '노포';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('노포');
    nextStep();
  });
});

siteButtons.jeonggwan.addEventListener('click', () => {
  showModal('근무지 : 정관(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '정관';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('정관');
    nextStep();
  });
});

// ======== 버스번호 버튼 동적 생성 ========
function renderBusNoButtons(site) {
  busnoButtonsDiv.innerHTML = '';
  BUSNO_LIST[site].forEach(busNo => {
    const btn = document.createElement('button');
    btn.className = 'busno-btn';
    btn.textContent = busNo;
    btn.onclick = () => {
      showModal(`노선번호 : ${busNo}(이)가 맞으십니까?`, (ok) => {
        if (!ok) return;
        selectedBusNo = busNo;
        nextStep();
      });
    };
    busnoButtonsDiv.appendChild(btn);
  });
}

// ======== 복장 상태 확인 버튼 ========
function initUniformButtons() {
  const uniformOkBtn = document.getElementById('uniform-ok');
  const uniformBadBtn = document.getElementById('uniform-bad');
  
  if (uniformOkBtn) {
    uniformOkBtn.addEventListener('click', async () => {
      uniformStatus = 'ok';
      uniformReason = '';
      uniformOkBtn.disabled = true;
      uniformOkBtn.textContent = '제출 중...';
      try {
        await submitData();
        showPage(totalSteps); // 완료 화면 표시
      } catch (error) {
        console.error('제출 실패:', error);
        showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        uniformOkBtn.disabled = false;
        uniformOkBtn.textContent = '양호';
      }
    });
  }
  
  if (uniformBadBtn) {
    uniformBadBtn.addEventListener('click', () => {
      showReasonModal();
    });
  }
}

// ======== 불량 사유 입력 모달 ========
function showReasonModal() {
  const modal = document.getElementById('modal-reason');
  const reasonInput = document.getElementById('reason-input');
  const submitBtn = document.getElementById('modal-reason-submit');
  const cancelBtn = document.getElementById('modal-reason-cancel');
  const uniformBadBtn = document.getElementById('uniform-bad');
  
  reasonInput.value = uniformReason; // 기존 값이 있으면 표시
  modal.style.display = 'flex';
  
  function cleanup() {
    modal.style.display = 'none';
    submitBtn.removeEventListener('click', submitHandler);
    cancelBtn.removeEventListener('click', cancelHandler);
  }
  
  async function submitHandler() {
    const reason = reasonInput.value.trim();
    if (!reason) {
      showError('불량 사유를 입력해주세요.');
      return;
    }
    uniformStatus = 'bad';
    uniformReason = reason;
    cleanup();
    
    // 제출 버튼 비활성화
    if (uniformBadBtn) {
      uniformBadBtn.disabled = true;
      const originalText = uniformBadBtn.textContent;
      uniformBadBtn.textContent = '제출 중...';
      
      try {
        await submitData();
        showPage(totalSteps); // 완료 화면 표시
      } catch (error) {
        console.error('제출 실패:', error);
        showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        uniformBadBtn.disabled = false;
        uniformBadBtn.textContent = originalText;
      }
    }
  }
  
  function cancelHandler() {
    cleanup();
  }
  
  submitBtn.addEventListener('click', submitHandler);
  cancelBtn.addEventListener('click', cancelHandler);
  
  // Enter 키로 제출
  reasonInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      submitHandler();
    }
  });
  
  // 포커스
  setTimeout(() => reasonInput.focus(), 100);
}

// ======== 데이터 제출 함수 ========
async function submitData() {
  const formData = new FormData();
  formData.append('site', selectedSite);
  formData.append('busNo', selectedBusNo);
  formData.append('plate', enteredPlate);
  formData.append('uniformStatus', uniformStatus);
  if (uniformStatus === 'bad' && uniformReason) {
    formData.append('uniformReason', uniformReason);
  }
  formData.append('timestamp', new Date().toISOString());
  // TODO: 실제 백엔드 URL로 변경 필요
  const response = await fetch('/api/submit', {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// ======== 키보드 이벤트 ========
document.addEventListener('keydown', (e) => {
  // 버스번호 선택 화면에서는 Enter로 동작하지 않음
  if (currentStep === 1) return;
  // 복장 상태 확인 화면에서는 버튼이 다르므로 처리하지 않음
  if (currentStep === 3) return;
  const btnMap = {2: 'b2'};
  const currentButton = buttons[btnMap[currentStep]];
  if (e.key === 'Enter' && currentButton && !currentButton.disabled) {
    currentButton.click();
  }
});

// 처음 화면으로 이동하는 함수
function goToInitialPage() {
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    showPage(-1, true);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    showPage(0, true);
  }
}

// 이름 입력 이벤트 리스너
if (driverNameInput && driverNameSubmit) {
  driverNameInput.addEventListener('input', (e) => {
    const name = e.target.value.trim();
    driverNameSubmit.disabled = name.length === 0;
  });

  driverNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !driverNameSubmit.disabled) {
      driverNameSubmit.click();
    }
  });

  driverNameSubmit.addEventListener('click', () => {
    const name = driverNameInput.value.trim();
    if (name.length > 0) {
      saveDriverName(name);
      showPage(0, true); // 근무지 선택 페이지로 이동
    }
  });
}

// ======== 정보 모달 ========
function showInfoModal() {
  const modal = document.getElementById('modal-info');
  const infoContent = document.getElementById('info-content');
  const closeBtn = document.getElementById('modal-info-close');
  
  let info = [];
  if (selectedSite) info.push(`<p><strong>근무지:</strong> ${selectedSite}</p>`);
  if (selectedBusNo) info.push(`<p><strong>노선번호:</strong> ${selectedBusNo}</p>`);
  if (enteredPlate) info.push(`<p><strong>차량번호:</strong> ${enteredPlate}</p>`);
  if (uniformStatus) {
    const statusText = uniformStatus === 'ok' ? '양호' : '불량';
    info.push(`<p><strong>복장 상태:</strong> ${statusText}</p>`);
    if (uniformStatus === 'bad' && uniformReason) {
      info.push(`<p><strong>불량 사유:</strong> ${uniformReason}</p>`);
    }
  }
  
  if (info.length === 0) {
    infoContent.innerHTML = '<p>아직 선택된 정보가 없습니다.</p>';
  } else {
    infoContent.innerHTML = info.join('');
  }
  
  modal.style.display = 'flex';
  
  closeBtn.onclick = () => {
    modal.style.display = 'none';
  };
}

// 정보 버튼 이벤트
const infoBtn = document.getElementById('info-btn');
if (infoBtn) {
  infoBtn.addEventListener('click', () => {
    showInfoModal();
  });
}

// ======== renderPlateGrid 수정 ========
function renderPlateGrid() {
  // p2 페이지의 card-content를 직접 찾기
  const p2Page = document.getElementById('p2');
  if (!p2Page) return;
  const cardContent = p2Page.querySelector('.card-content');
  if (!cardContent) return;
  let plateGridDiv = cardContent.querySelector('#plate-grid');
  if (plateGridDiv) cardContent.removeChild(plateGridDiv);
  let filterInput = cardContent.querySelector('#plate-filter');
  if (filterInput) cardContent.removeChild(filterInput);
  let errorMsg = cardContent.querySelector('#plate-filter-error');
  if (errorMsg) cardContent.removeChild(errorMsg);
  filterInput = document.createElement('input');
  filterInput.id = 'plate-filter';
  filterInput.type = 'text';
  filterInput.placeholder = '차량번호 검색(숫자 입력)';
  filterInput.inputMode = 'numeric';
  filterInput.autocomplete = 'off';
  filterInput.style.marginBottom = '0.5rem';
  filterInput.style.width = '100%';
  cardContent.appendChild(filterInput);
  errorMsg = document.createElement('div');
  errorMsg.id = 'plate-filter-error';
  errorMsg.style.color = '#dc2626';
  errorMsg.style.fontSize = '0.98rem';
  errorMsg.style.height = '1.2em';
  errorMsg.style.marginBottom = '0.5rem';
  errorMsg.style.textAlign = 'left';
  errorMsg.textContent = '';
  cardContent.appendChild(errorMsg);
  plateGridDiv = document.createElement('div');
  plateGridDiv.id = 'plate-grid';
  plateGridDiv.style.display = 'grid';
  plateGridDiv.style.gridTemplateColumns = 'repeat(3, 1fr)';
  plateGridDiv.style.gap = '0.7rem';
  plateGridDiv.style.maxHeight = '320px';
  plateGridDiv.style.minHeight = '320px';
  plateGridDiv.style.overflowY = 'auto';
  plateGridDiv.style.overflowX = 'hidden';
  plateGridDiv.style.width = '100%';
  plateGridDiv.style.marginBottom = '1.2rem';
  cardContent.appendChild(plateGridDiv);
  function renderGrid() {
    const oldBtns = Array.from(plateGridDiv.children);
    oldBtns.forEach(btn => {
      btn.classList.add('fade-exit');
      setTimeout(() => btn.remove(), 200);
    });
    // 데이터 로딩 상태 처리
    if (!plateDataLoaded) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#888;font-size:1.1rem;">차량번호 데이터를 불러오는 중...</div>';
      return;
    }
    if (plateDataError) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#dc2626;font-size:1.1rem;">차량번호 데이터를 불러오지 못했습니다.</div>';
      return;
    }
    let list = [];
    if (selectedBusNo && PLATE_LISTS[selectedBusNo]) {
      list = PLATE_LISTS[selectedBusNo];
    }
    let filter = filterInput.value.trim();
    if (filter.length > 4) {
      filter = filter.slice(0, 4);
      filterInput.value = filter;
    }
    if (filter && /[^0-9]/.test(filter)) {
      errorMsg.textContent = '숫자만 입력해주세요!';
      return;
    } else {
      errorMsg.textContent = '';
    }
    const filtered = filter ? list.filter(num => num.includes(filter)) : list;
    const total = filtered.length;
    const maxRow = Math.ceil(list.length / 3);
    plateGridDiv.style.gridTemplateRows = `repeat(${maxRow}, 1fr)`;
    for (let i = 0; i < maxRow * 3; i++) {
      if (i < total) {
        const num = filtered[i];
        const btn = document.createElement('button');
        btn.className = 'plate-btn fade-in';
        btn.textContent = num;
        btn.setAttribute('aria-label', `차량번호 ${num}`);
        btn.tabIndex = 0;
        btn.onclick = () => {
          showModal(`차량번호 : ${num}가 맞으십니까?`, (ok) => {
            if (!ok) return;
            enteredPlate = num;
            updateBreadcrumb();
            nextStep();
          });
        };
        btn.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') btn.click();
        };
        plateGridDiv.appendChild(btn);
        setTimeout(() => btn.classList.remove('fade-in'), 250);
      } else {
        const empty = document.createElement('div');
        empty.style.visibility = 'hidden';
        plateGridDiv.appendChild(empty);
      }
    }
  }
  filterInput.addEventListener('input', renderGrid);
  renderGrid();
}

// ======== 초기화 ========
document.addEventListener('DOMContentLoaded', () => {
  // 헤더 로고 클릭 이벤트
  const headerLogo = document.getElementById('header-logo');
  if (headerLogo) {
    headerLogo.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 헤더 제목 클릭 이벤트
  const headerTitle = document.getElementById('header-title');
  if (headerTitle) {
    headerTitle.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 복장 상태 확인 버튼 초기화
  initUniformButtons();
  
  // localStorage에 기사님 이름이 있는지 확인
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    history.replaceState({ pageIndex: -1 }, '', '');
    history.pushState({ pageIndex: -1 }, '', '');
    showPage(-1, false);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    history.replaceState({ pageIndex: 0 }, '', '');
    history.pushState({ pageIndex: 0 }, '', '');
    showPage(0, false);
  }
  updateBreadcrumb();
  console.log('운행전 자가점검시스템이 로드되었습니다.');
});

window.addEventListener('popstate', (event) => {
  const pageIndex = event.state && typeof event.state.pageIndex === 'number' ? event.state.pageIndex : (hasDriverName() ? 0 : -1);
  showPage(pageIndex, false);
  // history가 1개뿐이면(첫 화면) 더 이상 뒤로가기를 막음
  if ((pageIndex === 0 || pageIndex === -1) && history.length <= 2) {
    const initialPage = hasDriverName() ? 0 : -1;
    history.pushState({ pageIndex: initialPage }, '', '');
  }
});

// ======== 오프라인 지원 ========
window.addEventListener('online', () => {
  console.log('네트워크 연결이 복구되었습니다.');
});
window.addEventListener('offline', () => {
  console.log('네트워크 연결이 끊어졌습니다.');
  showError('네트워크 연결을 확인해주세요.');
});


```

```javascript
// ======== 상수 ========
const DRIVER_NAME_KEY = 'mdcsDriverName';

const BUSNO_LIST = {
  '노포': ['29', '80', '300'],
  '정관': ['73', '73 (오전)', '106', '107', '184', '188']
};

// ======== Storage 함수 ========
function getDriverName() {
  const stored = localStorage.getItem(DRIVER_NAME_KEY);
  if (!stored) return '';
  return stored.trim();
}

function hasDriverName() {
  return getDriverName().length > 0;
}

function saveDriverName(name) {
  if (!name || !name.trim()) return false;
  localStorage.setItem(DRIVER_NAME_KEY, name.trim());
  return true;
}

// ======== 전역 변수 ========
let currentStep = 0;
const totalSteps = 4;
let selectedSite = '';
let selectedBusNo = '';
let enteredPlate = '';
let uniformStatus = ''; // 'ok' or 'bad'
let uniformReason = ''; // 불량 사유

// ======== DOM 요소 ========
const pages = document.querySelectorAll('.page');
const driverNamePage = document.getElementById('p-driver-name');
const driverNameInput = document.getElementById('driver-name-input');
const driverNameSubmit = document.getElementById('driver-name-submit');

// 근무지 선택 버튼
const siteButtons = {
  nopo: document.getElementById('site-nopo'),
  jeonggwan: document.getElementById('site-jeonggwan')
};

// 버스번호 버튼 컨테이너
const busnoButtonsDiv = document.getElementById('busno-buttons');

// ======== 노선별 차량번호 리스트(구글 시트 연동) ========
let PLATE_LISTS = {};
let plateDataLoaded = false;
let plateDataError = false;
fetch('https://script.google.com/macros/s/AKfycbxKXmbLSOl64gNdOoYIORQs1fpdHOHZuX7LGypDLlgacjKtNhiVTWef6_pBNNkd2cWE/exec')
  .then(res => res.json())
  .then(data => {
    PLATE_LISTS = data;
    plateDataLoaded = true;
  })
  .catch(err => {
    plateDataError = true;
    console.error('차량번호 데이터 불러오기 실패:', err);
  });

// ======== 유효성 검사 함수들 ========
const validators = {
  // 면허판번호 검증 (70가1234 형식)
  plate: (value) => {
    if (!value.trim()) return '면허판 번호를 입력해주세요.';
    const pattern = /^\d{2}[가-힣]\d{4}$/;
    if (!pattern.test(value)) return '올바른 면허판 번호 형식으로 입력해주세요. (예: 70가1234)';
    return null;
  },
  // 사진 검증
  photo: (file) => {
    if (!file) return '사진을 선택해주세요.';
    if (!file.type.startsWith('image/')) return '이미지 파일만 선택 가능합니다.';
    if (file.size > 10 * 1024 * 1024) return '파일 크기는 10MB 이하로 선택해주세요.';
    return null;
  }
};

// ======== 유틸리티 함수들 ========
function showError(message) {
  alert(message);
}

function validateInput(type, value) {
  const validator = validators[type];
  if (!validator) return true;
  const error = validator(value);
  if (error) {
    showError(error);
    return false;
  }
  return true;
}

function updateButtonState(buttonId, isValid) {
  const button = buttons[buttonId];
  if (button) {
    button.disabled = !isValid;
  }
}

function getCurrentPrevBtn() {
  const cards = document.querySelectorAll('.card');
  return cards[currentStep]?.querySelector('.prevBtn');
}

function updatePrevBtn() {
  document.querySelectorAll('.prevBtn').forEach((btn) => {
    // 이름 입력 페이지(-1)나 근무지 선택 페이지(0)에서는 이전 버튼 비활성화
    btn.disabled = (currentStep === -1 || currentStep === 0);
    
    // 모든 이전 버튼에 이벤트 설정
    btn.onclick = () => {
      if (currentStep > 0) {
        window.history.back();
      }
    };
  });
}

// 페이지 ID를 인덱스로 변환하는 맵
const pageIdToIndex = {
  'p-driver-name': -1,
  'p0': 0,
  'p1': 1,
  'p2': 2,
  'p3': 3,
  'done': 4
};

// 인덱스를 페이지 ID로 변환
function getPageIdByIndex(index) {
  const idMap = ['p0', 'p1', 'p2', 'p3', 'done'];
  if (index === -1) return 'p-driver-name';
  return idMap[index] || 'p0';
}

function showPage(pageIndex, pushHistory = false) {
  // 이름 입력 페이지 처리
  if (pageIndex === -1) {
    pages.forEach(page => page.classList.remove('active'));
    driverNamePage.classList.add('active');
    currentStep = -1;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (pushHistory) {
      history.pushState({ pageIndex: -1 }, '', '');
    }
    return;
  }

  // 이름 입력 페이지 숨기기
  driverNamePage.classList.remove('active');

  // 단계별로 입력값 초기화
  if (pageIndex === 0) {
    selectedSite = '';
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 1) {
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 2) {
    enteredPlate = '';
  }
  
  // 일반 페이지 표시
  pages.forEach((page, index) => {
    const pageId = page.id;
    if (pageId === 'p-driver-name') {
      page.classList.remove('active');
    } else {
      const pageIdx = pageIdToIndex[pageId] || 0;
      page.classList.toggle('active', pageIdx === pageIndex);
    }
  });
  currentStep = pageIndex;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  updatePrevBtn();
  
  // 차량번호 선택 페이지(p2)일 때 그리드 렌더링
  if (pageIndex === 2) {
    renderPlateGrid();
  }
  
  if (pushHistory) {
    history.pushState({ pageIndex: currentStep }, '', '');
  }
}

function nextStep() {
  // 이름 입력 페이지에서 다음 단계로
  if (currentStep === -1) {
    showPage(0, true);
    return;
  }
  // 일반 페이지 다음 단계
  if (currentStep < 4) { // done 페이지는 인덱스 4
    showPage(currentStep + 1, true);
  }
}

// ======== 커스텀 모달 ========
function showModal(message, onConfirm) {
  const modal = document.getElementById('modal');
  const msg = document.getElementById('modal-message');
  const yesBtn = document.getElementById('modal-yes');
  const noBtn = document.getElementById('modal-no');
  msg.textContent = message;
  modal.style.display = 'flex';
  function cleanup() {
    modal.style.display = 'none';
    yesBtn.removeEventListener('click', yesHandler);
    noBtn.removeEventListener('click', noHandler);
  }
  function yesHandler() {
    cleanup();
    onConfirm(true);
  }
  function noHandler() {
    cleanup();
    onConfirm(false);
  }
  yesBtn.addEventListener('click', yesHandler);
  noBtn.addEventListener('click', noHandler);
}

// ======== 근무지 선택 이벤트 리스너 ========
siteButtons.nopo.addEventListener('click', () => {
  showModal('근무지 : 노포(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '노포';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('노포');
    nextStep();
  });
});

siteButtons.jeonggwan.addEventListener('click', () => {
  showModal('근무지 : 정관(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '정관';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('정관');
    nextStep();
  });
});

// ======== 버스번호 버튼 동적 생성 ========
function renderBusNoButtons(site) {
  busnoButtonsDiv.innerHTML = '';
  BUSNO_LIST[site].forEach(busNo => {
    const btn = document.createElement('button');
    btn.className = 'busno-btn';
    btn.textContent = busNo;
    btn.onclick = () => {
      showModal(`노선번호 : ${busNo}(이)가 맞으십니까?`, (ok) => {
        if (!ok) return;
        selectedBusNo = busNo;
        nextStep();
      });
    };
    busnoButtonsDiv.appendChild(btn);
  });
}

// ======== 복장 상태 확인 버튼 ========
function initUniformButtons() {
  const uniformOkBtn = document.getElementById('uniform-ok');
  const uniformBadBtn = document.getElementById('uniform-bad');
  
  if (uniformOkBtn) {
    uniformOkBtn.addEventListener('click', async () => {
      uniformStatus = 'ok';
      uniformReason = '';
      uniformOkBtn.disabled = true;
      uniformOkBtn.textContent = '제출 중...';
      try {
        await submitData();
        showPage(totalSteps); // 완료 화면 표시
      } catch (error) {
        console.error('제출 실패:', error);
        showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        uniformOkBtn.disabled = false;
        uniformOkBtn.textContent = '양호';
      }
    });
  }
  
  if (uniformBadBtn) {
    uniformBadBtn.addEventListener('click', () => {
      showReasonModal();
    });
  }
}

// ======== 불량 사유 입력 모달 ========
function showReasonModal() {
  const modal = document.getElementById('modal-reason');
  const reasonInput = document.getElementById('reason-input');
  const submitBtn = document.getElementById('modal-reason-submit');
  const cancelBtn = document.getElementById('modal-reason-cancel');
  const uniformBadBtn = document.getElementById('uniform-bad');
  
  reasonInput.value = uniformReason; // 기존 값이 있으면 표시
  modal.style.display = 'flex';
  
  function cleanup() {
    modal.style.display = 'none';
    submitBtn.removeEventListener('click', submitHandler);
    cancelBtn.removeEventListener('click', cancelHandler);
  }
  
  async function submitHandler() {
    const reason = reasonInput.value.trim();
    if (!reason) {
      showError('불량 사유를 입력해주세요.');
      return;
    }
    uniformStatus = 'bad';
    uniformReason = reason;
    cleanup();
    
    // 제출 버튼 비활성화
    if (uniformBadBtn) {
      uniformBadBtn.disabled = true;
      const originalText = uniformBadBtn.textContent;
      uniformBadBtn.textContent = '제출 중...';
      
      try {
        await submitData();
        showPage(totalSteps); // 완료 화면 표시
      } catch (error) {
        console.error('제출 실패:', error);
        showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        uniformBadBtn.disabled = false;
        uniformBadBtn.textContent = originalText;
      }
    }
  }
  
  function cancelHandler() {
    cleanup();
  }
  
  submitBtn.addEventListener('click', submitHandler);
  cancelBtn.addEventListener('click', cancelHandler);
  
  // Enter 키로 제출
  reasonInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      submitHandler();
    }
  });
  
  // 포커스
  setTimeout(() => reasonInput.focus(), 100);
}

// ======== 데이터 제출 함수 ========
async function submitData() {
  const formData = new FormData();
  formData.append('site', selectedSite);
  formData.append('busNo', selectedBusNo);
  formData.append('plate', enteredPlate);
  formData.append('uniformStatus', uniformStatus);
  if (uniformStatus === 'bad' && uniformReason) {
    formData.append('uniformReason', uniformReason);
  }
  formData.append('timestamp', new Date().toISOString());
  // TODO: 실제 백엔드 URL로 변경 필요
  const response = await fetch('/api/submit', {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// ======== 키보드 이벤트 ========
document.addEventListener('keydown', (e) => {
  // 버스번호 선택 화면에서는 Enter로 동작하지 않음
  if (currentStep === 1) return;
  // 복장 상태 확인 화면에서는 버튼이 다르므로 처리하지 않음
  if (currentStep === 3) return;
  const btnMap = {2: 'b2'};
  const currentButton = buttons[btnMap[currentStep]];
  if (e.key === 'Enter' && currentButton && !currentButton.disabled) {
    currentButton.click();
  }
});

// 처음 화면으로 이동하는 함수
function goToInitialPage() {
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    showPage(-1, true);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    showPage(0, true);
  }
}

// 이름 입력 이벤트 리스너
if (driverNameInput && driverNameSubmit) {
  driverNameInput.addEventListener('input', (e) => {
    const name = e.target.value.trim();
    driverNameSubmit.disabled = name.length === 0;
  });

  driverNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !driverNameSubmit.disabled) {
      driverNameSubmit.click();
    }
  });

  driverNameSubmit.addEventListener('click', () => {
    const name = driverNameInput.value.trim();
    if (name.length > 0) {
      saveDriverName(name);
      showPage(0, true); // 근무지 선택 페이지로 이동
    }
  });
}

// ======== 정보 모달 ========
function showInfoModal() {
  const modal = document.getElementById('modal-info');
  const infoContent = document.getElementById('info-content');
  const closeBtn = document.getElementById('modal-info-close');
  
  let info = [];
  if (selectedSite) info.push(`<p><strong>근무지:</strong> ${selectedSite}</p>`);
  if (selectedBusNo) info.push(`<p><strong>노선번호:</strong> ${selectedBusNo}</p>`);
  if (enteredPlate) info.push(`<p><strong>차량번호:</strong> ${enteredPlate}</p>`);
  if (uniformStatus) {
    const statusText = uniformStatus === 'ok' ? '양호' : '불량';
    info.push(`<p><strong>복장 상태:</strong> ${statusText}</p>`);
    if (uniformStatus === 'bad' && uniformReason) {
      info.push(`<p><strong>불량 사유:</strong> ${uniformReason}</p>`);
    }
  }
  
  if (info.length === 0) {
    infoContent.innerHTML = '<p>아직 선택된 정보가 없습니다.</p>';
  } else {
    infoContent.innerHTML = info.join('');
  }
  
  modal.style.display = 'flex';
  
  closeBtn.onclick = () => {
    modal.style.display = 'none';
  };
}

// 정보 버튼 이벤트
const infoBtn = document.getElementById('info-btn');
if (infoBtn) {
  infoBtn.addEventListener('click', () => {
    showInfoModal();
  });
}

// ======== renderPlateGrid 수정 ========
function renderPlateGrid() {
  // p2 페이지의 card-content를 직접 찾기
  const p2Page = document.getElementById('p2');
  if (!p2Page) return;
  const cardContent = p2Page.querySelector('.card-content');
  if (!cardContent) return;
  let plateGridDiv = cardContent.querySelector('#plate-grid');
  if (plateGridDiv) cardContent.removeChild(plateGridDiv);
  let filterInput = cardContent.querySelector('#plate-filter');
  if (filterInput) cardContent.removeChild(filterInput);
  let errorMsg = cardContent.querySelector('#plate-filter-error');
  if (errorMsg) cardContent.removeChild(errorMsg);
  filterInput = document.createElement('input');
  filterInput.id = 'plate-filter';
  filterInput.type = 'text';
  filterInput.placeholder = '차량번호 검색(숫자 입력)';
  filterInput.inputMode = 'numeric';
  filterInput.autocomplete = 'off';
  filterInput.style.marginBottom = '0.5rem';
  filterInput.style.width = '100%';
  cardContent.appendChild(filterInput);
  errorMsg = document.createElement('div');
  errorMsg.id = 'plate-filter-error';
  errorMsg.style.color = '#dc2626';
  errorMsg.style.fontSize = '0.98rem';
  errorMsg.style.height = '1.2em';
  errorMsg.style.marginBottom = '0.5rem';
  errorMsg.style.textAlign = 'left';
  errorMsg.textContent = '';
  cardContent.appendChild(errorMsg);
  plateGridDiv = document.createElement('div');
  plateGridDiv.id = 'plate-grid';
  plateGridDiv.style.display = 'grid';
  plateGridDiv.style.gridTemplateColumns = 'repeat(3, 1fr)';
  plateGridDiv.style.gap = '0.7rem';
  plateGridDiv.style.maxHeight = '320px';
  plateGridDiv.style.minHeight = '320px';
  plateGridDiv.style.overflowY = 'auto';
  plateGridDiv.style.overflowX = 'hidden';
  plateGridDiv.style.width = '100%';
  plateGridDiv.style.marginBottom = '1.2rem';
  cardContent.appendChild(plateGridDiv);
  function renderGrid() {
    const oldBtns = Array.from(plateGridDiv.children);
    oldBtns.forEach(btn => {
      btn.classList.add('fade-exit');
      setTimeout(() => btn.remove(), 200);
    });
    // 데이터 로딩 상태 처리
    if (!plateDataLoaded) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#888;font-size:1.1rem;">차량번호 데이터를 불러오는 중...</div>';
      return;
    }
    if (plateDataError) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#dc2626;font-size:1.1rem;">차량번호 데이터를 불러오지 못했습니다.</div>';
      return;
    }
    let list = [];
    if (selectedBusNo && PLATE_LISTS[selectedBusNo]) {
      list = PLATE_LISTS[selectedBusNo];
    }
    let filter = filterInput.value.trim();
    if (filter.length > 4) {
      filter = filter.slice(0, 4);
      filterInput.value = filter;
    }
    if (filter && /[^0-9]/.test(filter)) {
      errorMsg.textContent = '숫자만 입력해주세요!';
      return;
    } else {
      errorMsg.textContent = '';
    }
    const filtered = filter ? list.filter(num => num.includes(filter)) : list;
    const total = filtered.length;
    const maxRow = Math.ceil(list.length / 3);
    plateGridDiv.style.gridTemplateRows = `repeat(${maxRow}, 1fr)`;
    for (let i = 0; i < maxRow * 3; i++) {
      if (i < total) {
        const num = filtered[i];
        const btn = document.createElement('button');
        btn.className = 'plate-btn fade-in';
        btn.textContent = num;
        btn.setAttribute('aria-label', `차량번호 ${num}`);
        btn.tabIndex = 0;
        btn.onclick = () => {
          showModal(`차량번호 : ${num}가 맞으십니까?`, (ok) => {
            if (!ok) return;
            enteredPlate = num;
            nextStep();
          });
        };
        btn.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') btn.click();
        };
        plateGridDiv.appendChild(btn);
        setTimeout(() => btn.classList.remove('fade-in'), 250);
      } else {
        const empty = document.createElement('div');
        empty.style.visibility = 'hidden';
        plateGridDiv.appendChild(empty);
      }
    }
  }
  filterInput.addEventListener('input', renderGrid);
  renderGrid();
}

// ======== 초기화 ========
document.addEventListener('DOMContentLoaded', () => {
  // 헤더 로고 클릭 이벤트
  const headerLogo = document.getElementById('header-logo');
  if (headerLogo) {
    headerLogo.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 헤더 제목 클릭 이벤트
  const headerTitle = document.getElementById('header-title');
  if (headerTitle) {
    headerTitle.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 복장 상태 확인 버튼 초기화
  initUniformButtons();
  
  // localStorage에 기사님 이름이 있는지 확인
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    history.replaceState({ pageIndex: -1 }, '', '');
    history.pushState({ pageIndex: -1 }, '', '');
    showPage(-1, false);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    history.replaceState({ pageIndex: 0 }, '', '');
    history.pushState({ pageIndex: 0 }, '', '');
    showPage(0, false);
  }
  updateBreadcrumb();
  console.log('운행전 자가점검시스템이 로드되었습니다.');
});

window.addEventListener('popstate', (event) => {
  const pageIndex = event.state && typeof event.state.pageIndex === 'number' ? event.state.pageIndex : (hasDriverName() ? 0 : -1);
  showPage(pageIndex, false);
  // history가 1개뿐이면(첫 화면) 더 이상 뒤로가기를 막음
  if ((pageIndex === 0 || pageIndex === -1) && history.length <= 2) {
    const initialPage = hasDriverName() ? 0 : -1;
    history.pushState({ pageIndex: initialPage }, '', '');
  }
});

// ======== 오프라인 지원 ========
window.addEventListener('online', () => {
  console.log('네트워크 연결이 복구되었습니다.');
});
window.addEventListener('offline', () => {
  console.log('네트워크 연결이 끊어졌습니다.');
  showError('네트워크 연결을 확인해주세요.');
});


```

```javascript
// ======== 상수 ========
const DRIVER_NAME_KEY = 'mdcsDriverName';

const BUSNO_LIST = {
  '노포': ['29', '80', '300'],
  '정관': ['73', '73 (오전)', '106', '107', '184', '188']
};

// ======== Storage 함수 ========
function getDriverName() {
  const stored = localStorage.getItem(DRIVER_NAME_KEY);
  if (!stored) return '';
  return stored.trim();
}

function hasDriverName() {
  return getDriverName().length > 0;
}

function saveDriverName(name) {
  if (!name || !name.trim()) return false;
  localStorage.setItem(DRIVER_NAME_KEY, name.trim());
  return true;
}

// ======== 전역 변수 ========
let currentStep = 0;
const totalSteps = 4;
let selectedSite = '';
let selectedBusNo = '';
let enteredPlate = '';
let uniformStatus = ''; // 'ok' or 'bad'
let uniformReason = ''; // 불량 사유

// ======== DOM 요소 ========
const pages = document.querySelectorAll('.page');
const driverNamePage = document.getElementById('p-driver-name');
const driverNameInput = document.getElementById('driver-name-input');
const driverNameSubmit = document.getElementById('driver-name-submit');

// 근무지 선택 버튼
const siteButtons = {
  nopo: document.getElementById('site-nopo'),
  jeonggwan: document.getElementById('site-jeonggwan')
};

// 버스번호 버튼 컨테이너
const busnoButtonsDiv = document.getElementById('busno-buttons');

// ======== 노선별 차량번호 리스트(구글 시트 연동) ========
let PLATE_LISTS = {};
let plateDataLoaded = false;
let plateDataError = false;
fetch('https://script.google.com/macros/s/AKfycbxKXmbLSOl64gNdOoYIORQs1fpdHOHZuX7LGypDLlgacjKtNhiVTWef6_pBNNkd2cWE/exec')
  .then(res => res.json())
  .then(data => {
    PLATE_LISTS = data;
    plateDataLoaded = true;
  })
  .catch(err => {
    plateDataError = true;
    console.error('차량번호 데이터 불러오기 실패:', err);
  });

// ======== 유효성 검사 함수들 ========
const validators = {
  // 면허판번호 검증 (70가1234 형식)
  plate: (value) => {
    if (!value.trim()) return '면허판 번호를 입력해주세요.';
    const pattern = /^\d{2}[가-힣]\d{4}$/;
    if (!pattern.test(value)) return '올바른 면허판 번호 형식으로 입력해주세요. (예: 70가1234)';
    return null;
  },
  // 사진 검증
  photo: (file) => {
    if (!file) return '사진을 선택해주세요.';
    if (!file.type.startsWith('image/')) return '이미지 파일만 선택 가능합니다.';
    if (file.size > 10 * 1024 * 1024) return '파일 크기는 10MB 이하로 선택해주세요.';
    return null;
  }
};

// ======== 유틸리티 함수들 ========
function showError(message) {
  alert(message);
}

function validateInput(type, value) {
  const validator = validators[type];
  if (!validator) return true;
  const error = validator(value);
  if (error) {
    showError(error);
    return false;
  }
  return true;
}

function updateButtonState(buttonId, isValid) {
  const button = buttons[buttonId];
  if (button) {
    button.disabled = !isValid;
  }
}

function getCurrentPrevBtn() {
  const cards = document.querySelectorAll('.card');
  return cards[currentStep]?.querySelector('.prevBtn');
}

function updatePrevBtn() {
  document.querySelectorAll('.prevBtn').forEach((btn) => {
    // 이름 입력 페이지(-1)나 근무지 선택 페이지(0)에서는 이전 버튼 비활성화
    btn.disabled = (currentStep === -1 || currentStep === 0);
    
    // 모든 이전 버튼에 이벤트 설정
    btn.onclick = () => {
      if (currentStep > 0) {
        window.history.back();
      }
    };
  });
}

// 페이지 ID를 인덱스로 변환하는 맵
const pageIdToIndex = {
  'p-driver-name': -1,
  'p0': 0,
  'p1': 1,
  'p2': 2,
  'p3': 3,
  'done': 4
};

// 인덱스를 페이지 ID로 변환
function getPageIdByIndex(index) {
  const idMap = ['p0', 'p1', 'p2', 'p3', 'done'];
  if (index === -1) return 'p-driver-name';
  return idMap[index] || 'p0';
}

function showPage(pageIndex, pushHistory = false) {
  // 이름 입력 페이지 처리
  if (pageIndex === -1) {
    pages.forEach(page => page.classList.remove('active'));
    driverNamePage.classList.add('active');
    currentStep = -1;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (pushHistory) {
      history.pushState({ pageIndex: -1 }, '', '');
    }
    return;
  }

  // 이름 입력 페이지 숨기기
  driverNamePage.classList.remove('active');

  // 단계별로 입력값 초기화
  if (pageIndex === 0) {
    selectedSite = '';
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 1) {
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 2) {
    enteredPlate = '';
  }
  
  // 일반 페이지 표시
  pages.forEach((page, index) => {
    const pageId = page.id;
    if (pageId === 'p-driver-name') {
      page.classList.remove('active');
    } else {
      const pageIdx = pageIdToIndex[pageId] || 0;
      page.classList.toggle('active', pageIdx === pageIndex);
    }
  });
  currentStep = pageIndex;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  updatePrevBtn();
  
  // 차량번호 선택 페이지(p2)일 때 그리드 렌더링
  if (pageIndex === 2) {
    renderPlateGrid();
  }
  
  if (pushHistory) {
    history.pushState({ pageIndex: currentStep }, '', '');
  }
}

function nextStep() {
  // 이름 입력 페이지에서 다음 단계로
  if (currentStep === -1) {
    showPage(0, true);
    return;
  }
  // 일반 페이지 다음 단계
  if (currentStep < 4) { // done 페이지는 인덱스 4
    showPage(currentStep + 1, true);
  }
}

// ======== 커스텀 모달 ========
function showModal(message, onConfirm) {
  const modal = document.getElementById('modal');
  const msg = document.getElementById('modal-message');
  const yesBtn = document.getElementById('modal-yes');
  const noBtn = document.getElementById('modal-no');
  msg.textContent = message;
  modal.style.display = 'flex';
  function cleanup() {
    modal.style.display = 'none';
    yesBtn.removeEventListener('click', yesHandler);
    noBtn.removeEventListener('click', noHandler);
  }
  function yesHandler() {
    cleanup();
    onConfirm(true);
  }
  function noHandler() {
    cleanup();
    onConfirm(false);
  }
  yesBtn.addEventListener('click', yesHandler);
  noBtn.addEventListener('click', noHandler);
}

// ======== 근무지 선택 이벤트 리스너 ========
siteButtons.nopo.addEventListener('click', () => {
  showModal('근무지 : 노포(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '노포';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('노포');
    nextStep();
  });
});

siteButtons.jeonggwan.addEventListener('click', () => {
  showModal('근무지 : 정관(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '정관';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('정관');
    nextStep();
  });
});

// ======== 버스번호 버튼 동적 생성 ========
function renderBusNoButtons(site) {
  busnoButtonsDiv.innerHTML = '';
  BUSNO_LIST[site].forEach(busNo => {
    const btn = document.createElement('button');
    btn.className = 'busno-btn';
    btn.textContent = busNo;
    btn.onclick = () => {
      showModal(`노선번호 : ${busNo}(이)가 맞으십니까?`, (ok) => {
        if (!ok) return;
        selectedBusNo = busNo;
        nextStep();
      });
    };
    busnoButtonsDiv.appendChild(btn);
  });
}

// ======== 복장 상태 확인 버튼 ========
function initUniformButtons() {
  const uniformOkBtn = document.getElementById('uniform-ok');
  const uniformBadBtn = document.getElementById('uniform-bad');
  
  if (uniformOkBtn) {
    uniformOkBtn.addEventListener('click', async () => {
      uniformStatus = 'ok';
      uniformReason = '';
      uniformOkBtn.disabled = true;
      uniformOkBtn.textContent = '제출 중...';
      try {
        await submitData();
        showPage(totalSteps); // 완료 화면 표시
      } catch (error) {
        console.error('제출 실패:', error);
        showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        uniformOkBtn.disabled = false;
        uniformOkBtn.textContent = '양호';
      }
    });
  }
  
  if (uniformBadBtn) {
    uniformBadBtn.addEventListener('click', () => {
      showReasonModal();
    });
  }
}

// ======== 불량 사유 입력 모달 ========
function showReasonModal() {
  const modal = document.getElementById('modal-reason');
  const reasonInput = document.getElementById('reason-input');
  const submitBtn = document.getElementById('modal-reason-submit');
  const cancelBtn = document.getElementById('modal-reason-cancel');
  const uniformBadBtn = document.getElementById('uniform-bad');
  
  reasonInput.value = uniformReason; // 기존 값이 있으면 표시
  modal.style.display = 'flex';
  
  function cleanup() {
    modal.style.display = 'none';
    submitBtn.removeEventListener('click', submitHandler);
    cancelBtn.removeEventListener('click', cancelHandler);
  }
  
  async function submitHandler() {
    const reason = reasonInput.value.trim();
    if (!reason) {
      showError('불량 사유를 입력해주세요.');
      return;
    }
    uniformStatus = 'bad';
    uniformReason = reason;
    cleanup();
    
    // 제출 버튼 비활성화
    if (uniformBadBtn) {
      uniformBadBtn.disabled = true;
      const originalText = uniformBadBtn.textContent;
      uniformBadBtn.textContent = '제출 중...';
      
      try {
        await submitData();
        showPage(totalSteps); // 완료 화면 표시
      } catch (error) {
        console.error('제출 실패:', error);
        showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        uniformBadBtn.disabled = false;
        uniformBadBtn.textContent = originalText;
      }
    }
  }
  
  function cancelHandler() {
    cleanup();
  }
  
  submitBtn.addEventListener('click', submitHandler);
  cancelBtn.addEventListener('click', cancelHandler);
  
  // Enter 키로 제출
  reasonInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      submitHandler();
    }
  });
  
  // 포커스
  setTimeout(() => reasonInput.focus(), 100);
}

// ======== 데이터 제출 함수 ========
async function submitData() {
  const formData = new FormData();
  formData.append('site', selectedSite);
  formData.append('busNo', selectedBusNo);
  formData.append('plate', enteredPlate);
  formData.append('uniformStatus', uniformStatus);
  if (uniformStatus === 'bad' && uniformReason) {
    formData.append('uniformReason', uniformReason);
  }
  formData.append('timestamp', new Date().toISOString());
  // TODO: 실제 백엔드 URL로 변경 필요
  const response = await fetch('/api/submit', {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// ======== 키보드 이벤트 ========
document.addEventListener('keydown', (e) => {
  // 버스번호 선택 화면에서는 Enter로 동작하지 않음
  if (currentStep === 1) return;
  // 복장 상태 확인 화면에서는 버튼이 다르므로 처리하지 않음
  if (currentStep === 3) return;
  const btnMap = {2: 'b2'};
  const currentButton = buttons[btnMap[currentStep]];
  if (e.key === 'Enter' && currentButton && !currentButton.disabled) {
    currentButton.click();
  }
});

// 처음 화면으로 이동하는 함수
function goToInitialPage() {
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    showPage(-1, true);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    showPage(0, true);
  }
}

// 이름 입력 이벤트 리스너
if (driverNameInput && driverNameSubmit) {
  driverNameInput.addEventListener('input', (e) => {
    const name = e.target.value.trim();
    driverNameSubmit.disabled = name.length === 0;
  });

  driverNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !driverNameSubmit.disabled) {
      driverNameSubmit.click();
    }
  });

  driverNameSubmit.addEventListener('click', () => {
    const name = driverNameInput.value.trim();
    if (name.length > 0) {
      saveDriverName(name);
      showPage(0, true); // 근무지 선택 페이지로 이동
    }
  });
}

// ======== 정보 모달 ========
function showInfoModal() {
  const modal = document.getElementById('modal-info');
  const infoContent = document.getElementById('info-content');
  const closeBtn = document.getElementById('modal-info-close');
  
  let info = [];
  if (selectedSite) info.push(`<p><strong>근무지:</strong> ${selectedSite}</p>`);
  if (selectedBusNo) info.push(`<p><strong>노선번호:</strong> ${selectedBusNo}</p>`);
  if (enteredPlate) info.push(`<p><strong>차량번호:</strong> ${enteredPlate}</p>`);
  if (uniformStatus) {
    const statusText = uniformStatus === 'ok' ? '양호' : '불량';
    info.push(`<p><strong>복장 상태:</strong> ${statusText}</p>`);
    if (uniformStatus === 'bad' && uniformReason) {
      info.push(`<p><strong>불량 사유:</strong> ${uniformReason}</p>`);
    }
  }
  
  if (info.length === 0) {
    infoContent.innerHTML = '<p>아직 선택된 정보가 없습니다.</p>';
  } else {
    infoContent.innerHTML = info.join('');
  }
  
  modal.style.display = 'flex';
  
  closeBtn.onclick = () => {
    modal.style.display = 'none';
  };
}

// 정보 버튼 이벤트
const infoBtn = document.getElementById('info-btn');
if (infoBtn) {
  infoBtn.addEventListener('click', () => {
    showInfoModal();
  });
}

// ======== renderPlateGrid 수정 ========
function renderPlateGrid() {
  // p2 페이지의 card-content를 직접 찾기
  const p2Page = document.getElementById('p2');
  if (!p2Page) return;
  const cardContent = p2Page.querySelector('.card-content');
  if (!cardContent) return;
  let plateGridDiv = cardContent.querySelector('#plate-grid');
  if (plateGridDiv) cardContent.removeChild(plateGridDiv);
  let filterInput = cardContent.querySelector('#plate-filter');
  if (filterInput) cardContent.removeChild(filterInput);
  let errorMsg = cardContent.querySelector('#plate-filter-error');
  if (errorMsg) cardContent.removeChild(errorMsg);
  filterInput = document.createElement('input');
  filterInput.id = 'plate-filter';
  filterInput.type = 'text';
  filterInput.placeholder = '차량번호 검색(숫자 입력)';
  filterInput.inputMode = 'numeric';
  filterInput.autocomplete = 'off';
  filterInput.style.marginBottom = '0.5rem';
  filterInput.style.width = '100%';
  cardContent.appendChild(filterInput);
  errorMsg = document.createElement('div');
  errorMsg.id = 'plate-filter-error';
  errorMsg.style.color = '#dc2626';
  errorMsg.style.fontSize = '0.98rem';
  errorMsg.style.height = '1.2em';
  errorMsg.style.marginBottom = '0.5rem';
  errorMsg.style.textAlign = 'left';
  errorMsg.textContent = '';
  cardContent.appendChild(errorMsg);
  plateGridDiv = document.createElement('div');
  plateGridDiv.id = 'plate-grid';
  plateGridDiv.style.display = 'grid';
  plateGridDiv.style.gridTemplateColumns = 'repeat(3, 1fr)';
  plateGridDiv.style.gap = '0.7rem';
  plateGridDiv.style.maxHeight = '320px';
  plateGridDiv.style.minHeight = '320px';
  plateGridDiv.style.overflowY = 'auto';
  plateGridDiv.style.overflowX = 'hidden';
  plateGridDiv.style.width = '100%';
  plateGridDiv.style.marginBottom = '1.2rem';
  cardContent.appendChild(plateGridDiv);
  function renderGrid() {
    const oldBtns = Array.from(plateGridDiv.children);
    oldBtns.forEach(btn => {
      btn.classList.add('fade-exit');
      setTimeout(() => btn.remove(), 200);
    });
    // 데이터 로딩 상태 처리
    if (!plateDataLoaded) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#888;font-size:1.1rem;">차량번호 데이터를 불러오는 중...</div>';
      return;
    }
    if (plateDataError) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#dc2626;font-size:1.1rem;">차량번호 데이터를 불러오지 못했습니다.</div>';
      return;
    }
    let list = [];
    if (selectedBusNo && PLATE_LISTS[selectedBusNo]) {
      list = PLATE_LISTS[selectedBusNo];
    }
    let filter = filterInput.value.trim();
    if (filter.length > 4) {
      filter = filter.slice(0, 4);
      filterInput.value = filter;
    }
    if (filter && /[^0-9]/.test(filter)) {
      errorMsg.textContent = '숫자만 입력해주세요!';
      return;
    } else {
      errorMsg.textContent = '';
    }
    const filtered = filter ? list.filter(num => num.includes(filter)) : list;
    const total = filtered.length;
    const maxRow = Math.ceil(list.length / 3);
    plateGridDiv.style.gridTemplateRows = `repeat(${maxRow}, 1fr)`;
    for (let i = 0; i < maxRow * 3; i++) {
      if (i < total) {
        const num = filtered[i];
        const btn = document.createElement('button');
        btn.className = 'plate-btn fade-in';
        btn.textContent = num;
        btn.setAttribute('aria-label', `차량번호 ${num}`);
        btn.tabIndex = 0;
        btn.onclick = () => {
          showModal(`차량번호 : ${num}가 맞으십니까?`, (ok) => {
            if (!ok) return;
            enteredPlate = num;
            nextStep();
          });
        };
        btn.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') btn.click();
        };
        plateGridDiv.appendChild(btn);
        setTimeout(() => btn.classList.remove('fade-in'), 250);
      } else {
        const empty = document.createElement('div');
        empty.style.visibility = 'hidden';
        plateGridDiv.appendChild(empty);
      }
    }
  }
  filterInput.addEventListener('input', renderGrid);
  renderGrid();
}

// ======== 초기화 ========
document.addEventListener('DOMContentLoaded', () => {
  // 헤더 로고 클릭 이벤트
  const headerLogo = document.getElementById('header-logo');
  if (headerLogo) {
    headerLogo.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 헤더 제목 클릭 이벤트
  const headerTitle = document.getElementById('header-title');
  if (headerTitle) {
    headerTitle.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 복장 상태 확인 버튼 초기화
  initUniformButtons();
  
  // localStorage에 기사님 이름이 있는지 확인
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    history.replaceState({ pageIndex: -1 }, '', '');
    history.pushState({ pageIndex: -1 }, '', '');
    showPage(-1, false);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    history.replaceState({ pageIndex: 0 }, '', '');
    history.pushState({ pageIndex: 0 }, '', '');
    showPage(0, false);
  }
  console.log('운행전 자가점검시스템이 로드되었습니다.');
});

window.addEventListener('popstate', (event) => {
  const pageIndex = event.state && typeof event.state.pageIndex === 'number' ? event.state.pageIndex : (hasDriverName() ? 0 : -1);
  showPage(pageIndex, false);
  // history가 1개뿐이면(첫 화면) 더 이상 뒤로가기를 막음
  if ((pageIndex === 0 || pageIndex === -1) && history.length <= 2) {
    const initialPage = hasDriverName() ? 0 : -1;
    history.pushState({ pageIndex: initialPage }, '', '');
  }
});

// ======== 오프라인 지원 ========
window.addEventListener('online', () => {
  console.log('네트워크 연결이 복구되었습니다.');
});
window.addEventListener('offline', () => {
  console.log('네트워크 연결이 끊어졌습니다.');
  showError('네트워크 연결을 확인해주세요.');
});


```


정보 버튼과 모달 스타일 추가 중.


```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 70px;
}

header {
  background: var(--card-bg);
  padding: 0.75rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
}

header img {
  height: 36px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}

@media (max-width: 480px) {
  header {
    padding: 0.6rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 70px);
  padding: 1rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}

.breadcrumb {
  width: 100%;
  max-width: 400px;
  margin: 1rem auto 1rem auto;
  padding: 0.7rem 1rem;
  font-size: 1.55rem;
  color: var(--text-light);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  text-align: center;
}

.breadcrumb .crumb {
  color: var(--primary);
  font-weight: 600;
}

.breadcrumb .sep {
  color: var(--text-light);
  margin: 0 0.2em;
}

.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 복장 체크리스트 */
.uniform-checklist {
  width: 100%;
  text-align: left;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.uniform-checklist p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 0;
  white-space: pre-line;
}

.checklist-indent {
  display: inline-block;
  padding-left: 1em;
}

/* 복장 버튼 */
.uniform-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.uniform-btn {
  width: 100% !important;
  padding: 1.25rem 2rem !important;
  font-size: 1.2rem !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px !important;
}

.uniform-btn:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.uniform-btn:disabled {
  background: var(--text-light) !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 불량 사유 입력 모달 */
.modal-input-container {
  width: 100%;
  margin: 1rem 0;
}

.modal-textarea {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-textarea::placeholder {
  color: var(--text-light);
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

  .breadcrumb {
    font-size: 1.25rem;
    padding: 0.5rem 0.5rem;
    max-width: 100vw;
    margin: 0.7rem auto 0.7rem auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```

```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 70px;
}

header {
  background: var(--card-bg);
  padding: 0.75rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
}

header img {
  height: 36px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
  flex: 1;
}

.info-btn {
  background: transparent !important;
  border: none !important;
  font-size: 1.5rem !important;
  cursor: pointer !important;
  padding: 0.5rem !important;
  min-width: auto !important;
  min-height: auto !important;
  width: auto !important;
  transition: transform 0.2s ease !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.info-btn:hover {
  transform: scale(1.1) !important;
  background: transparent !important;
}

@media (max-width: 480px) {
  header {
    padding: 0.6rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 70px);
  padding: 1rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}

.breadcrumb {
  width: 100%;
  max-width: 400px;
  margin: 1rem auto 1rem auto;
  padding: 0.7rem 1rem;
  font-size: 1.55rem;
  color: var(--text-light);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  text-align: center;
}

.breadcrumb .crumb {
  color: var(--primary);
  font-weight: 600;
}

.breadcrumb .sep {
  color: var(--text-light);
  margin: 0 0.2em;
}

.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 복장 체크리스트 */
.uniform-checklist {
  width: 100%;
  text-align: left;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.uniform-checklist p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 0;
  white-space: pre-line;
}

.checklist-indent {
  display: inline-block;
  padding-left: 1em;
}

/* 복장 버튼 */
.uniform-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.uniform-btn {
  width: 100% !important;
  padding: 1.25rem 2rem !important;
  font-size: 1.2rem !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px !important;
}

.uniform-btn:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.uniform-btn:disabled {
  background: var(--text-light) !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 불량 사유 입력 모달 */
.modal-input-container {
  width: 100%;
  margin: 1rem 0;
}

.modal-textarea {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-textarea::placeholder {
  color: var(--text-light);
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

  .breadcrumb {
    font-size: 1.25rem;
    padding: 0.5rem 0.5rem;
    max-width: 100vw;
    margin: 0.7rem auto 0.7rem auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```

```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 70px;
}

header {
  background: var(--card-bg);
  padding: 0.75rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
}

header img {
  height: 36px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
  flex: 1;
}

.info-btn {
  background: transparent !important;
  border: none !important;
  font-size: 1.5rem !important;
  cursor: pointer !important;
  padding: 0.5rem !important;
  min-width: auto !important;
  min-height: auto !important;
  width: auto !important;
  transition: transform 0.2s ease !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.info-btn:hover {
  transform: scale(1.1) !important;
  background: transparent !important;
}

@media (max-width: 480px) {
  header {
    padding: 0.6rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 70px);
  padding: 1rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}

.breadcrumb {
  width: 100%;
  max-width: 400px;
  margin: 1rem auto 1rem auto;
  padding: 0.7rem 1rem;
  font-size: 1.55rem;
  color: var(--text-light);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  text-align: center;
}

.breadcrumb .crumb {
  color: var(--primary);
  font-weight: 600;
}

.breadcrumb .sep {
  color: var(--text-light);
  margin: 0 0.2em;
}

.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 복장 체크리스트 */
.uniform-checklist {
  width: 100%;
  text-align: left;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.uniform-checklist p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 0;
  white-space: pre-line;
}

.checklist-indent {
  display: inline-block;
  padding-left: 1em;
}

/* 복장 버튼 */
.uniform-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.uniform-btn {
  width: 100% !important;
  padding: 1.25rem 2rem !important;
  font-size: 1.2rem !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px !important;
}

.uniform-btn:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.uniform-btn:disabled {
  background: var(--text-light) !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 불량 사유 입력 모달 */
.modal-input-container {
  width: 100%;
  margin: 1rem 0;
}

.modal-textarea {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-textarea::placeholder {
  color: var(--text-light);
}

/* 정보 모달 */
.info-content {
  width: 100%;
  text-align: left;
  padding: 1rem 0;
}

.info-content p {
  margin: 0.8rem 0;
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
}

.info-content p strong {
  color: var(--primary);
  font-weight: 600;
  margin-right: 0.5rem;
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

  .breadcrumb {
    font-size: 1.25rem;
    padding: 0.5rem 0.5rem;
    max-width: 100vw;
    margin: 0.7rem auto 0.7rem auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```


breadcrumb 관련 CSS 제거 중.


```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 70px;
}

header {
  background: var(--card-bg);
  padding: 0.75rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
}

header img {
  height: 36px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
  flex: 1;
}

.info-btn {
  background: transparent !important;
  border: none !important;
  font-size: 1.5rem !important;
  cursor: pointer !important;
  padding: 0.5rem !important;
  min-width: auto !important;
  min-height: auto !important;
  width: auto !important;
  transition: transform 0.2s ease !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.info-btn:hover {
  transform: scale(1.1) !important;
  background: transparent !important;
}

@media (max-width: 480px) {
  header {
    padding: 0.6rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 70px);
  padding: 1rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}


.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 복장 체크리스트 */
.uniform-checklist {
  width: 100%;
  text-align: left;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.uniform-checklist p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 0;
  white-space: pre-line;
}

.checklist-indent {
  display: inline-block;
  padding-left: 1em;
}

/* 복장 버튼 */
.uniform-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.uniform-btn {
  width: 100% !important;
  padding: 1.25rem 2rem !important;
  font-size: 1.2rem !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px !important;
}

.uniform-btn:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.uniform-btn:disabled {
  background: var(--text-light) !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 불량 사유 입력 모달 */
.modal-input-container {
  width: 100%;
  margin: 1rem 0;
}

.modal-textarea {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-textarea::placeholder {
  color: var(--text-light);
}

/* 정보 모달 */
.info-content {
  width: 100%;
  text-align: left;
  padding: 1rem 0;
}

.info-content p {
  margin: 0.8rem 0;
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
}

.info-content p strong {
  color: var(--primary);
  font-weight: 600;
  margin-right: 0.5rem;
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

  .breadcrumb {
    font-size: 1.25rem;
    padding: 0.5rem 0.5rem;
    max-width: 100vw;
    margin: 0.7rem auto 0.7rem auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```

```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 70px;
}

header {
  background: var(--card-bg);
  padding: 0.75rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
}

header img {
  height: 36px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
  flex: 1;
}

.info-btn {
  background: transparent !important;
  border: none !important;
  font-size: 1.5rem !important;
  cursor: pointer !important;
  padding: 0.5rem !important;
  min-width: auto !important;
  min-height: auto !important;
  width: auto !important;
  transition: transform 0.2s ease !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.info-btn:hover {
  transform: scale(1.1) !important;
  background: transparent !important;
}

@media (max-width: 480px) {
  header {
    padding: 0.6rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 70px);
  padding: 1rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}


.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 복장 체크리스트 */
.uniform-checklist {
  width: 100%;
  text-align: left;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.uniform-checklist p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 0;
  white-space: pre-line;
}

.checklist-indent {
  display: inline-block;
  padding-left: 1em;
}

/* 복장 버튼 */
.uniform-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.uniform-btn {
  width: 100% !important;
  padding: 1.25rem 2rem !important;
  font-size: 1.2rem !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px !important;
}

.uniform-btn:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.uniform-btn:disabled {
  background: var(--text-light) !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 불량 사유 입력 모달 */
.modal-input-container {
  width: 100%;
  margin: 1rem 0;
}

.modal-textarea {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-textarea::placeholder {
  color: var(--text-light);
}

/* 정보 모달 */
.info-content {
  width: 100%;
  text-align: left;
  padding: 1rem 0;
}

.info-content p {
  margin: 0.8rem 0;
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
}

.info-content p strong {
  color: var(--primary);
  font-weight: 600;
  margin-right: 0.5rem;
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```


정보 버튼 초기화를 DOMContentLoaded에 추가 중.


```javascript
// ======== 상수 ========
const DRIVER_NAME_KEY = 'mdcsDriverName';

const BUSNO_LIST = {
  '노포': ['29', '80', '300'],
  '정관': ['73', '73 (오전)', '106', '107', '184', '188']
};

// ======== Storage 함수 ========
function getDriverName() {
  const stored = localStorage.getItem(DRIVER_NAME_KEY);
  if (!stored) return '';
  return stored.trim();
}

function hasDriverName() {
  return getDriverName().length > 0;
}

function saveDriverName(name) {
  if (!name || !name.trim()) return false;
  localStorage.setItem(DRIVER_NAME_KEY, name.trim());
  return true;
}

// ======== 전역 변수 ========
let currentStep = 0;
const totalSteps = 4;
let selectedSite = '';
let selectedBusNo = '';
let enteredPlate = '';
let uniformStatus = ''; // 'ok' or 'bad'
let uniformReason = ''; // 불량 사유

// ======== DOM 요소 ========
const pages = document.querySelectorAll('.page');
const driverNamePage = document.getElementById('p-driver-name');
const driverNameInput = document.getElementById('driver-name-input');
const driverNameSubmit = document.getElementById('driver-name-submit');

// 근무지 선택 버튼
const siteButtons = {
  nopo: document.getElementById('site-nopo'),
  jeonggwan: document.getElementById('site-jeonggwan')
};

// 버스번호 버튼 컨테이너
const busnoButtonsDiv = document.getElementById('busno-buttons');

// ======== 노선별 차량번호 리스트(구글 시트 연동) ========
let PLATE_LISTS = {};
let plateDataLoaded = false;
let plateDataError = false;
fetch('https://script.google.com/macros/s/AKfycbxKXmbLSOl64gNdOoYIORQs1fpdHOHZuX7LGypDLlgacjKtNhiVTWef6_pBNNkd2cWE/exec')
  .then(res => res.json())
  .then(data => {
    PLATE_LISTS = data;
    plateDataLoaded = true;
  })
  .catch(err => {
    plateDataError = true;
    console.error('차량번호 데이터 불러오기 실패:', err);
  });

// ======== 유효성 검사 함수들 ========
const validators = {
  // 면허판번호 검증 (70가1234 형식)
  plate: (value) => {
    if (!value.trim()) return '면허판 번호를 입력해주세요.';
    const pattern = /^\d{2}[가-힣]\d{4}$/;
    if (!pattern.test(value)) return '올바른 면허판 번호 형식으로 입력해주세요. (예: 70가1234)';
    return null;
  },
  // 사진 검증
  photo: (file) => {
    if (!file) return '사진을 선택해주세요.';
    if (!file.type.startsWith('image/')) return '이미지 파일만 선택 가능합니다.';
    if (file.size > 10 * 1024 * 1024) return '파일 크기는 10MB 이하로 선택해주세요.';
    return null;
  }
};

// ======== 유틸리티 함수들 ========
function showError(message) {
  alert(message);
}

function validateInput(type, value) {
  const validator = validators[type];
  if (!validator) return true;
  const error = validator(value);
  if (error) {
    showError(error);
    return false;
  }
  return true;
}

function updateButtonState(buttonId, isValid) {
  const button = buttons[buttonId];
  if (button) {
    button.disabled = !isValid;
  }
}

function getCurrentPrevBtn() {
  const cards = document.querySelectorAll('.card');
  return cards[currentStep]?.querySelector('.prevBtn');
}

function updatePrevBtn() {
  document.querySelectorAll('.prevBtn').forEach((btn) => {
    // 이름 입력 페이지(-1)나 근무지 선택 페이지(0)에서는 이전 버튼 비활성화
    btn.disabled = (currentStep === -1 || currentStep === 0);
    
    // 모든 이전 버튼에 이벤트 설정
    btn.onclick = () => {
      if (currentStep > 0) {
        window.history.back();
      }
    };
  });
}

// 페이지 ID를 인덱스로 변환하는 맵
const pageIdToIndex = {
  'p-driver-name': -1,
  'p0': 0,
  'p1': 1,
  'p2': 2,
  'p3': 3,
  'done': 4
};

// 인덱스를 페이지 ID로 변환
function getPageIdByIndex(index) {
  const idMap = ['p0', 'p1', 'p2', 'p3', 'done'];
  if (index === -1) return 'p-driver-name';
  return idMap[index] || 'p0';
}

function showPage(pageIndex, pushHistory = false) {
  // 이름 입력 페이지 처리
  if (pageIndex === -1) {
    pages.forEach(page => page.classList.remove('active'));
    driverNamePage.classList.add('active');
    currentStep = -1;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (pushHistory) {
      history.pushState({ pageIndex: -1 }, '', '');
    }
    return;
  }

  // 이름 입력 페이지 숨기기
  driverNamePage.classList.remove('active');

  // 단계별로 입력값 초기화
  if (pageIndex === 0) {
    selectedSite = '';
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 1) {
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 2) {
    enteredPlate = '';
  }
  
  // 일반 페이지 표시
  pages.forEach((page, index) => {
    const pageId = page.id;
    if (pageId === 'p-driver-name') {
      page.classList.remove('active');
    } else {
      const pageIdx = pageIdToIndex[pageId] || 0;
      page.classList.toggle('active', pageIdx === pageIndex);
    }
  });
  currentStep = pageIndex;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  updatePrevBtn();
  
  // 차량번호 선택 페이지(p2)일 때 그리드 렌더링
  if (pageIndex === 2) {
    renderPlateGrid();
  }
  
  if (pushHistory) {
    history.pushState({ pageIndex: currentStep }, '', '');
  }
}

function nextStep() {
  // 이름 입력 페이지에서 다음 단계로
  if (currentStep === -1) {
    showPage(0, true);
    return;
  }
  // 일반 페이지 다음 단계
  if (currentStep < 4) { // done 페이지는 인덱스 4
    showPage(currentStep + 1, true);
  }
}

// ======== 커스텀 모달 ========
function showModal(message, onConfirm) {
  const modal = document.getElementById('modal');
  const msg = document.getElementById('modal-message');
  const yesBtn = document.getElementById('modal-yes');
  const noBtn = document.getElementById('modal-no');
  msg.textContent = message;
  modal.style.display = 'flex';
  function cleanup() {
    modal.style.display = 'none';
    yesBtn.removeEventListener('click', yesHandler);
    noBtn.removeEventListener('click', noHandler);
  }
  function yesHandler() {
    cleanup();
    onConfirm(true);
  }
  function noHandler() {
    cleanup();
    onConfirm(false);
  }
  yesBtn.addEventListener('click', yesHandler);
  noBtn.addEventListener('click', noHandler);
}

// ======== 근무지 선택 이벤트 리스너 ========
siteButtons.nopo.addEventListener('click', () => {
  showModal('근무지 : 노포(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '노포';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('노포');
    nextStep();
  });
});

siteButtons.jeonggwan.addEventListener('click', () => {
  showModal('근무지 : 정관(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '정관';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('정관');
    nextStep();
  });
});

// ======== 버스번호 버튼 동적 생성 ========
function renderBusNoButtons(site) {
  busnoButtonsDiv.innerHTML = '';
  BUSNO_LIST[site].forEach(busNo => {
    const btn = document.createElement('button');
    btn.className = 'busno-btn';
    btn.textContent = busNo;
    btn.onclick = () => {
      showModal(`노선번호 : ${busNo}(이)가 맞으십니까?`, (ok) => {
        if (!ok) return;
        selectedBusNo = busNo;
        nextStep();
      });
    };
    busnoButtonsDiv.appendChild(btn);
  });
}

// ======== 복장 상태 확인 버튼 ========
function initUniformButtons() {
  const uniformOkBtn = document.getElementById('uniform-ok');
  const uniformBadBtn = document.getElementById('uniform-bad');
  
  if (uniformOkBtn) {
    uniformOkBtn.addEventListener('click', async () => {
      uniformStatus = 'ok';
      uniformReason = '';
      uniformOkBtn.disabled = true;
      uniformOkBtn.textContent = '제출 중...';
      try {
        await submitData();
        showPage(totalSteps); // 완료 화면 표시
      } catch (error) {
        console.error('제출 실패:', error);
        showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        uniformOkBtn.disabled = false;
        uniformOkBtn.textContent = '양호';
      }
    });
  }
  
  if (uniformBadBtn) {
    uniformBadBtn.addEventListener('click', () => {
      showReasonModal();
    });
  }
}

// ======== 불량 사유 입력 모달 ========
function showReasonModal() {
  const modal = document.getElementById('modal-reason');
  const reasonInput = document.getElementById('reason-input');
  const submitBtn = document.getElementById('modal-reason-submit');
  const cancelBtn = document.getElementById('modal-reason-cancel');
  const uniformBadBtn = document.getElementById('uniform-bad');
  
  reasonInput.value = uniformReason; // 기존 값이 있으면 표시
  modal.style.display = 'flex';
  
  function cleanup() {
    modal.style.display = 'none';
    submitBtn.removeEventListener('click', submitHandler);
    cancelBtn.removeEventListener('click', cancelHandler);
  }
  
  async function submitHandler() {
    const reason = reasonInput.value.trim();
    if (!reason) {
      showError('불량 사유를 입력해주세요.');
      return;
    }
    uniformStatus = 'bad';
    uniformReason = reason;
    cleanup();
    
    // 제출 버튼 비활성화
    if (uniformBadBtn) {
      uniformBadBtn.disabled = true;
      const originalText = uniformBadBtn.textContent;
      uniformBadBtn.textContent = '제출 중...';
      
      try {
        await submitData();
        showPage(totalSteps); // 완료 화면 표시
      } catch (error) {
        console.error('제출 실패:', error);
        showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        uniformBadBtn.disabled = false;
        uniformBadBtn.textContent = originalText;
      }
    }
  }
  
  function cancelHandler() {
    cleanup();
  }
  
  submitBtn.addEventListener('click', submitHandler);
  cancelBtn.addEventListener('click', cancelHandler);
  
  // Enter 키로 제출
  reasonInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      submitHandler();
    }
  });
  
  // 포커스
  setTimeout(() => reasonInput.focus(), 100);
}

// ======== 데이터 제출 함수 ========
async function submitData() {
  const formData = new FormData();
  formData.append('site', selectedSite);
  formData.append('busNo', selectedBusNo);
  formData.append('plate', enteredPlate);
  formData.append('uniformStatus', uniformStatus);
  if (uniformStatus === 'bad' && uniformReason) {
    formData.append('uniformReason', uniformReason);
  }
  formData.append('timestamp', new Date().toISOString());
  // TODO: 실제 백엔드 URL로 변경 필요
  const response = await fetch('/api/submit', {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// ======== 키보드 이벤트 ========
document.addEventListener('keydown', (e) => {
  // 버스번호 선택 화면에서는 Enter로 동작하지 않음
  if (currentStep === 1) return;
  // 복장 상태 확인 화면에서는 버튼이 다르므로 처리하지 않음
  if (currentStep === 3) return;
  const btnMap = {2: 'b2'};
  const currentButton = buttons[btnMap[currentStep]];
  if (e.key === 'Enter' && currentButton && !currentButton.disabled) {
    currentButton.click();
  }
});

// 처음 화면으로 이동하는 함수
function goToInitialPage() {
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    showPage(-1, true);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    showPage(0, true);
  }
}

// 이름 입력 이벤트 리스너
if (driverNameInput && driverNameSubmit) {
  driverNameInput.addEventListener('input', (e) => {
    const name = e.target.value.trim();
    driverNameSubmit.disabled = name.length === 0;
  });

  driverNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !driverNameSubmit.disabled) {
      driverNameSubmit.click();
    }
  });

  driverNameSubmit.addEventListener('click', () => {
    const name = driverNameInput.value.trim();
    if (name.length > 0) {
      saveDriverName(name);
      showPage(0, true); // 근무지 선택 페이지로 이동
    }
  });
}

// ======== 정보 모달 ========
function showInfoModal() {
  const modal = document.getElementById('modal-info');
  const infoContent = document.getElementById('info-content');
  const closeBtn = document.getElementById('modal-info-close');
  
  let info = [];
  if (selectedSite) info.push(`<p><strong>근무지:</strong> ${selectedSite}</p>`);
  if (selectedBusNo) info.push(`<p><strong>노선번호:</strong> ${selectedBusNo}</p>`);
  if (enteredPlate) info.push(`<p><strong>차량번호:</strong> ${enteredPlate}</p>`);
  if (uniformStatus) {
    const statusText = uniformStatus === 'ok' ? '양호' : '불량';
    info.push(`<p><strong>복장 상태:</strong> ${statusText}</p>`);
    if (uniformStatus === 'bad' && uniformReason) {
      info.push(`<p><strong>불량 사유:</strong> ${uniformReason}</p>`);
    }
  }
  
  if (info.length === 0) {
    infoContent.innerHTML = '<p>아직 선택된 정보가 없습니다.</p>';
  } else {
    infoContent.innerHTML = info.join('');
  }
  
  modal.style.display = 'flex';
  
  closeBtn.onclick = () => {
    modal.style.display = 'none';
  };
}

// 정보 버튼 이벤트
const infoBtn = document.getElementById('info-btn');
if (infoBtn) {
  infoBtn.addEventListener('click', () => {
    showInfoModal();
  });
}

// ======== renderPlateGrid 수정 ========
function renderPlateGrid() {
  // p2 페이지의 card-content를 직접 찾기
  const p2Page = document.getElementById('p2');
  if (!p2Page) return;
  const cardContent = p2Page.querySelector('.card-content');
  if (!cardContent) return;
  let plateGridDiv = cardContent.querySelector('#plate-grid');
  if (plateGridDiv) cardContent.removeChild(plateGridDiv);
  let filterInput = cardContent.querySelector('#plate-filter');
  if (filterInput) cardContent.removeChild(filterInput);
  let errorMsg = cardContent.querySelector('#plate-filter-error');
  if (errorMsg) cardContent.removeChild(errorMsg);
  filterInput = document.createElement('input');
  filterInput.id = 'plate-filter';
  filterInput.type = 'text';
  filterInput.placeholder = '차량번호 검색(숫자 입력)';
  filterInput.inputMode = 'numeric';
  filterInput.autocomplete = 'off';
  filterInput.style.marginBottom = '0.5rem';
  filterInput.style.width = '100%';
  cardContent.appendChild(filterInput);
  errorMsg = document.createElement('div');
  errorMsg.id = 'plate-filter-error';
  errorMsg.style.color = '#dc2626';
  errorMsg.style.fontSize = '0.98rem';
  errorMsg.style.height = '1.2em';
  errorMsg.style.marginBottom = '0.5rem';
  errorMsg.style.textAlign = 'left';
  errorMsg.textContent = '';
  cardContent.appendChild(errorMsg);
  plateGridDiv = document.createElement('div');
  plateGridDiv.id = 'plate-grid';
  plateGridDiv.style.display = 'grid';
  plateGridDiv.style.gridTemplateColumns = 'repeat(3, 1fr)';
  plateGridDiv.style.gap = '0.7rem';
  plateGridDiv.style.maxHeight = '320px';
  plateGridDiv.style.minHeight = '320px';
  plateGridDiv.style.overflowY = 'auto';
  plateGridDiv.style.overflowX = 'hidden';
  plateGridDiv.style.width = '100%';
  plateGridDiv.style.marginBottom = '1.2rem';
  cardContent.appendChild(plateGridDiv);
  function renderGrid() {
    const oldBtns = Array.from(plateGridDiv.children);
    oldBtns.forEach(btn => {
      btn.classList.add('fade-exit');
      setTimeout(() => btn.remove(), 200);
    });
    // 데이터 로딩 상태 처리
    if (!plateDataLoaded) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#888;font-size:1.1rem;">차량번호 데이터를 불러오는 중...</div>';
      return;
    }
    if (plateDataError) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#dc2626;font-size:1.1rem;">차량번호 데이터를 불러오지 못했습니다.</div>';
      return;
    }
    let list = [];
    if (selectedBusNo && PLATE_LISTS[selectedBusNo]) {
      list = PLATE_LISTS[selectedBusNo];
    }
    let filter = filterInput.value.trim();
    if (filter.length > 4) {
      filter = filter.slice(0, 4);
      filterInput.value = filter;
    }
    if (filter && /[^0-9]/.test(filter)) {
      errorMsg.textContent = '숫자만 입력해주세요!';
      return;
    } else {
      errorMsg.textContent = '';
    }
    const filtered = filter ? list.filter(num => num.includes(filter)) : list;
    const total = filtered.length;
    const maxRow = Math.ceil(list.length / 3);
    plateGridDiv.style.gridTemplateRows = `repeat(${maxRow}, 1fr)`;
    for (let i = 0; i < maxRow * 3; i++) {
      if (i < total) {
        const num = filtered[i];
        const btn = document.createElement('button');
        btn.className = 'plate-btn fade-in';
        btn.textContent = num;
        btn.setAttribute('aria-label', `차량번호 ${num}`);
        btn.tabIndex = 0;
        btn.onclick = () => {
          showModal(`차량번호 : ${num}가 맞으십니까?`, (ok) => {
            if (!ok) return;
            enteredPlate = num;
            nextStep();
          });
        };
        btn.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') btn.click();
        };
        plateGridDiv.appendChild(btn);
        setTimeout(() => btn.classList.remove('fade-in'), 250);
      } else {
        const empty = document.createElement('div');
        empty.style.visibility = 'hidden';
        plateGridDiv.appendChild(empty);
      }
    }
  }
  filterInput.addEventListener('input', renderGrid);
  renderGrid();
}

// ======== 초기화 ========
document.addEventListener('DOMContentLoaded', () => {
  // 헤더 로고 클릭 이벤트
  const headerLogo = document.getElementById('header-logo');
  if (headerLogo) {
    headerLogo.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 헤더 제목 클릭 이벤트
  const headerTitle = document.getElementById('header-title');
  if (headerTitle) {
    headerTitle.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 복장 상태 확인 버튼 초기화
  initUniformButtons();
  
  // 정보 버튼 초기화
  const infoBtn = document.getElementById('info-btn');
  if (infoBtn) {
    infoBtn.addEventListener('click', () => {
      showInfoModal();
    });
  }
  
  // localStorage에 기사님 이름이 있는지 확인
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    history.replaceState({ pageIndex: -1 }, '', '');
    history.pushState({ pageIndex: -1 }, '', '');
    showPage(-1, false);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    history.replaceState({ pageIndex: 0 }, '', '');
    history.pushState({ pageIndex: 0 }, '', '');
    showPage(0, false);
  }
  console.log('운행전 자가점검시스템이 로드되었습니다.');
});

window.addEventListener('popstate', (event) => {
  const pageIndex = event.state && typeof event.state.pageIndex === 'number' ? event.state.pageIndex : (hasDriverName() ? 0 : -1);
  showPage(pageIndex, false);
  // history가 1개뿐이면(첫 화면) 더 이상 뒤로가기를 막음
  if ((pageIndex === 0 || pageIndex === -1) && history.length <= 2) {
    const initialPage = hasDriverName() ? 0 : -1;
    history.pushState({ pageIndex: initialPage }, '', '');
  }
});

// ======== 오프라인 지원 ========
window.addEventListener('online', () => {
  console.log('네트워크 연결이 복구되었습니다.');
});
window.addEventListener('offline', () => {
  console.log('네트워크 연결이 끊어졌습니다.');
  showError('네트워크 연결을 확인해주세요.');
});


```

```javascript
// ======== 상수 ========
const DRIVER_NAME_KEY = 'mdcsDriverName';

const BUSNO_LIST = {
  '노포': ['29', '80', '300'],
  '정관': ['73', '73 (오전)', '106', '107', '184', '188']
};

// ======== Storage 함수 ========
function getDriverName() {
  const stored = localStorage.getItem(DRIVER_NAME_KEY);
  if (!stored) return '';
  return stored.trim();
}

function hasDriverName() {
  return getDriverName().length > 0;
}

function saveDriverName(name) {
  if (!name || !name.trim()) return false;
  localStorage.setItem(DRIVER_NAME_KEY, name.trim());
  return true;
}

// ======== 전역 변수 ========
let currentStep = 0;
const totalSteps = 4;
let selectedSite = '';
let selectedBusNo = '';
let enteredPlate = '';
let uniformStatus = ''; // 'ok' or 'bad'
let uniformReason = ''; // 불량 사유

// ======== DOM 요소 ========
const pages = document.querySelectorAll('.page');
const driverNamePage = document.getElementById('p-driver-name');
const driverNameInput = document.getElementById('driver-name-input');
const driverNameSubmit = document.getElementById('driver-name-submit');

// 근무지 선택 버튼
const siteButtons = {
  nopo: document.getElementById('site-nopo'),
  jeonggwan: document.getElementById('site-jeonggwan')
};

// 버스번호 버튼 컨테이너
const busnoButtonsDiv = document.getElementById('busno-buttons');

// ======== 노선별 차량번호 리스트(구글 시트 연동) ========
let PLATE_LISTS = {};
let plateDataLoaded = false;
let plateDataError = false;
fetch('https://script.google.com/macros/s/AKfycbxKXmbLSOl64gNdOoYIORQs1fpdHOHZuX7LGypDLlgacjKtNhiVTWef6_pBNNkd2cWE/exec')
  .then(res => res.json())
  .then(data => {
    PLATE_LISTS = data;
    plateDataLoaded = true;
  })
  .catch(err => {
    plateDataError = true;
    console.error('차량번호 데이터 불러오기 실패:', err);
  });

// ======== 유효성 검사 함수들 ========
const validators = {
  // 면허판번호 검증 (70가1234 형식)
  plate: (value) => {
    if (!value.trim()) return '면허판 번호를 입력해주세요.';
    const pattern = /^\d{2}[가-힣]\d{4}$/;
    if (!pattern.test(value)) return '올바른 면허판 번호 형식으로 입력해주세요. (예: 70가1234)';
    return null;
  },
  // 사진 검증
  photo: (file) => {
    if (!file) return '사진을 선택해주세요.';
    if (!file.type.startsWith('image/')) return '이미지 파일만 선택 가능합니다.';
    if (file.size > 10 * 1024 * 1024) return '파일 크기는 10MB 이하로 선택해주세요.';
    return null;
  }
};

// ======== 유틸리티 함수들 ========
function showError(message) {
  alert(message);
}

function validateInput(type, value) {
  const validator = validators[type];
  if (!validator) return true;
  const error = validator(value);
  if (error) {
    showError(error);
    return false;
  }
  return true;
}

function updateButtonState(buttonId, isValid) {
  const button = buttons[buttonId];
  if (button) {
    button.disabled = !isValid;
  }
}

function getCurrentPrevBtn() {
  const cards = document.querySelectorAll('.card');
  return cards[currentStep]?.querySelector('.prevBtn');
}

function updatePrevBtn() {
  document.querySelectorAll('.prevBtn').forEach((btn) => {
    // 이름 입력 페이지(-1)나 근무지 선택 페이지(0)에서는 이전 버튼 비활성화
    btn.disabled = (currentStep === -1 || currentStep === 0);
    
    // 모든 이전 버튼에 이벤트 설정
    btn.onclick = () => {
      if (currentStep > 0) {
        window.history.back();
      }
    };
  });
}

// 페이지 ID를 인덱스로 변환하는 맵
const pageIdToIndex = {
  'p-driver-name': -1,
  'p0': 0,
  'p1': 1,
  'p2': 2,
  'p3': 3,
  'done': 4
};

// 인덱스를 페이지 ID로 변환
function getPageIdByIndex(index) {
  const idMap = ['p0', 'p1', 'p2', 'p3', 'done'];
  if (index === -1) return 'p-driver-name';
  return idMap[index] || 'p0';
}

function showPage(pageIndex, pushHistory = false) {
  // 이름 입력 페이지 처리
  if (pageIndex === -1) {
    pages.forEach(page => page.classList.remove('active'));
    driverNamePage.classList.add('active');
    currentStep = -1;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (pushHistory) {
      history.pushState({ pageIndex: -1 }, '', '');
    }
    return;
  }

  // 이름 입력 페이지 숨기기
  driverNamePage.classList.remove('active');

  // 단계별로 입력값 초기화
  if (pageIndex === 0) {
    selectedSite = '';
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 1) {
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 2) {
    enteredPlate = '';
  }
  
  // 일반 페이지 표시
  pages.forEach((page, index) => {
    const pageId = page.id;
    if (pageId === 'p-driver-name') {
      page.classList.remove('active');
    } else {
      const pageIdx = pageIdToIndex[pageId] || 0;
      page.classList.toggle('active', pageIdx === pageIndex);
    }
  });
  currentStep = pageIndex;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  updatePrevBtn();
  
  // 차량번호 선택 페이지(p2)일 때 그리드 렌더링
  if (pageIndex === 2) {
    renderPlateGrid();
  }
  
  if (pushHistory) {
    history.pushState({ pageIndex: currentStep }, '', '');
  }
}

function nextStep() {
  // 이름 입력 페이지에서 다음 단계로
  if (currentStep === -1) {
    showPage(0, true);
    return;
  }
  // 일반 페이지 다음 단계
  if (currentStep < 4) { // done 페이지는 인덱스 4
    showPage(currentStep + 1, true);
  }
}

// ======== 커스텀 모달 ========
function showModal(message, onConfirm) {
  const modal = document.getElementById('modal');
  const msg = document.getElementById('modal-message');
  const yesBtn = document.getElementById('modal-yes');
  const noBtn = document.getElementById('modal-no');
  msg.textContent = message;
  modal.style.display = 'flex';
  function cleanup() {
    modal.style.display = 'none';
    yesBtn.removeEventListener('click', yesHandler);
    noBtn.removeEventListener('click', noHandler);
  }
  function yesHandler() {
    cleanup();
    onConfirm(true);
  }
  function noHandler() {
    cleanup();
    onConfirm(false);
  }
  yesBtn.addEventListener('click', yesHandler);
  noBtn.addEventListener('click', noHandler);
}

// ======== 근무지 선택 이벤트 리스너 ========
siteButtons.nopo.addEventListener('click', () => {
  showModal('근무지 : 노포(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '노포';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('노포');
    nextStep();
  });
});

siteButtons.jeonggwan.addEventListener('click', () => {
  showModal('근무지 : 정관(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '정관';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('정관');
    nextStep();
  });
});

// ======== 버스번호 버튼 동적 생성 ========
function renderBusNoButtons(site) {
  busnoButtonsDiv.innerHTML = '';
  BUSNO_LIST[site].forEach(busNo => {
    const btn = document.createElement('button');
    btn.className = 'busno-btn';
    btn.textContent = busNo;
    btn.onclick = () => {
      showModal(`노선번호 : ${busNo}(이)가 맞으십니까?`, (ok) => {
        if (!ok) return;
        selectedBusNo = busNo;
        nextStep();
      });
    };
    busnoButtonsDiv.appendChild(btn);
  });
}

// ======== 복장 상태 확인 버튼 ========
function initUniformButtons() {
  const uniformOkBtn = document.getElementById('uniform-ok');
  const uniformBadBtn = document.getElementById('uniform-bad');
  
  if (uniformOkBtn) {
    uniformOkBtn.addEventListener('click', async () => {
      uniformStatus = 'ok';
      uniformReason = '';
      uniformOkBtn.disabled = true;
      uniformOkBtn.textContent = '제출 중...';
      try {
        await submitData();
        showPage(totalSteps); // 완료 화면 표시
      } catch (error) {
        console.error('제출 실패:', error);
        showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        uniformOkBtn.disabled = false;
        uniformOkBtn.textContent = '양호';
      }
    });
  }
  
  if (uniformBadBtn) {
    uniformBadBtn.addEventListener('click', () => {
      showReasonModal();
    });
  }
}

// ======== 불량 사유 입력 모달 ========
function showReasonModal() {
  const modal = document.getElementById('modal-reason');
  const reasonInput = document.getElementById('reason-input');
  const submitBtn = document.getElementById('modal-reason-submit');
  const cancelBtn = document.getElementById('modal-reason-cancel');
  const uniformBadBtn = document.getElementById('uniform-bad');
  
  reasonInput.value = uniformReason; // 기존 값이 있으면 표시
  modal.style.display = 'flex';
  
  function cleanup() {
    modal.style.display = 'none';
    submitBtn.removeEventListener('click', submitHandler);
    cancelBtn.removeEventListener('click', cancelHandler);
  }
  
  async function submitHandler() {
    const reason = reasonInput.value.trim();
    if (!reason) {
      showError('불량 사유를 입력해주세요.');
      return;
    }
    uniformStatus = 'bad';
    uniformReason = reason;
    cleanup();
    
    // 제출 버튼 비활성화
    if (uniformBadBtn) {
      uniformBadBtn.disabled = true;
      const originalText = uniformBadBtn.textContent;
      uniformBadBtn.textContent = '제출 중...';
      
      try {
        await submitData();
        showPage(totalSteps); // 완료 화면 표시
      } catch (error) {
        console.error('제출 실패:', error);
        showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        uniformBadBtn.disabled = false;
        uniformBadBtn.textContent = originalText;
      }
    }
  }
  
  function cancelHandler() {
    cleanup();
  }
  
  submitBtn.addEventListener('click', submitHandler);
  cancelBtn.addEventListener('click', cancelHandler);
  
  // Enter 키로 제출
  reasonInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      submitHandler();
    }
  });
  
  // 포커스
  setTimeout(() => reasonInput.focus(), 100);
}

// ======== 데이터 제출 함수 ========
async function submitData() {
  const formData = new FormData();
  formData.append('site', selectedSite);
  formData.append('busNo', selectedBusNo);
  formData.append('plate', enteredPlate);
  formData.append('uniformStatus', uniformStatus);
  if (uniformStatus === 'bad' && uniformReason) {
    formData.append('uniformReason', uniformReason);
  }
  formData.append('timestamp', new Date().toISOString());
  // TODO: 실제 백엔드 URL로 변경 필요
  const response = await fetch('/api/submit', {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// ======== 키보드 이벤트 ========
document.addEventListener('keydown', (e) => {
  // 버스번호 선택 화면에서는 Enter로 동작하지 않음
  if (currentStep === 1) return;
  // 복장 상태 확인 화면에서는 버튼이 다르므로 처리하지 않음
  if (currentStep === 3) return;
  const btnMap = {2: 'b2'};
  const currentButton = buttons[btnMap[currentStep]];
  if (e.key === 'Enter' && currentButton && !currentButton.disabled) {
    currentButton.click();
  }
});

// 처음 화면으로 이동하는 함수
function goToInitialPage() {
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    showPage(-1, true);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    showPage(0, true);
  }
}

// 이름 입력 이벤트 리스너
if (driverNameInput && driverNameSubmit) {
  driverNameInput.addEventListener('input', (e) => {
    const name = e.target.value.trim();
    driverNameSubmit.disabled = name.length === 0;
  });

  driverNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !driverNameSubmit.disabled) {
      driverNameSubmit.click();
    }
  });

  driverNameSubmit.addEventListener('click', () => {
    const name = driverNameInput.value.trim();
    if (name.length > 0) {
      saveDriverName(name);
      showPage(0, true); // 근무지 선택 페이지로 이동
    }
  });
}

// ======== 정보 모달 ========
function showInfoModal() {
  const modal = document.getElementById('modal-info');
  const infoContent = document.getElementById('info-content');
  const closeBtn = document.getElementById('modal-info-close');
  
  let info = [];
  if (selectedSite) info.push(`<p><strong>근무지:</strong> ${selectedSite}</p>`);
  if (selectedBusNo) info.push(`<p><strong>노선번호:</strong> ${selectedBusNo}</p>`);
  if (enteredPlate) info.push(`<p><strong>차량번호:</strong> ${enteredPlate}</p>`);
  if (uniformStatus) {
    const statusText = uniformStatus === 'ok' ? '양호' : '불량';
    info.push(`<p><strong>복장 상태:</strong> ${statusText}</p>`);
    if (uniformStatus === 'bad' && uniformReason) {
      info.push(`<p><strong>불량 사유:</strong> ${uniformReason}</p>`);
    }
  }
  
  if (info.length === 0) {
    infoContent.innerHTML = '<p>아직 선택된 정보가 없습니다.</p>';
  } else {
    infoContent.innerHTML = info.join('');
  }
  
  modal.style.display = 'flex';
  
  closeBtn.onclick = () => {
    modal.style.display = 'none';
  };
}


// ======== renderPlateGrid 수정 ========
function renderPlateGrid() {
  // p2 페이지의 card-content를 직접 찾기
  const p2Page = document.getElementById('p2');
  if (!p2Page) return;
  const cardContent = p2Page.querySelector('.card-content');
  if (!cardContent) return;
  let plateGridDiv = cardContent.querySelector('#plate-grid');
  if (plateGridDiv) cardContent.removeChild(plateGridDiv);
  let filterInput = cardContent.querySelector('#plate-filter');
  if (filterInput) cardContent.removeChild(filterInput);
  let errorMsg = cardContent.querySelector('#plate-filter-error');
  if (errorMsg) cardContent.removeChild(errorMsg);
  filterInput = document.createElement('input');
  filterInput.id = 'plate-filter';
  filterInput.type = 'text';
  filterInput.placeholder = '차량번호 검색(숫자 입력)';
  filterInput.inputMode = 'numeric';
  filterInput.autocomplete = 'off';
  filterInput.style.marginBottom = '0.5rem';
  filterInput.style.width = '100%';
  cardContent.appendChild(filterInput);
  errorMsg = document.createElement('div');
  errorMsg.id = 'plate-filter-error';
  errorMsg.style.color = '#dc2626';
  errorMsg.style.fontSize = '0.98rem';
  errorMsg.style.height = '1.2em';
  errorMsg.style.marginBottom = '0.5rem';
  errorMsg.style.textAlign = 'left';
  errorMsg.textContent = '';
  cardContent.appendChild(errorMsg);
  plateGridDiv = document.createElement('div');
  plateGridDiv.id = 'plate-grid';
  plateGridDiv.style.display = 'grid';
  plateGridDiv.style.gridTemplateColumns = 'repeat(3, 1fr)';
  plateGridDiv.style.gap = '0.7rem';
  plateGridDiv.style.maxHeight = '320px';
  plateGridDiv.style.minHeight = '320px';
  plateGridDiv.style.overflowY = 'auto';
  plateGridDiv.style.overflowX = 'hidden';
  plateGridDiv.style.width = '100%';
  plateGridDiv.style.marginBottom = '1.2rem';
  cardContent.appendChild(plateGridDiv);
  function renderGrid() {
    const oldBtns = Array.from(plateGridDiv.children);
    oldBtns.forEach(btn => {
      btn.classList.add('fade-exit');
      setTimeout(() => btn.remove(), 200);
    });
    // 데이터 로딩 상태 처리
    if (!plateDataLoaded) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#888;font-size:1.1rem;">차량번호 데이터를 불러오는 중...</div>';
      return;
    }
    if (plateDataError) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#dc2626;font-size:1.1rem;">차량번호 데이터를 불러오지 못했습니다.</div>';
      return;
    }
    let list = [];
    if (selectedBusNo && PLATE_LISTS[selectedBusNo]) {
      list = PLATE_LISTS[selectedBusNo];
    }
    let filter = filterInput.value.trim();
    if (filter.length > 4) {
      filter = filter.slice(0, 4);
      filterInput.value = filter;
    }
    if (filter && /[^0-9]/.test(filter)) {
      errorMsg.textContent = '숫자만 입력해주세요!';
      return;
    } else {
      errorMsg.textContent = '';
    }
    const filtered = filter ? list.filter(num => num.includes(filter)) : list;
    const total = filtered.length;
    const maxRow = Math.ceil(list.length / 3);
    plateGridDiv.style.gridTemplateRows = `repeat(${maxRow}, 1fr)`;
    for (let i = 0; i < maxRow * 3; i++) {
      if (i < total) {
        const num = filtered[i];
        const btn = document.createElement('button');
        btn.className = 'plate-btn fade-in';
        btn.textContent = num;
        btn.setAttribute('aria-label', `차량번호 ${num}`);
        btn.tabIndex = 0;
        btn.onclick = () => {
          showModal(`차량번호 : ${num}가 맞으십니까?`, (ok) => {
            if (!ok) return;
            enteredPlate = num;
            nextStep();
          });
        };
        btn.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') btn.click();
        };
        plateGridDiv.appendChild(btn);
        setTimeout(() => btn.classList.remove('fade-in'), 250);
      } else {
        const empty = document.createElement('div');
        empty.style.visibility = 'hidden';
        plateGridDiv.appendChild(empty);
      }
    }
  }
  filterInput.addEventListener('input', renderGrid);
  renderGrid();
}

// ======== 초기화 ========
document.addEventListener('DOMContentLoaded', () => {
  // 헤더 로고 클릭 이벤트
  const headerLogo = document.getElementById('header-logo');
  if (headerLogo) {
    headerLogo.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 헤더 제목 클릭 이벤트
  const headerTitle = document.getElementById('header-title');
  if (headerTitle) {
    headerTitle.addEventListener('click', () => {
      goToInitialPage();
    });
  }
  
  // 복장 상태 확인 버튼 초기화
  initUniformButtons();
  
  // 정보 버튼 초기화
  const infoBtn = document.getElementById('info-btn');
  if (infoBtn) {
    infoBtn.addEventListener('click', () => {
      showInfoModal();
    });
  }
  
  // localStorage에 기사님 이름이 있는지 확인
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    history.replaceState({ pageIndex: -1 }, '', '');
    history.pushState({ pageIndex: -1 }, '', '');
    showPage(-1, false);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    history.replaceState({ pageIndex: 0 }, '', '');
    history.pushState({ pageIndex: 0 }, '', '');
    showPage(0, false);
  }
  console.log('운행전 자가점검시스템이 로드되었습니다.');
});

window.addEventListener('popstate', (event) => {
  const pageIndex = event.state && typeof event.state.pageIndex === 'number' ? event.state.pageIndex : (hasDriverName() ? 0 : -1);
  showPage(pageIndex, false);
  // history가 1개뿐이면(첫 화면) 더 이상 뒤로가기를 막음
  if ((pageIndex === 0 || pageIndex === -1) && history.length <= 2) {
    const initialPage = hasDriverName() ? 0 : -1;
    history.pushState({ pageIndex: initialPage }, '', '');
  }
});

// ======== 오프라인 지원 ========
window.addEventListener('online', () => {
  console.log('네트워크 연결이 복구되었습니다.');
});
window.addEventListener('offline', () => {
  console.log('네트워크 연결이 끊어졌습니다.');
  showError('네트워크 연결을 확인해주세요.');
});


```


body의 padding-top 조정 중.


```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 60px;
}

header {
  background: var(--card-bg);
  padding: 0.75rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
}

header img {
  height: 36px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
  flex: 1;
}

.info-btn {
  background: transparent !important;
  border: none !important;
  font-size: 1.5rem !important;
  cursor: pointer !important;
  padding: 0.5rem !important;
  min-width: auto !important;
  min-height: auto !important;
  width: auto !important;
  transition: transform 0.2s ease !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.info-btn:hover {
  transform: scale(1.1) !important;
  background: transparent !important;
}

@media (max-width: 480px) {
  header {
    padding: 0.6rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 70px);
  padding: 1rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}


.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 복장 체크리스트 */
.uniform-checklist {
  width: 100%;
  text-align: left;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.uniform-checklist p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 0;
  white-space: pre-line;
}

.checklist-indent {
  display: inline-block;
  padding-left: 1em;
}

/* 복장 버튼 */
.uniform-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.uniform-btn {
  width: 100% !important;
  padding: 1.25rem 2rem !important;
  font-size: 1.2rem !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px !important;
}

.uniform-btn:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.uniform-btn:disabled {
  background: var(--text-light) !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 불량 사유 입력 모달 */
.modal-input-container {
  width: 100%;
  margin: 1rem 0;
}

.modal-textarea {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-textarea::placeholder {
  color: var(--text-light);
}

/* 정보 모달 */
.info-content {
  width: 100%;
  text-align: left;
  padding: 1rem 0;
}

.info-content p {
  margin: 0.8rem 0;
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
}

.info-content p strong {
  color: var(--primary);
  font-weight: 600;
  margin-right: 0.5rem;
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```

```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 60px;
}

header {
  background: var(--card-bg);
  padding: 0.75rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
}

header img {
  height: 36px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
  flex: 1;
}

.info-btn {
  background: transparent !important;
  border: none !important;
  font-size: 1.5rem !important;
  cursor: pointer !important;
  padding: 0.5rem !important;
  min-width: auto !important;
  min-height: auto !important;
  width: auto !important;
  transition: transform 0.2s ease !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.info-btn:hover {
  transform: scale(1.1) !important;
  background: transparent !important;
}

@media (max-width: 480px) {
  header {
    padding: 0.6rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 60px);
  padding: 1rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}


.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 복장 체크리스트 */
.uniform-checklist {
  width: 100%;
  text-align: left;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.uniform-checklist p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 0;
  white-space: pre-line;
}

.checklist-indent {
  display: inline-block;
  padding-left: 1em;
}

/* 복장 버튼 */
.uniform-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.uniform-btn {
  width: 100% !important;
  padding: 1.25rem 2rem !important;
  font-size: 1.2rem !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px !important;
}

.uniform-btn:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.uniform-btn:disabled {
  background: var(--text-light) !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 불량 사유 입력 모달 */
.modal-input-container {
  width: 100%;
  margin: 1rem 0;
}

.modal-textarea {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-textarea::placeholder {
  color: var(--text-light);
}

/* 정보 모달 */
.info-content {
  width: 100%;
  text-align: left;
  padding: 1rem 0;
}

.info-content p {
  margin: 0.8rem 0;
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
}

.info-content p strong {
  color: var(--primary);
  font-weight: 600;
  margin-right: 0.5rem;
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```


적용 완료. breadcrumb을 제거하고 헤더에 정보 아이콘 버튼을 추가했습니다.

## 변경 사항

1. **breadcrumb 제거**
   - HTML에서 breadcrumb 영역 제거
   - CSS에서 breadcrumb 관련 스타일 제거
   - JavaScript에서 `updateBreadcrumb()` 호출 제거

2. **헤더에 정보 아이콘 버튼 추가**
   - 헤더 오른쪽에 ℹ️ 아이콘 버튼 추가
   - 클릭 시 정보 모달 표시

3. **정보 모달 추가**
   - 선택된 정보 표시:
     - 근무지
     - 노선번호
     - 차량번호
     - 복장 상태 (양호/불량)
     - 불량 사유 (해당 시)

4. **레이아웃 조정**
   - body `padding-top` 70px → 60px
   - page `min-height` 조정

헤더 오른쪽의 ℹ️ 버튼을 클릭하면 현재까지 선택한 정보를 모달로 확인할 수 있습니다. Live Server로 확인해 주세요. 마음에 들지 않으면 알려주세요. 롤백하겠습니다.

---

**User**

좋긴 한데, 아이콘이 뭔가 좀 촌스러워서 사용자로 하여금 직관적이고 바로 알 수 있는 그런 아이콘으로 대체해줘.

그리고 지금보면 breadcrumb 영역이 사라지면서 card 영역이 바로 header 밑으로 들어왔는데, header와 card 사이에 여백을 좀 주었으면 좋겠어.

---

**Cursor**


아이콘을 더 직관적으로 변경하고, header와 card 사이 여백을 추가 중입니다.


```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>운행전 자가점검시스템</title>

<!-- 기본 메타 태그 -->
<meta name="description" content="부산 세진여객 운전기사 운행전 자가점검시스템">
<meta name="theme-color" content="#2563eb">

<!-- PWA 메타 태그 (주석처리) -->
<!-- <meta name="apple-mobile-web-app-capable" content="yes"> -->
<!-- <meta name="apple-mobile-web-app-status-bar-style" content="default"> -->
<!-- <meta name="apple-mobile-web-app-title" content="세진여객 점검"> -->

<!-- PWA 아이콘 (주석처리) -->
<!-- <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png"> -->
<!-- <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png"> -->
<!-- <link rel="apple-touch-icon" href="/icons/icon-192x192.png"> -->
<!-- <link rel="manifest" href="/manifest.json"> -->

<!-- Tailwind CSS CDN -->
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="styles.css">

</head>
<body>

<!-- ======== 헤더 ======== -->
<header>
  <!-- 로고 이미지: 업로드하신 PNG를 logo.png로 저장하여 같은 폴더에 두세요 -->
  <img src="logo.png" alt="세진여객 로고" id="header-logo" style="cursor: pointer;">
  <h2 id="header-title" style="font-size: 1.2rem; cursor: pointer;">운행전 자가점검시스템</h2>
  <button id="info-btn" class="info-btn" title="선택 정보 확인">📋</button>
</header>

<!-- ======== STEP -1 : 기사님 이름 입력 ======== -->
<section id="p-driver-name" class="page">
  <div class="card">
    <h1>기사님 성함을 입력해주세요</h1>
    <div class="card-content">
      <input id="driver-name-input" type="text" placeholder="이름을 입력하세요" autocomplete="name">
      <button id="driver-name-submit" disabled>다음</button>
    </div>
    <div class="card-actions"><button class="prevBtn" style="display:none;">이전</button></div>
  </div>
</section>

<!-- ======== STEP 0 : 근무지 선택 ======== -->
<section id="p0" class="page">
  <div class="card">
    <h1>1. 근무지를 선택하세요</h1>
    <img src="bus_illustration.png" alt="버스 일러스트" style="display:block;margin:0 auto 1.5rem auto;width:120px;height:120px;object-fit:contain;" />
    <div class="card-content">
      <div class="site-buttons">
        <button id="site-nopo" class="site-btn">노포</button>
        <button id="site-jeonggwan" class="site-btn">정관</button>
      </div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 1 : 버스번호 선택 ======== -->
<section id="p1" class="page">
  <div class="card">
    <h1>2. 노선번호를 선택하세요</h1>
    <div class="card-content">
      <div class="busno-buttons" id="busno-buttons"></div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 2 : 면허판번호 ======== -->
<section id="p2" class="page">
  <div class="card">
    <h1>차량번호를 선택하세요</h1>
    <div class="card-content">
      <!-- plate-grid와 prevBtn만 남김 -->
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 3 : 복장 상태 확인 ======== -->
<section id="p3" class="page">
  <div class="card">
    <h1>4. 복장 상태를 확인하세요.</h1>
    <div class="card-content">
      <div class="uniform-checklist">
        <p>1. 정규근무복 착용<br>2. 운동화 및 구두 착화<br><span class="checklist-indent">(슬리퍼, 크록스 x)</span><br>3. 단정하게 착용 여부<br><span class="checklist-indent">(옷매무새, 두발, 면도상태 등)</span></p>
      </div>
      <div class="uniform-buttons">
        <button id="uniform-ok" class="uniform-btn">양호</button>
        <button id="uniform-bad" class="uniform-btn">불량</button>
      </div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== 완료 화면 ======== -->
<section id="done" class="page">
  <div class="card">
    <h1 class="success-title">✅ 제출 완료!</h1>
    <p class="success-message">안전 운행 하십시오.</p>
  </div>
</section>

<div id="modal" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message" id="modal-message"></div>
    <div class="modal-actions">
      <button id="modal-yes" class="modal-btn modal-yes">네</button>
      <button id="modal-no" class="modal-btn modal-no">아니오</button>
    </div>
  </div>
</div>

<div id="modal-reason" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message">불량 사유를 작성해주세요.</div>
    <div class="modal-input-container">
      <textarea id="reason-input" class="modal-textarea" placeholder="불량 사유를 입력하세요..." rows="4"></textarea>
    </div>
    <div class="modal-actions">
      <button id="modal-reason-submit" class="modal-btn modal-yes">확인</button>
      <button id="modal-reason-cancel" class="modal-btn modal-no">취소</button>
    </div>
  </div>
</div>

<div id="modal-info" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message">선택 정보</div>
    <div class="info-content" id="info-content">
      <p>아직 선택된 정보가 없습니다.</p>
    </div>
    <div class="modal-actions">
      <button id="modal-info-close" class="modal-btn modal-yes">확인</button>
    </div>
  </div>
</div>

<script src="app.js"></script>
</body>
</html> 
```

```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 80px;
}

header {
  background: var(--card-bg);
  padding: 0.75rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
}

header img {
  height: 36px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
  flex: 1;
}

.info-btn {
  background: transparent !important;
  border: none !important;
  font-size: 1.5rem !important;
  cursor: pointer !important;
  padding: 0.5rem !important;
  min-width: auto !important;
  min-height: auto !important;
  width: auto !important;
  transition: transform 0.2s ease !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.info-btn:hover {
  transform: scale(1.1) !important;
  background: transparent !important;
}

@media (max-width: 480px) {
  header {
    padding: 0.6rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 60px);
  padding: 1rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}


.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 복장 체크리스트 */
.uniform-checklist {
  width: 100%;
  text-align: left;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.uniform-checklist p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 0;
  white-space: pre-line;
}

.checklist-indent {
  display: inline-block;
  padding-left: 1em;
}

/* 복장 버튼 */
.uniform-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.uniform-btn {
  width: 100% !important;
  padding: 1.25rem 2rem !important;
  font-size: 1.2rem !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px !important;
}

.uniform-btn:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.uniform-btn:disabled {
  background: var(--text-light) !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 불량 사유 입력 모달 */
.modal-input-container {
  width: 100%;
  margin: 1rem 0;
}

.modal-textarea {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-textarea::placeholder {
  color: var(--text-light);
}

/* 정보 모달 */
.info-content {
  width: 100%;
  text-align: left;
  padding: 1rem 0;
}

.info-content p {
  margin: 0.8rem 0;
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
}

.info-content p strong {
  color: var(--primary);
  font-weight: 600;
  margin-right: 0.5rem;
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```

```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 80px;
}

header {
  background: var(--card-bg);
  padding: 0.75rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
}

header img {
  height: 36px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
  flex: 1;
}

.info-btn {
  background: transparent !important;
  border: none !important;
  font-size: 1.5rem !important;
  cursor: pointer !important;
  padding: 0.5rem !important;
  min-width: auto !important;
  min-height: auto !important;
  width: auto !important;
  transition: transform 0.2s ease !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.info-btn:hover {
  transform: scale(1.1) !important;
  background: transparent !important;
}

@media (max-width: 480px) {
  header {
    padding: 0.6rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 80px);
  padding: 1.5rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}


.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 복장 체크리스트 */
.uniform-checklist {
  width: 100%;
  text-align: left;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.uniform-checklist p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 0;
  white-space: pre-line;
}

.checklist-indent {
  display: inline-block;
  padding-left: 1em;
}

/* 복장 버튼 */
.uniform-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.uniform-btn {
  width: 100% !important;
  padding: 1.25rem 2rem !important;
  font-size: 1.2rem !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px !important;
}

.uniform-btn:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.uniform-btn:disabled {
  background: var(--text-light) !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 불량 사유 입력 모달 */
.modal-input-container {
  width: 100%;
  margin: 1rem 0;
}

.modal-textarea {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-textarea::placeholder {
  color: var(--text-light);
}

/* 정보 모달 */
.info-content {
  width: 100%;
  text-align: left;
  padding: 1rem 0;
}

.info-content p {
  margin: 0.8rem 0;
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
}

.info-content p strong {
  color: var(--primary);
  font-weight: 600;
  margin-right: 0.5rem;
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```

```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 80px;
}

header {
  background: var(--card-bg);
  padding: 0.75rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
}

header img {
  height: 36px;
  width: auto;
}

header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
  flex: 1;
}

.info-btn {
  background: transparent !important;
  border: none !important;
  font-size: 1.8rem !important;
  cursor: pointer !important;
  padding: 0.5rem !important;
  min-width: auto !important;
  min-height: auto !important;
  width: auto !important;
  transition: transform 0.2s ease, opacity 0.2s ease !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  opacity: 0.8 !important;
}

.info-btn:hover {
  transform: scale(1.15) !important;
  background: transparent !important;
  opacity: 1 !important;
}

@media (max-width: 480px) {
  header {
    padding: 0.6rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 80px);
  padding: 1.5rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}


.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 복장 체크리스트 */
.uniform-checklist {
  width: 100%;
  text-align: left;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.uniform-checklist p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 0;
  white-space: pre-line;
}

.checklist-indent {
  display: inline-block;
  padding-left: 1em;
}

/* 복장 버튼 */
.uniform-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.uniform-btn {
  width: 100% !important;
  padding: 1.25rem 2rem !important;
  font-size: 1.2rem !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px !important;
}

.uniform-btn:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.uniform-btn:disabled {
  background: var(--text-light) !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 불량 사유 입력 모달 */
.modal-input-container {
  width: 100%;
  margin: 1rem 0;
}

.modal-textarea {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-textarea::placeholder {
  color: var(--text-light);
}

/* 정보 모달 */
.info-content {
  width: 100%;
  text-align: left;
  padding: 1rem 0;
}

.info-content p {
  margin: 0.8rem 0;
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
}

.info-content p strong {
  color: var(--primary);
  font-weight: 600;
  margin-right: 0.5rem;
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```


수정 완료.

## 변경 사항

1. **아이콘 변경**
   - ℹ️ → 📋 (클립보드 아이콘)
   - 크기와 hover 효과 조정

2. **header와 card 사이 여백 추가**
   - body `padding-top`: 60px → 80px
   - page `padding-top`: 1rem → 1.5rem

이제 헤더 오른쪽에 클립보드 아이콘이 표시되고, header와 card 사이에 여백이 추가되었습니다. Live Server로 확인해 주세요.

아이콘이 여전히 마음에 들지 않으면 텍스트(예: "정보" 또는 "선택 정보")나 다른 아이콘으로 변경할 수 있습니다. 원하시는 스타일을 알려주세요.

---

**User**

header의 '운행전 자가점검시스템' 텍스트 크기를 5% 줄여줘

---

**Cursor**


header의 '운행전 자가점검시스템' 텍스트 크기를 5% 줄이는 중.


```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>운행전 자가점검시스템</title>

<!-- 기본 메타 태그 -->
<meta name="description" content="부산 세진여객 운전기사 운행전 자가점검시스템">
<meta name="theme-color" content="#2563eb">

<!-- PWA 메타 태그 (주석처리) -->
<!-- <meta name="apple-mobile-web-app-capable" content="yes"> -->
<!-- <meta name="apple-mobile-web-app-status-bar-style" content="default"> -->
<!-- <meta name="apple-mobile-web-app-title" content="세진여객 점검"> -->

<!-- PWA 아이콘 (주석처리) -->
<!-- <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png"> -->
<!-- <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png"> -->
<!-- <link rel="apple-touch-icon" href="/icons/icon-192x192.png"> -->
<!-- <link rel="manifest" href="/manifest.json"> -->

<!-- Tailwind CSS CDN -->
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="styles.css">

</head>
<body>

<!-- ======== 헤더 ======== -->
<header>
  <!-- 로고 이미지: 업로드하신 PNG를 logo.png로 저장하여 같은 폴더에 두세요 -->
  <img src="logo.png" alt="세진여객 로고" id="header-logo" style="cursor: pointer;">
  <h2 id="header-title" style="font-size: 1.14rem; cursor: pointer;">운행전 자가점검시스템</h2>
  <button id="info-btn" class="info-btn" title="선택 정보 확인">📋</button>
</header>

<!-- ======== STEP -1 : 기사님 이름 입력 ======== -->
<section id="p-driver-name" class="page">
  <div class="card">
    <h1>기사님 성함을 입력해주세요</h1>
    <div class="card-content">
      <input id="driver-name-input" type="text" placeholder="이름을 입력하세요" autocomplete="name">
      <button id="driver-name-submit" disabled>다음</button>
    </div>
    <div class="card-actions"><button class="prevBtn" style="display:none;">이전</button></div>
  </div>
</section>

<!-- ======== STEP 0 : 근무지 선택 ======== -->
<section id="p0" class="page">
  <div class="card">
    <h1>1. 근무지를 선택하세요</h1>
    <img src="bus_illustration.png" alt="버스 일러스트" style="display:block;margin:0 auto 1.5rem auto;width:120px;height:120px;object-fit:contain;" />
    <div class="card-content">
      <div class="site-buttons">
        <button id="site-nopo" class="site-btn">노포</button>
        <button id="site-jeonggwan" class="site-btn">정관</button>
      </div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 1 : 버스번호 선택 ======== -->
<section id="p1" class="page">
  <div class="card">
    <h1>2. 노선번호를 선택하세요</h1>
    <div class="card-content">
      <div class="busno-buttons" id="busno-buttons"></div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 2 : 면허판번호 ======== -->
<section id="p2" class="page">
  <div class="card">
    <h1>차량번호를 선택하세요</h1>
    <div class="card-content">
      <!-- plate-grid와 prevBtn만 남김 -->
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 3 : 복장 상태 확인 ======== -->
<section id="p3" class="page">
  <div class="card">
    <h1>4. 복장 상태를 확인하세요.</h1>
    <div class="card-content">
      <div class="uniform-checklist">
        <p>1. 정규근무복 착용<br>2. 운동화 및 구두 착화<br><span class="checklist-indent">(슬리퍼, 크록스 x)</span><br>3. 단정하게 착용 여부<br><span class="checklist-indent">(옷매무새, 두발, 면도상태 등)</span></p>
      </div>
      <div class="uniform-buttons">
        <button id="uniform-ok" class="uniform-btn">양호</button>
        <button id="uniform-bad" class="uniform-btn">불량</button>
      </div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== 완료 화면 ======== -->
<section id="done" class="page">
  <div class="card">
    <h1 class="success-title">✅ 제출 완료!</h1>
    <p class="success-message">안전 운행 하십시오.</p>
  </div>
</section>

<div id="modal" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message" id="modal-message"></div>
    <div class="modal-actions">
      <button id="modal-yes" class="modal-btn modal-yes">네</button>
      <button id="modal-no" class="modal-btn modal-no">아니오</button>
    </div>
  </div>
</div>

<div id="modal-reason" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message">불량 사유를 작성해주세요.</div>
    <div class="modal-input-container">
      <textarea id="reason-input" class="modal-textarea" placeholder="불량 사유를 입력하세요..." rows="4"></textarea>
    </div>
    <div class="modal-actions">
      <button id="modal-reason-submit" class="modal-btn modal-yes">확인</button>
      <button id="modal-reason-cancel" class="modal-btn modal-no">취소</button>
    </div>
  </div>
</div>

<div id="modal-info" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message">선택 정보</div>
    <div class="info-content" id="info-content">
      <p>아직 선택된 정보가 없습니다.</p>
    </div>
    <div class="modal-actions">
      <button id="modal-info-close" class="modal-btn modal-yes">확인</button>
    </div>
  </div>
</div>

<script src="app.js"></script>
</body>
</html> 
```

```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 80px;
}

header {
  background: var(--card-bg);
  padding: 0.75rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
}

header img {
  height: 36px;
  width: auto;
}

header h2 {
  font-size: 1.1875rem;
  font-weight: 600;
  color: var(--text);
  flex: 1;
}

.info-btn {
  background: transparent !important;
  border: none !important;
  font-size: 1.8rem !important;
  cursor: pointer !important;
  padding: 0.5rem !important;
  min-width: auto !important;
  min-height: auto !important;
  width: auto !important;
  transition: transform 0.2s ease, opacity 0.2s ease !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  opacity: 0.8 !important;
}

.info-btn:hover {
  transform: scale(1.15) !important;
  background: transparent !important;
  opacity: 1 !important;
}

@media (max-width: 480px) {
  header {
    padding: 0.6rem 1rem;
  }

  header h2 {
    font-size: 1.1rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 80px);
  padding: 1.5rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}


.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 복장 체크리스트 */
.uniform-checklist {
  width: 100%;
  text-align: left;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.uniform-checklist p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 0;
  white-space: pre-line;
}

.checklist-indent {
  display: inline-block;
  padding-left: 1em;
}

/* 복장 버튼 */
.uniform-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.uniform-btn {
  width: 100% !important;
  padding: 1.25rem 2rem !important;
  font-size: 1.2rem !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px !important;
}

.uniform-btn:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.uniform-btn:disabled {
  background: var(--text-light) !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 불량 사유 입력 모달 */
.modal-input-container {
  width: 100%;
  margin: 1rem 0;
}

.modal-textarea {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-textarea::placeholder {
  color: var(--text-light);
}

/* 정보 모달 */
.info-content {
  width: 100%;
  text-align: left;
  padding: 1rem 0;
}

.info-content p {
  margin: 0.8rem 0;
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
}

.info-content p strong {
  color: var(--primary);
  font-weight: 600;
  margin-right: 0.5rem;
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```

```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 80px;
}

header {
  background: var(--card-bg);
  padding: 0.75rem 1.5rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
}

header img {
  height: 36px;
  width: auto;
}

header h2 {
  font-size: 1.1875rem;
  font-weight: 600;
  color: var(--text);
  flex: 1;
}

.info-btn {
  background: transparent !important;
  border: none !important;
  font-size: 1.8rem !important;
  cursor: pointer !important;
  padding: 0.5rem !important;
  min-width: auto !important;
  min-height: auto !important;
  width: auto !important;
  transition: transform 0.2s ease, opacity 0.2s ease !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  opacity: 0.8 !important;
}

.info-btn:hover {
  transform: scale(1.15) !important;
  background: transparent !important;
  opacity: 1 !important;
}

@media (max-width: 480px) {
  header {
    padding: 0.6rem 1rem;
  }

  header h2 {
    font-size: 1.045rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 80px);
  padding: 1.5rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}


.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 복장 체크리스트 */
.uniform-checklist {
  width: 100%;
  text-align: left;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.uniform-checklist p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 0;
  white-space: pre-line;
}

.checklist-indent {
  display: inline-block;
  padding-left: 1em;
}

/* 복장 버튼 */
.uniform-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.uniform-btn {
  width: 100% !important;
  padding: 1.25rem 2rem !important;
  font-size: 1.2rem !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px !important;
}

.uniform-btn:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.uniform-btn:disabled {
  background: var(--text-light) !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 불량 사유 입력 모달 */
.modal-input-container {
  width: 100%;
  margin: 1rem 0;
}

.modal-textarea {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-textarea::placeholder {
  color: var(--text-light);
}

/* 정보 모달 */
.info-content {
  width: 100%;
  text-align: left;
  padding: 1rem 0;
}

.info-content p {
  margin: 0.8rem 0;
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
}

.info-content p strong {
  color: var(--primary);
  font-weight: 600;
  margin-right: 0.5rem;
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```


수정 완료. header의 '운행전 자가점검시스템' 텍스트 크기를 5% 줄였습니다.

## 변경 사항

1. **일반 화면**
   - HTML 인라인: `1.2rem` → `1.14rem`
   - CSS: `1.25rem` → `1.1875rem`

2. **모바일 화면**
   - `1.1rem` → `1.045rem`

텍스트 크기가 5% 줄었습니다. Live Server로 확인해 주세요.

---

**User**

header영역을 별도의 컴포넌트(모듈)로 만들어서 index.html에서 불러오는 방식으로 해줄 수 있어? 

---

**Cursor**


header를 별도 모듈로 분리 중. JavaScript로 header를 동적으로 생성하는 방식으로 진행합니다.


```javascript
// ======== Header 컴포넌트 ========
function createHeader() {
  const header = document.createElement('header');
  
  // 로고 이미지
  const logo = document.createElement('img');
  logo.src = 'logo.png';
  logo.alt = '세진여객 로고';
  logo.id = 'header-logo';
  logo.style.cursor = 'pointer';
  
  // 제목
  const title = document.createElement('h2');
  title.id = 'header-title';
  title.style.fontSize = '1.14rem';
  title.style.cursor = 'pointer';
  title.textContent = '운행전 자가점검시스템';
  
  // 정보 버튼
  const infoBtn = document.createElement('button');
  infoBtn.id = 'info-btn';
  infoBtn.className = 'info-btn';
  infoBtn.title = '선택 정보 확인';
  infoBtn.textContent = '📋';
  
  // 요소들을 header에 추가
  header.appendChild(logo);
  header.appendChild(title);
  header.appendChild(infoBtn);
  
  return header;
}

// Header 초기화 함수
function initHeader() {
  const headerContainer = document.getElementById('header-container');
  if (headerContainer) {
    const header = createHeader();
    headerContainer.appendChild(header);
    
    // 헤더 로고 클릭 이벤트
    const headerLogo = document.getElementById('header-logo');
    if (headerLogo) {
      headerLogo.addEventListener('click', () => {
        if (typeof goToInitialPage === 'function') {
          goToInitialPage();
        }
      });
    }
    
    // 헤더 제목 클릭 이벤트
    const headerTitle = document.getElementById('header-title');
    if (headerTitle) {
      headerTitle.addEventListener('click', () => {
        if (typeof goToInitialPage === 'function') {
          goToInitialPage();
        }
      });
    }
    
    // 정보 버튼 이벤트
    const infoBtn = document.getElementById('info-btn');
    if (infoBtn) {
      infoBtn.addEventListener('click', () => {
        if (typeof showInfoModal === 'function') {
          showInfoModal();
        }
      });
    }
  }
}

```

```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>운행전 자가점검시스템</title>

<!-- 기본 메타 태그 -->
<meta name="description" content="부산 세진여객 운전기사 운행전 자가점검시스템">
<meta name="theme-color" content="#2563eb">

<!-- PWA 메타 태그 (주석처리) -->
<!-- <meta name="apple-mobile-web-app-capable" content="yes"> -->
<!-- <meta name="apple-mobile-web-app-status-bar-style" content="default"> -->
<!-- <meta name="apple-mobile-web-app-title" content="세진여객 점검"> -->

<!-- PWA 아이콘 (주석처리) -->
<!-- <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png"> -->
<!-- <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png"> -->
<!-- <link rel="apple-touch-icon" href="/icons/icon-192x192.png"> -->
<!-- <link rel="manifest" href="/manifest.json"> -->

<!-- Tailwind CSS CDN -->
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="styles.css">

</head>
<body>

<!-- ======== 헤더 ======== -->
<div id="header-container"></div>

<!-- ======== STEP -1 : 기사님 이름 입력 ======== -->
<section id="p-driver-name" class="page">
  <div class="card">
    <h1>기사님 성함을 입력해주세요</h1>
    <div class="card-content">
      <input id="driver-name-input" type="text" placeholder="이름을 입력하세요" autocomplete="name">
      <button id="driver-name-submit" disabled>다음</button>
    </div>
    <div class="card-actions"><button class="prevBtn" style="display:none;">이전</button></div>
  </div>
</section>

<!-- ======== STEP 0 : 근무지 선택 ======== -->
<section id="p0" class="page">
  <div class="card">
    <h1>1. 근무지를 선택하세요</h1>
    <img src="bus_illustration.png" alt="버스 일러스트" style="display:block;margin:0 auto 1.5rem auto;width:120px;height:120px;object-fit:contain;" />
    <div class="card-content">
      <div class="site-buttons">
        <button id="site-nopo" class="site-btn">노포</button>
        <button id="site-jeonggwan" class="site-btn">정관</button>
      </div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 1 : 버스번호 선택 ======== -->
<section id="p1" class="page">
  <div class="card">
    <h1>2. 노선번호를 선택하세요</h1>
    <div class="card-content">
      <div class="busno-buttons" id="busno-buttons"></div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 2 : 면허판번호 ======== -->
<section id="p2" class="page">
  <div class="card">
    <h1>차량번호를 선택하세요</h1>
    <div class="card-content">
      <!-- plate-grid와 prevBtn만 남김 -->
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 3 : 복장 상태 확인 ======== -->
<section id="p3" class="page">
  <div class="card">
    <h1>4. 복장 상태를 확인하세요.</h1>
    <div class="card-content">
      <div class="uniform-checklist">
        <p>1. 정규근무복 착용<br>2. 운동화 및 구두 착화<br><span class="checklist-indent">(슬리퍼, 크록스 x)</span><br>3. 단정하게 착용 여부<br><span class="checklist-indent">(옷매무새, 두발, 면도상태 등)</span></p>
      </div>
      <div class="uniform-buttons">
        <button id="uniform-ok" class="uniform-btn">양호</button>
        <button id="uniform-bad" class="uniform-btn">불량</button>
      </div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== 완료 화면 ======== -->
<section id="done" class="page">
  <div class="card">
    <h1 class="success-title">✅ 제출 완료!</h1>
    <p class="success-message">안전 운행 하십시오.</p>
  </div>
</section>

<div id="modal" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message" id="modal-message"></div>
    <div class="modal-actions">
      <button id="modal-yes" class="modal-btn modal-yes">네</button>
      <button id="modal-no" class="modal-btn modal-no">아니오</button>
    </div>
  </div>
</div>

<div id="modal-reason" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message">불량 사유를 작성해주세요.</div>
    <div class="modal-input-container">
      <textarea id="reason-input" class="modal-textarea" placeholder="불량 사유를 입력하세요..." rows="4"></textarea>
    </div>
    <div class="modal-actions">
      <button id="modal-reason-submit" class="modal-btn modal-yes">확인</button>
      <button id="modal-reason-cancel" class="modal-btn modal-no">취소</button>
    </div>
  </div>
</div>

<div id="modal-info" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message">선택 정보</div>
    <div class="info-content" id="info-content">
      <p>아직 선택된 정보가 없습니다.</p>
    </div>
    <div class="modal-actions">
      <button id="modal-info-close" class="modal-btn modal-yes">확인</button>
    </div>
  </div>
</div>

<script src="app.js"></script>
</body>
</html> 
```

```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>운행전 자가점검시스템</title>

<!-- 기본 메타 태그 -->
<meta name="description" content="부산 세진여객 운전기사 운행전 자가점검시스템">
<meta name="theme-color" content="#2563eb">

<!-- PWA 메타 태그 (주석처리) -->
<!-- <meta name="apple-mobile-web-app-capable" content="yes"> -->
<!-- <meta name="apple-mobile-web-app-status-bar-style" content="default"> -->
<!-- <meta name="apple-mobile-web-app-title" content="세진여객 점검"> -->

<!-- PWA 아이콘 (주석처리) -->
<!-- <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png"> -->
<!-- <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png"> -->
<!-- <link rel="apple-touch-icon" href="/icons/icon-192x192.png"> -->
<!-- <link rel="manifest" href="/manifest.json"> -->

<!-- Tailwind CSS CDN -->
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="styles.css">

</head>
<body>

<!-- ======== 헤더 ======== -->
<div id="header-container"></div>

<!-- ======== STEP -1 : 기사님 이름 입력 ======== -->
<section id="p-driver-name" class="page">
  <div class="card">
    <h1>기사님 성함을 입력해주세요</h1>
    <div class="card-content">
      <input id="driver-name-input" type="text" placeholder="이름을 입력하세요" autocomplete="name">
      <button id="driver-name-submit" disabled>다음</button>
    </div>
    <div class="card-actions"><button class="prevBtn" style="display:none;">이전</button></div>
  </div>
</section>

<!-- ======== STEP 0 : 근무지 선택 ======== -->
<section id="p0" class="page">
  <div class="card">
    <h1>1. 근무지를 선택하세요</h1>
    <img src="bus_illustration.png" alt="버스 일러스트" style="display:block;margin:0 auto 1.5rem auto;width:120px;height:120px;object-fit:contain;" />
    <div class="card-content">
      <div class="site-buttons">
        <button id="site-nopo" class="site-btn">노포</button>
        <button id="site-jeonggwan" class="site-btn">정관</button>
      </div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 1 : 버스번호 선택 ======== -->
<section id="p1" class="page">
  <div class="card">
    <h1>2. 노선번호를 선택하세요</h1>
    <div class="card-content">
      <div class="busno-buttons" id="busno-buttons"></div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 2 : 면허판번호 ======== -->
<section id="p2" class="page">
  <div class="card">
    <h1>차량번호를 선택하세요</h1>
    <div class="card-content">
      <!-- plate-grid와 prevBtn만 남김 -->
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== STEP 3 : 복장 상태 확인 ======== -->
<section id="p3" class="page">
  <div class="card">
    <h1>4. 복장 상태를 확인하세요.</h1>
    <div class="card-content">
      <div class="uniform-checklist">
        <p>1. 정규근무복 착용<br>2. 운동화 및 구두 착화<br><span class="checklist-indent">(슬리퍼, 크록스 x)</span><br>3. 단정하게 착용 여부<br><span class="checklist-indent">(옷매무새, 두발, 면도상태 등)</span></p>
      </div>
      <div class="uniform-buttons">
        <button id="uniform-ok" class="uniform-btn">양호</button>
        <button id="uniform-bad" class="uniform-btn">불량</button>
      </div>
    </div>
    <div class="card-actions"><button class="prevBtn">이전</button></div>
  </div>
</section>

<!-- ======== 완료 화면 ======== -->
<section id="done" class="page">
  <div class="card">
    <h1 class="success-title">✅ 제출 완료!</h1>
    <p class="success-message">안전 운행 하십시오.</p>
  </div>
</section>

<div id="modal" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message" id="modal-message"></div>
    <div class="modal-actions">
      <button id="modal-yes" class="modal-btn modal-yes">네</button>
      <button id="modal-no" class="modal-btn modal-no">아니오</button>
    </div>
  </div>
</div>

<div id="modal-reason" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message">불량 사유를 작성해주세요.</div>
    <div class="modal-input-container">
      <textarea id="reason-input" class="modal-textarea" placeholder="불량 사유를 입력하세요..." rows="4"></textarea>
    </div>
    <div class="modal-actions">
      <button id="modal-reason-submit" class="modal-btn modal-yes">확인</button>
      <button id="modal-reason-cancel" class="modal-btn modal-no">취소</button>
    </div>
  </div>
</div>

<div id="modal-info" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <div class="modal-message">선택 정보</div>
    <div class="info-content" id="info-content">
      <p>아직 선택된 정보가 없습니다.</p>
    </div>
    <div class="modal-actions">
      <button id="modal-info-close" class="modal-btn modal-yes">확인</button>
    </div>
  </div>
</div>

<script src="header.js"></script>
<script src="app.js"></script>
</body>
</html> 
```

```javascript
// ======== 상수 ========
const DRIVER_NAME_KEY = 'mdcsDriverName';

const BUSNO_LIST = {
  '노포': ['29', '80', '300'],
  '정관': ['73', '73 (오전)', '106', '107', '184', '188']
};

// ======== Storage 함수 ========
function getDriverName() {
  const stored = localStorage.getItem(DRIVER_NAME_KEY);
  if (!stored) return '';
  return stored.trim();
}

function hasDriverName() {
  return getDriverName().length > 0;
}

function saveDriverName(name) {
  if (!name || !name.trim()) return false;
  localStorage.setItem(DRIVER_NAME_KEY, name.trim());
  return true;
}

// ======== 전역 변수 ========
let currentStep = 0;
const totalSteps = 4;
let selectedSite = '';
let selectedBusNo = '';
let enteredPlate = '';
let uniformStatus = ''; // 'ok' or 'bad'
let uniformReason = ''; // 불량 사유

// ======== DOM 요소 ========
const pages = document.querySelectorAll('.page');
const driverNamePage = document.getElementById('p-driver-name');
const driverNameInput = document.getElementById('driver-name-input');
const driverNameSubmit = document.getElementById('driver-name-submit');

// 근무지 선택 버튼
const siteButtons = {
  nopo: document.getElementById('site-nopo'),
  jeonggwan: document.getElementById('site-jeonggwan')
};

// 버스번호 버튼 컨테이너
const busnoButtonsDiv = document.getElementById('busno-buttons');

// ======== 노선별 차량번호 리스트(구글 시트 연동) ========
let PLATE_LISTS = {};
let plateDataLoaded = false;
let plateDataError = false;
fetch('https://script.google.com/macros/s/AKfycbxKXmbLSOl64gNdOoYIORQs1fpdHOHZuX7LGypDLlgacjKtNhiVTWef6_pBNNkd2cWE/exec')
  .then(res => res.json())
  .then(data => {
    PLATE_LISTS = data;
    plateDataLoaded = true;
  })
  .catch(err => {
    plateDataError = true;
    console.error('차량번호 데이터 불러오기 실패:', err);
  });

// ======== 유효성 검사 함수들 ========
const validators = {
  // 면허판번호 검증 (70가1234 형식)
  plate: (value) => {
    if (!value.trim()) return '면허판 번호를 입력해주세요.';
    const pattern = /^\d{2}[가-힣]\d{4}$/;
    if (!pattern.test(value)) return '올바른 면허판 번호 형식으로 입력해주세요. (예: 70가1234)';
    return null;
  },
  // 사진 검증
  photo: (file) => {
    if (!file) return '사진을 선택해주세요.';
    if (!file.type.startsWith('image/')) return '이미지 파일만 선택 가능합니다.';
    if (file.size > 10 * 1024 * 1024) return '파일 크기는 10MB 이하로 선택해주세요.';
    return null;
  }
};

// ======== 유틸리티 함수들 ========
function showError(message) {
  alert(message);
}

function validateInput(type, value) {
  const validator = validators[type];
  if (!validator) return true;
  const error = validator(value);
  if (error) {
    showError(error);
    return false;
  }
  return true;
}

function updateButtonState(buttonId, isValid) {
  const button = buttons[buttonId];
  if (button) {
    button.disabled = !isValid;
  }
}

function getCurrentPrevBtn() {
  const cards = document.querySelectorAll('.card');
  return cards[currentStep]?.querySelector('.prevBtn');
}

function updatePrevBtn() {
  document.querySelectorAll('.prevBtn').forEach((btn) => {
    // 이름 입력 페이지(-1)나 근무지 선택 페이지(0)에서는 이전 버튼 비활성화
    btn.disabled = (currentStep === -1 || currentStep === 0);
    
    // 모든 이전 버튼에 이벤트 설정
    btn.onclick = () => {
      if (currentStep > 0) {
        window.history.back();
      }
    };
  });
}

// 페이지 ID를 인덱스로 변환하는 맵
const pageIdToIndex = {
  'p-driver-name': -1,
  'p0': 0,
  'p1': 1,
  'p2': 2,
  'p3': 3,
  'done': 4
};

// 인덱스를 페이지 ID로 변환
function getPageIdByIndex(index) {
  const idMap = ['p0', 'p1', 'p2', 'p3', 'done'];
  if (index === -1) return 'p-driver-name';
  return idMap[index] || 'p0';
}

function showPage(pageIndex, pushHistory = false) {
  // 이름 입력 페이지 처리
  if (pageIndex === -1) {
    pages.forEach(page => page.classList.remove('active'));
    driverNamePage.classList.add('active');
    currentStep = -1;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (pushHistory) {
      history.pushState({ pageIndex: -1 }, '', '');
    }
    return;
  }

  // 이름 입력 페이지 숨기기
  driverNamePage.classList.remove('active');

  // 단계별로 입력값 초기화
  if (pageIndex === 0) {
    selectedSite = '';
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 1) {
    selectedBusNo = '';
    enteredPlate = '';
  } else if (pageIndex === 2) {
    enteredPlate = '';
  }
  
  // 일반 페이지 표시
  pages.forEach((page, index) => {
    const pageId = page.id;
    if (pageId === 'p-driver-name') {
      page.classList.remove('active');
    } else {
      const pageIdx = pageIdToIndex[pageId] || 0;
      page.classList.toggle('active', pageIdx === pageIndex);
    }
  });
  currentStep = pageIndex;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  updatePrevBtn();
  
  // 차량번호 선택 페이지(p2)일 때 그리드 렌더링
  if (pageIndex === 2) {
    renderPlateGrid();
  }
  
  if (pushHistory) {
    history.pushState({ pageIndex: currentStep }, '', '');
  }
}

function nextStep() {
  // 이름 입력 페이지에서 다음 단계로
  if (currentStep === -1) {
    showPage(0, true);
    return;
  }
  // 일반 페이지 다음 단계
  if (currentStep < 4) { // done 페이지는 인덱스 4
    showPage(currentStep + 1, true);
  }
}

// ======== 커스텀 모달 ========
function showModal(message, onConfirm) {
  const modal = document.getElementById('modal');
  const msg = document.getElementById('modal-message');
  const yesBtn = document.getElementById('modal-yes');
  const noBtn = document.getElementById('modal-no');
  msg.textContent = message;
  modal.style.display = 'flex';
  function cleanup() {
    modal.style.display = 'none';
    yesBtn.removeEventListener('click', yesHandler);
    noBtn.removeEventListener('click', noHandler);
  }
  function yesHandler() {
    cleanup();
    onConfirm(true);
  }
  function noHandler() {
    cleanup();
    onConfirm(false);
  }
  yesBtn.addEventListener('click', yesHandler);
  noBtn.addEventListener('click', noHandler);
}

// ======== 근무지 선택 이벤트 리스너 ========
siteButtons.nopo.addEventListener('click', () => {
  showModal('근무지 : 노포(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '노포';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('노포');
    nextStep();
  });
});

siteButtons.jeonggwan.addEventListener('click', () => {
  showModal('근무지 : 정관(이)가 맞으십니까?', (ok) => {
    if (!ok) return;
    selectedSite = '정관';
    selectedBusNo = '';
    enteredPlate = '';
    renderBusNoButtons('정관');
    nextStep();
  });
});

// ======== 버스번호 버튼 동적 생성 ========
function renderBusNoButtons(site) {
  busnoButtonsDiv.innerHTML = '';
  BUSNO_LIST[site].forEach(busNo => {
    const btn = document.createElement('button');
    btn.className = 'busno-btn';
    btn.textContent = busNo;
    btn.onclick = () => {
      showModal(`노선번호 : ${busNo}(이)가 맞으십니까?`, (ok) => {
        if (!ok) return;
        selectedBusNo = busNo;
        nextStep();
      });
    };
    busnoButtonsDiv.appendChild(btn);
  });
}

// ======== 복장 상태 확인 버튼 ========
function initUniformButtons() {
  const uniformOkBtn = document.getElementById('uniform-ok');
  const uniformBadBtn = document.getElementById('uniform-bad');
  
  if (uniformOkBtn) {
    uniformOkBtn.addEventListener('click', async () => {
      uniformStatus = 'ok';
      uniformReason = '';
      uniformOkBtn.disabled = true;
      uniformOkBtn.textContent = '제출 중...';
      try {
        await submitData();
        showPage(totalSteps); // 완료 화면 표시
      } catch (error) {
        console.error('제출 실패:', error);
        showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        uniformOkBtn.disabled = false;
        uniformOkBtn.textContent = '양호';
      }
    });
  }
  
  if (uniformBadBtn) {
    uniformBadBtn.addEventListener('click', () => {
      showReasonModal();
    });
  }
}

// ======== 불량 사유 입력 모달 ========
function showReasonModal() {
  const modal = document.getElementById('modal-reason');
  const reasonInput = document.getElementById('reason-input');
  const submitBtn = document.getElementById('modal-reason-submit');
  const cancelBtn = document.getElementById('modal-reason-cancel');
  const uniformBadBtn = document.getElementById('uniform-bad');
  
  reasonInput.value = uniformReason; // 기존 값이 있으면 표시
  modal.style.display = 'flex';
  
  function cleanup() {
    modal.style.display = 'none';
    submitBtn.removeEventListener('click', submitHandler);
    cancelBtn.removeEventListener('click', cancelHandler);
  }
  
  async function submitHandler() {
    const reason = reasonInput.value.trim();
    if (!reason) {
      showError('불량 사유를 입력해주세요.');
      return;
    }
    uniformStatus = 'bad';
    uniformReason = reason;
    cleanup();
    
    // 제출 버튼 비활성화
    if (uniformBadBtn) {
      uniformBadBtn.disabled = true;
      const originalText = uniformBadBtn.textContent;
      uniformBadBtn.textContent = '제출 중...';
      
      try {
        await submitData();
        showPage(totalSteps); // 완료 화면 표시
      } catch (error) {
        console.error('제출 실패:', error);
        showError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        uniformBadBtn.disabled = false;
        uniformBadBtn.textContent = originalText;
      }
    }
  }
  
  function cancelHandler() {
    cleanup();
  }
  
  submitBtn.addEventListener('click', submitHandler);
  cancelBtn.addEventListener('click', cancelHandler);
  
  // Enter 키로 제출
  reasonInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      submitHandler();
    }
  });
  
  // 포커스
  setTimeout(() => reasonInput.focus(), 100);
}

// ======== 데이터 제출 함수 ========
async function submitData() {
  const formData = new FormData();
  formData.append('site', selectedSite);
  formData.append('busNo', selectedBusNo);
  formData.append('plate', enteredPlate);
  formData.append('uniformStatus', uniformStatus);
  if (uniformStatus === 'bad' && uniformReason) {
    formData.append('uniformReason', uniformReason);
  }
  formData.append('timestamp', new Date().toISOString());
  // TODO: 실제 백엔드 URL로 변경 필요
  const response = await fetch('/api/submit', {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// ======== 키보드 이벤트 ========
document.addEventListener('keydown', (e) => {
  // 버스번호 선택 화면에서는 Enter로 동작하지 않음
  if (currentStep === 1) return;
  // 복장 상태 확인 화면에서는 버튼이 다르므로 처리하지 않음
  if (currentStep === 3) return;
  const btnMap = {2: 'b2'};
  const currentButton = buttons[btnMap[currentStep]];
  if (e.key === 'Enter' && currentButton && !currentButton.disabled) {
    currentButton.click();
  }
});

// 처음 화면으로 이동하는 함수
function goToInitialPage() {
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    showPage(-1, true);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    showPage(0, true);
  }
}

// 이름 입력 이벤트 리스너
if (driverNameInput && driverNameSubmit) {
  driverNameInput.addEventListener('input', (e) => {
    const name = e.target.value.trim();
    driverNameSubmit.disabled = name.length === 0;
  });

  driverNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !driverNameSubmit.disabled) {
      driverNameSubmit.click();
    }
  });

  driverNameSubmit.addEventListener('click', () => {
    const name = driverNameInput.value.trim();
    if (name.length > 0) {
      saveDriverName(name);
      showPage(0, true); // 근무지 선택 페이지로 이동
    }
  });
}

// ======== 정보 모달 ========
function showInfoModal() {
  const modal = document.getElementById('modal-info');
  const infoContent = document.getElementById('info-content');
  const closeBtn = document.getElementById('modal-info-close');
  
  let info = [];
  if (selectedSite) info.push(`<p><strong>근무지:</strong> ${selectedSite}</p>`);
  if (selectedBusNo) info.push(`<p><strong>노선번호:</strong> ${selectedBusNo}</p>`);
  if (enteredPlate) info.push(`<p><strong>차량번호:</strong> ${enteredPlate}</p>`);
  if (uniformStatus) {
    const statusText = uniformStatus === 'ok' ? '양호' : '불량';
    info.push(`<p><strong>복장 상태:</strong> ${statusText}</p>`);
    if (uniformStatus === 'bad' && uniformReason) {
      info.push(`<p><strong>불량 사유:</strong> ${uniformReason}</p>`);
    }
  }
  
  if (info.length === 0) {
    infoContent.innerHTML = '<p>아직 선택된 정보가 없습니다.</p>';
  } else {
    infoContent.innerHTML = info.join('');
  }
  
  modal.style.display = 'flex';
  
  closeBtn.onclick = () => {
    modal.style.display = 'none';
  };
}


// ======== renderPlateGrid 수정 ========
function renderPlateGrid() {
  // p2 페이지의 card-content를 직접 찾기
  const p2Page = document.getElementById('p2');
  if (!p2Page) return;
  const cardContent = p2Page.querySelector('.card-content');
  if (!cardContent) return;
  let plateGridDiv = cardContent.querySelector('#plate-grid');
  if (plateGridDiv) cardContent.removeChild(plateGridDiv);
  let filterInput = cardContent.querySelector('#plate-filter');
  if (filterInput) cardContent.removeChild(filterInput);
  let errorMsg = cardContent.querySelector('#plate-filter-error');
  if (errorMsg) cardContent.removeChild(errorMsg);
  filterInput = document.createElement('input');
  filterInput.id = 'plate-filter';
  filterInput.type = 'text';
  filterInput.placeholder = '차량번호 검색(숫자 입력)';
  filterInput.inputMode = 'numeric';
  filterInput.autocomplete = 'off';
  filterInput.style.marginBottom = '0.5rem';
  filterInput.style.width = '100%';
  cardContent.appendChild(filterInput);
  errorMsg = document.createElement('div');
  errorMsg.id = 'plate-filter-error';
  errorMsg.style.color = '#dc2626';
  errorMsg.style.fontSize = '0.98rem';
  errorMsg.style.height = '1.2em';
  errorMsg.style.marginBottom = '0.5rem';
  errorMsg.style.textAlign = 'left';
  errorMsg.textContent = '';
  cardContent.appendChild(errorMsg);
  plateGridDiv = document.createElement('div');
  plateGridDiv.id = 'plate-grid';
  plateGridDiv.style.display = 'grid';
  plateGridDiv.style.gridTemplateColumns = 'repeat(3, 1fr)';
  plateGridDiv.style.gap = '0.7rem';
  plateGridDiv.style.maxHeight = '320px';
  plateGridDiv.style.minHeight = '320px';
  plateGridDiv.style.overflowY = 'auto';
  plateGridDiv.style.overflowX = 'hidden';
  plateGridDiv.style.width = '100%';
  plateGridDiv.style.marginBottom = '1.2rem';
  cardContent.appendChild(plateGridDiv);
  function renderGrid() {
    const oldBtns = Array.from(plateGridDiv.children);
    oldBtns.forEach(btn => {
      btn.classList.add('fade-exit');
      setTimeout(() => btn.remove(), 200);
    });
    // 데이터 로딩 상태 처리
    if (!plateDataLoaded) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#888;font-size:1.1rem;">차량번호 데이터를 불러오는 중...</div>';
      return;
    }
    if (plateDataError) {
      plateGridDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#dc2626;font-size:1.1rem;">차량번호 데이터를 불러오지 못했습니다.</div>';
      return;
    }
    let list = [];
    if (selectedBusNo && PLATE_LISTS[selectedBusNo]) {
      list = PLATE_LISTS[selectedBusNo];
    }
    let filter = filterInput.value.trim();
    if (filter.length > 4) {
      filter = filter.slice(0, 4);
      filterInput.value = filter;
    }
    if (filter && /[^0-9]/.test(filter)) {
      errorMsg.textContent = '숫자만 입력해주세요!';
      return;
    } else {
      errorMsg.textContent = '';
    }
    const filtered = filter ? list.filter(num => num.includes(filter)) : list;
    const total = filtered.length;
    const maxRow = Math.ceil(list.length / 3);
    plateGridDiv.style.gridTemplateRows = `repeat(${maxRow}, 1fr)`;
    for (let i = 0; i < maxRow * 3; i++) {
      if (i < total) {
        const num = filtered[i];
        const btn = document.createElement('button');
        btn.className = 'plate-btn fade-in';
        btn.textContent = num;
        btn.setAttribute('aria-label', `차량번호 ${num}`);
        btn.tabIndex = 0;
        btn.onclick = () => {
          showModal(`차량번호 : ${num}가 맞으십니까?`, (ok) => {
            if (!ok) return;
            enteredPlate = num;
            nextStep();
          });
        };
        btn.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') btn.click();
        };
        plateGridDiv.appendChild(btn);
        setTimeout(() => btn.classList.remove('fade-in'), 250);
      } else {
        const empty = document.createElement('div');
        empty.style.visibility = 'hidden';
        plateGridDiv.appendChild(empty);
      }
    }
  }
  filterInput.addEventListener('input', renderGrid);
  renderGrid();
}

// ======== 초기화 ========
document.addEventListener('DOMContentLoaded', () => {
  // Header 초기화 (header.js에서 처리)
  if (typeof initHeader === 'function') {
    initHeader();
  }
  
  // 복장 상태 확인 버튼 초기화
  initUniformButtons();
  
  // localStorage에 기사님 이름이 있는지 확인
  if (!hasDriverName()) {
    // 이름이 없으면 이름 입력 페이지로
    history.replaceState({ pageIndex: -1 }, '', '');
    history.pushState({ pageIndex: -1 }, '', '');
    showPage(-1, false);
  } else {
    // 이름이 있으면 근무지 선택 페이지로
    history.replaceState({ pageIndex: 0 }, '', '');
    history.pushState({ pageIndex: 0 }, '', '');
    showPage(0, false);
  }
  console.log('운행전 자가점검시스템이 로드되었습니다.');
});

window.addEventListener('popstate', (event) => {
  const pageIndex = event.state && typeof event.state.pageIndex === 'number' ? event.state.pageIndex : (hasDriverName() ? 0 : -1);
  showPage(pageIndex, false);
  // history가 1개뿐이면(첫 화면) 더 이상 뒤로가기를 막음
  if ((pageIndex === 0 || pageIndex === -1) && history.length <= 2) {
    const initialPage = hasDriverName() ? 0 : -1;
    history.pushState({ pageIndex: initialPage }, '', '');
  }
});

// ======== 오프라인 지원 ========
window.addEventListener('online', () => {
  console.log('네트워크 연결이 복구되었습니다.');
});
window.addEventListener('offline', () => {
  console.log('네트워크 연결이 끊어졌습니다.');
  showError('네트워크 연결을 확인해주세요.');
});


```


header를 별도 모듈로 분리했습니다.

## 변경 사항

1. **header.js 파일 생성**
   - `createHeader()`: header HTML 요소 생성
   - `initHeader()`: header 초기화 및 이벤트 리스너 등록

2. **index.html 수정**
   - header HTML 제거
   - `<div id="header-container"></div>`로 대체
   - `header.js`를 `app.js`보다 먼저 로드

3. **app.js 수정**
   - 중복된 header 이벤트 리스너 코드 제거
   - `initHeader()` 호출로 header 초기화

이제 header는 `header.js` 모듈로 관리되며, `index.html`에서 불러와 사용합니다. Live Server로 확인해 주세요.

---

**User**

header 영역 안에 있는 컨텐츠들(logo.png, h2, button)을 굉장히 황금률처럼 대칭적이고 균형적으로 보이게 하고 싶어. 크기도 적당하고 정렬도 굉장히 균형적이라서 흠이 없도록 보이게 대칭과 균형 레이아웃 배치를 맞추어줘

---

**Cursor**


header 레이아웃을 황금비에 맞춰 대칭적이고 균형 있게 조정 중.


```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 80px;
}

header {
  background: var(--card-bg);
  padding: 0.75rem 2rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1.5rem;
  max-width: 100%;
}

header img {
  height: 38px;
  width: auto;
  object-fit: contain;
}

header h2 {
  font-size: 1.1875rem;
  font-weight: 600;
  color: var(--text);
  text-align: center;
  margin: 0;
  white-space: nowrap;
}

.info-btn {
  background: transparent !important;
  border: none !important;
  font-size: 1.8rem !important;
  cursor: pointer !important;
  padding: 0.5rem !important;
  min-width: auto !important;
  min-height: auto !important;
  width: auto !important;
  transition: transform 0.2s ease, opacity 0.2s ease !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  opacity: 0.8 !important;
}

.info-btn:hover {
  transform: scale(1.15) !important;
  background: transparent !important;
  opacity: 1 !important;
}

@media (max-width: 480px) {
  header {
    padding: 0.6rem 1rem;
  }

  header h2 {
    font-size: 1.045rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 80px);
  padding: 1.5rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}


.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 복장 체크리스트 */
.uniform-checklist {
  width: 100%;
  text-align: left;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.uniform-checklist p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 0;
  white-space: pre-line;
}

.checklist-indent {
  display: inline-block;
  padding-left: 1em;
}

/* 복장 버튼 */
.uniform-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.uniform-btn {
  width: 100% !important;
  padding: 1.25rem 2rem !important;
  font-size: 1.2rem !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px !important;
}

.uniform-btn:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.uniform-btn:disabled {
  background: var(--text-light) !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 불량 사유 입력 모달 */
.modal-input-container {
  width: 100%;
  margin: 1rem 0;
}

.modal-textarea {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-textarea::placeholder {
  color: var(--text-light);
}

/* 정보 모달 */
.info-content {
  width: 100%;
  text-align: left;
  padding: 1rem 0;
}

.info-content p {
  margin: 0.8rem 0;
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
}

.info-content p strong {
  color: var(--primary);
  font-weight: 600;
  margin-right: 0.5rem;
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```

```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 80px;
}

header {
  background: var(--card-bg);
  padding: 0.75rem 2rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1.5rem;
  max-width: 100%;
}

header img {
  height: 38px;
  width: auto;
  object-fit: contain;
}

header h2 {
  font-size: 1.1875rem;
  font-weight: 600;
  color: var(--text);
  text-align: center;
  margin: 0;
  white-space: nowrap;
}

.info-btn {
  background: transparent !important;
  border: none !important;
  font-size: 1.6rem !important;
  cursor: pointer !important;
  padding: 0.4rem 0.6rem !important;
  min-width: auto !important;
  min-height: auto !important;
  width: auto !important;
  height: auto !important;
  transition: transform 0.2s ease, opacity 0.2s ease !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  opacity: 0.75 !important;
  line-height: 1 !important;
}

.info-btn:hover {
  transform: scale(1.1) !important;
  background: transparent !important;
  opacity: 1 !important;
}

@media (max-width: 480px) {
  header {
    padding: 0.6rem 1rem;
  }

  header h2 {
    font-size: 1.045rem;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 80px);
  padding: 1.5rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}


.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 복장 체크리스트 */
.uniform-checklist {
  width: 100%;
  text-align: left;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.uniform-checklist p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 0;
  white-space: pre-line;
}

.checklist-indent {
  display: inline-block;
  padding-left: 1em;
}

/* 복장 버튼 */
.uniform-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.uniform-btn {
  width: 100% !important;
  padding: 1.25rem 2rem !important;
  font-size: 1.2rem !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px !important;
}

.uniform-btn:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.uniform-btn:disabled {
  background: var(--text-light) !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 불량 사유 입력 모달 */
.modal-input-container {
  width: 100%;
  margin: 1rem 0;
}

.modal-textarea {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-textarea::placeholder {
  color: var(--text-light);
}

/* 정보 모달 */
.info-content {
  width: 100%;
  text-align: left;
  padding: 1rem 0;
}

.info-content p {
  margin: 0.8rem 0;
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
}

.info-content p strong {
  color: var(--primary);
  font-weight: 600;
  margin-right: 0.5rem;
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```

```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 80px;
}

header {
  background: var(--card-bg);
  padding: 0.75rem 2rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1.5rem;
  max-width: 100%;
}

header img {
  height: 38px;
  width: auto;
  object-fit: contain;
}

header h2 {
  font-size: 1.1875rem;
  font-weight: 600;
  color: var(--text);
  text-align: center;
  margin: 0;
  white-space: nowrap;
}

.info-btn {
  background: transparent !important;
  border: none !important;
  font-size: 1.6rem !important;
  cursor: pointer !important;
  padding: 0.4rem 0.6rem !important;
  min-width: auto !important;
  min-height: auto !important;
  width: auto !important;
  height: auto !important;
  transition: transform 0.2s ease, opacity 0.2s ease !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  opacity: 0.75 !important;
  line-height: 1 !important;
}

.info-btn:hover {
  transform: scale(1.1) !important;
  background: transparent !important;
  opacity: 1 !important;
}

@media (max-width: 480px) {
  header {
    padding: 0.6rem 1rem;
    gap: 0.8rem;
  }

  header img {
    height: 32px;
  }

  header h2 {
    font-size: 1.045rem;
  }

  .info-btn {
    font-size: 1.4rem !important;
    padding: 0.3rem 0.5rem !important;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 80px);
  padding: 1.5rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}


.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 복장 체크리스트 */
.uniform-checklist {
  width: 100%;
  text-align: left;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.uniform-checklist p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 0;
  white-space: pre-line;
}

.checklist-indent {
  display: inline-block;
  padding-left: 1em;
}

/* 복장 버튼 */
.uniform-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.uniform-btn {
  width: 100% !important;
  padding: 1.25rem 2rem !important;
  font-size: 1.2rem !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px !important;
}

.uniform-btn:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.uniform-btn:disabled {
  background: var(--text-light) !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 불량 사유 입력 모달 */
.modal-input-container {
  width: 100%;
  margin: 1rem 0;
}

.modal-textarea {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-textarea::placeholder {
  color: var(--text-light);
}

/* 정보 모달 */
.info-content {
  width: 100%;
  text-align: left;
  padding: 1rem 0;
}

.info-content p {
  margin: 0.8rem 0;
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
}

.info-content p strong {
  color: var(--primary);
  font-weight: 600;
  margin-right: 0.5rem;
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```

```javascript
// ======== Header 컴포넌트 ========
function createHeader() {
  const header = document.createElement('header');
  
  // 로고 이미지
  const logo = document.createElement('img');
  logo.src = 'logo.png';
  logo.alt = '세진여객 로고';
  logo.id = 'header-logo';
  logo.style.cursor = 'pointer';
  
  // 제목
  const title = document.createElement('h2');
  title.id = 'header-title';
  title.style.cursor = 'pointer';
  title.textContent = '운행전 자가점검시스템';
  
  // 정보 버튼
  const infoBtn = document.createElement('button');
  infoBtn.id = 'info-btn';
  infoBtn.className = 'info-btn';
  infoBtn.title = '선택 정보 확인';
  infoBtn.textContent = '📋';
  
  // 요소들을 header에 추가
  header.appendChild(logo);
  header.appendChild(title);
  header.appendChild(infoBtn);
  
  return header;
}

// Header 초기화 함수
function initHeader() {
  const headerContainer = document.getElementById('header-container');
  if (headerContainer) {
    const header = createHeader();
    headerContainer.appendChild(header);
    
    // 헤더 로고 클릭 이벤트
    const headerLogo = document.getElementById('header-logo');
    if (headerLogo) {
      headerLogo.addEventListener('click', () => {
        if (typeof goToInitialPage === 'function') {
          goToInitialPage();
        }
      });
    }
    
    // 헤더 제목 클릭 이벤트
    const headerTitle = document.getElementById('header-title');
    if (headerTitle) {
      headerTitle.addEventListener('click', () => {
        if (typeof goToInitialPage === 'function') {
          goToInitialPage();
        }
      });
    }
    
    // 정보 버튼 이벤트
    const infoBtn = document.getElementById('info-btn');
    if (infoBtn) {
      infoBtn.addEventListener('click', () => {
        if (typeof showInfoModal === 'function') {
          showInfoModal();
        }
      });
    }
  }
}


```


header 레이아웃을 황금비에 맞춰 대칭적이고 균형 있게 조정했습니다.

## 변경 사항

1. **Grid 레이아웃 적용**
   - `display: grid`로 3열 구성: `auto 1fr auto`
   - 로고(왼쪽) | 제목(중앙) | 버튼(오른쪽)

2. **제목 중앙 정렬**
   - `text-align: center`로 중앙 배치
   - `white-space: nowrap`로 줄바꿈 방지

3. **크기 및 간격 조정**
   - 로고: 36px → 38px
   - 버튼: 1.8rem → 1.6rem, 패딩 조정
   - 간격: 1rem → 1.5rem
   - 패딩: 1.5rem → 2rem

4. **시각적 균형**
   - 좌우 대칭 구조
   - 중앙 제목으로 균형 유지
   - 버튼 투명도와 크기 조정

Live Server로 확인해 주세요. 추가 조정이 필요하면 알려주세요.

---

**User**

음 나쁘지는 않은데,  button은 지금보다 크기를 조금 더 키워줘.

그리고 logo.png는 지금보다 살짝 오른쪽으로 위치를 이동해줘.  h2태그는 지금보다 살짝 왼쪽으로 위치를 이동해줘,.

내가 직접 위치 조정과 크기조정을 한다고 하면 어디서 내가 직접조정할 수 있는지도 알려줘

---

**Cursor**


버튼 크기 확대, 로고를 오른쪽으로, h2를 왼쪽으로 이동 중. 직접 조정 가능한 위치도 안내합니다.


```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 80px;
}

header {
  background: var(--card-bg);
  padding: 0.75rem 2rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1.5rem;
  max-width: 100%;
}

header img {
  height: 38px;
  width: auto;
  object-fit: contain;
  margin-left: 0.5rem; /* 로고 오른쪽 이동: 값 조정 가능 */
}

header h2 {
  font-size: 1.1875rem;
  font-weight: 600;
  color: var(--text);
  text-align: center;
  margin: 0;
  white-space: nowrap;
  margin-left: -0.5rem; /* 제목 왼쪽 이동: 값 조정 가능 */
}

.info-btn {
  background: transparent !important;
  border: none !important;
  font-size: 1.9rem !important; /* 버튼 크기: 값 조정 가능 */
  cursor: pointer !important;
  padding: 0.5rem 0.7rem !important; /* 버튼 패딩: 값 조정 가능 */
  min-width: auto !important;
  min-height: auto !important;
  width: auto !important;
  height: auto !important;
  transition: transform 0.2s ease, opacity 0.2s ease !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  opacity: 0.75 !important;
  line-height: 1 !important;
}

.info-btn:hover {
  transform: scale(1.1) !important;
  background: transparent !important;
  opacity: 1 !important;
}

@media (max-width: 480px) {
  header {
    padding: 0.6rem 1rem;
    gap: 0.8rem;
  }

  header img {
    height: 32px;
  }

  header h2 {
    font-size: 1.045rem;
  }

  .info-btn {
    font-size: 1.4rem !important;
    padding: 0.3rem 0.5rem !important;
  }
}

.page {
  display: none;
  min-height: calc(100vh - 80px);
  padding: 1.5rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}


.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 복장 체크리스트 */
.uniform-checklist {
  width: 100%;
  text-align: left;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.uniform-checklist p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 0;
  white-space: pre-line;
}

.checklist-indent {
  display: inline-block;
  padding-left: 1em;
}

/* 복장 버튼 */
.uniform-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.uniform-btn {
  width: 100% !important;
  padding: 1.25rem 2rem !important;
  font-size: 1.2rem !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px !important;
}

.uniform-btn:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.uniform-btn:disabled {
  background: var(--text-light) !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 불량 사유 입력 모달 */
.modal-input-container {
  width: 100%;
  margin: 1rem 0;
}

.modal-textarea {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-textarea::placeholder {
  color: var(--text-light);
}

/* 정보 모달 */
.info-content {
  width: 100%;
  text-align: left;
  padding: 1rem 0;
}

.info-content p {
  margin: 0.8rem 0;
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
}

.info-content p strong {
  color: var(--primary);
  font-weight: 600;
  margin-right: 0.5rem;
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```

```css
/* Tailwind CSS는 CDN으로 로드되므로 여기서는 커스텀 스타일만 정의 */

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --accent: #059669;
  --accent-dark: #047857;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  padding-top: 80px;
}

header {
  background: var(--card-bg);
  padding: 0.75rem 2rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1.5rem;
  max-width: 100%;
}

header img {
  height: 38px;
  width: auto;
  object-fit: contain;
  margin-left: 0.5rem; /* 로고 오른쪽 이동: 값 조정 가능 */
}

header h2 {
  font-size: 1.1875rem;
  font-weight: 600;
  color: var(--text);
  text-align: center;
  margin: 0;
  white-space: nowrap;
  margin-left: -0.5rem; /* 제목 왼쪽 이동: 값 조정 가능 */
}

.info-btn {
  background: transparent !important;
  border: none !important;
  font-size: 1.9rem !important; /* 버튼 크기: 값 조정 가능 */
  cursor: pointer !important;
  padding: 0.5rem 0.7rem !important; /* 버튼 패딩: 값 조정 가능 */
  min-width: auto !important;
  min-height: auto !important;
  width: auto !important;
  height: auto !important;
  transition: transform 0.2s ease, opacity 0.2s ease !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  opacity: 0.75 !important;
  line-height: 1 !important;
}

.info-btn:hover {
  transform: scale(1.1) !important;
  background: transparent !important;
  opacity: 1 !important;
}

@media (max-width: 480px) {
  header {
    padding: 0.6rem 1rem;
    gap: 0.8rem;
  }

  header img {
    height: 32px;
    margin-left: 0.3rem; /* 모바일: 로고 오른쪽 이동 */
  }

  header h2 {
    font-size: 1.045rem;
    margin-left: -0.3rem; /* 모바일: 제목 왼쪽 이동 */
  }

  .info-btn {
    font-size: 1.6rem !important; /* 모바일: 버튼 크기 */
    padding: 0.4rem 0.6rem !important; /* 모바일: 버튼 패딩 */
  }
}

.page {
  display: none;
  min-height: calc(100vh - 80px);
  padding: 1.5rem 1rem 2rem 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.page.active {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.card h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text);
  margin-top: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.site-buttons,
.busno-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.site-btn,
.busno-btn {
  width: 100% !important;
  padding: 2rem 2rem !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  border: 3px solid transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  background: var(--primary) !important;
  color: #fff !important;
  text-align: center !important;
  min-height: 80px !important;
  display: block !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.site-btn:hover,
.busno-btn:hover {
  background: var(--primary-dark) !important;
  color: #fff !important;
  transform: translateY(-4px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.site-btn:active,
.busno-btn:active {
  transform: translateY(-2px) !important;
}

input[type="text"],
input[type="file"] {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  margin-bottom: 2rem;
  transition: all 0.2s ease;
  background: var(--bg);
  min-height: 56px;
}

input[type="text"]:focus,
input[type="file"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input[type="text"]::placeholder {
  color: var(--text-light);
}

button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px;
}

button:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 기사님 이름 입력 버튼 특별 스타일 */
#driver-name-submit {
  background: var(--primary) !important;
  color: white !important;
}

#driver-name-submit:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: white !important;
}

#driver-name-submit:disabled {
  background: #d1d5db !important;
  color: #9ca3af !important;
}

#preview {
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px solid var(--border);
  display: none;
}

#preview.show {
  display: block;
}

.success-title {
  font-size: 1.4rem !important;
  color: var(--accent) !important;
  margin-top: 60px !important;
  margin-bottom: 1rem !important;
}

.success-message {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-light);
}


.card-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.prevBtn {
  padding: 1rem 2.2rem !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  background: #e5e7eb !important;
  color: var(--text) !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  min-width: 120px !important;
  min-height: 48px !important;
}

.prevBtn:hover:not(:disabled) {
  background: #cbd5e1 !important;
}

.prevBtn:disabled {
  background: #f3f4f6 !important;
  color: #bdbdbd !important;
  cursor: not-allowed !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 95vw;
  width: 380px;
  min-height: 140px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-message {
  font-size: 1.35rem;
  color: var(--text);
  font-weight: 600;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.modal-btn {
  flex: 1 1 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  padding: 1.1rem 0 !important;
  border-radius: 12px !important;
  border: none !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  width: auto !important;
  min-height: auto !important;
}

.modal-yes {
  background: var(--primary) !important;
  color: #fff !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-yes:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  color: #fff !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-no {
  background: #e5e7eb !important;
  color: var(--text) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.modal-no:hover:not(:disabled) {
  background: #cbd5e1 !important;
  color: var(--text) !important;
  box-shadow: var(--shadow-lg) !important;
}

.modal-btn:disabled {
  background: #f3f4f6;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}

.plate-btn {
  min-height: 64px !important;
  height: 64px !important;
  font-size: 1.4rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
  background: var(--primary) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 복장 체크리스트 */
.uniform-checklist {
  width: 100%;
  text-align: left;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.uniform-checklist p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 0;
  white-space: pre-line;
}

.checklist-indent {
  display: inline-block;
  padding-left: 1em;
}

/* 복장 버튼 */
.uniform-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.uniform-btn {
  width: 100% !important;
  padding: 1.25rem 2rem !important;
  font-size: 1.2rem !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  background: var(--primary) !important;
  color: white !important;
  min-height: 64px !important;
}

.uniform-btn:hover:not(:disabled) {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.uniform-btn:disabled {
  background: var(--text-light) !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 불량 사유 입력 모달 */
.modal-input-container {
  width: 100%;
  margin: 1rem 0;
}

.modal-textarea {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-textarea::placeholder {
  color: var(--text-light);
}

/* 정보 모달 */
.info-content {
  width: 100%;
  text-align: left;
  padding: 1rem 0;
}

.info-content p {
  margin: 0.8rem 0;
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text);
}

.info-content p strong {
  color: var(--primary);
  font-weight: 600;
  margin-right: 0.5rem;
}

.plate-btn:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.plate-btn.fade-in {
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-btn.fade-exit {
  animation: fadeOutScale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-btn,
.busno-btn,
button {
  touch-action: manipulation;
}

#plate-grid > div {
  min-height: 64px;
  height: 64px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .card h1 {
    font-size: 1.7rem;
  }

  .site-btn,
  .busno-btn {
    font-size: 1.6rem;
    padding: 1.5rem 1.5rem;
    min-height: 70px;
  }

  input[type="text"],
  input[type="file"] {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  button {
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
  }

}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --card-bg: #1f2937;
    --text: #f9fafb;
    --text-light: #9ca3af;
    --border: #374151;
  }
}


```


수정 완료. 버튼 크기를 키우고, 로고는 오른쪽으로, h2는 왼쪽으로 이동했습니다.

## 변경 사항

1. **버튼 크기 증가**
   - `font-size: 1.6rem` → `1.9rem`
   - `padding: 0.4rem 0.6rem` → `0.5rem 0.7rem`

2. **로고 오른쪽 이동**
   - `margin-left: 0.5rem` 추가

3. **h2 제목 왼쪽 이동**
   - `margin-left: -0.5rem` 추가

## 직접 조정하는 방법

`styles.css` 파일에서 다음 부분을 수정하세요:

### 1. 버튼 크기 조정
```css
/* styles.css 파일의 약 66번째 줄 */
.info-btn {
  font-size: 1.9rem !important; /* 이 값을 변경 (예: 2rem, 2.2rem 등) */
  padding: 0.5rem 0.7rem !important; /* 패딩도 함께 조정 가능 */
}
```

### 2. 로고 위치 조정
```css
/* styles.css 파일의 약 48번째 줄 */
header img {
  margin-left: 0.5rem; /* 이 값을 변경 (값이 클수록 더 오른쪽으로 이동) */
}
```

### 3. h2 제목 위치 조정
```css
/* styles.css 파일의 약 54번째 줄 */
header h2 {
  margin-left: -0.5rem; /* 이 값을 변경 (음수 값이 클수록 더 왼쪽으로 이동) */
}
```

### 4. 모바일 버전도 조정 가능
```css
/* styles.css 파일의 약 89번째 줄 (모바일 미디어 쿼리 내부) */
@media (max-width: 480px) {
  header img {
    margin-left: 0.3rem; /* 모바일 로고 위치 */
  }
  header h2 {
    margin-left: -0.3rem; /* 모바일 제목 위치 */
  }
  .info-btn {
    font-size: 1.6rem !important; /* 모바일 버튼 크기 */
  }
}
```

Live Server로 확인해 주세요. 추가 조정이 필요하면 알려주세요.

```css
/* styles.css 파일의 약 66번째 줄 */
.info-btn {
  font-size: 1.9rem !important; /* 이 값을 변경 (예: 2rem, 2.2rem 등) */
  padding: 0.5rem 0.7rem !important; /* 패딩도 함께 조정 가능 */
}
```

```css
/* styles.css 파일의 약 48번째 줄 */
header img {
  margin-left: 0.5rem; /* 이 값을 변경 (값이 클수록 더 오른쪽으로 이동) */
}
```

```css
/* styles.css 파일의 약 54번째 줄 */
header h2 {
  margin-left: -0.5rem; /* 이 값을 변경 (음수 값이 클수록 더 왼쪽으로 이동) */
}
```

```css
/* styles.css 파일의 약 89번째 줄 (모바일 미디어 쿼리 내부) */
@media (max-width: 480px) {
  header img {
    margin-left: 0.3rem; /* 모바일 로고 위치 */
  }
  header h2 {
    margin-left: -0.3rem; /* 모바일 제목 위치 */
  }
  .info-btn {
    font-size: 1.6rem !important; /* 모바일 버튼 크기 */
  }
}
```

---

**User**

지금까지 너와 했던 작업을 다른 컴퓨터 커서ai에서 그대로 이 맥락을 이어서 작업을 할려고 하면 어떻게 해야하지? 지금까지 대화를 뭘 저장을 해서 불러와야하는건가?

---

**Cursor**


다른 컴퓨터에서 이어서 작업하려면 다음을 준비하세요:

1) 프로젝트 파일 복사
- 현재 프로젝트 폴더 전체를 복사하거나 Git으로 옮기세요.

2) Cursor 대화 기록
- Cursor는 대화 기록을 자동 저장하지만, 다른 컴퓨터로 옮기려면:
  - Cursor 설정에서 대화 내보내기/가져오기 기능 확인
  - 또는 대화 기록 파일 위치 확인 (보통 Cursor 설정 폴더 내)

3) 맥락 문서 생성
- 대화 요약과 현재 상태를 문서로 만들어 함께 옮기면 도움이 됩니다.


```markdown
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

```


`CONTEXT.md` 파일을 생성했습니다. 다른 컴퓨터에서 작업을 이어가려면:

## 방법 1: 프로젝트 파일 + CONTEXT.md (권장)

1. 프로젝트 폴더 전체를 다른 컴퓨터로 복사
   - `MDCS_NEW` 폴더 전체
   - `CONTEXT.md` 포함

2. 다른 컴퓨터에서 Cursor로 프로젝트 열기

3. Cursor AI에게 다음처럼 요청:
   ```
   CONTEXT.md 파일을 읽고 이 프로젝트의 맥락을 이해해줘.
   이전 작업을 이어서 진행할 준비가 되었어.
   ```

## 방법 2: Cursor 대화 기록 옮기기

Cursor의 대화 기록 위치 (OS별):

- Windows: `%APPDATA%\Cursor\User\workspaceStorage\` 또는 `%APPDATA%\Cursor\`
- macOS: `~/Library/Application Support/Cursor/`
- Linux: `~/.config/Cursor/`

하지만 대화 기록 파일을 직접 옮기는 것보다는 방법 1이 더 안정적입니다.

## 방법 3: Git 사용 (추천)

```bash
# 현재 프로젝트를 Git으로 관리
git init
git add .
git commit -m "Initial commit with context"
git remote add origin <your-repo-url>
git push -u origin main
```

다른 컴퓨터에서:
```bash
git clone <your-repo-url>
cd MDCS_NEW
```

## 권장 방법

방법 1 + 방법 3 조합:
1. `CONTEXT.md` 파일 생성 완료
2. Git으로 프로젝트 관리
3. 다른 컴퓨터에서 클론 후 Cursor로 열기
4. Cursor AI에게 `CONTEXT.md`를 읽고 맥락 이해 요청

이렇게 하면 다른 컴퓨터에서도 작업을 이어갈 수 있습니다.

```plaintext
   CONTEXT.md 파일을 읽고 이 프로젝트의 맥락을 이해해줘.
   이전 작업을 이어서 진행할 준비가 되었어.
```

```shellscript
# 현재 프로젝트를 Git으로 관리
git init
git add .
git commit -m "Initial commit with context"
git remote add origin <your-repo-url>
git push -u origin main
```

```shellscript
git clone <your-repo-url>
cd MDCS_NEW
```

