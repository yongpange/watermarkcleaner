import { parsePDF } from './parsers/pdf';
import { parseDOCX } from './parsers/docx';
import { parseTXT } from './parsers/txt';
import type { ConversionResultData, ConversionMetadata } from '@/types/conversion.d';

/**
 * Convert raw text to Markdown format
 */
function formatToMarkdown(text: string, fileType: string): string {
  // If already markdown, return as-is
  if (fileType === 'text/markdown') {
    return text;
  }

  // Basic formatting for plain text
  let markdown = text;

  // Normalize line breaks
  markdown = markdown.replace(/\r\n/g, '\n');
  markdown = markdown.replace(/\r/g, '\n');

  // Remove excessive blank lines (more than 2 consecutive)
  markdown = markdown.replace(/\n{3,}/g, '\n\n');

  // Try to detect and format headings (lines that are all caps or end with colon)
  const lines = markdown.split('\n');
  const formattedLines = lines.map((line) => {
    const trimmed = line.trim();
    
    // Skip empty lines
    if (!trimmed) return line;

    // Detect potential headings
    // 1. All caps lines (at least 3 words)
    if (trimmed === trimmed.toUpperCase() && trimmed.split(' ').length >= 3) {
      return `## ${trimmed}`;
    }

    // 2. Lines ending with colon (potential section headers)
    if (trimmed.endsWith(':') && trimmed.length < 100 && !trimmed.includes(',')) {
      return `### ${trimmed.slice(0, -1)}`;
    }

    // 3. Detect numbered lists
    if (/^\d+[\.\)]\s/.test(trimmed)) {
      return line;
    }

    // 4. Detect bullet points
    if (/^[-•*]\s/.test(trimmed)) {
      return line.replace(/^[•*]/, '-');
    }

    return line;
  });

  markdown = formattedLines.join('\n');

  // Trim whitespace
  markdown = markdown.trim();

  return markdown;
}

/**
 * Extract metadata from content
 */
function extractMetadata(
  content: string,
  fileType: string,
  additionalData?: Record<string, unknown>
): ConversionMetadata {
  // Count words (approximate)
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

  // Detect language (simple heuristic)
  const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
  const totalChars = content.replace(/\s/g, '').length;
  const language = totalChars > 0 && chineseChars / totalChars > 0.3 ? 'zh' : 'en';

  // Determine format
  let detectedFormat = 'txt';
  if (fileType.includes('pdf')) detectedFormat = 'pdf';
  else if (fileType.includes('word') || fileType.includes('document')) detectedFormat = 'docx';
  else if (fileType.includes('markdown')) detectedFormat = 'md';

  return {
    language,
    wordCount,
    pageCount: (additionalData?.pageCount as number) || 0,
    detectedFormat,
  };
}

/**
 * Extract sections from markdown content
 */
function extractSections(markdown: string) {
  const sections: Array<{ title: string; content: string; level: number }> = [];
  const lines = markdown.split('\n');
  
  let currentSection: { title: string; content: string; level: number } | null = null;

  lines.forEach((line) => {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    
    if (headingMatch) {
      // Save previous section
      if (currentSection) {
        sections.push(currentSection);
      }

      // Start new section
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();
      currentSection = { title, content: '', level };
    } else if (currentSection) {
      // Add content to current section
      currentSection.content += line + '\n';
    }
  });

  // Save last section
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections.length > 0 ? sections : undefined;
}

/**
 * Main conversion processor
 */
export async function processConversion(
  buffer: Buffer,
  fileType: string
): Promise<ConversionResultData> {
  let rawText = '';
  const additionalData: Record<string, unknown> = {};

  // Step 1: Parse file based on type
  if (fileType.includes('pdf')) {
    const result = await parsePDF(buffer);
    rawText = result.text;
    additionalData.pageCount = result.pageCount;
  } else if (fileType.includes('word') || fileType.includes('document')) {
    const result = await parseDOCX(buffer);
    rawText = result.text;
  } else if (fileType.includes('text') || fileType.includes('markdown')) {
    const result = await parseTXT(buffer);
    rawText = result.text;
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }

  // Step 2: Format to Markdown
  const markdown = formatToMarkdown(rawText, fileType);

  // Step 3: Extract metadata
  const metadata = extractMetadata(markdown, fileType, additionalData);

  // Step 4: Extract sections
  const sections = extractSections(markdown);

  return {
    content: markdown,
    metadata,
    sections,
  };
}

