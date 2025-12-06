// Tool types for the watermark editor
export type ToolType = "brush" | "rectangle" | "lasso" | "eraser";

// Editor state
export interface EditorState {
  tool: ToolType;
  brushSize: number;
  isDrawing: boolean;
  hasImage: boolean;
  isProcessing: boolean;
  resultImageUrl: string | null;
}

// Point coordinates
export interface Point {
  x: number;
  y: number;
}

// History entry for undo/redo
export interface HistoryEntry {
  imageData: ImageData;
  timestamp: number;
}

// Upload state
export interface UploadState {
  isDragging: boolean;
  error: string | null;
}

// API response
export interface InpaintResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

// Canvas dimensions
export interface CanvasDimensions {
  width: number;
  height: number;
  displayWidth: number;
  displayHeight: number;
  scale: number;
}

