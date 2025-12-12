import { describe, expect, it } from 'vitest'
import {
  addPrefix,
  addSuffix,
  bottomLines,
  extractBetween,
  filterLines,
  getCommonLines,
  getLeftOnlyLines,
  getRightOnlyLines,
  getTextStats,
  getUniqueLines,
  highlightCommonLines,
  highlightDelimiters,
  insertText,
  joinLines,
  removeDuplicates,
  removeEmptyLines,
  replaceText,
  reverseLines,
  searchAndHighlight,
  sortLines,
  splitText,
  substringLines,
  topLines,
  trimEndLines,
  trimLines,
  trimStartLines,
} from '../lib/textProcessing'

describe('Text Processing Functions', () => {
  describe('getTextStats', () => {
    it('should calculate correct stats for empty text', () => {
      const result = getTextStats('')
      expect(result).toEqual({
        lines: 0,
        uniqueLines: 0,
        characters: 0,
        charactersWithLineBreaks: 0,
      })
    })

    it('should calculate correct stats for single line', () => {
      const result = getTextStats('hello world')
      expect(result).toEqual({
        lines: 1,
        uniqueLines: 1,
        characters: 11,
        charactersWithLineBreaks: 11,
      })
    })

    it('should calculate correct stats for multiline text', () => {
      const text = 'line1\nline2\nline1'
      const result = getTextStats(text)
      expect(result).toEqual({
        lines: 3,
        uniqueLines: 2,
        characters: 15, // excludes line breaks by default
        charactersWithLineBreaks: 17,
      })
    })

    it('should respect ignoreCase option', () => {
      const text = 'Hello\nhello\nHELLO'
      const result = getTextStats(text, true)
      expect(result.uniqueLines).toBe(1)
    })

    it('should include line breaks when requested', () => {
      const text = 'line1\nline2'
      const result = getTextStats(text, false, true)
      expect(result.characters).toBe(11) // includes the \n
    })

    it('should exclude empty lines from unique count', () => {
      const text = 'line1\n\nline2\n '
      const result = getTextStats(text)
      expect(result.uniqueLines).toBe(2) // line1 and line2, empty lines are filtered out
    })
  })

  describe('sortLines', () => {
    const testText = 'zebra\napple\nbanana\nApple\nBanana'

    it('should sort case-insensitively in ascending order', () => {
      const result = sortLines(testText, 'asc', true)
      expect(result).toBe('apple\nApple\nbanana\nBanana\nzebra')
    })

    it('should sort case-sensitively in ascending order', () => {
      const result = sortLines(testText, 'asc', false)
      expect(result).toBe('Apple\nBanana\napple\nbanana\nzebra')
    })

    it('should sort case-insensitively in descending order', () => {
      const result = sortLines(testText, 'desc', true)
      expect(result).toBe('zebra\nbanana\nBanana\napple\nApple')
    })

    it('should sort case-sensitively in descending order', () => {
      const result = sortLines(testText, 'desc', false)
      expect(result).toBe('zebra\nbanana\napple\nBanana\nApple')
    })

    it('should randomize line order while preserving all lines', () => {
      const result = sortLines(testText, 'random', false)
      expect(result.split('\n')).toHaveLength(5)
      expect(result).toContain('apple')
      expect(result).toContain('zebra')
    })

    it('should return original text when sort mode is invalid', () => {
      const result = sortLines(testText, 'invalid' as any, false)
      expect(result).toBe(testText)
    })
  })

  describe('reverseLines', () => {
    it('should reverse the order of multiple lines', () => {
      const text = 'first\nsecond\nthird'
      const result = reverseLines(text)
      expect(result).toBe('third\nsecond\nfirst')
    })

    it('should return single line unchanged', () => {
      const result = reverseLines('single')
      expect(result).toBe('single')
    })

    it('should return empty string unchanged', () => {
      const result = reverseLines('')
      expect(result).toBe('')
    })
  })

  describe('removeDuplicates', () => {
    it('should remove duplicate lines while preserving unique ones', () => {
      const text = 'apple\nbanana\napple\ncherry\nbanana'
      const result = removeDuplicates(text)
      expect(result).toBe('apple\nbanana\ncherry')
    })

    it('should preserve order of first occurrence when removing duplicates', () => {
      const text = 'c\na\nb\na\nc'
      const result = removeDuplicates(text)
      expect(result).toBe('c\na\nb')
    })

    it('should remove duplicates case-insensitively when specified', () => {
      const text = 'Apple\napple\nAPPLE\nbanana'
      const result = removeDuplicates(text, true)
      expect(result).toBe('Apple\nbanana')
    })

    it('should return empty string unchanged', () => {
      const result = removeDuplicates('')
      expect(result).toBe('')
    })
  })

  describe('searchAndHighlight', () => {
    it('should highlight all occurrences of search term with mark tags', () => {
      const text = 'hello world hello'
      const result = searchAndHighlight(text, 'hello')
      expect(result).toBe('<mark>hello</mark> world <mark>hello</mark>')
    })

    it('should highlight case-insensitively when specified', () => {
      const text = 'Hello WORLD hello'
      const result = searchAndHighlight(text, 'hello', true)
      expect(result).toBe('<mark>Hello</mark> WORLD <mark>hello</mark>')
    })

    it('should properly escape special regex characters in search term', () => {
      const text = 'test (hello) test'
      const result = searchAndHighlight(text, '(hello)')
      expect(result).toBe('test <mark>(hello)</mark> test')
    })

    it('should return original text unchanged when search term is empty', () => {
      const text = 'hello world'
      const result = searchAndHighlight(text, '')
      expect(result).toBe(text)
    })

    it('should return original text unchanged when search term is only whitespace', () => {
      const text = 'hello world'
      const result = searchAndHighlight(text, '   ')
      expect(result).toBe(text)
    })

    it('should escape HTML characters while highlighting matches', () => {
      const text = '<span>content</span>'
      const result = searchAndHighlight(text, 'span')
      expect(result).toBe('&lt;<mark>span</mark>&gt;content&lt;/<mark>span</mark>&gt;')
    })

    it('should escape HTML characters when no matches are found', () => {
      const text = '<data>'
      const result = searchAndHighlight(text, 'missing')
      expect(result).toBe('&lt;data&gt;')
    })

    // LIKE mode tests
    it('should highlight using LIKE pattern with % wildcard at end', () => {
      const text = 'hello world hello universe'
      const result = searchAndHighlight(text, 'hel%', false, 'like')
      expect(result).toBe('<mark>hello world hello universe</mark>')
    })

    it('should highlight using LIKE pattern with % at start (suffix match)', () => {
      const text = 'hello world say hello'
      const result = searchAndHighlight(text, '%llo', false, 'like')
      expect(result).toBe('<mark>hello world say hello</mark>')
    })

    it('should highlight using LIKE pattern - start match only', () => {
      const text = 'hello world, 2 hello, hello'
      const result = searchAndHighlight(text, 'hel%', false, 'like')
      // "hel%" matches lines starting with "hel"
      // The entire line starts with "hello", so the whole line is matched
      expect(result).toBe('<mark>hello world, 2 hello, hello</mark>')
    })

    it('should highlight using LIKE pattern with _ wildcard', () => {
      const text = 'hello hallo hillo'
      const result = searchAndHighlight(text, '%h_llo%', false, 'like')
      expect(result).toBe('<mark>hello</mark> <mark>hallo</mark> <mark>hillo</mark>')
    })

    it('should highlight using LIKE pattern case-insensitively', () => {
      const text = 'Hello HALLO hillo'
      const result = searchAndHighlight(text, '%h_llo%', true, 'like')
      expect(result).toBe('<mark>Hello</mark> <mark>HALLO</mark> <mark>hillo</mark>')
    })

    // Regex mode tests
    it('should highlight using regex pattern', () => {
      const text = 'test123 hello456 world'
      const result = searchAndHighlight(text, '[0-9]+', false, 'regex')
      expect(result).toBe('test<mark>123</mark> hello<mark>456</mark> world')
    })

    it('should highlight using regex pattern case-insensitively', () => {
      const text = 'Hello hello HELLO'
      const result = searchAndHighlight(text, 'h.llo', true, 'regex')
      expect(result).toBe('<mark>Hello</mark> <mark>hello</mark> <mark>HELLO</mark>')
    })

    it('should highlight using regex with line-end anchor ($)', () => {
      const text = 'hello\nworld\nbello'
      const result = searchAndHighlight(text, 'llo$', false, 'regex')
      // Should match "llo" at the end of each line (multiline mode)
      expect(result).toBe('he<mark>llo</mark>\nworld\nbe<mark>llo</mark>')
    })

    it('should highlight using regex with line-start anchor (^)', () => {
      const text = 'hello\nworld\nhello again'
      const result = searchAndHighlight(text, '^hello', false, 'regex')
      // Should match "hello" at the start of each line (multiline mode)
      expect(result).toBe('<mark>hello</mark>\nworld\n<mark>hello</mark> again')
    })

    it('should return original text for invalid regex', () => {
      const text = 'hello world'
      const result = searchAndHighlight(text, '[invalid(', false, 'regex')
      expect(result).toBe(text)
    })
  })

  describe('filterLines', () => {
    const testText = 'apple pie\nbanana split\napple juice\ncherry tart'

    it('should keep only lines containing the search term by default', () => {
      const result = filterLines(testText, 'apple')
      expect(result).toBe('apple pie\napple juice')
    })

    it('should remove lines containing search term when keep is false', () => {
      const result = filterLines(testText, 'apple', false)
      expect(result).toBe('banana split\ncherry tart')
    })

    it('should filter case-insensitively when specified', () => {
      const text = 'Apple pie\nbanana split\nAPPLE juice'
      const result = filterLines(text, 'apple', true, true)
      expect(result).toBe('Apple pie\nAPPLE juice')
    })

    it('should return original text if search term is empty', () => {
      const result = filterLines(testText, '')
      expect(result).toBe(testText)
    })

    // LIKE mode tests
    it('should filter using LIKE pattern with % at end - matches line start', () => {
      const text = 'hello\nhello 2\n3 hello'
      const result = filterLines(text, 'hel%', true, false, 'like')
      // "hel%" should match lines starting with "hel"
      expect(result).toBe('hello\nhello 2')
    })

    it('should filter using LIKE pattern with % at start - matches line end', () => {
      const text = 'hello\nhello 2\n3 hello'
      const result = filterLines(text, '%lo', true, false, 'like')
      // "%lo" should match lines ending with "lo"
      expect(result).toBe('hello\n3 hello')
    })

    it('should filter using LIKE pattern with % at end', () => {
      const text = 'apple pie\nbanana split\napple juice\ncherry tart'
      const result = filterLines(text, 'apple%', true, false, 'like')
      expect(result).toBe('apple pie\napple juice')
    })

    it('should filter using LIKE pattern with % at start', () => {
      const text = 'apple pie\nbanana split\nfruit pie\ncherry tart'
      const result = filterLines(text, '%pie', true, false, 'like')
      expect(result).toBe('apple pie\nfruit pie')
    })

    it('should filter using LIKE pattern with % in middle', () => {
      const text = 'test-file-name\ntest_var_name\ntestfunction\nmy-test-value'
      const result = filterLines(text, 'test%name', true, false, 'like')
      expect(result).toBe('test-file-name\ntest_var_name')
    })

    it('should filter using LIKE pattern with _ wildcard', () => {
      const text = 'cat\ncot\ncut\ncoat'
      const result = filterLines(text, 'c_t', true, false, 'like')
      expect(result).toBe('cat\ncot\ncut')
    })

    it('should filter using LIKE pattern case-insensitively', () => {
      const text = 'Apple pie\nBanana split\nAPPLE juice'
      const result = filterLines(text, 'apple%', true, true, 'like')
      expect(result).toBe('Apple pie\nAPPLE juice')
    })

    it('should remove lines using LIKE pattern when keep is false', () => {
      const text = 'apple pie\nbanana split\napple juice'
      const result = filterLines(text, 'apple%', false, false, 'like')
      expect(result).toBe('banana split')
    })

    // Regex mode tests
    it('should filter using regex pattern with line-end anchor', () => {
      const text = 'hello\nworld\nbello'
      const result = filterLines(text, 'llo$', true, false, 'regex')
      // Should match lines ending with "llo" (multiline mode)
      expect(result).toBe('hello\nbello')
    })

    it('should filter using regex pattern with line-start anchor', () => {
      const text = 'hello\nworld\nhello again'
      const result = filterLines(text, '^hello', true, false, 'regex')
      // Should match lines starting with "hello" (multiline mode)
      expect(result).toBe('hello\nhello again')
    })

    it('should filter using regex pattern', () => {
      const text = 'test123\nhello\nworld456\nfoo'
      const result = filterLines(text, '\\d+$', true, false, 'regex')
      expect(result).toBe('test123\nworld456')
    })

    it('should filter using regex pattern case-insensitively', () => {
      const text = 'Hello world\nhello WORLD\nHELLO\ntest'
      const result = filterLines(text, '^hello', true, true, 'regex')
      expect(result).toBe('Hello world\nhello WORLD\nHELLO')
    })

    it('should remove lines using regex pattern when keep is false', () => {
      const text = 'test123\nhello\nworld456'
      const result = filterLines(text, '\\d+', false, false, 'regex')
      expect(result).toBe('hello')
    })

    it('should return original text for invalid regex', () => {
      const text = 'hello\nworld'
      const result = filterLines(text, '[invalid(', true, false, 'regex')
      expect(result).toBe(text)
    })
  })

  describe('getCommonLines', () => {
    it('should find common lines between two texts', () => {
      const left = 'apple\nbanana\ncherry'
      const right = 'banana\ncherry\ndate'
      const result = getCommonLines(left, right)
      expect(result).toBe('banana\ncherry')
    })

    it('should handle case-insensitive comparison', () => {
      const left = 'Apple\nbanana'
      const right = 'apple\nBanana\ncherry'
      const result = getCommonLines(left, right, true)
      expect(result).toBe('apple\nBanana')
    })

    it('should remove duplicates from result', () => {
      const left = 'apple\nbanana'
      const right = 'apple\napple\nbanana'
      const result = getCommonLines(left, right)
      expect(result).toBe('apple\nbanana')
    })

    it('should return empty string when no common lines', () => {
      const left = 'apple\nbanana'
      const right = 'cherry\ndate'
      const result = getCommonLines(left, right)
      expect(result).toBe('')
    })
  })

  describe('getLeftOnlyLines', () => {
    it('should find lines only in left text', () => {
      const left = 'apple\nbanana\ncherry'
      const right = 'banana\ndate'
      const result = getLeftOnlyLines(left, right)
      expect(result).toBe('apple\ncherry')
    })

    it('should handle case-insensitive comparison', () => {
      const left = 'Apple\nbanana\ncherry'
      const right = 'apple\ndate'
      const result = getLeftOnlyLines(left, right, true)
      expect(result).toBe('banana\ncherry')
    })
  })

  describe('getRightOnlyLines', () => {
    it('should find lines only in right text', () => {
      const left = 'apple\nbanana'
      const right = 'banana\ncherry\ndate'
      const result = getRightOnlyLines(left, right)
      expect(result).toBe('cherry\ndate')
    })

    it('should handle case-insensitive comparison', () => {
      const left = 'apple\nbanana'
      const right = 'Apple\ncherry'
      const result = getRightOnlyLines(left, right, true)
      expect(result).toBe('cherry')
    })
  })

  describe('getUniqueLines', () => {
    it('should combine left-only and right-only lines', () => {
      const left = 'apple\nbanana\ncherry'
      const right = 'banana\ndate\nfig'
      const result = getUniqueLines(left, right)
      expect(result).toBe('apple\ncherry\ndate\nfig')
    })

    it('should handle when one side has no unique lines', () => {
      const left = 'apple\nbanana'
      const right = 'apple\nbanana\ncherry'
      const result = getUniqueLines(left, right)
      expect(result).toBe('cherry')
    })
  })

  describe('trimLines', () => {
    it('should trim whitespace from all lines', () => {
      const text = '  apple  \n\tbanana\t\n cherry '
      const result = trimLines(text)
      expect(result).toBe('apple\nbanana\ncherry')
    })

    it('should handle empty lines', () => {
      const text = 'apple\n   \nbanana'
      const result = trimLines(text)
      expect(result).toBe('apple\n\nbanana')
    })
  })

  describe('trimStartLines', () => {
    it('should trim whitespace from start of lines only', () => {
      const text = '  apple  \n\tbanana\t'
      const result = trimStartLines(text)
      expect(result).toBe('apple  \nbanana\t')
    })
  })

  describe('trimEndLines', () => {
    it('should trim whitespace from end of lines only', () => {
      const text = '  apple  \n\tbanana\t'
      const result = trimEndLines(text)
      expect(result).toBe('  apple\n\tbanana')
    })
  })

  describe('removeEmptyLines', () => {
    it('should remove completely empty lines by default', () => {
      const text = 'apple\n\nbanana\n\ncherry'
      const result = removeEmptyLines(text)
      expect(result).toBe('apple\nbanana\ncherry')
    })

    it('should remove blank lines when ignoreBlanks=true', () => {
      const text = 'apple\n\nbanana\n  \ncherry'
      const result = removeEmptyLines(text, true)
      expect(result).toBe('apple\nbanana\ncherry')
    })

    it('should preserve whitespace-only lines when ignoreBlanks=false', () => {
      const text = 'apple\n\nbanana\n  \ncherry'
      const result = removeEmptyLines(text, false)
      expect(result).toBe('apple\nbanana\n  \ncherry')
    })
  })

  describe('highlightCommonLines', () => {
    it('should highlight common lines when highlight=true', () => {
      const text = 'apple\nbanana\ncherry'
      const compare = 'banana\ndate'
      const result = highlightCommonLines(text, compare, true)
      expect(result).toBe('apple\n<span class="highlight-common">banana</span>\ncherry')
    })

    it('should highlight different lines when highlight=false', () => {
      const text = 'apple\nbanana\ncherry'
      const compare = 'banana\ndate'
      const result = highlightCommonLines(text, compare, false)
      expect(result).toBe(
        '<span class="highlight-different">apple</span>\nbanana\n<span class="highlight-different">cherry</span>',
      )
    })

    it('should handle case-insensitive comparison', () => {
      const text = 'Apple\nbanana'
      const compare = 'apple\ndate'
      const result = highlightCommonLines(text, compare, true, true)
      expect(result).toBe('<span class="highlight-common">Apple</span>\nbanana')
    })

    it('should escape HTML characters in highlighted lines', () => {
      const text = '<tag>'
      const compare = '<tag>'
      const result = highlightCommonLines(text, compare, true)
      expect(result).toBe('<span class="highlight-common">&lt;tag&gt;</span>')
    })
  })

  describe('joinLines', () => {
    it('should join lines with default empty separator', () => {
      const text = 'apple\nbanana\ncherry'
      const result = joinLines(text)
      expect(result).toBe('applebananacherry')
    })

    it('should join lines with custom separator', () => {
      const text = 'apple\nbanana\ncherry'
      const result = joinLines(text, ', ')
      expect(result).toBe('apple, banana, cherry')
    })

    it('should handle single line', () => {
      const result = joinLines('apple', ', ')
      expect(result).toBe('apple')
    })
  })

  describe('splitText', () => {
    it('should split text by separator into lines', () => {
      const text = 'apple,banana,cherry'
      const result = splitText(text, ',')
      expect(result).toBe('apple\nbanana\ncherry')
    })

    it('should split by space separator', () => {
      const text = 'apple banana cherry'
      const result = splitText(text, ' ')
      expect(result).toBe('apple\nbanana\ncherry')
    })

    it('should handle multiple character separator', () => {
      const text = 'apple::banana::cherry'
      const result = splitText(text, '::')
      expect(result).toBe('apple\nbanana\ncherry')
    })

    it('should return original text if separator is empty', () => {
      const text = 'apple banana'
      const result = splitText(text, '')
      expect(result).toBe(text)
    })

    it('should handle text without separator', () => {
      const text = 'apple banana'
      const result = splitText(text, ',')
      expect(result).toBe('apple banana')
    })
  })

  describe('topLines', () => {
    it('should keep only the first n lines', () => {
      const text = 'line1\nline2\nline3\nline4\nline5'
      const result = topLines(text, 3)
      expect(result).toBe('line1\nline2\nline3')
    })

    it('should return all lines if count is greater than number of lines', () => {
      const text = 'line1\nline2'
      const result = topLines(text, 5)
      expect(result).toBe('line1\nline2')
    })

    it('should return empty string if count is 0', () => {
      const text = 'line1\nline2\nline3'
      const result = topLines(text, 0)
      expect(result).toBe('')
    })

    it('should return empty string if count is negative', () => {
      const text = 'line1\nline2\nline3'
      const result = topLines(text, -1)
      expect(result).toBe('')
    })

    it('should handle single line', () => {
      const text = 'single line'
      const result = topLines(text, 1)
      expect(result).toBe('single line')
    })

    it('should return empty string from empty text', () => {
      const result = topLines('', 3)
      expect(result).toBe('')
    })
  })

  describe('bottomLines', () => {
    it('should keep only the last n lines', () => {
      const text = 'line1\nline2\nline3\nline4\nline5'
      const result = bottomLines(text, 3)
      expect(result).toBe('line3\nline4\nline5')
    })

    it('should return all lines if count is greater than number of lines', () => {
      const text = 'line1\nline2'
      const result = bottomLines(text, 5)
      expect(result).toBe('line1\nline2')
    })

    it('should return empty string if count is 0', () => {
      const text = 'line1\nline2\nline3'
      const result = bottomLines(text, 0)
      expect(result).toBe('')
    })

    it('should return empty string if count is negative', () => {
      const text = 'line1\nline2\nline3'
      const result = bottomLines(text, -1)
      expect(result).toBe('')
    })

    it('should handle single line', () => {
      const text = 'single line'
      const result = bottomLines(text, 1)
      expect(result).toBe('single line')
    })

    it('should return empty string from empty text', () => {
      const result = bottomLines('', 3)
      expect(result).toBe('')
    })
  })

  describe('addPrefix', () => {
    it('should add prefix to each line', () => {
      const text = 'line1\nline2\nline3'
      const result = addPrefix(text, '> ')
      expect(result).toBe('> line1\n> line2\n> line3')
    })

    it('should handle single line', () => {
      const text = 'single line'
      const result = addPrefix(text, '- ')
      expect(result).toBe('- single line')
    })

    it('should return original text when prefix is empty', () => {
      const text = 'line1\nline2'
      const result = addPrefix(text, '')
      expect(result).toBe(text)
    })

    it('should add prefix to empty lines', () => {
      const text = 'line1\n\nline3'
      const result = addPrefix(text, '>> ')
      expect(result).toBe('>> line1\n>> \n>> line3')
    })

    it('should handle special characters in prefix', () => {
      const text = 'line1\nline2'
      const result = addPrefix(text, '* ')
      expect(result).toBe('* line1\n* line2')
    })
  })

  describe('addSuffix', () => {
    it('should add suffix to each line', () => {
      const text = 'line1\nline2\nline3'
      const result = addSuffix(text, ' !')
      expect(result).toBe('line1 !\nline2 !\nline3 !')
    })

    it('should handle single line', () => {
      const text = 'single line'
      const result = addSuffix(text, ' !!!')
      expect(result).toBe('single line !!!')
    })

    it('should return original text when suffix is empty', () => {
      const text = 'line1\nline2'
      const result = addSuffix(text, '')
      expect(result).toBe(text)
    })

    it('should add suffix to empty lines', () => {
      const text = 'line1\n\nline3'
      const result = addSuffix(text, ' <<')
      expect(result).toBe('line1 <<\n <<\nline3 <<')
    })

    it('should handle special characters in suffix', () => {
      const text = 'line1\nline2'
      const result = addSuffix(text, ',')
      expect(result).toBe('line1,\nline2,')
    })
  })

  describe('replaceText', () => {
    it('should replace all occurrences of search term', () => {
      const text = 'hello world hello universe'
      const result = replaceText(text, 'hello', 'hi')
      expect(result).toBe('hi world hi universe')
    })

    it('should replace with empty string', () => {
      const text = 'hello world hello universe'
      const result = replaceText(text, 'hello ', '')
      expect(result).toBe('world universe')
    })

    it('should handle case-insensitive replacement', () => {
      const text = 'Hello world HELLO universe'
      const result = replaceText(text, 'hello', 'hi', true)
      expect(result).toBe('hi world hi universe')
    })

    it('should handle case-sensitive replacement', () => {
      const text = 'Hello world hello universe'
      const result = replaceText(text, 'hello', 'hi', false)
      expect(result).toBe('Hello world hi universe')
    })

    it('should return original text when search term is empty', () => {
      const text = 'hello world'
      const result = replaceText(text, '', 'replacement')
      expect(result).toBe(text)
    })

    it('should properly escape special regex characters in search term', () => {
      const text = 'test (hello) test'
      const result = replaceText(text, '(hello)', 'world')
      expect(result).toBe('test world test')
    })

    // LIKE mode tests
    it('should replace using LIKE pattern with %', () => {
      const text = 'hello world hello universe'
      const result = replaceText(text, 'hel%', 'greetings', false, 'like')
      expect(result).toBe('greetings')
    })

    it('should replace using LIKE pattern with _', () => {
      const text = 'hello hallo hillo'
      const result = replaceText(text, '%h_llo%', 'hi', false, 'like')
      expect(result).toBe('hi hi hi')
    })

    it('should replace using LIKE pattern case-insensitively', () => {
      const text = 'Hello HALLO hillo'
      const result = replaceText(text, '%h_llo%', 'hi', true, 'like')
      expect(result).toBe('hi hi hi')
    })

    // Regex mode tests
    it('should replace using regex pattern', () => {
      const text = 'test123 hello456 world'
      const result = replaceText(text, '[0-9]+', 'XXX', false, 'regex')
      expect(result).toBe('testXXX helloXXX world')
    })

    it('should replace using regex with line-end anchor ($)', () => {
      const text = 'hello\nworld\nbello'
      const result = replaceText(text, 'llo$', 'ENDING', false, 'regex')
      // Should replace "llo" at the end of each line (multiline mode)
      expect(result).toBe('heENDING\nworld\nbeENDING')
    })

    it('should replace using regex with line-start anchor (^)', () => {
      const text = 'hello world\nworld peace\nhello there'
      const result = replaceText(text, '^hello', 'START', false, 'regex')
      // Should replace "hello" at the start of each line (multiline mode)
      expect(result).toBe('START world\nworld peace\nSTART there')
    })

    it('should replace using regex pattern with capture groups', () => {
      const text = 'John Smith, Jane Doe'
      const result = replaceText(text, '(\\w+) (\\w+)', '$2 $1', false, 'regex')
      expect(result).toBe('Smith John, Doe Jane')
    })

    it('should replace using regex pattern case-insensitively', () => {
      const text = 'Hello hello HELLO'
      const result = replaceText(text, 'h.llo', 'hi', true, 'regex')
      expect(result).toBe('hi hi hi')
    })

    it('should return original text for invalid regex', () => {
      const text = 'hello world'
      const result = replaceText(text, '[invalid(', 'replacement', false, 'regex')
      expect(result).toBe(text)
    })

    it('should handle multiline text', () => {
      const text = 'line1 hello\nline2 hello\nline3'
      const result = replaceText(text, 'hello', 'goodbye')
      expect(result).toBe('line1 goodbye\nline2 goodbye\nline3')
    })

    it('should replace with special characters', () => {
      const text = 'hello world'
      const result = replaceText(text, 'world', '$100')
      expect(result).toBe('hello $100')
    })

    it('should handle overlapping patterns', () => {
      const text = 'aaaa'
      const result = replaceText(text, 'aa', 'b')
      expect(result).toBe('bb')
    })

    it('should handle text with no matches', () => {
      const text = 'hello world'
      const result = replaceText(text, 'goodbye', 'hi')
      expect(result).toBe('hello world')
    })
  })

  describe('substringLines', () => {
    it('should extract substring starting at position 1 with no length', () => {
      const text = 'hello world\napple banana\ntest string'
      const result = substringLines(text, 1)
      expect(result).toBe('hello world\napple banana\ntest string')
    })

    it('should extract substring starting at position 3 with no length', () => {
      const text = 'hello world\napple banana\ntest string'
      const result = substringLines(text, 3)
      expect(result).toBe('llo world\nple banana\nst string')
    })

    it('should extract substring starting at position 1 with length 5', () => {
      const text = 'hello world\napple banana\ntest string'
      const result = substringLines(text, 1, 5)
      expect(result).toBe('hello\napple\ntest ')
    })

    it('should extract substring starting at position 7 with length 5', () => {
      const text = 'hello world\napple banana\ntest string'
      const result = substringLines(text, 7, 5)
      expect(result).toBe('world\nbanan\ntring')
    })

    it('should extract substring from negative index (count from end)', () => {
      const text = 'hello world\napple banana\ntest string'
      const result = substringLines(text, -5)
      expect(result).toBe('world\nanana\ntring')
    })

    it('should extract substring from negative index with length', () => {
      const text = 'hello world\napple banana\ntest string'
      const result = substringLines(text, -5, 3)
      expect(result).toBe('wor\nana\ntri')
    })

    it('should handle negative index that exceeds line length', () => {
      const text = 'hi\nhello\ntest'
      const result = substringLines(text, -10)
      expect(result).toBe('hi\nhello\ntest')
    })

    it('should handle start index beyond line length', () => {
      const text = 'hi\nhello\ntest'
      const result = substringLines(text, 20)
      expect(result).toBe('\n\n')
    })

    it('should handle length that exceeds remaining characters', () => {
      const text = 'hello\napple\ntest'
      const result = substringLines(text, 3, 100)
      expect(result).toBe('llo\nple\nst')
    })

    it('should handle empty lines', () => {
      const text = 'hello\n\napple'
      const result = substringLines(text, 2, 3)
      expect(result).toBe('ell\n\nppl')
    })

    it('should preserve empty lines', () => {
      const text = 'hello\n\napple'
      const result = substringLines(text, 1)
      expect(result).toBe('hello\n\napple')
    })

    it('should handle single character extraction', () => {
      const text = 'hello\napple\ntest'
      const result = substringLines(text, 1, 1)
      expect(result).toBe('h\na\nt')
    })

    it('should handle length of 0', () => {
      const text = 'hello\napple\ntest'
      const result = substringLines(text, 1, 0)
      expect(result).toBe('\n\n')
    })

    it('should handle length of 0 to extract everything before index', () => {
      const text = 'hello world\napple banana\ntest string'
      const result = substringLines(text, 7, 0)
      // Position 7 is 'w'/'b'/'s'. Length 0 means everything before: "hello " / "apple " / "test s"
      expect(result).toBe('hello \napple \ntest s')
    })

    it('should handle length of 0 with negative index', () => {
      const text = 'hello world\napple banana\ntest string'
      const result = substringLines(text, -5, 0)
      // -5 from end is position 'w'/'a'/'s'. Length 0 means everything before that
      expect(result).toBe('hello \napple b\ntest s')
    })

    it('should handle length of 0 from position 1 (returns empty)', () => {
      const text = 'hello\napple\ntest'
      const result = substringLines(text, 1, 0)
      expect(result).toBe('\n\n')
    })

    it('should handle single line input', () => {
      const text = 'hello world'
      const result = substringLines(text, 7, 5)
      expect(result).toBe('world')
    })

    it('should handle empty text', () => {
      const text = ''
      const result = substringLines(text, 1)
      expect(result).toBe('')
    })

    it('should extract from position 1 being equivalent to full line', () => {
      const text = 'test'
      const result = substringLines(text, 1)
      expect(result).toBe('test')
    })

    it('should handle negative index -1 (last character)', () => {
      const text = 'hello\napple\ntest'
      const result = substringLines(text, -1)
      expect(result).toBe('o\ne\nt')
    })

    it('should handle negative index -1 with length', () => {
      const text = 'hello\napple\ntest'
      const result = substringLines(text, -1, 1)
      expect(result).toBe('o\ne\nt')
    })

    it('should handle different line lengths with positive index', () => {
      const text = 'short\nthis is a longer line\nmed'
      const result = substringLines(text, 5, 3)
      expect(result).toBe('t\n is\n')
    })

    it('should handle different line lengths with negative index', () => {
      const text = 'short\nthis is a longer line\nmed'
      const result = substringLines(text, -3)
      expect(result).toBe('ort\nine\nmed')
    })

    it('should handle negative length to extract characters before index', () => {
      const text = 'hello world\napple banana\ntest string'
      const result = substringLines(text, 7, -2)
      // Position 7 is 'w' (index 6). -2 means 2 chars before: positions 5-6 = "o "
      expect(result).toBe('o \ne \n s')
    })

    it('should handle negative length from negative start index', () => {
      const text = 'hello world\napple banana\ntest string'
      const result = substringLines(text, -5, -3)
      // -5 from end: "world" -> 'w' is at position 7 (index 6)
      // -3 means 3 chars before: positions 4-6 = "lo "
      expect(result).toBe('lo \ne b\nt s')
    })

    it('should handle negative length that exceeds line start', () => {
      const text = 'hello\napple\ntest'
      const result = substringLines(text, 3, -10)
      expect(result).toBe('he\nap\nte')
    })

    it('should handle negative length of -1 (one char before index)', () => {
      const text = 'hello\napple\ntest'
      const result = substringLines(text, 5, -1)
      // Position 5 is 'o' (index 4). -1 means 1 char before: position 4 = "l"
      expect(result).toBe('l\nl\n')
    })

    it('should return empty string for negative length from position 1', () => {
      const text = 'hello\napple\ntest'
      const result = substringLines(text, 1, -1)
      expect(result).toBe('\n\n')
    })
  })

  describe('insertText', () => {
    it('should insert text at position 1 (beginning of line)', () => {
      const text = 'hello\nworld\ntest'
      const result = insertText(text, '>>> ', 1)
      expect(result).toBe('>>> hello\n>>> world\n>>> test')
    })

    it('should insert text at position 2 (after first character)', () => {
      const text = 'hello\nworld\ntest'
      const result = insertText(text, '-', 2)
      expect(result).toBe('h-ello\nw-orld\nt-est')
    })

    it('should insert text in the middle of lines', () => {
      const text = 'hello world\napple banana'
      const result = insertText(text, '***', 7)
      expect(result).toBe('hello ***world\napple ***banana')
    })

    it('should insert text at the end when position exceeds line length', () => {
      const text = 'hello\nworld'
      const result = insertText(text, '!!!', 100)
      expect(result).toBe('hello!!!\nworld!!!')
    })

    it('should insert text from negative position (count from end)', () => {
      const text = 'hello\nworld\ntest'
      const result = insertText(text, '>>', -1)
      // -1 means before the last character
      expect(result).toBe('hell>>o\nworl>>d\ntes>>t')
    })

    it('should insert text from negative position -2', () => {
      const text = 'hello\nworld\ntest'
      const result = insertText(text, '_', -2)
      // -2 means before the 2nd-to-last character
      expect(result).toBe('hel_lo\nwor_ld\nte_st')
    })

    it('should insert text from negative position -5', () => {
      const text = 'hello world\napple banana'
      const result = insertText(text, '|', -5)
      // -5 from end: "hello world" has 11 chars, so position 7 (index 6) - before 'w'
      // "apple banana" has 12 chars, so position 8 (index 7) - before 'b'
      expect(result).toBe('hello |world\napple b|anana')
    })

    it('should insert at beginning when negative position exceeds line length', () => {
      const text = 'hi\nok\ngo'
      const result = insertText(text, '<', -100)
      expect(result).toBe('<hi\n<ok\n<go')
    })

    it('should handle position 0 (treated as beginning)', () => {
      const text = 'hello\nworld'
      const result = insertText(text, '>>', 0)
      expect(result).toBe('>>hello\n>>world')
    })

    it('should preserve empty lines', () => {
      const text = 'hello\n\nworld'
      const result = insertText(text, '>>', 1)
      expect(result).toBe('>>hello\n\n>>world')
    })

    it('should handle single line', () => {
      const text = 'hello world'
      const result = insertText(text, '***', 7)
      expect(result).toBe('hello ***world')
    })

    it('should handle empty text', () => {
      const text = ''
      const result = insertText(text, 'test', 1)
      expect(result).toBe('')
    })

    it('should handle empty insertion text', () => {
      const text = 'hello\nworld'
      const result = insertText(text, '', 3)
      expect(result).toBe('hello\nworld')
    })

    it('should insert special characters', () => {
      const text = 'hello\nworld'
      const result = insertText(text, '$()', 3)
      expect(result).toBe('he$()llo\nwo$()rld')
    })

    it('should insert at last position of line', () => {
      const text = 'hello\nworld'
      const result = insertText(text, '!', 6)
      expect(result).toBe('hello!\nworld!')
    })

    it('should handle negative position -1 (after last char)', () => {
      const text = 'abc\nxyz'
      const result = insertText(text, '!', -1)
      // -1 means before the last character
      expect(result).toBe('ab!c\nxy!z')
    })

    it('should handle lines with different lengths', () => {
      const text = 'short\nthis is a longer line\nmed'
      const result = insertText(text, '|', 4)
      expect(result).toBe('sho|rt\nthi|s is a longer line\nmed|')
    })

    it('should insert newline characters', () => {
      const text = 'hello\nworld'
      const result = insertText(text, '\n', 3)
      expect(result).toBe('he\nllo\nwo\nrld')
    })

    it('should insert tabs', () => {
      const text = 'hello\nworld'
      const result = insertText(text, '\t', 1)
      expect(result).toBe('\thello\n\tworld')
    })
  })

  describe('extractBetween', () => {
    it('should extract text between two delimiters with delimiters stripped', () => {
      const text = 'ab<cd>ef'
      const result = extractBetween(text, '<', '>')
      expect(result).toBe('cd')
    })

    it('should extract text between two delimiters with delimiters included', () => {
      const text = 'ab<cd>ef'
      const result = extractBetween(text, '<', '>', false)
      expect(result).toBe('<cd>')
    })

    it('should extract multiple occurrences from same line', () => {
      const text = 'ab<cd>ef<gh>ij'
      const result = extractBetween(text, '<', '>')
      expect(result).toBe('cdgh')
    })

    it('should extract multiple occurrences with delimiters included', () => {
      const text = 'ab<cd>ef<gh>ij'
      const result = extractBetween(text, '<', '>', false)
      expect(result).toBe('<cd><gh>')
    })

    it('should handle parentheses as delimiters', () => {
      const text = 'func(arg1, arg2) and other(x)'
      const result = extractBetween(text, '(', ')')
      expect(result).toBe('arg1, arg2x')
    })

    it('should handle square brackets as delimiters', () => {
      const text = 'array[0] and data[key]'
      const result = extractBetween(text, '[', ']')
      expect(result).toBe('0key')
    })

    it('should handle curly braces as delimiters', () => {
      const text = 'template {value1} and {value2}'
      const result = extractBetween(text, '{', '}')
      expect(result).toBe('value1value2')
    })

    it('should handle multi-character delimiters', () => {
      const text = 'text [[content]] more [[data]]'
      const result = extractBetween(text, '[[', ']]')
      expect(result).toBe('contentdata')
    })

    it('should handle same delimiter at start and end', () => {
      const text = 'text "quoted" and "more"'
      const result = extractBetween(text, '"', '"')
      expect(result).toBe('quotedmore')
    })

    it('should return empty string if no start delimiter found', () => {
      const text = 'no delimiters here'
      const result = extractBetween(text, '<', '>')
      expect(result).toBe('')
    })

    it('should return empty string if no end delimiter found', () => {
      const text = 'start<but no end'
      const result = extractBetween(text, '<', '>')
      expect(result).toBe('')
    })

    it('should return empty string for incomplete delimiter pair', () => {
      const text = 'ab<cd'
      const result = extractBetween(text, '<', '>')
      expect(result).toBe('')
    })

    it('should handle empty content between delimiters', () => {
      const text = 'empty<>brackets'
      const result = extractBetween(text, '<', '>')
      expect(result).toBe('')
    })

    it('should handle empty content between delimiters with delimiters included', () => {
      const text = 'empty<>brackets'
      const result = extractBetween(text, '<', '>', false)
      expect(result).toBe('<>')
    })

    it('should handle nested-looking delimiters by matching first occurrence', () => {
      const text = 'outer<inner<content>end>final'
      const result = extractBetween(text, '<', '>')
      // Should match first < to first >, extracting what's between
      expect(result).toBe('inner<content')
    })

    it('should handle double delimiters correctly', () => {
      const text = 'ab<<cd>>ef'
      const result = extractBetween(text, '<', '>')
      // First < to first >: "<cd", then second < to second >: ">"
      expect(result).toBe('<cd>')
    })

    it('should handle multiple lines', () => {
      const text = 'line1 <a>test\nline2 <b>data\nline3 no match'
      const result = extractBetween(text, '<', '>')
      expect(result).toBe('a\nb\n')
    })

    it('should preserve empty lines', () => {
      const text = 'line1 <a>test\n\nline3 <b>data'
      const result = extractBetween(text, '<', '>')
      expect(result).toBe('a\n\nb')
    })

    it('should handle line with only delimiters and content', () => {
      const text = '<content>'
      const result = extractBetween(text, '<', '>')
      expect(result).toBe('content')
    })

    it('should handle line with only delimiters and content (included)', () => {
      const text = '<content>'
      const result = extractBetween(text, '<', '>', false)
      expect(result).toBe('<content>')
    })

    it('should handle adjacent delimiters', () => {
      const text = '<a><b><c>'
      const result = extractBetween(text, '<', '>')
      expect(result).toBe('abc')
    })

    it('should handle text before and after delimiter pairs', () => {
      const text = 'prefix<content>suffix'
      const result = extractBetween(text, '<', '>')
      expect(result).toBe('content')
    })

    it('should extract from start to end delimiter when start delimiter is empty', () => {
      const text = 'test<content>text'
      const result = extractBetween(text, '', '>')
      expect(result).toBe('test<content')
    })

    it('should extract from start delimiter to end when end delimiter is empty', () => {
      const text = 'test<content>text'
      const result = extractBetween(text, '<', '')
      expect(result).toBe('content>text')
    })

    it('should handle special regex characters in delimiters', () => {
      const text = 'test.*content.*end'
      const result = extractBetween(text, '.*', '.*')
      expect(result).toBe('content')
    })

    it('should handle HTML tags', () => {
      const text = 'text <span>content</span> more'
      const result = extractBetween(text, '<span>', '</span>')
      expect(result).toBe('content')
    })

    it('should handle XML-style tags', () => {
      const text = '<tag attr=\'value\'>content</tag>'
      const result = extractBetween(text, '>', '<')
      expect(result).toBe('content')
    })

    it('should handle single line with multiple different content', () => {
      const text = 'a<x>b<y>c<z>d'
      const result = extractBetween(text, '<', '>')
      expect(result).toBe('xyz')
    })

    it('should handle whitespace in extracted content', () => {
      const text = 'text< content with spaces >end'
      const result = extractBetween(text, '<', '>')
      expect(result).toBe(' content with spaces ')
    })

    it('should handle newlines within the same line processing', () => {
      const text = 'line1<a>\nline2<b>'
      const result = extractBetween(text, '<', '>')
      // Each line is processed independently - both lines have delimiters
      expect(result).toBe('a\nb')
    })

    it('should handle extraction where delimiters appear multiple times', () => {
      const text = '<<content>>'
      const result = extractBetween(text, '<', '>')
      // When end delimiters are adjacent, match to the second one
      expect(result).toBe('<content>')
    })

    it('should handle long content between delimiters', () => {
      const text = 'start<this is a very long content string>end'
      const result = extractBetween(text, '<', '>')
      expect(result).toBe('this is a very long content string')
    })

    it('should handle delimiters at line boundaries', () => {
      const text = '<content>'
      const result = extractBetween(text, '<', '>')
      expect(result).toBe('content')
    })

    it('should handle case-sensitive delimiters', () => {
      const text = 'text<Content>and<content>end'
      const result = extractBetween(text, '<', '>')
      expect(result).toBe('Contentcontent')
    })

    it('should extract from complex expressions', () => {
      const text = 'func(a, b, c) + other(x, y)'
      const result = extractBetween(text, '(', ')')
      expect(result).toBe('a, b, cx, y')
    })

    it('should handle empty text', () => {
      const text = ''
      const result = extractBetween(text, '<', '>')
      expect(result).toBe('')
    })

    it('should handle single character between delimiters', () => {
      const text = 'test<x>end'
      const result = extractBetween(text, '<', '>')
      expect(result).toBe('x')
    })

    it('should handle numbers as content', () => {
      const text = 'value[123]and[456]'
      const result = extractBetween(text, '[', ']')
      expect(result).toBe('123456')
    })

    // Tests for only start delimiter
    it('should extract from start delimiter to end of line when no end delimiter', () => {
      const text = 'prefix<content here'
      const result = extractBetween(text, '<', '')
      expect(result).toBe('content here')
    })

    it('should extract from start delimiter to end with delimiter included', () => {
      const text = 'prefix<content here'
      const result = extractBetween(text, '<', '', false)
      expect(result).toBe('<content here')
    })

    it('should handle multiple lines with only start delimiter', () => {
      const text = 'line1<data1\nline2<data2\nline3 no match'
      const result = extractBetween(text, '<', '')
      expect(result).toBe('data1\ndata2\n')
    })

    // Tests for only end delimiter
    it('should extract from start of line to end delimiter when no start delimiter', () => {
      const text = 'content here>suffix'
      const result = extractBetween(text, '', '>')
      expect(result).toBe('content here')
    })

    it('should extract from start to end delimiter with delimiter included', () => {
      const text = 'content here>suffix'
      const result = extractBetween(text, '', '>', false)
      expect(result).toBe('content here>')
    })

    it('should handle multiple end delimiters with only end delimiter provided', () => {
      const text = 'abc>def>ghi'
      const result = extractBetween(text, '', '>')
      expect(result).toBe('abcdef')
    })

    it('should handle multiple lines with only end delimiter', () => {
      const text = 'data1>line1\ndata2>line2\nno match'
      const result = extractBetween(text, '', '>')
      expect(result).toBe('data1\ndata2\n')
    })

    // Tests for no delimiters
    it('should return empty string when both delimiters are empty', () => {
      const text = 'some text here'
      const result = extractBetween(text, '', '')
      expect(result).toBe('')
    })
  })

  describe('highlightDelimiters', () => {
    it('should highlight extracted text between delimiters (stripped)', () => {
      const text = 'ab<cd>ef'
      const result = highlightDelimiters(text, '<', '>', true)
      expect(result).toBe('ab&lt;<span class="highlight-extract">cd</span>&gt;ef')
    })

    it('should highlight extracted text including delimiters (not stripped)', () => {
      const text = 'ab<cd>ef'
      const result = highlightDelimiters(text, '<', '>', false)
      expect(result).toBe('ab<span class="highlight-extract">&lt;cd&gt;</span>ef')
    })

    it('should highlight multiple occurrences (stripped)', () => {
      const text = 'ab<cd>ef<gh>ij'
      const result = highlightDelimiters(text, '<', '>', true)
      expect(result).toBe(
        'ab&lt;<span class="highlight-extract">cd</span>&gt;ef&lt;<span class="highlight-extract">gh</span>&gt;ij',
      )
    })

    it('should highlight multiple occurrences (not stripped)', () => {
      const text = 'ab<cd>ef<gh>ij'
      const result = highlightDelimiters(text, '<', '>', false)
      expect(result).toBe(
        'ab<span class="highlight-extract">&lt;cd&gt;</span>ef<span class="highlight-extract">&lt;gh&gt;</span>ij',
      )
    })

    it('should highlight from start delimiter to end (stripped)', () => {
      const text = 'ab<cdef'
      const result = highlightDelimiters(text, '<', '', true)
      expect(result).toBe('ab&lt;<span class="highlight-extract">cdef</span>')
    })

    it('should highlight from start delimiter to end (not stripped)', () => {
      const text = 'ab<cdef'
      const result = highlightDelimiters(text, '<', '', false)
      expect(result).toBe('ab<span class="highlight-extract">&lt;cdef</span>')
    })

    it('should highlight from start to end delimiter (stripped)', () => {
      const text = 'abcd>ef'
      const result = highlightDelimiters(text, '', '>', true)
      expect(result).toBe('<span class="highlight-extract">abcd</span>&gt;ef')
    })

    it('should highlight from start to end delimiter (not stripped)', () => {
      const text = 'abcd>ef'
      const result = highlightDelimiters(text, '', '>', false)
      expect(result).toBe('<span class="highlight-extract">abcd&gt;</span>ef')
    })

    it('should handle parentheses (stripped)', () => {
      const text = 'func(arg1)'
      const result = highlightDelimiters(text, '(', ')', true)
      expect(result).toBe('func(<span class="highlight-extract">arg1</span>)')
    })

    it('should handle parentheses (not stripped)', () => {
      const text = 'func(arg1)'
      const result = highlightDelimiters(text, '(', ')', false)
      expect(result).toBe('func<span class="highlight-extract">(arg1)</span>')
    })

    it('should handle square brackets (stripped)', () => {
      const text = 'array[0]'
      const result = highlightDelimiters(text, '[', ']', true)
      expect(result).toBe('array[<span class="highlight-extract">0</span>]')
    })

    it('should handle multi-character delimiters (stripped)', () => {
      const text = 'text [[content]] more'
      const result = highlightDelimiters(text, '[[', ']]', true)
      expect(result).toBe('text [[<span class="highlight-extract">content</span>]] more')
    })

    it('should handle adjacent delimiters (stripped)', () => {
      const text = '<<content>>'
      const result = highlightDelimiters(text, '<', '>', true)
      expect(result).toBe('&lt;<span class="highlight-extract">&lt;content&gt;</span>&gt;')
    })

    it('should handle multiple lines (stripped)', () => {
      const text = 'line1<a>\nline2<b>'
      const result = highlightDelimiters(text, '<', '>', true)
      expect(result).toBe(
        'line1&lt;<span class="highlight-extract">a</span>&gt;\nline2&lt;<span class="highlight-extract">b</span>&gt;',
      )
    })

    it('should return original text when no delimiters provided', () => {
      const text = 'some text'
      const result = highlightDelimiters(text, '', '', true)
      expect(result).toBe('some text')
    })

    it('should handle special regex characters in delimiters (stripped)', () => {
      const text = 'test.*content.*end'
      const result = highlightDelimiters(text, '.*', '.*', true)
      expect(result).toBe('test.*<span class="highlight-extract">content</span>.*end')
    })

    it('should preserve empty lines', () => {
      const text = 'line1<a>\n\nline3<b>'
      const result = highlightDelimiters(text, '<', '>', true)
      expect(result).toBe(
        'line1&lt;<span class="highlight-extract">a</span>&gt;\n\nline3&lt;<span class="highlight-extract">b</span>&gt;',
      )
    })

    it('should handle double delimiters correctly (stripped)', () => {
      const text = 'ab<<cd>>ef'
      const result = highlightDelimiters(text, '<', '>', true)
      expect(result).toBe('ab&lt;<span class="highlight-extract">&lt;cd&gt;</span>&gt;ef')
    })

    it('should handle multiple end delimiters with only end delimiter (stripped)', () => {
      const text = 'abc>def>ghi'
      const result = highlightDelimiters(text, '', '>', true)
      expect(result).toBe(
        '<span class="highlight-extract">abc</span>&gt;<span class="highlight-extract">def</span>&gt;ghi',
      )
    })
  })
})
