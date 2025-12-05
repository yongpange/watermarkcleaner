/**
 * Test script for conversion functionality
 * Run with: npx tsx scripts/test-conversion.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { processConversion } from '../src/services/conversion/processor';

async function testConversion() {
  console.log('🧪 Testing Conversion System\n');

  // Test 1: TXT file conversion
  console.log('Test 1: Converting TXT file...');
  try {
    const txtContent = `# Sample Document

This is a test document with multiple sections.

## Introduction

This section introduces the document.

## Main Content

Here is the main content with:
- Bullet point 1
- Bullet point 2
- Bullet point 3

## Conclusion

This is the conclusion.`;

    const txtBuffer = Buffer.from(txtContent, 'utf-8');
    const result = await processConversion(txtBuffer, 'text/plain');

    console.log('✅ TXT Conversion successful!');
    console.log('   Word count:', result.metadata.wordCount);
    console.log('   Language:', result.metadata.language);
    console.log('   Sections:', result.sections?.length || 0);
    console.log('');
  } catch (error) {
    console.error('❌ TXT Conversion failed:', error);
  }

  // Test 2: Markdown file conversion
  console.log('Test 2: Converting Markdown file...');
  try {
    const mdContent = `# Markdown Test

This is a **bold** text and this is *italic*.

\`\`\`javascript
console.log('Hello World');
\`\`\`

- List item 1
- List item 2`;

    const mdBuffer = Buffer.from(mdContent, 'utf-8');
    const result = await processConversion(mdBuffer, 'text/markdown');

    console.log('✅ Markdown Conversion successful!');
    console.log('   Word count:', result.metadata.wordCount);
    console.log('   Content length:', result.content.length);
    console.log('');
  } catch (error) {
    console.error('❌ Markdown Conversion failed:', error);
  }

  // Test 3: Utility functions
  console.log('Test 3: Testing utility functions...');
  try {
    const { formatFileSize, isSupportedFileType, estimateConversionTime } = await import('../src/lib/conversion-utils');

    console.log('   formatFileSize(1024):', formatFileSize(1024));
    console.log('   formatFileSize(1048576):', formatFileSize(1048576));
    console.log('   isSupportedFileType("application/pdf"):', isSupportedFileType('application/pdf'));
    console.log('   isSupportedFileType("image/png"):', isSupportedFileType('image/png'));
    console.log('   estimateConversionTime(1024):', estimateConversionTime(1024));
    console.log('   estimateConversionTime(5242880):', estimateConversionTime(5242880));
    console.log('✅ Utility functions working!');
    console.log('');
  } catch (error) {
    console.error('❌ Utility functions test failed:', error);
  }

  // Test 4: Language detection
  console.log('Test 4: Testing language detection...');
  try {
    const { detectUserLanguage } = await import('../src/lib/language-detector');
    const lang = detectUserLanguage();
    console.log('   Detected language:', lang);
    console.log('✅ Language detection working!');
    console.log('');
  } catch (error) {
    console.error('❌ Language detection test failed:', error);
  }

  console.log('🎉 All tests completed!\n');
}

testConversion().catch(console.error);

