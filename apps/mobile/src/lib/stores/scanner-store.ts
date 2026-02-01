import { create } from "zustand";

interface ScannerState {
  shortCode: string | null;
  sessionToken: string | null;
  vehicleNumber: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleColor: string | null;
  setShortCode: (code: string) => void;
  setSession: (data: {
    sessionToken: string;
    vehicleNumber: string;
    make: string | null;
    model: string | null;
    color: string | null;
  }) => void;
  reset: () => void;
}

export const useScannerStore = create<ScannerState>((set) => ({
  shortCode: null,
  sessionToken: null,
  vehicleNumber: null,
  vehicleMake: null,
  vehicleModel: null,
  vehicleColor: null,

  setShortCode: (code) => set({ shortCode: code }),

  setSession: (data) =>
    set({
      sessionToken: data.sessionToken,
      vehicleNumber: data.vehicleNumber,
      vehicleMake: data.make,
      vehicleModel: data.model,
      vehicleColor: data.color,
    }),

  reset: () =>
    set({
      shortCode: null,
      sessionToken: null,
      vehicleNumber: null,
      vehicleMake: null,
      vehicleModel: null,
      vehicleColor: null,
    }),
}));
