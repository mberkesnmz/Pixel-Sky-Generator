'use strict';

// ─────────────────────────────────────────────
// SEEDED RNG
// ─────────────────────────────────────────────

function makeRNG(seed) {
  let s = seed >>> 0;
  return {
    n() {
      s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
      s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
      s ^= (s >>> 16);
      return (s >>> 0) / 0xffffffff;
    },
    r(a, b) { return a + this.n() * (b - a); },
    i(a, b) { return Math.floor(this.r(a, b + 0.999)); },
  };
}

/**
 * Her element kendi bağımsız RNG'sini alır.
 * Bir elementi toggle etmek diğer katmanları etkilemez.
 * Türetme: seed XOR (index × Knuth sabit)
 */
function deriveRNG(seed, index) {
  return makeRNG(((seed >>> 0) ^ (Math.imul(index, 2654435761) >>> 0)) >>> 0);
}

// ─────────────────────────────────────────────
// COLOR UTILITIES
// ─────────────────────────────────────────────

function lerp(a, b, t) { return a + (b - a) * t; }

function lerpColor(c1, c2, t) {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}

function clampColor(c) {
  return c.map(v => Math.max(0, Math.min(255, Math.round(v))));
}

// ─────────────────────────────────────────────
// FALLBACK COLORS
// Palette'de tanımlı olmayan elementler için
// ─────────────────────────────────────────────

const FALLBACKS = {
  cloud: [220, 225, 235],
  star:  [255, 255, 230],
  sun:   [255, 220, 80],
  moon:  [215, 220, 228],
  rain:  [120, 140, 160],
  snow:  [240, 245, 255],
  bird:  [20, 25, 35],
  tree:  [30, 60, 30],
  mount: [[55, 65, 75], [38, 48, 58]],
  aur:   [[80, 200, 120], [40, 160, 200], [140, 60, 200]],
};

// ─────────────────────────────────────────────
// COLOR PALETTES
// ─────────────────────────────────────────────

