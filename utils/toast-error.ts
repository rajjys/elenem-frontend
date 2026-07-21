import { toast } from 'sonner';
import { getApiErrorMessage } from '@/services/api';

// Show a toast with the normalized backend error message.
export function toastApiError(error: unknown, fallback?: string) {
  toast.error(getApiErrorMessage(error, fallback));
}
