'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useRemoveImage, useReplaceImage } from '@/services/media';
import { MIN_SIDE, SLOT_KIND, mediaSrc, type ImageSlot } from '@/lib/media';
import { toastApiError } from '@/utils';
import { cn } from '@/utils/cn';
import { decodeImage } from './crop-image';

const CropDialog = dynamic(() => import('./crop-dialog'), { ssr: false });

/** Accepted by the API (it reads the bytes; this is only so the picker offers the right files). */
const ACCEPT = 'image/jpeg,image/png,image/webp';
/** The file picked, before cropping. It is never sent as is: the crop scales it down first. */
const MAX_PICK_MB = 20;

const COPY: Record<
  ImageSlot,
  { label: string; add: string; saved: string; removed: string; removeTitle: string; removeBody: string; crop: string }
> = {
  'tenant-logo': {
    label: 'Logo de l’organisation',
    add: 'Ajouter un logo',
    saved: 'Logo enregistré.',
    removed: 'Logo retiré.',
    removeTitle: 'Retirer le logo ?',
    removeBody: 'Les initiales de l’organisation le remplaceront, sur le site public comme dans l’application.',
    crop: 'Recadrer le logo',
  },
  'league-logo': {
    label: 'Logo de la compétition',
    add: 'Ajouter un logo',
    saved: 'Logo enregistré.',
    removed: 'Logo retiré.',
    removeTitle: 'Retirer le logo ?',
    removeBody: 'Les initiales de la compétition le remplaceront partout où il apparaît.',
    crop: 'Recadrer le logo',
  },
  'team-logo': {
    label: 'Logo du club',
    add: 'Ajouter un logo',
    saved: 'Logo enregistré.',
    removed: 'Logo retiré.',
    removeTitle: 'Retirer le logo ?',
    removeBody: 'Les initiales du club le remplaceront, au classement comme sur le calendrier.',
    crop: 'Recadrer le logo',
  },
  'player-photo': {
    label: 'Photo',
    add: 'Ajouter une photo',
    saved: 'Photo enregistrée.',
    removed: 'Photo retirée.',
    removeTitle: 'Retirer la photo ?',
    removeBody: 'Les initiales du joueur la remplaceront partout où elle apparaît.',
    crop: 'Recadrer la photo',
  },
};

/** Round where the image is shown round: a club's crest and a player's photo. */
const ROUND: Record<ImageSlot, boolean> = {
  'tenant-logo': false,
  'league-logo': false,
  'team-logo': true,
  'player-photo': true,
};

/** Why a picked file cannot be used, in words that say what to do instead. Null when it can. */
function refusalFor(file: File): string | null {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  if (/hei[cf]/.test(type) || /\.hei[cf]$/.test(name)) {
    return 'Le format HEIC (iPhone) n’est pas accepté. Exportez la photo en JPEG, puis réessayez.';
  }
  if (type === 'image/svg+xml' || name.endsWith('.svg')) {
    return 'Les fichiers SVG ne sont pas acceptés. Utilisez le logo en PNG ou en JPEG.';
  }
  if (type === 'image/gif') return 'Les GIF ne sont pas acceptés. Choisissez une image JPEG, PNG ou WebP.';
  if (!ACCEPT.split(',').includes(type)) return 'Choisissez une image JPEG, PNG ou WebP.';
  if (file.size > MAX_PICK_MB * 1024 * 1024) {
    return `Cette image dépasse ${MAX_PICK_MB} Mo. Choisissez-en une plus légère.`;
  }
  return null;
}

function initials(name: string): string {
  const words = name.split(/[\s'’-]+/).filter((w) => w && !/^(de|du|des|la|le|les|d|l|et)$/i.test(w));
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? words[0]?.[1] ?? '')).toUpperCase();
}

/**
 * A logo or a photo, and the controls to change or remove it (docs/IMAGES_AND_STORAGE.md §4).
 *
 * It saves on its own, the moment the crop is confirmed, whatever form it sits in: an image is
 * stored as soon as it is sent, so tying it to a form's « Enregistrer » would only add a second step
 * that could be forgotten. Everything it shows falls back to initials — a missing or broken image
 * never leaves a hole.
 */