const PALETTES = [
  {
    id: 'aurora', name: 'AURORA DREAMS',
    sky:   [[8, 5, 25], [12, 20, 55], [15, 45, 65]],
    cloud: [100, 180, 160], mount: [[15, 15, 40], [8, 25, 35]],
    tree: [5, 20, 15], star: [200, 240, 220], moon: [210, 230, 220],
    aur: [[80, 200, 120], [40, 160, 200], [120, 60, 200]], bird: [5, 40, 30],
    sw: ['#08051a','#0c1437','#0f2d41','#3c7858','#64b4a0','#c8f0dc','#a0b8d0','#d2e6de'],
  },
  {
    id: 'golden', name: 'GOLDEN HOUR',
    sky:   [[20, 10, 55], [180, 60, 30], [240, 160, 40]],
    cloud: [240, 180, 140], mount: [[30, 15, 40], [55, 25, 20]],
    tree: [20, 15, 10], sun: [255, 220, 80], bird: [15, 10, 5],
    sw: ['#140a37','#b43c1e','#f0a028','#f0b48c','#fae0a0','#ff8c50','#1e0f28','#503218'],
  },
  {
    id: 'midday', name: 'MIDDAY CLEAR',
    sky:   [[30, 100, 200], [80, 160, 230], [160, 210, 255]],
    cloud: [240, 248, 255], mount: [[60, 90, 80], [80, 110, 70]],
    tree: [30, 70, 30], sun: [255, 240, 100], bird: [20, 50, 80],
    sw: ['#1e64c8','#50a0e6','#a0d2ff','#f0f8ff','#ffffff','#3c5a50','#1e4a1e','#fef064'],
  },
  {
    id: 'dawn', name: 'MISTY DAWN',
    sky:   [[50, 15, 70], [180, 80, 130], [240, 160, 100]],
    cloud: [220, 160, 190], mount: [[40, 20, 55], [70, 40, 70]],
    tree: [25, 15, 30], star: [220, 200, 230], sun: [255, 200, 100], bird: [20, 10, 25],
    sw: ['#321046','#b45082','#f0a064','#dca0be','#f5d0e0','#f0c8a0','#190f23','#644050'],
  },
  {
    id: 'storm', name: 'STORM FRONT',
    sky:   [[15, 15, 25], [40, 45, 55], [70, 75, 85]],
    cloud: [80, 85, 95], mount: [[20, 20, 30], [30, 35, 40]],
    tree: [15, 18, 20], rain: [120, 140, 160], snow: [180, 190, 200],
    sw: ['#0f0f19','#282d37','#464b55','#505870','#787d87','#adb2bc','#0f1419','#1e6496'],
  },
  {
    id: 'winter', name: 'WINTER PALE',
    sky:   [[120, 150, 190], [170, 200, 230], [210, 230, 250]],
    cloud: [240, 245, 250], mount: [[140, 165, 195], [160, 185, 215]],
    tree: [40, 40, 55], snow: [240, 245, 255], sun: [220, 220, 240],
    moon: [210, 220, 235], star: [200, 215, 240],
    sw: ['#7896be','#aac8e6','#d2e6f5','#f0f5fa','#ffffff','#283738','#c0cdd8','#dce6f0'],
  },
  {
    id: 'forest', name: 'FOREST DUSK',
    sky:   [[20, 30, 55], [50, 70, 40], [80, 100, 50]],
    cloud: [70, 90, 60], mount: [[15, 30, 15], [25, 50, 20]],
    tree: [12, 35, 12], treeHi: [30, 60, 20],
    star: [200, 210, 180], moon: [200, 210, 190], bird: [10, 20, 10],
    sw: ['#141e37','#3c5032','#647850','#508014','#a0b450','#c8d878','#0f1e0f','#c8d2b4'],
  },
  {
    id: 'tropical', name: 'TROPICAL SKY',
    sky:   [[0, 140, 200], [0, 180, 230], [100, 220, 255]],
    cloud: [255, 255, 255], mount: [[20, 80, 40]],
    tree: [10, 60, 20], treeHi: [30, 120, 40], sun: [255, 230, 0], bird: [10, 50, 80],
    sw: ['#008cc8','#00b4e6','#78dcff','#ffffff','#f5f5a0','#145028','#1e783c','#ffe800'],
  },
  {
    id: 'twilight', name: 'TWILIGHT HAZE',
    sky:   [[25, 10, 50], [120, 60, 100], [200, 120, 80]],
    cloud: [180, 120, 160], mount: [[35, 15, 45], [60, 30, 60]],
    tree: [20, 10, 25], star: [230, 200, 250], moon: [230, 215, 240], bird: [15, 8, 20],
    sw: ['#190a32','#783c64','#c87850','#b47890','#f0d0e0','#e8c090','#0f0519','#503040'],
  },
  {
    id: 'neon_night', name: 'NEON NIGHT',
    sky:   [[5, 3, 18], [8, 10, 35], [10, 20, 50]],
    cloud: [60, 20, 100], mount: [[20, 10, 40], [15, 5, 30]],
    tree: [10, 5, 25], star: [255, 200, 255], moon: [200, 180, 255],
    aur: [[200, 50, 255], [50, 200, 255], [255, 100, 150]],
    sw: ['#05031a','#080a23','#141432','#3c1464','#6428c8','#c850ff','#50c8ff','#ff6496'],
  },
  {
    id: 'desert', name: 'DESERT SUNSET',
    sky:   [[30, 15, 60], [200, 80, 20], [240, 180, 80]],
    cloud: [200, 140, 100], mount: [[80, 40, 20], [100, 60, 30]],
    tree: [40, 25, 10], sun: [255, 210, 60],
    star: [220, 200, 160], moon: [220, 200, 160], bird: [20, 8, 5],
    sw: ['#1e0f3c','#c85014','#f0b450','#c88c64','#f0c896','#f0e090','#281408','#644028'],
  },
  {
    id: 'pastel', name: 'PASTEL DREAM',
    sky:   [[180, 160, 220], [210, 190, 240], [235, 220, 255]],
    cloud: [255, 240, 255], mount: [[180, 170, 210], [195, 185, 225]],
    tree: [140, 180, 160], treeHi: [170, 210, 185],
    sun: [255, 220, 200], moon: [220, 210, 240], star: [200, 190, 230],
    bird: [160, 140, 200], rain: [180, 170, 210], snow: [245, 240, 255],
    sw: ['#b4a0dc','#d2bef0','#ebb8e0','#f5dcff','#fff0ff','#8cb4a0','#aad2be','#ffdce8'],
  },
];

