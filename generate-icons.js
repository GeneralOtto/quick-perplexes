/**
 * Generates Quick Perplexes extension icons as PNG files.
 * Pure Node.js, no npm dependencies.
 * Run: node generate-icons.js
 */

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// --- CRC32 ---
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// --- PNG encoder ---
function makePNG(pixels, size) {
  // pixels: Uint8Array of RGBA values, row-major

  function chunk(type, data) {
    const typeBytes = Buffer.from(type, 'ascii');
    const len = Buffer.allocUnsafe(4);
    len.writeUInt32BE(data.length);
    const crcInput = Buffer.concat([typeBytes, data]);
    const crcBuf = Buffer.allocUnsafe(4);
    crcBuf.writeUInt32BE(crc32(crcInput));
    return Buffer.concat([len, typeBytes, data, crcBuf]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Filter bytes (type 0 = None) before each row
  const raw = Buffer.allocUnsafe(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 4)] = 0;
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 4;
      const dst = y * (1 + size * 4) + 1 + x * 4;
      raw[dst]     = pixels[src];
      raw[dst + 1] = pixels[src + 1];
      raw[dst + 2] = pixels[src + 2];
      raw[dst + 3] = pixels[src + 3];
    }
  }

  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// --- Icon renderer ---
function renderIcon(size) {
  const pixels = new Uint8Array(size * size * 4);

  // Background: #1c1c1e with rounded corners
  const bgR = 28, bgG = 28, bgB = 30;
  const cornerRadius = size * 0.22;

  // Magnifying glass parameters (all in unit coords 0..1, mapped to pixel space)
  const cx = 0.42 * size;  // circle center x
  const cy = 0.42 * size;  // circle center y
  const outerR = 0.24 * size; // outer radius of lens ring
  const innerR = 0.155 * size; // inner radius (hollow)
  // Handle: a rotated rectangle from bottom-right of circle
  const handleAngle = Math.PI * 0.78; // angle pointing bottom-right
  const handleLen = 0.22 * size;
  const handleW = 0.065 * size;
  // Handle end point
  const hx1 = cx + Math.cos(handleAngle) * outerR * 0.85;
  const hy1 = cy + Math.sin(handleAngle) * outerR * 0.85;
  const hx2 = cx + Math.cos(handleAngle) * (outerR + handleLen);
  const hy2 = cy + Math.sin(handleAngle) * (outerR + handleLen);

  // Anti-aliasing helper: signed distance to nearest edge, negative = inside
  function sdRoundedBox(px, py, cx2, cy2, w, h, r) {
    const qx = Math.abs(px - cx2) - w + r;
    const qy = Math.abs(py - cy2) - h + r;
    return Math.sqrt(Math.max(qx, 0) ** 2 + Math.max(qy, 0) ** 2) - r +
      Math.min(Math.max(qx, qy), 0);
  }

  function sdCircle(px, py, ox, oy, r) {
    return Math.hypot(px - ox, py - oy) - r;
  }

  function sdCapsule(px, py, ax, ay, bx, by, r) {
    const pax = px - ax, pay = py - ay;
    const bax = bx - ax, bay = by - ay;
    const h = Math.max(0, Math.min(1, (pax * bax + pay * bay) / (bax * bax + bay * bay)));
    return Math.hypot(pax - bax * h, pay - bay * h) - r;
  }

  const AA = 1.2; // anti-aliasing smoothing radius in pixels

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // --- Background with rounded corners ---
      const half = size / 2;
      const bgSd = sdRoundedBox(x + 0.5, y + 0.5, half, half, half, half, cornerRadius);
      const bgAlpha = Math.max(0, Math.min(1, -bgSd / AA + 0.5));

      if (bgAlpha <= 0) {
        // fully transparent outside rounded rect
        pixels[idx + 3] = 0;
        continue;
      }

      // --- Magnifying glass: lens ring ---
      const outerSd = sdCircle(x + 0.5, y + 0.5, cx, cy, outerR);
      const innerSd = sdCircle(x + 0.5, y + 0.5, cx, cy, innerR);
      // Ring = inside outer AND outside inner
      const ringAlpha = Math.max(0, Math.min(1, -outerSd / AA + 0.5)) *
                        Math.max(0, Math.min(1,  innerSd / AA + 0.5));

      // --- Handle (capsule) ---
      const handleAlpha = Math.max(0, Math.min(1, -sdCapsule(x + 0.5, y + 0.5, hx1, hy1, hx2, hy2, handleW) / AA + 0.5));

      const iconAlpha = Math.min(1, ringAlpha + handleAlpha);
      const fgAlpha = bgAlpha * iconAlpha;

      // Composite: white icon over bg
      const finalR = bgR + (255 - bgR) * fgAlpha;
      const finalG = bgG + (255 - bgG) * fgAlpha;
      const finalB = bgB + (255 - bgB) * fgAlpha;

      pixels[idx]     = Math.round(finalR);
      pixels[idx + 1] = Math.round(finalG);
      pixels[idx + 2] = Math.round(finalB);
      pixels[idx + 3] = Math.round(bgAlpha * 255);
    }
  }

  return pixels;
}

// --- Generate icons ---
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

for (const size of [16, 32, 48, 128]) {
  const pixels = renderIcon(size);
  const png = makePNG(pixels, size);
  const outPath = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`✓ icons/icon${size}.png (${png.length} bytes)`);
}

console.log('\nDone. Update manifest.json to reference these icons.');
