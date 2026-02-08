import { create } from "zustand";

interface ScannerState {
  sessionToken: string | null;
  vehicleNumber: string | null;
  make: string | null;
  model: string | null;
  color: string | null;
  shortCode: string | null;
  setSession: (data: {
    sessionToken: string;
    vehicleNumber: string;
    make: string | null;
    model: string | null;
    color: string | null;
    shortCode: string;
  }) => void;
  clear: () => void;
}

export const useScannerStore = create<ScannerState>((set) => ({
  sessionToken: null,
  vehicleNumber: null,
  make: null,
  model: null,
  color: null,
  shortCode: null,

  setSession: (data) => set(data),
  clear: () =>
    set({
      sessionToken: null,
      vehicleNumber: null,
      make: null,
      model: null,
      color: null,
      shortCode: null,
    }),
}));
