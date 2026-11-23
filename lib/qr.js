/* CupCoff — minimal QR Code encoder (byte mode, ECC level M, versions 1–10).
 * Self-contained so the dashboard has no external dependency for posters.
 * Usage: const m = QR.encode("https://..."); // m.size, m.get(x, y) -> boolean
 *        QR.toSvgPath(m, 4) -> SVG path data (quiet zone in modules)
 */
const QR = (() => {
  const ECC_M_PER_BLOCK = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
  const BLOCKS_M = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];

  function rawDataModules(ver) {
    let r = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      const na = Math.floor(ver / 7) + 2;
      r -= (25 * na - 10) * na - 55;
      if (ver >= 7) r -= 36;
    }
    return r;
  }
  const dataCodewords = (ver) => Math.floor(rawDataModules(ver) / 8) - ECC_M_PER_BLOCK[ver] * BLOCKS_M[ver];

  function alignmentPositions(ver, size) {
    if (ver === 1) return [];
    const na = Math.floor(ver / 7) + 2;
    const step = Math.ceil((ver * 4 + 4) / (na * 2 - 2)) * 2;
    const res = [6];
    for (let pos = size - 7; res.length < na; pos -= step) res.splice(1, 0, pos);
    return res;
  }

  function gfMul(x, y) {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11d);
      z ^= ((y >>> i) & 1) * x;
    }
    return z & 0xff;
  }
  function rsDivisor(degree) {
    const r = new Array(degree).fill(0);
    r[degree - 1] = 1;
    let root = 1;
    for (let i = 0; i < degree; i++) {
      for (let j = 0; j < r.length; j++) {
        r[j] = gfMul(r[j], root);
        if (j + 1 < r.length) r[j] ^= r[j + 1];
      }
      root = gfMul(root, 0x02);
    }
    return r;
  }
  function rsRemainder(data, div) {
    const r = div.map(() => 0);
    for (const b of data) {
      const f = b ^ r.shift();
      r.push(0);
      div.forEach((c, i) => (r[i] ^= gfMul(c, f)));
    }
    return r;
  }

  const bit = (x, i) => ((x >>> i) & 1) !== 0;

  function encode(text) {
    const bytes = Array.from(new TextEncoder().encode(text));
    let ver = 0;
    for (let v = 1; v <= 10; v++) {
      const ccBits = v <= 9 ? 8 : 16;
      if (4 + ccBits + bytes.length * 8 <= dataCodewords(v) * 8) { ver = v; break; }
    }
    if (!ver) throw new Error("QR: text too long for this encoder (max version 10)");
    const size = ver * 4 + 17;

    // --- bit stream
    const bits = [];
    const push = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    push(0b0100, 4);
    push(bytes.length, ver <= 9 ? 8 : 16);
    bytes.forEach((b) => push(b, 8));
    const cap = dataCodewords(ver) * 8;
    push(0, Math.min(4, cap - bits.length));
    push(0, (8 - (bits.length % 8)) % 8);
    for (let pad = 0xec; bits.length < cap; pad ^= 0xec ^ 0x11) push(pad, 8);
    const data = [];
    for (let i = 0; i < bits.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
      data.push(b);
    }

    // --- ECC + interleave
    const numBlocks = BLOCKS_M[ver], eccLen = ECC_M_PER_BLOCK[ver];
    const rawCw = Math.floor(rawDataModules(ver) / 8);
    const numShort = numBlocks - (rawCw % numBlocks);
    const shortLen = Math.floor(rawCw / numBlocks);
    const div = rsDivisor(eccLen);
    const blocks = [];
    for (let i = 0, k = 0; i < numBlocks; i++) {
      const dat = data.slice(k, k + shortLen - eccLen + (i < numShort ? 0 : 1));
      k += dat.length;
      const ecc = rsRemainder(dat, div);
      if (i < numShort) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    const cw = [];
    for (let i = 0; i < blocks[0].length; i++) {
      blocks.forEach((blk, j) => { if (i !== shortLen - eccLen || j >= numShort) cw.push(blk[i]); });
    }

    // --- function patterns
    const mod = Array.from({ length: size }, () => new Array(size).fill(false));
    const fn = Array.from({ length: size }, () => new Array(size).fill(false));
    const setF = (x, y, d) => { mod[y][x] = d; fn[y][x] = true; };
    for (let i = 0; i < size; i++) { setF(6, i, i % 2 === 0); setF(i, 6, i % 2 === 0); }
    const finder = (cx, cy) => {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        setF(x, y, d !== 2 && d !== 4);
      }
    };
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    const ap = alignmentPositions(ver, size);
    for (let i = 0; i < ap.length; i++) for (let j = 0; j < ap.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === ap.length - 1) || (i === ap.length - 1 && j === 0)) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++)
        setF(ap[i] + dx, ap[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
    const drawFormat = (mask) => {
      const d = (0 << 3) | mask; // ECC M = 0b00
      let rem = d;
      for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      const b = ((d << 10) | rem) ^ 0x5412;
      for (let i = 0; i <= 5; i++) setF(8, i, bit(b, i));
      setF(8, 7, bit(b, 6)); setF(8, 8, bit(b, 7)); setF(7, 8, bit(b, 8));
      for (let i = 9; i < 15; i++) setF(14 - i, 8, bit(b, i));
      for (let i = 0; i < 8; i++) setF(size - 1 - i, 8, bit(b, i));
      for (let i = 8; i < 15; i++) setF(8, size - 15 + i, bit(b, i));
      setF(8, size - 8, true);
    };
    drawFormat(0);
    if (ver >= 7) {
      let rem = ver;
      for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
      const b = (ver << 12) | rem;
      for (let i = 0; i < 18; i++) {
        const a = size - 11 + (i % 3), c = Math.floor(i / 3);
        setF(a, c, bit(b, i)); setF(c, a, bit(b, i));
      }
    }

    // --- place codewords (zigzag)
    let idx = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
        const x = right - j;
        const up = ((right + 1) & 2) === 0;
        const y = up ? size - 1 - vert : vert;
        if (!fn[y][x] && idx < cw.length * 8) { mod[y][x] = bit(cw[idx >>> 3], 7 - (idx & 7)); idx++; }
      }
    }

    // --- masking (choose lowest simplified penalty)
    const maskFn = [
      (x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
      (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
      (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
    ];
    const applyMask = (m) => {
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++)
        if (!fn[y][x] && maskFn[m](x, y)) mod[y][x] = !mod[y][x];
    };
    const penalty = () => {
      let p = 0, dark = 0;
      for (let y = 0; y < size; y++) {
        let runR = 1, runC = 1;
        for (let x = 0; x < size; x++) {
          if (mod[y][x]) dark++;
          if (x > 0) {
            if (mod[y][x] === mod[y][x - 1]) { runR++; if (runR === 5) p += 3; else if (runR > 5) p++; } else runR = 1;
            if (mod[x][y] === mod[x - 1][y]) { runC++; if (runC === 5) p += 3; else if (runC > 5) p++; } else runC = 1;
          }
          if (x < size - 1 && y < size - 1) {
            const c = mod[y][x];
            if (c === mod[y][x + 1] && c === mod[y + 1][x] && c === mod[y + 1][x + 1]) p += 3;
          }
        }
      }
      const total = size * size;
      p += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
      return p;
    };
    let best = 0, bestP = Infinity;
    for (let m = 0; m < 8; m++) {
      applyMask(m); drawFormat(m);
      const p = penalty();
      if (p < bestP) { bestP = p; best = m; }
      applyMask(m);
    }
    applyMask(best); drawFormat(best);

    return { size, version: ver, get: (x, y) => mod[y][x] };
  }

  function toSvgPath(m, quiet = 4) {
    let d = "";
    for (let y = 0; y < m.size; y++) for (let x = 0; x < m.size; x++)
      if (m.get(x, y)) d += `M${x + quiet},${y + quiet}h1v1h-1z`;
    return d;
  }

  return { encode, toSvgPath };
})();

export default QR;
export { QR };
