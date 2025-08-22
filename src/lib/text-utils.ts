/**
 * Text processing utilities for the Text Wizard editor
 * Contains pure functions for text transformations and analysis
 */

/**
 * Detects if text contains Russian characters
 * @param text - The text to analyze
 * @returns 'ru' if Russian characters detected, 'en' otherwise
 */
export function detectLanguage(text: string): 'ru' | 'en' {
  const hasRussianChars = /[а-яё]/i.test(text);
  return hasRussianChars ? 'ru' : 'en';
}

/**
 * Removes extra spaces from text (multiple spaces become single, trim edges)
 * @param text - Input text
 * @returns Text with normalized spacing
 */
export function removeExtraSpaces(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Removes duplicate lines from text
 * @param text - Input text
 * @returns Text with duplicate lines removed
 */
export function removeDuplicateLines(text: string): string {
  const lines = text.split('\n');
  const uniqueLines = Array.from(new Set(lines));
  return uniqueLines.join('\n');
}

/**
 * Removes empty lines from text
 * @param text - Input text
 * @returns Text with empty lines removed
 */
export function removeEmptyLines(text: string): string {
  return text.split('\n').filter(line => line.trim() !== '').join('\n');
}

/**
 * Sorts lines alphabetically
 * @param text - Input text
 * @returns Text with lines sorted alphabetically
 */
export function sortLines(text: string): string {
  return text.split('\n').sort().join('\n');
}

/**
 * Transforms text case
 * @param text - Input text
 * @param type - Type of case transformation
 * @returns Transformed text
 */
export function transformCase(text: string, type: 'upper' | 'lower' | 'title' | 'sentence'): string {
  switch (type) {
    case 'upper':
      return text.toUpperCase();
    case 'lower':
      return text.toLowerCase();
    case 'title':
      return text.replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );
    case 'sentence':
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    default:
      return text;
  }
}

/**
 * Converts inline text to list format using separator
 * @param text - Input text
 * @param separator - Separator to split on (default: comma)
 * @returns Text formatted as list
 */
export function inlineToList(text: string, separator: string = ','): string {
  return text.split(separator).map(item => item.trim()).filter(item => item).join('\n');
}

/**
 * Converts list format to inline text using separator
 * @param text - Input text (list format)
 * @param separator - Separator to join with (default: comma)
 * @returns Text formatted inline
 */
export function listToInline(text: string, separator: string = ','): string {
  return text.split('\n').map(line => line.trim()).filter(line => line).join(`${separator} `);
}

/**
 * Counts characters, words, and lines in text
 * @param text - Input text
 * @returns Object with character, word, and line counts
 */
export function countTextStats(text: string): { chars: number; words: number; lines: number } {
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text.split('\n').length;
  
  return { chars, words, lines };
}

/**
 * Adds markdown formatting to text
 * @param text - Input text
 * @param type - Type of markdown formatting
 * @returns Text with markdown formatting
 */
export function addMarkdown(text: string, type: 'bold' | 'italic' | 'code' | 'heading' | 'separator'): string {
  switch (type) {
    case 'bold':
      return `**${text}**`;
    case 'italic':
      return `*${text}*`;
    case 'code':
      return `\`${text}\``;
    case 'heading':
      return `# ${text}`;
    case 'separator':
      return text + '\n\n---\n\n';
    default:
      return text;
  }
}

/**
 * Removes markdown formatting from text
 * @param text - Input text with markdown
 * @returns Text without markdown formatting
 */
export function removeMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1')     // Remove italic
    .replace(/`(.*?)`/g, '$1')       // Remove code
    .replace(/^#+\s*/gm, '')         // Remove headings
    .replace(/^---$/gm, '');         // Remove separators
}

/**
 * Finds and replaces text with optional regex support
 * @param text - Input text
 * @param searchTerm - Text to search for
 * @param replaceTerm - Text to replace with
 * @param useRegex - Whether to use regex for search
 * @returns Object with replaced text and match count
 */
export function findAndReplace(
  text: string, 
  searchTerm: string, 
  replaceTerm: string, 
  useRegex: boolean = false
): { text: string; matchCount: number } {
  if (!searchTerm) {
    return { text, matchCount: 0 };
  }

  try {
    if (useRegex) {
      const regex = new RegExp(searchTerm, 'gi');
      const matches = text.match(regex);
      const matchCount = matches ? matches.length : 0;
      const newText = text.replace(regex, replaceTerm);
      return { text: newText, matchCount };
    } else {
      const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedSearchTerm, 'gi');
      const matches = text.match(regex);
      const matchCount = matches ? matches.length : 0;
      const newText = text.replace(regex, replaceTerm);
      return { text: newText, matchCount };
    }
  } catch (error) {
    // Invalid regex
    return { text, matchCount: 0 };
  }
}