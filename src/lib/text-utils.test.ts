import { describe, it, expect } from 'vitest';
import {
  detectLanguage,
  removeExtraSpaces,
  removeDuplicateLines,
  removeEmptyLines,
  sortLines,
  transformCase,
  inlineToList,
  listToInline,
  countTextStats,
  addMarkdown,
  removeMarkdown,
  findAndReplace,
} from './text-utils';

describe('Text Processing Utilities', () => {
  describe('detectLanguage', () => {
    it('should detect Russian text', () => {
      expect(detectLanguage('Привет мир')).toBe('ru');
      expect(detectLanguage('Hello мир')).toBe('ru');
      expect(detectLanguage('Ё')).toBe('ru');
    });

    it('should detect English text', () => {
      expect(detectLanguage('Hello world')).toBe('en');
      expect(detectLanguage('123 ABC')).toBe('en');
      expect(detectLanguage('')).toBe('en');
    });
  });

  describe('removeExtraSpaces', () => {
    it('should remove multiple spaces', () => {
      expect(removeExtraSpaces('hello    world')).toBe('hello world');
      expect(removeExtraSpaces('a   b   c')).toBe('a b c');
    });

    it('should trim leading and trailing spaces', () => {
      expect(removeExtraSpaces('  hello world  ')).toBe('hello world');
      expect(removeExtraSpaces('\t\nhello\n\t')).toBe('hello');
    });

    it('should handle empty string', () => {
      expect(removeExtraSpaces('')).toBe('');
      expect(removeExtraSpaces('   ')).toBe('');
    });

    it('should handle single spaces correctly', () => {
      expect(removeExtraSpaces('hello world')).toBe('hello world');
    });
  });

  describe('removeDuplicateLines', () => {
    it('should remove duplicate lines', () => {
      const input = 'line1\nline2\nline1\nline3\nline2';
      const expected = 'line1\nline2\nline3';
      expect(removeDuplicateLines(input)).toBe(expected);
    });

    it('should preserve order of first occurrence', () => {
      const input = 'first\nsecond\nfirst\nthird';
      const expected = 'first\nsecond\nthird';
      expect(removeDuplicateLines(input)).toBe(expected);
    });

    it('should handle empty lines', () => {
      const input = 'line1\n\nline1\n\nline2';
      const expected = 'line1\n\nline2';
      expect(removeDuplicateLines(input)).toBe(expected);
    });
  });

  describe('removeEmptyLines', () => {
    it('should remove empty lines', () => {
      const input = 'line1\n\nline2\n\nline3';
      const expected = 'line1\nline2\nline3';
      expect(removeEmptyLines(input)).toBe(expected);
    });

    it('should remove lines with only whitespace', () => {
      const input = 'line1\n  \nline2\n\t\nline3';
      const expected = 'line1\nline2\nline3';
      expect(removeEmptyLines(input)).toBe(expected);
    });

    it('should handle text with no empty lines', () => {
      const input = 'line1\nline2\nline3';
      expect(removeEmptyLines(input)).toBe(input);
    });
  });

  describe('sortLines', () => {
    it('should sort lines alphabetically', () => {
      const input = 'zebra\napple\nbanana';
      const expected = 'apple\nbanana\nzebra';
      expect(sortLines(input)).toBe(expected);
    });

    it('should handle case-sensitive sorting', () => {
      const input = 'Apple\napple\nBanana';
      const expected = 'Apple\nBanana\napple';
      expect(sortLines(input)).toBe(expected);
    });

    it('should handle empty lines', () => {
      const input = 'c\n\na\nb';
      const expected = '\na\nb\nc';
      expect(sortLines(input)).toBe(expected);
    });
  });

  describe('transformCase', () => {
    const testText = 'hello WORLD';

    it('should transform to uppercase', () => {
      expect(transformCase(testText, 'upper')).toBe('HELLO WORLD');
    });

    it('should transform to lowercase', () => {
      expect(transformCase(testText, 'lower')).toBe('hello world');
    });

    it('should transform to title case', () => {
      expect(transformCase(testText, 'title')).toBe('Hello World');
      expect(transformCase('hello world test', 'title')).toBe('Hello World Test');
    });

    it('should transform to sentence case', () => {
      expect(transformCase(testText, 'sentence')).toBe('Hello world');
      expect(transformCase('HELLO WORLD', 'sentence')).toBe('Hello world');
    });

    it('should handle empty string', () => {
      expect(transformCase('', 'upper')).toBe('');
      expect(transformCase('', 'sentence')).toBe('');
    });
  });

  describe('inlineToList', () => {
    it('should convert comma-separated text to list', () => {
      const input = 'apple, banana, cherry';
      const expected = 'apple\nbanana\ncherry';
      expect(inlineToList(input)).toBe(expected);
    });

    it('should handle custom separator', () => {
      const input = 'apple|banana|cherry';
      const expected = 'apple\nbanana\ncherry';
      expect(inlineToList(input, '|')).toBe(expected);
    });

    it('should trim whitespace from items', () => {
      const input = ' apple , banana  , cherry ';
      const expected = 'apple\nbanana\ncherry';
      expect(inlineToList(input)).toBe(expected);
    });

    it('should filter out empty items', () => {
      const input = 'apple,, banana,, cherry';
      const expected = 'apple\nbanana\ncherry';
      expect(inlineToList(input)).toBe(expected);
    });
  });

  describe('listToInline', () => {
    it('should convert list to comma-separated text', () => {
      const input = 'apple\nbanana\ncherry';
      const expected = 'apple, banana, cherry';
      expect(listToInline(input)).toBe(expected);
    });

    it('should handle custom separator', () => {
      const input = 'apple\nbanana\ncherry';
      const expected = 'apple | banana | cherry';
      expect(listToInline(input, ' |')).toBe(expected);
    });

    it('should trim whitespace from lines', () => {
      const input = ' apple \n banana  \n cherry ';
      const expected = 'apple, banana, cherry';
      expect(listToInline(input)).toBe(expected);
    });

    it('should filter out empty lines', () => {
      const input = 'apple\n\nbanana\n\ncherry';
      const expected = 'apple, banana, cherry';
      expect(listToInline(input)).toBe(expected);
    });
  });

  describe('countTextStats', () => {
    it('should count characters, words, and lines correctly', () => {
      const text = 'Hello world\nThis is a test\nThird line';
      const stats = countTextStats(text);
      
      expect(stats.chars).toBe(37);
      expect(stats.words).toBe(8);
      expect(stats.lines).toBe(3);
    });

    it('should handle empty text', () => {
      const stats = countTextStats('');
      
      expect(stats.chars).toBe(0);
      expect(stats.words).toBe(0);
      expect(stats.lines).toBe(1);
    });

    it('should handle single word', () => {
      const stats = countTextStats('word');
      
      expect(stats.chars).toBe(4);
      expect(stats.words).toBe(1);
      expect(stats.lines).toBe(1);
    });

    it('should handle whitespace-only text', () => {
      const stats = countTextStats('   \n  \n ');
      
      expect(stats.chars).toBe(8);
      expect(stats.words).toBe(0);
      expect(stats.lines).toBe(3);
    });
  });

  describe('addMarkdown', () => {
    const testText = 'sample text';

    it('should add bold formatting', () => {
      expect(addMarkdown(testText, 'bold')).toBe('**sample text**');
    });

    it('should add italic formatting', () => {
      expect(addMarkdown(testText, 'italic')).toBe('*sample text*');
    });

    it('should add code formatting', () => {
      expect(addMarkdown(testText, 'code')).toBe('`sample text`');
    });

    it('should add heading formatting', () => {
      expect(addMarkdown(testText, 'heading')).toBe('# sample text');
    });

    it('should add separator', () => {
      expect(addMarkdown(testText, 'separator')).toBe('sample text\n\n---\n\n');
    });
  });

  describe('removeMarkdown', () => {
    it('should remove bold formatting', () => {
      expect(removeMarkdown('**bold text**')).toBe('bold text');
    });

    it('should remove italic formatting', () => {
      expect(removeMarkdown('*italic text*')).toBe('italic text');
    });

    it('should remove code formatting', () => {
      expect(removeMarkdown('`code text`')).toBe('code text');
    });

    it('should remove heading formatting', () => {
      expect(removeMarkdown('# heading text')).toBe('heading text');
      expect(removeMarkdown('## heading text')).toBe('heading text');
    });

    it('should remove separators', () => {
      expect(removeMarkdown('text\n---\nmore text')).toBe('text\n\nmore text');
    });

    it('should remove multiple markdown types', () => {
      const input = '**bold** and *italic* and `code`';
      const expected = 'bold and italic and code';
      expect(removeMarkdown(input)).toBe(expected);
    });
  });

  describe('findAndReplace', () => {
    const testText = 'Hello world. Hello everyone!';

    it('should find and replace simple text', () => {
      const result = findAndReplace(testText, 'Hello', 'Hi');
      expect(result.text).toBe('Hi world. Hi everyone!');
      expect(result.matchCount).toBe(2);
    });

    it('should be case insensitive', () => {
      const result = findAndReplace(testText, 'hello', 'Hi');
      expect(result.text).toBe('Hi world. Hi everyone!');
      expect(result.matchCount).toBe(2);
    });

    it('should handle empty search term', () => {
      const result = findAndReplace(testText, '', 'replacement');
      expect(result.text).toBe(testText);
      expect(result.matchCount).toBe(0);
    });

    it('should handle no matches', () => {
      const result = findAndReplace(testText, 'xyz', 'replacement');
      expect(result.text).toBe(testText);
      expect(result.matchCount).toBe(0);
    });

    it('should handle regex search', () => {
      const result = findAndReplace('test123 test456', '\\d+', 'NUM', true);
      expect(result.text).toBe('testNUM testNUM');
      expect(result.matchCount).toBe(2);
    });

    it('should handle invalid regex gracefully', () => {
      const result = findAndReplace(testText, '[invalid', 'replacement', true);
      expect(result.text).toBe(testText);
      expect(result.matchCount).toBe(0);
    });

    it('should escape special characters in non-regex mode', () => {
      const text = 'Price: $10.50 and $20.75';
      const result = findAndReplace(text, '$10.50', '$15.00');
      expect(result.text).toBe('Price: $15.00 and $20.75');
      expect(result.matchCount).toBe(1);
    });
  });
});