// ─────────────────────────────────────────────
// GENERATE
// ─────────────────────────────────────────────

function generate(W, H, palette, options, seed) {
  const buf = new Uint8ClampedArray(W * H * 4);

  function sp(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const i = (y * W + x) * 4;
    if (a === 255) {
      buf[i] = r; buf[i+1] = g; buf[i+2] = b; buf[i+3] = 255;
    } else {
      const fa = a / 255, ba = buf[i+3] / 255, oa = fa + ba * (1 - fa);
      if (oa > 0) {
        buf[i]   = Math.round((r * fa + buf[i]   * ba * (1 - fa)) / oa);
        buf[i+1] = Math.round((g * fa + buf[i+1] * ba * (1 - fa)) / oa);
        buf[i+2] = Math.round((b * fa + buf[i+2] * ba * (1 - fa)) / oa);
      }
      buf[i+3] = Math.round(oa * 255);
    }
  }

  // Bağımsız per-element RNG'ler
  const R = {
    sky:    deriveRNG(seed,  1),
    aurora: deriveRNG(seed,  2),
    stars:  deriveRNG(seed,  3),
    sun:    deriveRNG(seed,  4),
    moon:   deriveRNG(seed,  5),
    mount:  deriveRNG(seed,  6),
    clouds: deriveRNG(seed,  7),
    trees:  deriveRNG(seed,  8),
    birds:  deriveRNG(seed,  9),
    rain:   deriveRNG(seed, 10),
    snow:   deriveRNG(seed, 11),
  };

  // Palette'de yoksa fallback
  function pc(key) { return palette[key] || FALLBACKS[key]; }

  function mtnProfile(rng, baseH, variation, roughness) {
    const h = [];
    let cur = rng.r(baseH - variation * 0.5, baseH + variation * 0.5);
    for (let x = 0; x < W; x++) {
      cur += (rng.n() - 0.5) * roughness;
      cur  = Math.max(baseH - variation, Math.min(baseH + variation, cur));
      h.push(Math.round(cur));
    }
    for (let p = 0; p < 4; p++)
      for (let x = 1; x < W - 1; x++)
        h[x] = Math.round((h[x-1] + h[x] * 3 + h[x+1]) / 5);
    return h;
  }

  // 1. SKY
  const sky = palette.sky;
  for (let y = 0; y < H; y++) {
    const t = y / H;
    let c = sky.length === 2
      ? lerpColor(sky[0], sky[1], t)
      : t < 0.5 ? lerpColor(sky[0], sky[1], t * 2) : lerpColor(sky[1], sky[2], (t - 0.5) * 2);
    for (let x = 0; x < W; x++) {
      const n = (R.sky.n() - 0.5) * (options.dither ? 4 : 1);
      const cc = clampColor([c[0]+n, c[1]+n, c[2]+n]);
      sp(x, y, cc[0], cc[1], cc[2]);
    }
  }

  // 2. AURORA
  if (options.aurora) {
    pc('aur').forEach(a => {
      const baseY = R.aurora.r(0.05, 0.35) * H, amp = R.aurora.r(5, 20);
      const freq = R.aurora.r(0.02, 0.07), phase = R.aurora.r(0, Math.PI * 2), bandH = R.aurora.i(5, 18);
      for (let x = 0; x < W; x++) {
        const wave = Math.sin(x * freq + phase) * amp;
        for (let dy = 0; dy < bandH; dy++) {
          const al = Math.round(90 * Math.sin((dy / bandH) * Math.PI) * (0.4 + R.aurora.n() * 0.6));
          sp(x, Math.round(baseY + wave + dy), a[0], a[1], a[2], al);
        }
      }
    });
  }

  // 3. STARS
  if (options.stars) {
    const sc = pc('star'), ns = R.stars.i(50, 130);
    for (let i = 0; i < ns; i++) {
      const sx = R.stars.i(0, W-1), sy = R.stars.i(0, Math.floor(H * 0.65)), br = R.stars.i(140, 255);
      sp(sx, sy, sc[0], sc[1], sc[2], br);
      if (R.stars.n() < 0.18) { sp(sx+1, sy, sc[0], sc[1], sc[2], Math.round(br*0.4)); sp(sx, sy+1, sc[0], sc[1], sc[2], Math.round(br*0.4)); }
    }
  }

  // 4. SUN
  if (options.sun) {
    const sc = pc('sun');
    const sx = R.sun.i(Math.floor(W*0.15), Math.floor(W*0.85));
    const sy = R.sun.i(Math.floor(H*0.05), Math.floor(H*0.30));
    const sr = R.sun.i(7, 14);
    for (let dx = -sr*2; dx <= sr*2; dx++) {
      for (let dy = -sr*2; dy <= sr*2; dy++) {
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d <= sr) sp(sx+dx, sy+dy, sc[0], sc[1], sc[2]);
        else if (d < sr*2) sp(sx+dx, sy+dy, sc[0], sc[1], sc[2], Math.round((1-(d-sr)/sr)*88));
      }
    }
    const nr = R.sun.i(6, 10);
    for (let ri = 0; ri < nr; ri++) {
      const ang = (ri / nr) * Math.PI * 2, rl = R.sun.i(3, 8);
      for (let d = sr+2; d < sr+2+rl; d++)
        sp(Math.round(sx + Math.cos(ang)*d), Math.round(sy + Math.sin(ang)*d), sc[0], sc[1], sc[2], 145);
    }
  }

  // 5. MOON
  if (options.moon) {
    const mc = pc('moon');
    const mx = R.moon.i(Math.floor(W*0.15), Math.floor(W*0.85));
    const my = R.moon.i(Math.floor(H*0.04), Math.floor(H*0.27));
    const mr = R.moon.i(6, 12);
    for (let dx = -mr; dx <= mr; dx++) {
      for (let dy = -mr; dy <= mr; dy++) {
        if (Math.sqrt(dx*dx + dy*dy) <= mr) {
          const cr = (Math.abs(dx - mr*0.3) < 2 && Math.abs(dy + mr*0.2) < 2) ||
                     (Math.abs(dx + mr*0.4) < 1.5 && Math.abs(dy - mr*0.1) < 1.5);
          sp(mx+dx, my+dy, cr?Math.round(mc[0]*0.65):mc[0], cr?Math.round(mc[1]*0.65):mc[1], cr?Math.round(mc[2]*0.65):mc[2]);
        }
      }
    }
  }

  // 6. MOUNTAINS
  if (options.mountains) {
    const m = pc('mount');
    const m0 = Array.isArray(m[0]) ? m[0] : m;
    const m1 = Array.isArray(m[0]) && m[1] ? m[1] : null;
    const fh = mtnProfile(R.mount, H * 0.55, H * 0.18, 3);
    for (let x = 0; x < W; x++) for (let y = fh[x]; y < H; y++) {
      const dk = Math.min(1, (y - fh[x]) / 25);
      const cc = clampColor([m0[0]*(1-dk*0.3), m0[1]*(1-dk*0.3), m0[2]*(1-dk*0.3)]);
      sp(x, y, cc[0], cc[1], cc[2]);
    }
    if (m1) {
      const nh = mtnProfile(R.mount, H * 0.68, H * 0.14, 4);
      for (let x = 0; x < W; x++) for (let y = nh[x]; y < H; y++) {
        const dk = Math.min(1, (y - nh[x]) / 20);
        const cc = clampColor([m1[0]*(1-dk*0.4), m1[1]*(1-dk*0.4), m1[2]*(1-dk*0.4)]);
        sp(x, y, cc[0], cc[1], cc[2]);
      }
    }
  }

  // 7. CLOUDS
  if (options.clouds) {
    const cc = pc('cloud'), nc = R.clouds.i(3, 9);
    for (let ci = 0; ci < nc; ci++) {
      const cx = R.clouds.i(6, W-6), cy = R.clouds.i(Math.floor(H*0.04), Math.floor(H*0.44));
      const nb = R.clouds.i(3, 8);
      for (let bi = 0; bi < nb; bi++) {
        const bx = cx + R.clouds.i(-14, 14), by = cy + R.clouds.i(-5, 5), br = R.clouds.i(4, 11);
        for (let dx = -br; dx <= br; dx++) {
          for (let dy = -Math.floor(br*0.72); dy <= Math.floor(br*0.72); dy++) {
            const d = Math.sqrt(dx*dx + (dy*1.5)*(dy*1.5));
            if (d <= br) {
              const al = Math.round(175 * Math.min(1, (br-d)/(br*0.42)));
              const sh = dy > 0 ? 0.70 : 1.0;
              sp(bx+dx, by+dy, Math.round(cc[0]*sh), Math.round(cc[1]*sh), Math.round(cc[2]*sh), al);
            }
          }
        }
      }
    }
  }

  // 8. TREES
  if (options.trees) {
    const tc = pc('tree'), tHi = palette.treeHi || tc;
    const tBase = Math.floor(H * 0.85), nt = R.trees.i(5, 15);
    for (let ti = 0; ti < nt; ti++) {
      const tx = R.trees.i(0, W-1), th = R.trees.i(10, 26);
      const tB = Math.min(H-1, tBase + R.trees.i(-6, 6));
      const isPine = R.trees.n() < 0.60;
      if (isPine) {
        const tw = Math.floor(th * 0.52);
        for (let dy = 0; dy < th; dy++) {
          const rw = Math.floor((dy / th) * tw);
          for (let dx = -rw; dx <= rw; dx++) sp(tx+dx, tB-th+dy, tc[0], tc[1], tc[2]);
        }
        for (let dy = 0; dy < 3; dy++) sp(tx, tB+dy, Math.round(tc[0]*0.6), Math.round(tc[1]*0.5), Math.round(tc[2]*0.4));
      } else {
        const tr = Math.floor(th * 0.38);
        for (let dx = -tr; dx <= tr; dx++) for (let dy = -tr; dy <= tr; dy++) {
          if (Math.sqrt(dx*dx + dy*dy) <= tr) {
            const c = (dy < 0 && R.trees.n() < 0.30) ? tHi : tc;
            sp(tx+dx, tB-th+dy+tr, c[0], c[1], c[2]);
          }
        }
        for (let dy = 0; dy < Math.floor(th*0.52); dy++)
          sp(tx, tB-Math.floor(th*0.52)+dy, Math.round(tc[0]*0.6), Math.round(tc[1]*0.5), Math.round(tc[2]*0.4));
      }
    }
  }

  // 9. BIRDS
  if (options.birds) {
    const bc = pc('bird'), nb = R.birds.i(3, 14);
    for (let bi = 0; bi < nb; bi++) {
      const bx = R.birds.i(5, W-5), by = R.birds.i(Math.floor(H*0.08), Math.floor(H*0.54));
      sp(bx, by, bc[0], bc[1], bc[2]);
      sp(bx-1, by+1, bc[0], bc[1], bc[2]);
      sp(bx+1, by+1, bc[0], bc[1], bc[2]);
    }
  }

  // 10. RAIN
  if (options.rain) {
    const rc = pc('rain'), nd = R.rain.i(120, 230);
    for (let di = 0; di < nd; di++) {
      const rx = R.rain.i(0, W-1), ry = R.rain.i(0, H-1), rl = R.rain.i(3, 8);
      for (let dl = 0; dl < rl; dl++) sp(rx+dl, ry+dl*2, rc[0], rc[1], rc[2], 155);
    }
  }

  // 11. SNOW
  if (options.snow) {
    const sc = pc('snow'), nf = R.snow.i(70, 180);
    for (let fi = 0; fi < nf; fi++) {
      const fx = R.snow.i(0, W-1), fy = R.snow.i(0, H-1);
      sp(fx, fy, sc[0], sc[1], sc[2], 210);
      if (R.snow.n() < 0.28) { sp(fx+1, fy, sc[0], sc[1], sc[2], 110); sp(fx, fy+1, sc[0], sc[1], sc[2], 110); }
    }
  }

  // POST: DARKEN
  if (options.darken)
    for (let i = 0; i < buf.length; i += 4) { buf[i] = Math.round(buf[i]*0.62); buf[i+1] = Math.round(buf[i+1]*0.62); buf[i+2] = Math.round(buf[i+2]*0.62); }

  // POST: BAYER DITHER
  if (options.dither) {
    const BM = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const th = (BM[y%4][x%4] / 16 - 0.5) * 14, i = (y * W + x) * 4;
      buf[i]   = Math.max(0, Math.min(255, buf[i]   + th));
      buf[i+1] = Math.max(0, Math.min(255, buf[i+1] + th));
      buf[i+2] = Math.max(0, Math.min(255, buf[i+2] + th));
    }
  }

  return new ImageData(buf, W, H);
}
