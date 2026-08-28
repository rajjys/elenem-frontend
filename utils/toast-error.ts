import { toast } from 'sonner';
import { getApiErrorMessage, isAxiosError } from '@/services/api';

/**
 * Show a toast with the normalised backend error message.
 *
 * 401 is deliberately silent. The response interceptor already refreshes the token or clears the
 * session and sends the user to sign in — a toast on top of that is noise, and a screen that fires
 * five parallel requests produces five of them. That was the "succession of failure messages" you
 * get from an expired session: not five problems, one problem reported five times.
 */
export function toastApiError(error: unknown, fallback?: string) {
  if (isAxiosError(error) && error.response?.status === 401) return;
  toast.error(getApiErrorMessage(error, fallback));
}
