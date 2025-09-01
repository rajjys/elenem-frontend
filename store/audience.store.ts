// store/audience.store.ts
import { create } from 'zustand';

type AudienceState = {
  isFan: boolean;
  toggleIsFan: () => void;
};

export const useAudienceStore = create<AudienceState>((set) => ({
  isFan: true, // default view
  toggleIsFan: () => set((state) => ({ isFan: !state.isFan })),
}));
