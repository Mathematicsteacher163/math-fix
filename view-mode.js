/* view-mode.js — единый режим просмотра для всех страниц сайта */
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
      if (mode === 'phone') {
        btnP.classList.add('active');
        btnD.classList.remove('active');
      } else {
        btnD.classList.add('active');
        btnP.classList.remove('active');
      }
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

    document.getElementById('btnDesktop').addEventListener('click', () => {
      saveMode('desktop');
      applyMode('desktop');
    });
    document.getElementById('btnPhone').addEventListener('click', () => {
      saveMode('phone');
      applyMode('phone');
    });
  }

  window.setViewMode = function (mode) {
    if (mode !== 'phone' && mode !== 'desktop') return;
    saveMode(mode);
    applyMode(mode);
  };

  function init() {
    if (!document.body) {
      const obs = new MutationObserver(() => {
        if (document.body) {
          obs.disconnect();
          createToggleIfMissing();
          applyMode(getSavedMode());
        }
      });
      obs.observe(document.documentElement, { childList: true, subtree: true });
      return;
    }
    createToggleIfMissing();
    applyMode(getSavedMode());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();