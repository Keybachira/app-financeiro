import { decodePng, projectRoot, readFileSync, writePng } from './png.mjs';

const BG_DEEP = [7, 12, 36];
const BG_MID = [11, 21, 56];
const ICON_SIZE = 1024;

function sampleEdgeColor({ width, height, channels, pixels }) {
  const sum = [0, 0, 0];
  let count = 0;

  const sample = (x, y) => {
    const index = (y * width + x) * channels;
    sum[0] += pixels[index];
    sum[1] += pixels[index + 1];
    sum[2] += pixels[index + 2];
    count += 1;
  };

  const inset = Math.floor(width * 0.06);
  for (let i = inset; i < width - inset; i += 7) {
    sample(i, Math.floor(height * 0.02));
    sample(i, Math.floor(height * 0.98));
  }
  for (let i = inset; i < height - inset; i += 7) {
    sample(Math.floor(width * 0.02), i);
    sample(Math.floor(width * 0.98), i);
  }

  return sum.map((value) => Math.round(value / count));
}

function isCornerBlack(r, g, b) {
  return r < 14 && g < 14 && b < 14;
}

function toRgba(source, { cornerFill, cornerTransparent }) {
  const { width, height, channels, pixels } = source;
  const out = Buffer.alloc(width * height * 4);

  for (let i = 0; i < width * height; i += 1) {
    const sourceIndex = i * channels;
    const targetIndex = i * 4;
    const r = pixels[sourceIndex];
    const g = pixels[sourceIndex + 1];
    const b = pixels[sourceIndex + 2];

    if (isCornerBlack(r, g, b)) {
      if (cornerTransparent) {
        out[targetIndex + 3] = 0;
      } else {
        out[targetIndex] = cornerFill[0];
        out[targetIndex + 1] = cornerFill[1];
        out[targetIndex + 2] = cornerFill[2];
        out[targetIndex + 3] = 255;
      }
      continue;
    }

    out[targetIndex] = r;
    out[targetIndex + 1] = g;
    out[targetIndex + 2] = b;
    out[targetIndex + 3] = 255;
  }

  return out;
}

function resizeTo(source, size) {
  const { width, height, channels, pixels } = source;
  const out = Buffer.alloc(size * size * 4);
  const scaleX = width / size;
  const scaleY = height / size;

  for (let y = 0; y < size; y += 1) {
    const sy = Math.min(height - 1, Math.floor(y * scaleY));
    for (let x = 0; x < size; x += 1) {
      const sx = Math.min(width - 1, Math.floor(x * scaleX));
      const sourceIndex = (sy * width + sx) * channels;
      const targetIndex = (y * size + x) * 4;

      out[targetIndex] = pixels[sourceIndex];
      out[targetIndex + 1] = pixels[sourceIndex + 1];
      out[targetIndex + 2] = pixels[sourceIndex + 2];
      out[targetIndex + 3] = pixels[sourceIndex + 3] ?? 255;
    }
  }

  return out;
}

function composeOn(size, draw) {
  const out = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      out[index] = BG_DEEP[0];
      out[index + 1] = BG_DEEP[1];
      out[index + 2] = BG_DEEP[2];
      out[index + 3] = 255;
    }
  }

  draw(out, size);
  return out;
}

function drawCentered(target, size, source, sourceSize, scale, alpha = 255) {
  const inner = Math.round(sourceSize * scale);
  const offset = Math.round((size - inner) / 2);
  const step = sourceSize / inner;

  for (let y = 0; y < inner; y += 1) {
    const sy = Math.min(sourceSize - 1, Math.floor(y * step));
    for (let x = 0; x < inner; x += 1) {
      const sx = Math.min(sourceSize - 1, Math.floor(x * step));
      const sourceIndex = (sy * sourceSize + sx) * 4;
      const sourceAlpha = source[sourceIndex + 3];

      if (sourceAlpha === 0) {
        continue;
      }

      const px = offset + x;
      const py = offset + y;

      if (px < 0 || py < 0 || px >= size || py >= size) {
        continue;
      }

      const targetIndex = (py * size + px) * 4;
      const a = (sourceAlpha / 255) * (alpha / 255);

      target[targetIndex] = Math.round(source[sourceIndex] * a + target[targetIndex] * (1 - a));
      target[targetIndex + 1] = Math.round(source[sourceIndex + 1] * a + target[targetIndex + 1] * (1 - a));
      target[targetIndex + 2] = Math.round(source[sourceIndex + 2] * a + target[targetIndex + 2] * (1 - a));
      target[targetIndex + 3] = 255;
    }
  }
}

const source = decodePng(readFileSync(projectRoot('assets/logo.png')));
const navy = sampleEdgeColor(source);
const fullBleed = toRgba(source, { cornerFill: BG_MID, cornerTransparent: false });
const transparentCorners = toRgba(source, { cornerFill: BG_MID, cornerTransparent: true });

const icon = resizeTo({ ...source, channels: 4, pixels: fullBleed }, ICON_SIZE);
const foreground = resizeTo({ ...source, channels: 4, pixels: transparentCorners }, ICON_SIZE);

writePng(projectRoot('assets/icon.png'), ICON_SIZE, ICON_SIZE, icon);
writePng(projectRoot('assets/adaptive-icon.png'), ICON_SIZE, ICON_SIZE, foreground);
writePng(projectRoot('assets/favicon.png'), 196, 196, resizeTo({ ...source, channels: 4, pixels: fullBleed }, 196));

const splash = composeOn(ICON_SIZE, (target, size) => drawCentered(target, size, foreground, ICON_SIZE, 0.62));
writePng(projectRoot('assets/splash-icon.png'), ICON_SIZE, ICON_SIZE, splash);

console.log(JSON.stringify({ sourceSize: `${source.width}x${source.height}`, edgeNavy: navy, outputs: ['icon.png', 'adaptive-icon.png', 'favicon.png', 'splash-icon.png'] }, null, 2));