export function ImageField({
  slot,
  entityId,
  value,
  name,
  label,
  hint,
  onChange,
  className,
}: {
  slot: ImageSlot;
  entityId: string;
  /** The image's URL as the entity carries it (its `md.webp`), or null. */
  value: string | null | undefined;
  /** Whose image it is: for the initials, and the picture's description. */
  name: string;
  label?: string;
  hint?: string;
  onChange?: (url: string | null) => void;
  className?: string;
}) {
  const copy = COPY[slot];
  const kind = SLOT_KIND[slot];
  const round = ROUND[slot];

  const [current, setCurrent] = useState<string | null>(value ?? null);
  useEffect(() => setCurrent(value ?? null), [value]);
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [current]);
  // The crop just sent, shown under the stored image until that one has crossed the network: on 3G
  // that is seconds, and an empty circle right after « Logo enregistré » reads as a failure.
  const [sent, setSent] = useState<string | null>(null);
  useEffect(() => () => {
    if (sent) URL.revokeObjectURL(sent);
  }, [sent]);

  const input = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<HTMLImageElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const replace = useReplaceImage(slot);
  const remove = useRemoveImage(slot);

  const closeCrop = () => {
    if (picked) URL.revokeObjectURL(picked.src);
    setPicked(null);
    setProgress(0);
  };

  const onPick = async (file: File | undefined) => {
    if (input.current) input.current.value = ''; // so picking the same file again still fires
    if (!file) return;
    const refusal = refusalFor(file);
    if (refusal) {
      toast.error(refusal);
      return;
    }
    const src = URL.createObjectURL(file);
    try {
      const img = await decodeImage(src);
      // A photo fills the square from its short side, a logo is fitted by its long side; either
      // way, below 128 px it would be padded or stretched into something blurred.
      const edge = kind === 'photo' ? Math.min(img.naturalWidth, img.naturalHeight) : Math.max(img.naturalWidth, img.naturalHeight);
      if (edge < MIN_SIDE) {
        URL.revokeObjectURL(src);
        toast.error(
          `Image trop petite (${img.naturalWidth} × ${img.naturalHeight} pixels). Il faut au moins ${MIN_SIDE} × ${MIN_SIDE} pixels.`,
        );
        return;
      }
      setPicked(img);
    } catch {
      URL.revokeObjectURL(src);
      toast.error('Ce navigateur ne sait pas lire cette image. Exportez-la en JPEG, puis réessayez.');
    }
  };

  const upload = (file: Blob) =>
    replace.mutate(
      { entityId, file, onProgress: setProgress },
      {
        onSuccess: ({ url }) => {
          setSent(URL.createObjectURL(file));
          setCurrent(url);
          onChange?.(url);
          toast.success(copy.saved);
          closeCrop();
        },
        onError: (e) => {
          setProgress(0);
          toastApiError(e, 'L’image n’a pas pu être enregistrée.');
        },
      },
    );

  const doRemove = () =>
    remove.mutate(entityId, {
      onSuccess: () => {
        setSent(null);
        setCurrent(null);
        onChange?.(null);
        setConfirmRemove(false);
        toast.success(copy.removed);
      },
      onError: (e) => toastApiError(e, 'L’image n’a pas pu être retirée.'),
    });

  const shape = round ? 'rounded-full' : 'rounded-xl';
  const shown = current && !broken ? mediaSrc(current, 'md') : null;

  return (
    <div className={cn('flex items-start gap-4', className)}>
      {shown ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={shown}
          alt={`${copy.label} — ${name}`}
          width={64}
          height={64}
          onError={() => setBroken(true)}
          style={
            sent
              ? { backgroundImage: `url(${sent})`, backgroundSize: kind === 'logo' ? 'contain' : 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
              : undefined
          }
          className={cn('h-16 w-16 shrink-0 bg-surface ring-1 ring-line', shape, kind === 'logo' ? 'object-contain' : 'object-cover')}
        />
      ) : (
        <span
          aria-hidden
          className={cn('flex h-16 w-16 shrink-0 items-center justify-center bg-surface-sunk text-lg font-bold text-ink-muted ring-1 ring-line', shape)}
        >
          {initials(name)}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{label ?? copy.label}</p>
        <p className="mt-0.5 text-xs text-ink-muted">
          {hint ??
            (kind === 'logo'
              ? 'JPEG, PNG ou WebP. Un fond transparent rend mieux. Enregistré dès que vous validez le recadrage.'
              : 'JPEG, PNG ou WebP. Cette photo sera visible sur le site public de la ligue.')}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => input.current?.click()} disabled={replace.isPending || remove.isPending}>
            <ImagePlus className="mr-1.5 h-4 w-4" aria-hidden />
            {current ? 'Changer' : copy.add}
          </Button>
          {current && (
            <Button size="sm" variant="ghost" onClick={() => setConfirmRemove(true)} disabled={replace.isPending || remove.isPending}>
              Retirer
            </Button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => onPick(e.target.files?.[0])}
        />
      </div>

      {picked && (
        <CropDialog
          img={picked}
          kind={kind}
          round={round}
          title={copy.crop}
          uploading={replace.isPending}
          progress={progress}
          onCancel={closeCrop}
          onConfirm={upload}
        />
      )}

      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title={copy.removeTitle}
        description={copy.removeBody}
        confirmLabel="Retirer"
        onConfirm={doRemove}
      />
    </div>
  );
}
