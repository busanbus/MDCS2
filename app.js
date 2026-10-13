// ======== 스플래시 설정 ========
const SPLASH_AUTO_HIDE_DELAY = 1200; // ms: 자동 페이드 시작 대기시간
const SPLASH_FADE_DURATION = 1200;   // ms: 페이드 시간 (styles.css 애니메이션과 동일)
const SPLASH_DEBUG_HOLD = false;      // true면 자동 숨김 안 하고, 탭 시에만 닫힘 (디버그용)

// ======== 상수 ========
const DRIVER_NAME_KEY = 'mdcsDriverName';
const LAST_PLATE_KEY = 'mdcsLastPlate';

const BUSNO_LIST = {
  '노포': ['29', '80', '300'],
  '정관': ['73', '73 (오전)', '106', '107', '184', '188']
};

const NOTICES = [
  { title: '시내버스 운행계통 준수 및 운행관리 철저 안내', images: ['notice/compliance.png'] },
  { title: '시내버스 불편 민원 교육 요청', images: ['notice/complaint.png'] },
  { title: '규정 근무복(동복) 착용 안내', images: ['notice/uniform_request.png'] },
  {
    title: '독립유공자 무임승차 안내',
    images: ['notice/free_riding01.png', 'notice/free_riding02.png', 'notice/free_riding03.png']
  }
];

const STEP_PAGES = ['p0', 'p1', 'p3', 'p4', 'p5', 'p6', 'p7'];

const VEHICLE_ITEMS = [
  { id: 'cctv', label: 'CCTV 작동 및 관리상태' },
  { id: 'terminal', label: '단말기 작동 상태' },
  { id: 'energy', label: '에너지(배터리, CNG) 잔여량' },
  { id: 'dashboard', label: '계기판(경고등)' },
  { id: 'suspension', label: '에어서스펜션 상태' },
  { id: 'etc', label: '기타' }
];

function createCheckState(items) {
  return Object.fromEntries(items.map((item) => [item.id, { status: '', note: '', photo: null, photoUrl: '' }]));
}

function createVehicleState() {
  return createCheckState(VEHICLE_ITEMS);
}

const EXTERIOR_ITEMS = [
  { id: 'accident', label: '외부 사고 흔적 유무' },
  { id: 'tire', label: '타이어 공기압 및 상태' },
  { id: 'wiper', label: '와이퍼 작동상태' },
  { id: 'etc', label: '기타' }
];

function createExteriorState() {
  return createCheckState(EXTERIOR_ITEMS);
}

const PHOTO_MAX_EDGE = 1280;
const PHOTO_QUALITY = 0.7;

function releaseVehiclePhotos() {
  [state.vehicle, state.exterior].forEach((bucket) => {
    if (!bucket) return;
    Object.values(bucket).forEach((row) => {
      if (row && row.photoUrl) URL.revokeObjectURL(row.photoUrl);
    });
  });
}

async function compressPhoto(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', PHOTO_QUALITY));
  if (!blob) throw new Error('사진 용량을 줄이지 못했어요.');
  return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
}
const FLOW_PAGES = ['p-driver-name', ...STEP_PAGES, 'p-review', 'done'];

const ICONS = {
  document: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
  chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'
};

// ======== 하드코딩된 차량번호 리스트 ========
const HARDCODED_PLATE_NUMBERS = [
  '3101', '3102', '3103', '3104', '3105', '3106', '3107', '3108', '3109', '3110',
  '3111', '3112', '3113', '3114', '3115', '3116', '3117', '3118', '3119', '3120',
  '3121', '3122', '3123', '3124', '3125', '3126', '3127', '3128', '3129', '3130',
  '3131', '3132', '3133', '3134', '3135', '3136', '3137', '3138', '3139', '3140',
  '3141', '3142', '3143', '3144', '3145', '3146', '3147', '3148', '3149', '3150',
  '3151', '3152', '3153', '3154', '3155', '3156', '3157', '3158', '3159', '3160',
  '3161', '3162', '3163', '3164', '3165', '3166', '3167', '3168', '3169', '3170',
  '3171', '3172', '3173', '3174', '3175', '3176', '3177', '3178', '3179', '3180',
  '3181', '3182', '3183', '3184', '3185', '3186', '3187', '3188', '3189', '3190',
  '3191', '3192', '3193', '3194', '3195', '3196', '3197', '3198', '3199', '3200',
  '3201', '3202', '3203', '3204', '3205', '3206', '3207', '3208', '3209', '3210',
  '3211', '3212', '3213', '3214', '3215', '3216', '3217', '3218', '3219', '3220',
  '3221', '3222', '3223', '3224', '3225', '3226', '3227', '3228', '3229', '3230',
  '3300',
  '5201', '5202', '5203', '5204', '5205', '5206', '5207', '5208', '5209', '5210',
  '5211', '5212', '5213', '5214', '5215', '5216', '5217', '5218'
];

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

