import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface PendingImageData {
  image: HTMLImageElement;
  file: File;
}

interface UploadStore {
  pendingImage: PendingImageData | null;
  setPendingImage: (data: PendingImageData | null) => void;
  clearPendingImage: () => void;
}

export const useUploadStore = create<UploadStore>()(
  devtools(
    (set) => ({
      pendingImage: null,
      setPendingImage: (data) => set({ pendingImage: data }),
      clearPendingImage: () => set({ pendingImage: null }),
    }),
    { name: 'Upload Store' }
  )
);
