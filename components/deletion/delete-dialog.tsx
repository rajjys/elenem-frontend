'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Ban, Loader2 } from 'lucide-react';
import { Button, Label, Modal } from '@/components/ui';
import { getApiErrorMessage } from '@/services/api';
import {
  useDeleteResource,
  useDeletionReport,
  type DeletableResource,
  type DeletionAlternative,
} from '@/services/deletion';

/** What each resource is called, and its gender — « supprimée » is not « supprimé ». */
const NOUNS: Record<DeletableResource, { noun: string; feminine: boolean }> = {
  tenant: { noun: 'organisation', feminine: true },
  league: { noun: 'compétition', feminine: true },
  season: { noun: 'saison', feminine: true },
  stage: { noun: 'phase', feminine: true },
  team: { noun: 'club', feminine: false },
  player: { noun: 'joueur', feminine: false },
  game: { noun: 'match', feminine: false },
  user: { noun: 'compte', feminine: false },
  post: { noun: 'publication', feminine: true },
};

const field =
  'mt-1 h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink transition-colors ' +
  'hover:border-line-strong focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';

/**
 * The one way to delete something (`docs/RESOURCE_DELETION.md` §8, R2).
 *
 * It asks the API what deleting would do (`GET …/:id/deletion`) and shows that, rather than copy
 * written beside each button — the copy that promised cascades the server refused and said
 * « statistiques conservées » about a player whose statistics blocked the delete (§5). Two shapes:
 *
 * - **Refused:** why, in the API's words, and the other door when the caller can open it
 *   (« Annuler la saison », « Désactiver le compte »). No red button to press for nothing.
 * - **Allowed:** what goes with it, a reason (required where a result is involved, otherwise
 *   welcome — it is what the journal will say), the name to type for a competition or an
 *   organisation, and a red button that stays disabled until those are given. The dialog stays
 *   open while the request runs and shows a refusal inside itself; only success closes it.
 *
 * After it, every query on screen refetches (`useDeleteResource`), and `onDeleted` lets a page that
 * showed the deleted thing leave it.
 */
export function DeleteDialog({
  resource,
  id,
  open,
  onOpenChange,
  onDeleted,
  alternatives,
  confirmLabel,
  cancelLabel,
  successMessage,
}: {
  resource: DeletableResource;
  id: string | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** After success, before the screen refreshes: leave the page of the deleted thing. */
  onDeleted?: () => void;
  /** The doors this screen can open when deleting is refused, by the API's `alternative`. */
  alternatives?: Partial<Record<DeletionAlternative, { label: string; onSelect: () => void }>>;
  /** « Annuler l'invitation » rather than « Supprimer », where that is what deleting means. */
  confirmLabel?: string;
  /** « Garder » beside « Annuler l'invitation », where two « Annuler » would read the same. */
  cancelLabel?: string;
  successMessage?: string;
}) {
  const { noun, feminine } = NOUNS[resource];
  const e = feminine ? 'e' : '';
  const report = useDeletionReport(resource, id, open);
  const del = useDeleteResource(resource);
  const [reason, setReason] = useState('');
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason('');
      setTyped('');
      setError(null);
    }
  }, [open, id]);

  const r = report.data;
  const name = r?.name ?? '';
  const alternative = r?.alternative ? alternatives?.[r.alternative] : undefined;
  const reasonOk = !r?.requires.reason || reason.trim().length > 0;
  const nameOk = !r?.requires.typedName || typed.trim().toLocaleLowerCase('fr') === name.trim().toLocaleLowerCase('fr');
  const busy = del.isPending;

  function close(next: boolean) {
    if (!busy) onOpenChange(next);
  }

  function submit() {
    if (!id || !r?.allowed || !reasonOk || !nameOk) return;
    setError(null);
    del.mutate(
      { id, reason },
      {
        onSuccess: () => {
          toast.success(successMessage ?? `« ${name} » supprimé${e}.`);
          onOpenChange(false);
          onDeleted?.();
        },
        onError: (err) => setError(getApiErrorMessage(err, 'La suppression n’a pas abouti. Réessayez.')),
      },
    );
  }

  const title = !r
    ? `Supprimer ce${feminine ? 'tte' : ''} ${noun}`
    : r.allowed
      ? confirmLabel
        ? `${confirmLabel} ?`
        : `Supprimer « ${name} » ?`
      : `« ${name} » ne peut pas être supprimé${e}`;

  const footer = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button variant="outline" onClick={() => close(false)} disabled={busy}>
        {r && !r.allowed ? 'Fermer' : (cancelLabel ?? 'Annuler')}
      </Button>
      {r && !r.allowed && alternative && (
        <Button
          variant="primary"
          onClick={() => {
            onOpenChange(false);
            alternative.onSelect();
          }}
        >
          {alternative.label}
        </Button>
      )}
      {r?.allowed && (
        <Button
          variant="primary"
          onClick={submit}
          isLoading={busy}
          disabled={busy || !reasonOk || !nameOk}
          className="bg-negative text-ink-inverted hover:bg-negative/90"
        >
          {confirmLabel ?? 'Supprimer'}
        </Button>
      )}
    </div>
  );

  return (
    <Modal open={open} onOpenChange={close} title={title} className="max-w-lg" footer={footer}>
      {report.isPending ? (
        <p className="flex items-center gap-2 py-2 text-sm text-ink-muted">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Ce que cette suppression entraînerait…
        </p>
      ) : report.isError ? (
        <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-sm text-negative">
          {getApiErrorMessage(report.error, `Impossible de vérifier ce${feminine ? 'tte' : ''} ${noun}.`)}
        </p>
      ) : r && !r.allowed ? (
        <div className="space-y-2">
          {r.blockers.map((b) => (
            <p key={b.code} className="flex items-start gap-2 text-sm text-ink">
              <Ban className="mt-0.5 h-4 w-4 shrink-0 text-negative" aria-hidden />
              <span>{b.message}</span>
            </p>
          ))}
        </div>
      ) : r ? (
        <div className="space-y-4">
          {r.consequences.length > 0 ? (
            <div>
              <p className="text-sm font-medium text-ink">Avec {feminine ? 'elle' : 'lui'} :</p>
              <ul className="mt-1.5 space-y-1 text-sm text-ink-muted">
                {r.consequences.map((c) => (
                  <li key={c.message} className="flex gap-2">
                    <span aria-hidden className="text-ink-subtle">
                      –
                    </span>
                    <span>{c.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Rien d’autre n’est touché.</p>
          )}

          <div>
            <Label htmlFor="del-reason">Raison{r.requires.reason ? '' : ' (facultative)'}</Label>
            <input
              id="del-reason"
              type="text"
              value={reason}
              onChange={(ev) => setReason(ev.target.value)}
              maxLength={300}
              placeholder="Saisi par erreur, en double…"
              className={field}
            />
            <p className="mt-1 text-xs text-ink-subtle">Elle reste dans le journal.</p>
          </div>

          {r.requires.typedName && (
            <div>
              <Label htmlFor="del-name">
                Pour confirmer, tapez <span className="font-semibold text-ink">{name}</span>
              </Label>
              <input
                id="del-name"
                type="text"
                value={typed}
                onChange={(ev) => setTyped(ev.target.value)}
                autoComplete="off"
                className={field}
              />
            </div>
          )}

          <p className="flex items-start gap-2 text-xs text-ink-subtle">
            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0 text-caution" aria-hidden />
            Ce n’est pas réversible depuis l’application.
          </p>

          {error && (
            <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-sm text-negative">
              {error}
            </p>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
