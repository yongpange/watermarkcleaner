export interface TXTParseResult {
  text: string;
}

/**
 * Parse TXT/MD file and extract text content
 */
export async function parseTXT(buffer: Buffer): Promise<TXTParseResult> {
  try {
    const text = buffer.toString('utf-8');
    
    return {
      text,
    };
  } catch (error: unknown) {
    console.error('TXT parsing error:', error instanceof Error ? error.message : String(error));
    throw new Error('Failed to parse text file');
  }
}

