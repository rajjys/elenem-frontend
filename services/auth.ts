import { useMutation } from '@tanstack/react-query';
import { api } from './api';

// Auth recovery flows (OTP-based). All are public and return a { message } body.
export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) =>
      api.post('/auth/forgot-password', { email }).then((r) => r.data),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (dto: { email: string; otp: string; newPassword: string }) =>
      api.post('/auth/reset-password', dto).then((r) => r.data),
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (dto: { email: string; otp: string }) =>
      api.post('/auth/verify-email', dto).then((r) => r.data),
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (email: string) =>
      api.post('/auth/resend-verification', { email }).then((r) => r.data),
  });
}