function getLastPlate() {
  return localStorage.getItem(LAST_PLATE_KEY) || '';
}

// ======== 점검 상태 ========
function createEmptyState() {
  return {
    site: '',
    busNo: '',
    plate: '',
    uniform: '',        // 'ok' | 'bad'
    uniformReason: '',
    health: '',         // 'ok' | 'symptom'
    healthOption: '',   // 몸살 | 감기 | 장염 | 기타
    healthCustom: '',
    alcohol: '',        // 'yes' | 'no'
    vehicle: createVehicleState(),
    exterior: createExteriorState()
  };
}

const state = createEmptyState();
let session = 0;      // 점검을 새로 시작할 때마다 증가 (이전 점검의 history 항목 무효화)
let submitted = false;
let editDepth = 0;    // 확인 화면에서 '수정'으로 들어간 뒤 쌓인 history 수

// ======== DOM 요소 ========
const dom = {
  landingDate: document.getElementById('landing-date'),
  landingHello: document.getElementById('landing-hello'),
  landingStartBtn: document.getElementById('landing-start-btn'),
  driverNameInput: document.getElementById('driver-name-input'),
  driverNameSubmit: document.getElementById('driver-name-submit'),
  siteOptions: document.getElementById('site-options'),
  busnoOptions: document.getElementById('busno-options'),
  plateSection: document.getElementById('plate-section'),
  plateFilter: document.getElementById('plate-filter'),
  plateRecent: document.getElementById('plate-recent'),
  plateRecentGrid: document.getElementById('plate-recent-grid'),
  plateAllLabel: document.getElementById('plate-all-label'),
  plateGrid: document.getElementById('plate-grid'),
  plateEmpty: document.getElementById('plate-empty'),
  uniformOptions: document.getElementById('uniform-options'),
  uniformReasonWrap: document.getElementById('uniform-reason-wrap'),
  reasonInput: document.getElementById('reason-input'),
  reasonCounter: document.getElementById('reason-counter'),
  healthOptions: document.getElementById('health-options'),
  healthDetailWrap: document.getElementById('health-detail-wrap'),
  healthChips: document.getElementById('health-chips'),
  healthCustomWrap: document.getElementById('health-custom-wrap'),
  healthCustom: document.getElementById('health-custom'),
  healthCounter: document.getElementById('health-counter'),
  alcoholOptions: document.getElementById('alcohol-options'),
  alcoholWarning: document.getElementById('alcohol-warning'),
  vehicleChecks: document.getElementById('vehicle-checks'),
  exteriorChecks: document.getElementById('exterior-checks'),
  exteriorAlert: document.getElementById('exterior-alert'),
  reviewList: document.getElementById('review-list'),
  submitBtn: document.getElementById('submit-btn'),
  resultCard: document.getElementById('result-card'),
  doneAlert: document.getElementById('done-alert'),
  doneHomeBtn: document.getElementById('done-home-btn')
};

// ======== 노선별 차량번호 리스트(구글 시트 연동) ========
let PLATE_LISTS = {};
let plateDataLoaded = false;
let plateDataError = false;
let plateDataLoading = false;

// 차량번호 데이터를 지연 로딩 (차량번호 페이지에 도달할 때만 로드)
function loadPlateData() {
  if (plateDataLoading || plateDataLoaded || plateDataError) return;

  plateDataLoading = true;
  fetch('https://script.google.com/macros/s/AKfycbxKXmbLSOl64gNdOoYIORQs1fpdHOHZuX7LGypDLlgacjKtNhiVTWef6_pBNNkd2cWE/exec')
    .then(res => res.json())
    .then(data => {
      PLATE_LISTS = data;
      plateDataLoaded = true;
      plateDataLoading = false;
    })
    .catch(err => {
      plateDataError = true;
      plateDataLoading = false;
      console.error('차량번호 데이터 불러오기 실패:', err);
    });
}

