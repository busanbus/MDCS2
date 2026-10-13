// ======== 상단 내비게이션 컴포넌트 ========
// 모든 화면: 흰색 배경 + 로고 + '운행전 자가점검시스템'
// 내부 화면만 왼쪽에 뒤로가기, 점검 단계는 하단 진행 막대
function createHeader() {
  const header = document.createElement('header');
  header.id = 'app-nav';
  header.className = 'nav';
  header.dataset.mode = 'brand';
  header.innerHTML = `
    <button id="nav-back" class="icon-btn nav-back" type="button" aria-label="뒤로 가기">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>
    </button>
    <button id="nav-brand" class="nav-brand" type="button" aria-label="처음 화면으로">
      <img class="nav-logo" src="logo.png" alt="세진여객 로고">
      <span>운행전 자가점검시스템</span>
    </button>
    <div class="nav-progress" aria-hidden="true"><div id="nav-progress-bar" class="nav-progress-bar"></div></div>
  `;
  return header;
}

function setNav({ mode = 'back', progress = null } = {}) {
  const nav = document.getElementById('app-nav');
  if (!nav) return;
  nav.dataset.mode = mode;

  const hasProgress = typeof progress === 'number';
  nav.classList.toggle('has-progress', hasProgress);
  document.getElementById('nav-progress-bar').style.width = hasProgress ? `${Math.round(progress * 100)}%` : '0%';
}

function initHeader() {
  const headerContainer = document.getElementById('header-container');
  if (!headerContainer) return;
  headerContainer.appendChild(createHeader());

  document.getElementById('nav-back').addEventListener('click', () => {
    if (typeof navigateBack === 'function') navigateBack();
  });
  document.getElementById('nav-brand').addEventListener('click', () => {
    if (typeof goToInitialPage === 'function') goToInitialPage();
  });
}
