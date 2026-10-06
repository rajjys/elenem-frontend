import type { ImageKind } from '@/lib/media';

/** A square, in the picture's own pixels. It may reach past the picture's edges (a zoomed-out logo). */
export interface CropSquare {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The largest side sent: the API keeps 1024 px at most, so anything bigger is wasted bytes on 3G. */
const MAX_SIDE = 1024;

/**
 * Draws the chosen square onto a canvas of `side` pixels.
 *
 * Only the part of the picture inside the square is drawn. A zoomed-out logo's square reaches past
 * the picture, and some browsers draw nothing at all when asked for a source rectangle that does.
 * What lies outside stays transparent for a logo and turns white for a photo.
 */
export function renderCrop(img: HTMLImageElement, area: CropSquare, kind: ImageKind, side: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  if (kind === 'photo') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, side, side);
  }
  ctx.imageSmoothingQuality = 'high';
  const scale = side / area.width;
  const sx = Math.max(0, area.x);
  const sy = Math.max(0, area.y);
  const ex = Math.min(img.naturalWidth, area.x + area.width);
  const ey = Math.min(img.naturalHeight, area.y + area.height);
  if (ex > sx && ey > sy) {
    ctx.drawImage(img, sx, sy, ex - sx, ey - sy, (sx - area.x) * scale, (sy - area.y) * scale, (ex - sx) * scale, (ey - sy) * scale);
  }
  return canvas;
}

/**
 * The file that is uploaded: the square, at most 1024 px. A logo goes as PNG so its transparency
 * survives; a photo as JPEG, which is a fraction of the size. Either way the API re-encodes it, so
 * this is only about what crosses the network. It also drops the phone's metadata, GPS included,
 * before anything leaves the device.
 */
export function cropToBlob(img: HTMLImageElement, area: CropSquare, kind: ImageKind): Promise<Blob> {
  const side = Math.max(1, Math.round(Math.min(MAX_SIDE, area.width)));
  const canvas = renderCrop(img, area, kind, side);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('canvas'))),
      kind === 'logo' ? 'image/png' : 'image/jpeg',
      0.92,
    ),
  );
}

/** Loads a picture fully, or says it cannot be read (HEIC in Chrome, a damaged file). */
export async function decodeImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}