// ======== 공통 UI ========
let toastTimer;
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function createOption(value, label = value, className = 'option-tile compact') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.dataset.value = value;
  button.textContent = label;
  button.setAttribute('aria-pressed', 'false');
  return button;
}

function markSelected(container, value) {
  container.querySelectorAll('[data-value]').forEach((option) => {
    const selected = option.dataset.value === value;
    option.classList.toggle('selected', selected);
    option.setAttribute('aria-pressed', String(selected));
  });
}

function onOptionClick(container, handler) {
  container.addEventListener('click', (event) => {
    const option = event.target.closest('[data-value]');
    if (option && container.contains(option)) handler(option.dataset.value);
  });
}

function updateCounter(input, counter) {
  counter.textContent = `${input.value.length} / 100`;
}

function focusLater(input) {
  setTimeout(() => {
    input.focus({ preventScroll: true });
    input.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, 150);
}

function formatBusNo(busNo) {
  return busNo.replace(/^(\d+)/, '$1번');
}

function getHealthDetail() {
  return state.healthOption === '기타' ? state.healthCustom.trim() : state.healthOption;
}

// ======== 화면 전환 ========
function showPage(pageId, { push = true, direction = 'forward' } = {}) {
  const target = document.getElementById(pageId);
  if (!target) return;

  document.querySelectorAll('.page').forEach((page) => {
    page.classList.remove('active', 'enter-forward', 'enter-back');
  });
  target.classList.add('active', direction === 'back' ? 'enter-back' : 'enter-forward');
  document.body.dataset.tone = target.dataset.tone || 'white';

  updateNav(target);
  renderPage(pageId);
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

  if (push) history.pushState({ page: pageId, session }, '', '');
}

function updateNav(page) {
  const stepIndex = STEP_PAGES.indexOf(page.id);
  let progress = null;
  if (stepIndex >= 0) progress = (stepIndex + 1) / (STEP_PAGES.length + 1);
  else if (page.id === 'p-review') progress = 1;

  if (typeof setNav === 'function') {
    setNav({ mode: page.dataset.nav || 'back', progress });
  }
}

function renderPage(pageId) {
  if (pageId === 'p-landing') renderGreeting();
  if (pageId === 'p-driver-name') syncDriverName();
  if (pageId === 'p1') {
    renderBusNoOptions();
    loadPlateData();
    renderPlates();
  }
  if (pageId === 'p-review') renderReview();
  if (STEP_PAGES.includes(pageId)) {
    renderSummary(pageId);
    syncStep(pageId);
    updateCta(pageId);
  }
}

function navigateBack() {
  history.back();
}

// 처음 화면으로 이동하는 함수 (상단 로고)
function goToInitialPage() {
  showPage('p-landing', { direction: 'back' });
}

function startCheck() {
  session += 1;
  submitted = false;
  editDepth = 0;
  releaseVehiclePhotos();
  Object.assign(state, createEmptyState());
  dom.plateFilter.value = '';
  showPage(hasDriverName() ? 'p0' : 'p-driver-name');
}

window.addEventListener('popstate', (event) => {
  const { page = 'p-landing', session: entrySession } = event.state || {};
  if (editDepth > 0) editDepth -= 1;

  // 제출이 끝났거나 이전 점검의 화면이면 메인으로 보낸다
  const staleFlow = FLOW_PAGES.includes(page) && (entrySession !== session || submitted);
  if (staleFlow) {
    showPage('p-landing', { push: false, direction: 'back' });
    history.replaceState({ page: 'p-landing', session }, '', '');
    return;
  }
  showPage(page, { push: false, direction: 'back' });
});

// ======== 메인 화면 ========
function renderGreeting() {
  dom.landingDate.textContent = new Intl.DateTimeFormat('ko-KR', {
    month: 'long', day: 'numeric', weekday: 'long'
  }).format(new Date());

  const name = getDriverName();
  dom.landingHello.replaceChildren('안녕하세요,', document.createElement('br'), name ? `${name} 기사님` : '기사님');
}

function openNotice(notice) {
  const viewer = document.getElementById('notice-viewer');
  document.getElementById('notice-viewer-title').textContent = notice.title;
  const body = document.getElementById('notice-viewer-body');
  body.replaceChildren(...notice.images.map((src) => {
    const image = document.createElement('img');
    image.src = src;
    image.alt = notice.title;
    image.decoding = 'async';
    return image;
  }));
  body.scrollTop = 0;
  viewer.hidden = false;
  document.body.classList.add('no-scroll');
  document.getElementById('notice-viewer-close').focus();
}

function closeNotice() {
  const viewer = document.getElementById('notice-viewer');
  if (viewer.hidden) return;
  viewer.hidden = true;
  document.getElementById('notice-viewer-body').replaceChildren();
  document.body.classList.remove('no-scroll');
}

function createNoticeRow(notice) {
  const item = document.createElement('li');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'list-row';
  button.innerHTML = `<span class="list-row-icon">${ICONS.document}</span><span class="list-row-text"></span><span class="list-row-arrow">${ICONS.chevronRight}</span>`;
  button.querySelector('.list-row-text').textContent = notice.title;
  button.addEventListener('click', () => openNotice(notice));
  item.appendChild(button);
  return item;
}

function initNotices() {
  ['landing-notice-list', 'board-notice-list'].forEach((id) => {
    document.getElementById(id).replaceChildren(...NOTICES.map(createNoticeRow));
  });
  document.getElementById('notice-board-open').addEventListener('click', () => showPage('p-board'));
  document.getElementById('notice-viewer-close').addEventListener('click', closeNotice);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeNotice();
  });
}

