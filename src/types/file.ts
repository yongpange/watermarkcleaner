// File upload types
export interface FileUploadConfig {
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  multiple?: boolean;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  preview?: string;
  status: "pending" | "uploading" | "success" | "error";
  progress?: number;
  error?: string;
}

export interface FileUploadResponse {
  success: boolean;
  file?: {
    id: string;
    url: string;
    key: string;
    filename: string;
    size: number;
    type: string;
  };
  error?: string;
}

export const SUPPORTED_FILE_TYPES = {
  // Documents
  "application/pdf": [".pdf"],
  "text/plain": [".txt"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/msword": [".doc"],

  // Images
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],

  // Audio
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
  "audio/ogg": [".ogg"],
  "audio/mp4": [".m4a"],
  "audio/webm": [".weba"],

  // Video
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],

  // Code
  "text/javascript": [".js"],
  "text/typescript": [".ts"],
  "text/jsx": [".jsx"],
  "text/tsx": [".tsx"],
  "text/python": [".py"],
  "text/java": [".java"],
  "text/cpp": [".cpp"],
  "text/c": [".c"],
  "text/html": [".html"],
  "text/css": [".css"],
  "application/json": [".json"],
  "text/markdown": [".md"],
};

export const FILE_CATEGORIES = {
  documents: ["pdf", "txt", "docx", "doc"],
  images: ["png", "jpg", "jpeg", "gif", "webp"],
  audio: ["mp3", "wav", "ogg", "m4a", "weba"],
  video: ["mp4", "webm"],
  code: ["js", "ts", "jsx", "tsx", "py", "java", "cpp", "c", "html", "css", "json", "md"],
};

export const MAX_FILE_SIZE = 20; // MB

