import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from './api';
import { parseResponse } from './parse-response';
import type { ApiSchema } from '@/types/api-types';
import type { ImageSlot } from '@/lib/media';

/**
 * Logos and player photos (docs/IMAGES_AND_STORAGE.md §4). One pair of routes per slot, each under
 * the entity it changes; PUT replaces and DELETE removes, both answering `{ url }`.
 */

export type ImageResponse = ApiSchema<'ImageResponseDto'>;
const ImageResponseSchema = z.object({ url: z.string().nullable() });

const PATH: Record<ImageSlot, (id: string) => string> = {
  'tenant-logo': (id) => `/tenants/${id}/logo`,
  'league-logo': (id) => `/leagues/${id}/logo`,
  'team-logo': (id) => `/teams/${id}/logo`,
  'player-photo': (id) => `/players/${id}/photo`,
};

/**
 * An image appears in lists, tables, cards, the calendar and the header. Marking every query stale
 * is cheaper than tracking each one that embeds an image, and only what is on screen refetches.
 */
function useRefreshEverything() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}

export function useReplaceImage(slot: ImageSlot) {
  const refresh = useRefreshEverything();
  return useMutation({
    mutationFn: async ({
      entityId,
      file,
      onProgress,
    }: {
      entityId: string;
      file: Blob;
      /** 0 to 1, as the bytes leave the phone. On 3G this is most of the wait. */
      onProgress?: (fraction: number) => void;
    }): Promise<ImageResponse> => {
      const body = new FormData();
      body.append('file', file, file.type === 'image/png' ? 'image.png' : 'image.jpg');
      const res = await api.put(PATH[slot](entityId), body, {
        // The client defaults to JSON, and axios turns a FormData body into JSON when told to.
        // Saying multipart here lets the browser set the boundary itself.
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) onProgress?.(e.loaded / e.total);
        },
      });
      return parseResponse(ImageResponseSchema, res.data);
    },
    onSuccess: refresh,
  });
}

export function useRemoveImage(slot: ImageSlot) {
  const refresh = useRefreshEverything();
  return useMutation({
    mutationFn: async (entityId: string): Promise<ImageResponse> =>
      parseResponse(ImageResponseSchema, (await api.delete(PATH[slot](entityId))).data),
    onSuccess: refresh,
  });
}