// ======== 기사님 이름 ========
function syncDriverName() {
  dom.driverNameInput.value = getDriverName();
  dom.driverNameSubmit.disabled = !dom.driverNameInput.value.trim();
}

function initDriverName() {
  dom.driverNameInput.addEventListener('input', () => {
    dom.driverNameSubmit.disabled = !dom.driverNameInput.value.trim();
  });
  dom.driverNameInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !dom.driverNameSubmit.disabled) dom.driverNameSubmit.click();
  });
  dom.driverNameSubmit.addEventListener('click', () => {
    if (!saveDriverName(dom.driverNameInput.value)) return;
    dom.driverNameInput.blur();
    if (editDepth > 0) {
      returnToReview();
      return;
    }
    showPage('p0');
  });
}

// ======== 점검 단계 ========
const stepRules = {
  p0: () => Boolean(state.site),
  p1: () => Boolean(state.busNo && state.plate),
  p3: () => state.uniform === 'ok' || (state.uniform === 'bad' && Boolean(state.uniformReason.trim())),
  p4: () => state.health === 'ok' || (state.health === 'symptom' && Boolean(getHealthDetail())),
  p5: () => Boolean(state.alcohol),
  p6: () => problemListComplete(VEHICLE_ITEMS, state.vehicle),
  p7: () => problemListComplete(EXTERIOR_ITEMS, state.exterior)
};

function problemListComplete(items, bucket) {
  return items.every((item) => {
    const row = bucket[item.id];
    return row.status === 'ok' || (row.status === 'bad' && Boolean(row.note.trim()));
  });
}

function problemItems(items, bucket) {
  return items.filter((item) => bucket[item.id].status === 'bad');
}

function vehicleProblems() {
  return problemItems(VEHICLE_ITEMS, state.vehicle);
}

function exteriorProblems() {
  return problemItems(EXTERIOR_ITEMS, state.exterior);
}

function updateCta(pageId) {
  const button = document.querySelector(`#${pageId} [data-next]`);
  if (button) button.disabled = !stepRules[pageId]();
}

function renderSummary(pageId) {
  const container = document.querySelector(`#${pageId} [data-summary]`);
  if (!container) return;
  const index = STEP_PAGES.indexOf(pageId);
  const items = [];
  if (index > 0 && state.site) items.push(state.site);
  if (index > 1 && state.busNo) items.push(formatBusNo(state.busNo));
  if (index > 1 && state.plate) items.push(state.plate);
  container.replaceChildren(...items.map((text) => {
    const chip = document.createElement('span');
    chip.className = 'summary-chip';
    chip.textContent = text;
    return chip;
  }));
}

