// mammoth 是 CommonJS 模块，需要动态导入
export interface DOCXParseResult {
  text: string;
  html?: string;
}

/**
 * Parse DOCX file and extract text content
 */
export async function parseDOCX(buffer: Buffer): Promise<DOCXParseResult> {
  try {
    // 动态导入 mammoth（CommonJS 模块）
    const mammoth = (await import('mammoth')).default;

    // Extract raw text
    const textResult = await mammoth.extractRawText({ buffer });

    // Optionally extract HTML for better formatting
    const htmlResult = await mammoth.convertToHtml({ buffer });

    return {
      text: textResult.value,
      html: htmlResult.value,
    };
  } catch (error: unknown) {
    console.error('DOCX parsing error:', error instanceof Error ? error.message : String(error));
    throw new Error('Failed to parse DOCX file');
  }
}

