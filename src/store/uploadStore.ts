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
  // 示例图片模式
  sampleId: string | null;
  setSampleId: (id: string | null) => void;
  clearSampleId: () => void;
}

export const useUploadStore = create<UploadStore>()(
  devtools(
    (set) => ({
      pendingImage: null,
      setPendingImage: (data) => set({ pendingImage: data }),
      clearPendingImage: () => set({ pendingImage: null }),
      // 示例图片模式
      sampleId: null,
      setSampleId: (id) => set({ sampleId: id }),
      clearSampleId: () => set({ sampleId: null }),
    }),
    { name: 'Upload Store' }
  )
);