function syncStep(pageId) {
  switch (pageId) {
    case 'p0':
      markSelected(dom.siteOptions, state.site);
      break;
    case 'p1':
      markSelected(dom.busnoOptions, state.busNo);
      dom.plateSection.hidden = !state.busNo;
      if (state.busNo) markPlates();
      break;
    case 'p3':
      markSelected(dom.uniformOptions, state.uniform);
      dom.uniformReasonWrap.hidden = state.uniform !== 'bad';
      dom.reasonInput.value = state.uniformReason;
      updateCounter(dom.reasonInput, dom.reasonCounter);
      break;
    case 'p4':
      markSelected(dom.healthOptions, state.health);
      dom.healthDetailWrap.hidden = state.health !== 'symptom';
      markSelected(dom.healthChips, state.healthOption);
      dom.healthCustomWrap.hidden = state.healthOption !== '기타';
      dom.healthCustom.value = state.healthCustom;
      updateCounter(dom.healthCustom, dom.healthCounter);
      break;
    case 'p5':
      markSelected(dom.alcoholOptions, state.alcohol);
      dom.alcoholWarning.hidden = state.alcohol !== 'yes';
      break;
    case 'p6':
      syncProblemList(dom.vehicleChecks, VEHICLE_ITEMS, state.vehicle);
      break;
    case 'p7':
      syncProblemList(dom.exteriorChecks, EXTERIOR_ITEMS, state.exterior);
      updateExteriorAlert();
      break;
  }
}

function syncProblemList(root, items, bucket) {
  items.forEach((item) => {
    const group = root.querySelector(`[data-check="${item.id}"]`);
    const row = bucket[item.id];
    markSelected(group, row.status);
    group.querySelector('.reveal').hidden = row.status !== 'bad';
    const input = group.querySelector('[data-note]');
    if (document.activeElement !== input) input.value = row.note;
    group.querySelector('.field-counter').textContent = `${input.value.length} / 100`;
    const preview = group.querySelector('[data-photo-preview]');
    const image = preview.querySelector('img');
    preview.hidden = !row.photoUrl;
    if (row.photoUrl) image.src = row.photoUrl;
    else image.removeAttribute('src');
  });
}

function updateExteriorAlert() {
  const problems = exteriorProblems();
  dom.exteriorAlert.hidden = problems.length === 0;
  const accident = state.exterior.accident.status === 'bad';
  document.getElementById('exterior-alert-title').textContent = accident
    ? '사고 흔적을 촬영하고 운행관리실로 연락해 주세요'
    : '운행관리실로 연락해 주세요';
  document.getElementById('exterior-alert-desc').textContent = accident
    ? '사고 흔적이 있으면 사진을 찍은 뒤 운행관리실에 알려 주세요.'
    : '불량 사유가 있으면 적은 뒤 운행관리실에 알려 주세요.';
}

function renderBusNoOptions() {
  const list = BUSNO_LIST[state.site] || [];
  dom.busnoOptions.replaceChildren(...list.map((busNo) => createOption(busNo, formatBusNo(busNo))));
}

function renderPlates() {
  const filter = dom.plateFilter.value;
  const plates = filter ? HARDCODED_PLATE_NUMBERS.filter((num) => num.includes(filter)) : HARDCODED_PLATE_NUMBERS;
  dom.plateGrid.replaceChildren(...plates.map((num) => createOption(num)));
  dom.plateAllLabel.textContent = filter ? '검색 결과' : '전체 차량';
  dom.plateAllLabel.hidden = plates.length === 0;
  dom.plateEmpty.hidden = plates.length > 0;

  const recent = getLastPlate();
  const showRecent = !filter && HARDCODED_PLATE_NUMBERS.includes(recent);
  dom.plateRecent.hidden = !showRecent;
  dom.plateRecentGrid.replaceChildren(...(showRecent ? [createOption(recent)] : []));
  markPlates();
}

function markPlates() {
  markSelected(dom.plateGrid, state.plate);
  markSelected(dom.plateRecentGrid, state.plate);
}

