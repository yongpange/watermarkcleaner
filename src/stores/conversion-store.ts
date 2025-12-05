import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  ConversionStore,
  ConversionFile,
  ConversionResult,
} from '@/types/conversion.d';

// Custom serializer for Map objects
const mapSerializer = {
  serialize: (state: { files: Map<string, ConversionFile>; conversions: Map<string, ConversionResult> }) => {
    return JSON.stringify({
      ...state,
      files: Array.from(state.files.entries()),
      conversions: Array.from(state.conversions.entries()),
    });
  },
  deserialize: (str: string) => {
    const parsed = JSON.parse(str);
    return {
      ...parsed,
      files: new Map(parsed.files || []),
      conversions: new Map(parsed.conversions || []),
    };
  },
};

export const useConversionStore = create<ConversionStore>()(
  persist(
    (set, get) => ({
      // State
      files: new Map(),
      conversions: new Map(),
      currentFileId: null,

      // Actions
      addFile: (file: ConversionFile) => {
        set((state) => {
          const newFiles = new Map(state.files);
          newFiles.set(file.id, file);
          return { files: newFiles };
        });
      },

      removeFile: (fileId: string) => {
        set((state) => {
          const newFiles = new Map(state.files);
          const newConversions = new Map(state.conversions);
          
          newFiles.delete(fileId);
          
          // Remove associated conversions
          Array.from(newConversions.entries()).forEach(([id, conv]) => {
            if (conv.fileId === fileId) {
              newConversions.delete(id);
            }
          });

          return {
            files: newFiles,
            conversions: newConversions,
            currentFileId: state.currentFileId === fileId ? null : state.currentFileId,
          };
        });
      },

      updateConversion: (id: string, data: Partial<ConversionResult>) => {
        set((state) => {
          const newConversions = new Map(state.conversions);
          const existing = newConversions.get(id);
          
          if (existing) {
            newConversions.set(id, { ...existing, ...data } as ConversionResult);
          } else {
            // Create new conversion if it doesn't exist
            newConversions.set(id, data as ConversionResult);
          }
          
          return { conversions: newConversions };
        });
      },

      setCurrentFile: (fileId: string | null) => {
        set({ currentFileId: fileId });
      },

      clearCompleted: () => {
        set((state) => {
          const newConversions = new Map(state.conversions);
          
          Array.from(newConversions.entries()).forEach(([id, conv]) => {
            if (conv.status === 'completed' || conv.status === 'failed') {
              newConversions.delete(id);
            }
          });
          
          return { conversions: newConversions };
        });
      },

      reset: () => {
        set({
          files: new Map(),
          conversions: new Map(),
          currentFileId: null,
        });
      },
    }),
    {
      name: 'conversion-store',
      storage: createJSONStorage(() => sessionStorage, {
        reviver: (key: string, value: any) => {
          // Custom reviver for Map deserialization
          if (key === 'files' || key === 'conversions') {
            return new Map(value);
          }
          return value;
        },
        replacer: (key: string, value: any) => {
          // Custom replacer for Map serialization
          if (value instanceof Map) {
            return Array.from(value.entries());
          }
          return value;
        },
      }),
    }
  )
);

// Selectors for better performance
// 直接返回 Map，避免每次创建新数组导致重渲染
export const useConversionFiles = () =>
  useConversionStore((state) => state.files);

export const useConversionResults = () =>
  useConversionStore((state) => state.conversions);

export const useCurrentFile = () =>
  useConversionStore((state) => {
    const { currentFileId, files } = state;
    return currentFileId ? files.get(currentFileId) : null;
  });

export const useCurrentConversion = () =>
  useConversionStore((state) => {
    const { currentFileId, conversions } = state;
    if (!currentFileId) return null;

    // Find conversion by fileId
    return Array.from(conversions.values()).find(
      (conv) => conv.fileId === currentFileId
    );
  });

export const useConversionProgress = () =>
  useConversionStore((state) => {
    const conversions = Array.from(state.conversions.values());
    const processing = conversions.filter(
      (c) => c.status === 'processing' || c.status === 'uploading'
    );

    if (processing.length === 0) return null;

    const totalProgress = processing.reduce((sum, c) => sum + c.progress, 0);
    return {
      count: processing.length,
      averageProgress: Math.round(totalProgress / processing.length),
    };
  });

