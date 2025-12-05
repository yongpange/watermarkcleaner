// pdf-parse 是 CommonJS 模块，需要动态导入
export interface PDFParseResult {
  text: string;
  pageCount: number;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
  };
}

/**
 * Parse PDF file and extract text content
 */
export async function parsePDF(buffer: Buffer): Promise<PDFParseResult> {
  try {
    // 动态导入 pdf-parse（CommonJS 模块）
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = (pdfParseModule as any).default || pdfParseModule;
    const data = await pdfParse(buffer);

    return {
      text: data.text,
      pageCount: data.numpages,
      metadata: {
        title: data.info?.Title,
        author: data.info?.Author,
        subject: data.info?.Subject,
        keywords: data.info?.Keywords,
      },
    };
  } catch (error: unknown) {
    console.error('PDF parsing error:', error instanceof Error ? error.message : String(error));
    throw new Error('Failed to parse PDF file');
  }
}