function scrollPlateSectionIntoView() {
  window.setTimeout(() => {
    const top = dom.plateSection.getBoundingClientRect().top + window.scrollY - 64;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, 40);
}

function goNext(pageId) {
  if (!stepRules[pageId]()) return;
  if (pageId === 'p1') localStorage.setItem(LAST_PLATE_KEY, state.plate);

  if (editDepth > 0) {
    // 근무지를 바꾸면 노선도 다시 골라야 한다
    if (pageId === 'p0' && !state.busNo) {
      editDepth += 1;
      showPage('p1');
      return;
    }
    returnToReview();
    return;
  }
  const index = STEP_PAGES.indexOf(pageId);
  showPage(STEP_PAGES[index + 1] || 'p-review');
}

function bindProblemList(root, bucketName, pageId) {
  root.addEventListener('click', (event) => {
    const option = event.target.closest('[data-item][data-value]');
    if (!option || !root.contains(option)) return;
    const { item, value } = option.dataset;
    const row = state[bucketName][item];
    row.status = value;
    if (value === 'ok' && row.photoUrl) {
      URL.revokeObjectURL(row.photoUrl);
      row.photo = null;
      row.photoUrl = '';
    }
    syncStep(pageId);
    updateCta(pageId);
    if (value === 'bad') focusLater(root.querySelector(`[data-note="${item}"]`));
  });
  root.addEventListener('input', (event) => {
    const input = event.target.closest('[data-note]');
    if (!input) return;
    state[bucketName][input.dataset.note].note = input.value;
    input.parentElement.querySelector('.field-counter').textContent = `${input.value.length} / 100`;
    updateCta(pageId);
  });
  root.addEventListener('change', async (event) => {
    const input = event.target.closest('[data-photo]');
    if (!input || !input.files || !input.files[0]) return;
    const source = input.files[0];
    input.value = '';
    try {
      const photo = await compressPhoto(source);
      const row = state[bucketName][input.dataset.photo];
      if (row.photoUrl) URL.revokeObjectURL(row.photoUrl);
      row.photo = photo;
      row.photoUrl = URL.createObjectURL(photo);
      syncStep(pageId);
      const kb = Math.max(1, Math.round(photo.size / 1024));
      showToast(`사진을 줄여 등록했어요. ${kb}KB`);
    } catch (error) {
      console.error('사진 준비 실패:', error);
      showToast('사진을 준비하지 못했어요. 다시 찍어 주세요.');
    }
  });
  root.addEventListener('click', (event) => {
    const clear = event.target.closest('[data-photo-clear]');
    if (!clear || !root.contains(clear)) return;
    const row = state[bucketName][clear.dataset.photoClear];
    if (row.photoUrl) URL.revokeObjectURL(row.photoUrl);
    row.photo = null;
    row.photoUrl = '';
    syncStep(pageId);
  });
}

function initSteps() {
  onOptionClick(dom.siteOptions, (value) => {
    if (state.site !== value) state.busNo = '';
    state.site = value;
    syncStep('p0');
    updateCta('p0');
  });

  onOptionClick(dom.busnoOptions, (value) => {
    const opening = dom.plateSection.hidden;
    state.busNo = value;
    syncStep('p1');
    updateCta('p1');
    if (opening) scrollPlateSectionIntoView();
  });

  [dom.plateGrid, dom.plateRecentGrid].forEach((grid) => {
    onOptionClick(grid, (value) => {
      state.plate = value;
      markPlates();
      updateCta('p1');
    });
  });
  dom.plateFilter.addEventListener('input', () => {
    const digits = dom.plateFilter.value.replace(/\D/g, '').slice(0, 4);
    if (digits !== dom.plateFilter.value) dom.plateFilter.value = digits;
    renderPlates();
  });

  onOptionClick(dom.uniformOptions, (value) => {
    state.uniform = value;
    syncStep('p3');
    updateCta('p3');
    if (value === 'bad') focusLater(dom.reasonInput);
  });
  dom.reasonInput.addEventListener('input', () => {
    state.uniformReason = dom.reasonInput.value;
    updateCounter(dom.reasonInput, dom.reasonCounter);
    updateCta('p3');
  });

  onOptionClick(dom.healthOptions, (value) => {
    state.health = value;
    syncStep('p4');
    updateCta('p4');
  });
  onOptionClick(dom.healthChips, (value) => {
    state.healthOption = value;
    syncStep('p4');
    updateCta('p4');
    if (value === '기타') focusLater(dom.healthCustom);
  });
  dom.healthCustom.addEventListener('input', () => {
    state.healthCustom = dom.healthCustom.value;
    updateCounter(dom.healthCustom, dom.healthCounter);
    updateCta('p4');
  });

  onOptionClick(dom.alcoholOptions, (value) => {
    state.alcohol = value;
    syncStep('p5');
    updateCta('p5');
  });

  bindProblemList(dom.vehicleChecks, 'vehicle', 'p6');
  bindProblemList(dom.exteriorChecks, 'exterior', 'p7');

  document.querySelectorAll('[data-next]').forEach((button) => {
    button.addEventListener('click', () => goNext(button.closest('.page').id));
  });

  document.querySelectorAll('[data-prev]').forEach((button) => {
    button.addEventListener('click', () => navigateBack());
  });
}

// ======== 제출 전 확인 ========
function startEdit(pageId) {
  editDepth = 1;
  showPage(pageId);
}

function returnToReview() {
  const depth = editDepth;
  editDepth = 0;
  history.go(-depth);
}

function renderReview() {
  const rows = [
    { label: '기사님', value: getDriverName(), page: 'p-driver-name' },
    { label: '근무지', value: state.site, page: 'p0' },
    { label: '노선', value: formatBusNo(state.busNo), page: 'p1' },
    { label: '차량번호', value: state.plate, page: 'p1' },
    {
      label: '복장 상태',
      value: state.uniform === 'bad' ? '불량' : '양호',
      detail: state.uniform === 'bad' ? state.uniformReason.trim() : '',
      warn: state.uniform === 'bad',
      page: 'p3'
    },
    {
      label: '건강 상태',
      value: state.health === 'symptom' ? '증상 있음' : '양호',
      detail: state.health === 'symptom' ? getHealthDetail() : '',
      warn: state.health === 'symptom',
      page: 'p4'
    },
    {
      label: '24시간 이내 음주',
      value: state.alcohol === 'yes' ? '예' : '아니요',
      warn: state.alcohol === 'yes',
      page: 'p5'
    },
    {
      label: '차량 내부',
      value: vehicleProblems().length ? `문제 ${vehicleProblems().length}건` : '문제 없음',
      detail: problemDetail(VEHICLE_ITEMS, state.vehicle),
      warn: vehicleProblems().length > 0,
      page: 'p6'
    },
    {
      label: '차량 외부',
      value: exteriorProblems().length ? `문제 ${exteriorProblems().length}건` : '문제 없음',
      detail: problemDetail(EXTERIOR_ITEMS, state.exterior),
      warn: exteriorProblems().length > 0,
      page: 'p7'
    }
  ];
  dom.reviewList.replaceChildren(...rows.map(createReviewRow));
}

function problemDetail(items, bucket) {
  return problemItems(items, bucket).map((item) => {
    const row = bucket[item.id];
    return `${item.label}: ${row.note.trim()}${row.photo ? ' · 사진 있음' : ''}`;
  }).join('\n');
}

function appendProblemFields(formData, prefix, items, bucket) {
  items.forEach((item) => {
    const row = bucket[item.id];
    formData.append(`${prefix}_${item.id}`, row.status);
    if (row.status === 'bad') {
      formData.append(`${prefix}_${item.id}_note`, row.note.trim());
      if (row.photo) formData.append(`${prefix}_${item.id}_photo`, row.photo, `${prefix}_${item.id}.jpg`);
    }
  });
}

function createReviewRow({ label, value, detail, warn, page }) {
  const item = document.createElement('li');
  item.className = 'review-row';

  const main = document.createElement('div');
  main.className = 'review-main';
  const labelEl = document.createElement('span');
  labelEl.className = 'review-label';
  labelEl.textContent = label;
  const valueEl = document.createElement('span');
  valueEl.className = warn ? 'review-value warn' : 'review-value';
  valueEl.textContent = value;
  main.append(labelEl, valueEl);
  if (detail) {
    const detailEl = document.createElement('span');
    detailEl.className = 'review-detail';
    detailEl.textContent = detail;
    main.appendChild(detailEl);
  }

  const edit = document.createElement('button');
  edit.type = 'button';
  edit.className = 'text-btn';
  edit.textContent = '수정';
  edit.setAttribute('aria-label', `${label} 수정`);
  edit.addEventListener('click', () => startEdit(page));

  item.append(main, edit);
  return item;
}

// ======== 제출 ========
async function handleSubmit() {
  const button = dom.submitBtn;
  button.classList.add('is-loading');
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  try {
    await submitData();
    submitted = true;
    renderDone();
    showPage('done', { push: false });
    history.replaceState({ page: 'done', session }, '', '');
  } catch (error) {
    console.error('제출 실패:', error);
    showToast('제출하지 못했어요. 잠시 후 다시 시도해 주세요.');
  } finally {
    button.classList.remove('is-loading');
    button.disabled = false;
    button.removeAttribute('aria-busy');
  }
}

async function submitData() {
  const formData = new FormData();
  formData.append('driverName', getDriverName());
  formData.append('site', state.site);
  formData.append('busNo', state.busNo);
  formData.append('plate', state.plate);
  formData.append('uniformStatus', state.uniform);
  if (state.uniform === 'bad') formData.append('uniformReason', state.uniformReason.trim());
  formData.append('healthStatus', state.health);
  if (state.health === 'symptom') formData.append('healthDetail', getHealthDetail());
  formData.append('alcoholStatus', state.alcohol);
  appendProblemFields(formData, 'vehicle', VEHICLE_ITEMS, state.vehicle);
  appendProblemFields(formData, 'exterior', EXTERIOR_ITEMS, state.exterior);
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

function renderDone() {
  const time = new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' }).format(new Date());
  const rows = [
    ['제출 시각', time],
    ['노선', formatBusNo(state.busNo)],
    ['차량번호', state.plate],
    ['차량 내부', vehicleProblems().length ? `문제 ${vehicleProblems().length}건` : '문제 없음'],
    ['차량 외부', exteriorProblems().length ? `문제 ${exteriorProblems().length}건` : '문제 없음']
  ];
  dom.resultCard.replaceChildren(...rows.map(([term, description]) => {
    const row = document.createElement('div');
    const dt = document.createElement('dt');
    dt.textContent = term;
    const dd = document.createElement('dd');
    dd.textContent = description;
    row.append(dt, dd);
    return row;
  }));
  dom.doneAlert.hidden = state.alcohol !== 'yes';
}

function finishAndGoHome() {
  session += 1;
  submitted = false;
  releaseVehiclePhotos();
  Object.assign(state, createEmptyState());
  showPage('p-landing', { direction: 'back' });
}

// ======== 스플래시 ========
function initSplash() {
  const splash = document.getElementById('splash');
  if (!splash) return;

  const hideSplash = () => {
    splash.classList.add('fade-out');
    splash.addEventListener('animationend', () => {
      splash.style.display = 'none';
    }, { once: true });
  };

  if (!SPLASH_DEBUG_HOLD) {
    setTimeout(hideSplash, SPLASH_AUTO_HIDE_DELAY);
  }

  // 탭하여 즉시 닫기
  splash.addEventListener('click', hideSplash, { once: true });
}

// ======== 초기화 ========
document.addEventListener('DOMContentLoaded', () => {
  if (typeof initHeader === 'function') initHeader();
  initSplash();
  initNotices();
  initDriverName();
  initSteps();

  dom.landingStartBtn.addEventListener('click', startCheck);
  dom.submitBtn.addEventListener('click', handleSubmit);
  dom.doneHomeBtn.addEventListener('click', finishAndGoHome);

  history.replaceState({ page: 'p-landing', session }, '', '');
  showPage('p-landing', { push: false });
  console.log('운행전 자가점검시스템이 로드되었습니다.');
});

// ======== 오프라인 지원 ========
window.addEventListener('online', () => {
  console.log('네트워크 연결이 복구되었습니다.');
});
window.addEventListener('offline', () => {
  console.log('네트워크 연결이 끊어졌습니다.');
  showToast('인터넷 연결을 확인해 주세요.');
});
