// Conversion system type definitions

export interface ConversionFile {
  id: string;                    // Unique identifier
  name: string;                  // File name
  size: number;                  // File size in bytes
  type: string;                  // MIME type
  url?: string;                  // S3 storage URL
  uploadedAt: string;            // Upload timestamp (ISO 8601)
}

export type ConversionStatus = 
  | 'pending'      // Waiting for processing
  | 'uploading'    // Uploading file
  | 'processing'   // Converting file
  | 'completed'    // Conversion completed
  | 'failed';      // Conversion failed

export interface ConversionMetadata {
  language: string;              // Detected language (en/zh/etc)
  pageCount?: number;            // Number of pages (for PDF)
  wordCount?: number;            // Word count
  detectedFormat: string;        // Original format (pdf/docx/txt)
  processingTime?: number;       // Processing time in milliseconds
}

export interface ConversionSection {
  title: string;                 // Section title
  content: string;               // Section content (Markdown)
  level: number;                 // Heading level (1-6)
}

export interface ConversionResultData {
  content: string;               // Markdown formatted content
  format?: string;               // Content format (e.g., 'markdown')
  metadata: ConversionMetadata;
  sections?: ConversionSection[]; // Optional section breakdown
  aiSummary?: string;            // AI-generated learning notes
  aiSummaryGeneratedAt?: string; // AI summary generation timestamp
  aiSummaryVersion?: number;     // AI summary version number
}

export interface ConversionError {
  code: string;                  // Error code
  message: string;               // Error message
  details?: string;              // Additional error details
}

export interface ConversionResult {
  id: string;                    // Conversion task ID
  fileId: string;                // Associated file ID
  status: ConversionStatus;
  progress: number;              // 0-100
  result?: ConversionResultData;
  error?: ConversionError;
  createdAt: string;             // Creation timestamp (ISO 8601)
  completedAt?: string;          // Completion timestamp (ISO 8601)
}

export interface ConversionOptions {
  targetFormat?: 'markdown' | 'json';
  extractImages?: boolean;
  detectLanguage?: boolean;
  useAI?: boolean;               // Use AI enhancement (requires credits)
  userId?: string;               // User ID (optional for anonymous users)
}

export interface UserPreferences {
  locale: 'en' | 'zh';           // UI language
  theme: 'light' | 'dark';
  autoDetectLanguage: boolean;   // Auto-detect UI language
  defaultExportFormat: 'md' | 'pdf' | 'docx';
}

// API Response types
export interface ConversionUploadResponse {
  success: boolean;
  data?: {
    fileId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    fileUrl: string;
    expiresAt: string;           // Expiration time for anonymous users (24h)
  };
  error?: string;
}

export interface ConversionProcessResponse {
  success: boolean;
  data?: {
    conversionId: string;
    status: ConversionStatus;
    estimatedTime: number;       // Estimated time in seconds
  };
  error?: string;
}

export interface ConversionStatusResponse {
  success: boolean;
  data?: {
    id: string;
    status: ConversionStatus;
    progress: number;
    message?: string;            // Current step description
  };
  error?: string;
}

export interface ConversionResultResponse {
  success: boolean;
  data?: ConversionResult;
  error?: string;
}

// Store types
export interface ConversionStoreState {
  files: Map<string, ConversionFile>;
  conversions: Map<string, ConversionResult>;
  currentFileId: string | null;
}

export interface ConversionStoreActions {
  addFile: (file: ConversionFile) => void;
  removeFile: (fileId: string) => void;
  updateConversion: (id: string, data: Partial<ConversionResult>) => void;
  setCurrentFile: (fileId: string | null) => void;
  clearCompleted: () => void;
  reset: () => void;
}

export type ConversionStore = ConversionStoreState & ConversionStoreActions;

