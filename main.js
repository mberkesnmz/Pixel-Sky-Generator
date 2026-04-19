'use strict';

const TOGGLES = [
  { k: 'clouds',    l: 'CLOUDS',    d: true  },
  { k: 'sun',       l: 'SUN',       d: true  },
  { k: 'moon',      l: 'MOON',      d: false },
  { k: 'stars',     l: 'STARS',     d: false },
  { k: 'mountains', l: 'MOUNTAINS', d: true  },
  { k: 'trees',     l: 'TREES',     d: true  },
  { k: 'birds',     l: 'BIRDS',     d: true  },
  { k: 'rain',      l: 'RAIN',      d: false },
  { k: 'snow',      l: 'SNOW',      d: false },
  { k: 'aurora',    l: 'AURORA',    d: false },
  { k: 'dither',    l: 'DITHER',    d: true  },
  { k: 'darken',    l: 'DARKEN',    d: false },
];

let currentPaletteIndex = 0;
let options = {};
let seed = Date.now();
let isLight = false;

TOGGLES.forEach(t => { options[t.k] = t.d; });

// ── Helpers ──────────────────────────────────

function getSize() {
  const W = Math.max(1, parseInt(document.getElementById('iW').value) || 200);
  const H = Math.max(1, parseInt(document.getElementById('iH').value) || 200);
  return [W, H];
}

function renderCanvas() {
  const [W, H] = getSize();
  const cv     = document.getElementById('cv');
  const ctx    = cv.getContext('2d');
  const scale  = Math.max(1, Math.floor(420 / Math.max(W, H)));

  cv.width        = W;
  cv.height       = H;
  cv.style.width  = W * scale + 'px';
  cv.style.height = H * scale + 'px';

  ctx.putImageData(generate(W, H, PALETTES[currentPaletteIndex], options, seed), 0, 0);
}

// ── Palette list ─────────────────────────────

function buildPaletteList() {
  const container = document.getElementById('pl');
  container.innerHTML = '';
  PALETTES.forEach((p, i) => {
    const el = document.createElement('div');
    el.className = 'pi' + (i === currentPaletteIndex ? ' act' : '');
    el.innerHTML = `<span class="pn">${p.name}</span>
      <span class="pc">${p.sw.map(c => `<span class="ps" style="background:${c}"></span>`).join('')}</span>`;
    el.addEventListener('click', () => {
      document.querySelectorAll('.pi').forEach(e => e.classList.remove('act'));
      el.classList.add('act');
      currentPaletteIndex = i;
      seed = Date.now();
      renderCanvas();
    });
    container.appendChild(el);
  });
}

// ── Toggle grid ──────────────────────────────

function buildToggleGrid() {
  const container = document.getElementById('tg');
  container.innerHTML = '';
  TOGGLES.forEach(t => {
    const el = document.createElement('div');
    el.className = 'ti';
    el.dataset.key = t.k;
    el.innerHTML = `<span class="cb${options[t.k] ? ' on' : ''}"></span><span>${t.l}</span>`;
    el.addEventListener('click', () => {
      options[t.k] = !options[t.k];
      el.querySelector('.cb').className = 'cb' + (options[t.k] ? ' on' : '');
      renderCanvas();
    });
    container.appendChild(el);
  });
}

// ── Export ───────────────────────────────────

function exportPNG() {
  const cv   = document.getElementById('cv');
  const link = document.createElement('a');
  link.href     = cv.toDataURL('image/png');
  link.download = `pixelsky_${PALETTES[currentPaletteIndex].id}_${seed}.png`;
  link.click();
}

// ── Theme toggle ─────────────────────────────

function initThemeToggle() {
  document.getElementById('themeSwitch').addEventListener('click', () => {
    isLight = !isLight;
    document.body.classList.toggle('light', isLight);
  });
}

// ── Init ─────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  buildPaletteList();
  buildToggleGrid();
  initThemeToggle();

  document.getElementById('btnNew').addEventListener('click', () => {
    seed = Date.now();
    renderCanvas();
  });

  document.getElementById('btnEx').addEventListener('click', exportPNG);

  ['iW', 'iH'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
      seed = Date.now();
      renderCanvas();
    });
  });

  renderCanvas();
});
