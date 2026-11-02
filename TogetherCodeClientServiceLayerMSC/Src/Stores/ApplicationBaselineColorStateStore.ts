import { create } from 'zustand';
import ColorFactoryCON from '@/Constants/ColorFactoryCON';

interface ApplicationBaselineColorState {
  theme: 'dark';
  tokens: typeof ColorFactoryCON;
}

export const useApplicationBaselineColorStateStore = create<ApplicationBaselineColorState>(() => ({
  theme: 'dark',
  tokens: ColorFactoryCON,
}));
