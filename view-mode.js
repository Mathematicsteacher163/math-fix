/* view-mode.js — режим просмотра + защита от ложных свайпов при зуме */
(function () {
  const STORAGE_KEY = 'math_site_view_mode';
  const DEFAULT_MODE = 'desktop';

  function getSavedMode() {
    try {
      const m = localStorage.getItem(STORAGE_KEY);
      return (m === 'phone' || m === 'desktop') ? m : DEFAULT_MODE;
    } catch (e) { return DEFAULT_MODE; }
  }
  function saveMode(mode) {
    try { localStorage.setItem(STORAGE_KEY, mode); } catch (e) {}
  }
  function applyMode(mode) {
    const body = document.body;
    if (!body) return;
    body.classList.remove('phone-mode', 'desktop-mode');
    body.classList.add(mode === 'phone' ? 'phone-mode' : 'desktop-mode');
    const btnD = document.getElementById('btnDesktop');
    const btnP = document.getElementById('btnPhone');
    if (btnD && btnP) {
      btnP.classList.toggle('active', mode === 'phone');
      btnD.classList.toggle('active', mode === 'desktop');
    }
    document.dispatchEvent(new CustomEvent('viewmodechange', { detail: { mode } }));
  }
  function createToggleIfMissing() {
    if (document.getElementById('viewModeToggle')) return;
    const toggle = document.createElement('div');
    toggle.id = 'viewModeToggle';
    toggle.className = 'mode-toggle';
    toggle.setAttribute('role', 'group');
    toggle.setAttribute('aria-label', 'Режим просмотра');
    toggle.innerHTML = `
      <button type="button" id="btnDesktop" title="Режим компьютера">
        <span>🖥️</span><span>Компьютер</span>
      </button>
      <button type="button" id="btnPhone" title="Режим телефона">
        <span>📱</span><span>Телефон</span>
      </button>
    `;
    document.body.appendChild(toggle);
    document.getElementById('btnDesktop').addEventListener('click', () => { saveMode('desktop'); applyMode('desktop'); });
    document.getElementById('btnPhone').addEventListener('click', () => { saveMode('phone'); applyMode('phone'); });
  }

  window.setViewMode = function (mode) {
    if (mode !== 'phone' && mode !== 'desktop') return;
    saveMode(mode);
    applyMode(mode);
  };

  /* ===== Универсальная защита от ложных переключений слайдов =====
     Если на странице есть обработчик свайпа для слайдов, он обычно слушает
     touchstart/touchend на document. Мы не даём событию дойти до него,
     когда жест похож на зум (2 пальца) или на вертикальную прокрутку. */
  function installSwipeGuard() {
    let startX = 0, startY = 0, startT = 0, multi = false, active = false;
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) { multi = true; active = false; return; }
      multi = false; active = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startT = Date.now();
    }, { passive: true, capture: true });

    document.addEventListener('touchmove', (e) => {
      if (!active || multi) return;
      const dx = Math.abs(e.touches[0].clientX - startX);
      const dy = Math.abs(e.touches[0].clientY - startY);
      // Если движение явно вертикальное — блокируем горизонтальный свайп
      if (dy > dx && dy > 10) active = false;
    }, { passive: true, capture: true });

    document.addEventListener('touchend', (e) => {
      if (multi || !active) { multi = false; active = false; return; }
      const t = e.changedTouches[0];
      const dx = startX - t.clientX;
      const dy = startY - t.clientY;
      const dt = Date.now() - startT;
      const isSwipe = Math.abs(dx) > 60 && Math.abs(dy) < 40 && dt < 600;
      if (!isSwipe) {
        // Блокируем всплытие, чтобы обработчик слайдов не сработал
        e.stopPropagation();
      }
      active = false;
    }, { capture: true });
  }

  function init() {
    if (!document.body) {
      const obs = new MutationObserver(() => {
        if (document.body) {
          obs.disconnect();
          createToggleIfMissing();
          applyMode(getSavedMode());
          installSwipeGuard();
        }
      });
      obs.observe(document.documentElement, { childList: true, subtree: true });
      return;
    }
    createToggleIfMissing();
    applyMode(getSavedMode());
    installSwipeGuard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();