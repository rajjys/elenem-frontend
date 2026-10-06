'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/utils/cn';
import { MIN_SIDE, type ImageKind } from '@/lib/media';
import { cropToBlob, renderCrop } from './crop-image';

/**
 * Choosing the square (docs/IMAGES_AND_STORAGE.md §1.3: every v1 image is square).
 *
 * A **photo** fills the square: the frame stays inside the picture and the person drags to centre
 * the face. A **logo** opens fitted whole inside the square and can be zoomed out further, never
 * cut; what the frame holds beyond the logo becomes transparent.
 *
 * Loaded only when a file has been picked, so the cropper costs nothing on the pages that offer it.
 */
export default function CropDialog({
  img,
  kind,
  round,
  title,
  uploading,
  progress,
  onCancel,
  onConfirm,
}: {
  img: HTMLImageElement;
  kind: ImageKind;
  /** Shown round where the image will be shown round (clubs, players). */
  round: boolean;
  title: string;
  uploading: boolean;
  /** 0 to 1. */
  progress: number;
  onCancel: () => void;
  onConfirm: (file: Blob) => void;
}) {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  // Fitted whole: the zoom at which the long side fills the frame.
  const fitZoom = kind === 'logo' ? Math.min(w, h) / Math.max(w, h) : 1;

  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(fitZoom);
  const [area, setArea] = useState<Area | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  // The preview is drawn from the same crop that will be sent, once the hand stops moving.
  useEffect(() => {
    if (!area) return;
    setPreview(renderCrop(img, area, kind, 192).toDataURL('image/png'));
  }, [img, area, kind]);

  const side = area ? Math.round(area.width) : 0;
  const tooSmall = !!area && side < MIN_SIDE;
  const busy = uploading || preparing;

  const confirm = async () => {
    if (!area || tooSmall) return;
    setPreparing(true);
    try {
      onConfirm(await cropToBlob(img, area, kind));
    } finally {
      setPreparing(false);
    }
  };

  const shape = round ? 'rounded-full' : 'rounded-lg';
  const percent = useMemo(() => Math.round(progress * 100), [progress]);

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onCancel()}>
      <DialogContent className="max-w-md" hideClose={busy}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {kind === 'logo'
              ? 'Dézoomez pour faire entrer tout le logo : le reste sera transparent.'
              : 'Glissez la photo pour centrer le visage, et zoomez si besoin.'}
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-72 overflow-hidden rounded-lg bg-surface-sunk sm:h-80">
          <Cropper
            image={img.src}
            crop={crop}
            zoom={zoom}
            minZoom={fitZoom}
            maxZoom={4}
            aspect={1}
            cropShape={round ? 'round' : 'rect'}
            showGrid={false}
            restrictPosition={kind === 'photo'}
            zoomSpeed={0.2}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <label className="mt-4 flex items-center gap-3 text-sm text-ink-muted">
          <span className="w-10 shrink-0">Zoom</span>
          <input
            type="range"
            min={fitZoom}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1 w-full cursor-pointer accent-accent"
            aria-label="Zoom"
            disabled={busy}
          />
        </label>

        <div className="mt-4 flex items-center gap-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">Aperçu</span>
          {preview && (
            <>
              {/* Two sizes it will actually appear at: a row in a table, and a page. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="" className={cn('h-8 w-8 bg-surface object-contain ring-1 ring-line', shape)} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="" className={cn('h-20 w-20 bg-surface object-contain ring-1 ring-line', shape)} />
            </>
          )}
        </div>

        {tooSmall && (
          <p className="mt-3 text-sm text-negative" role="alert">
            Ce cadre ne fait que {side} pixels de côté ; il en faut au moins {MIN_SIDE}. Dézoomez, ou
            choisissez une image plus grande.
          </p>
        )}

        {uploading && (
          <div className="mt-4" aria-live="polite">
            <div className="h-1 w-full overflow-hidden rounded-full bg-surface-sunk">
              <div className="h-full bg-accent transition-[width]" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              {percent < 100 ? `Envoi… ${percent} %` : 'Préparation des différentes tailles…'}
            </p>
          </div>
        )}

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            Annuler
          </Button>
          <Button variant="primary" onClick={confirm} disabled={!area || tooSmall} isLoading={busy}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
