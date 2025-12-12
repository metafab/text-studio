// Text processing utility functions
export type SearchMode = 'standard' | 'like' | 'regex'

export interface TextStats {
  lines: number
  uniqueLines: number
  characters: number
  charactersWithLineBreaks: number
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Helper function to convert LIKE pattern to regex
function likePatternToRegex(pattern: string, ignoreCase: boolean = false): RegExp {
  // Escape special regex characters except % and _
  let regexPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&')

  // Convert LIKE wildcards to regex
  // % matches any sequence of characters (including none) - use .* for greedy
  // _ matches exactly one character
  regexPattern = regexPattern.replace(/%/g, '.*').replace(/_/g, '.')

  // Anchor to match full string
  regexPattern = `^${regexPattern}$`

  const flags = ignoreCase ? 'i' : ''
  return new RegExp(regexPattern, flags)
}

// Create regex for standard mode (literal matching)
function createStandardRegex(searchTerm: string, flags: string): RegExp {
  // Escape all special regex characters for literal matching
  const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(escaped, flags)
}

// Create regex for LIKE mode (SQL-style pattern matching)
function createLikeRegex(searchTerm: string, flags: string): RegExp {
  // For highlighting and replacement with LIKE patterns:
  // - If pattern doesn't start with %, match from start of line
  // - If pattern doesn't end with %, match to end of line
  // - Patterns without % at all match the literal pattern anywhere
  
  // Check if pattern starts/ends with % BEFORE escaping
  const startsWithPercent = searchTerm.startsWith('%')
  const endsWithPercent = searchTerm.endsWith('%')
  const hasPercent = searchTerm.includes('%')

  // Remove leading/trailing % for processing
  let corePattern = searchTerm
  if (startsWithPercent) corePattern = corePattern.slice(1)
  if (endsWithPercent) corePattern = corePattern.slice(0, -1)

  // Escape special regex characters except % and _
  let likePattern = corePattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&')

  // Replace % with .* (greedy) and _ with any character
  likePattern = likePattern.replace(/%/g, '.*').replace(/_/g, '.')

  // Add boundary constraints and capture groups based on % presence
  if (!hasPercent) {
    // No % wildcard - match the pattern anywhere (like standard search but with _ support)
    likePattern = `(${likePattern})`
  } else if (startsWithPercent && endsWithPercent) {
    // Pattern is %...%, match anywhere - use non-greedy prefix/suffix, capture the core
    likePattern = `.*?(${likePattern}).*?`
  } else if (startsWithPercent) {
    // Pattern is %..., match ending (anchored at end of line) - use greedy .* to capture full line
    likePattern = `(^.*${likePattern}$)`
  } else if (endsWithPercent) {
    // Pattern is ...%, match from start (anchored at start of line)
    likePattern = `(^${likePattern}.*)`
  } else {
    // Has % in the middle (e.g., "a%b"), match the full line
    likePattern = `(^${likePattern}$)`
  }

  // Add multiline flag for ^ and $ to work with line boundaries
  if (!flags.includes('m')) {
    flags += 'm'
  }

  return new RegExp(likePattern, flags)
}

// Create regex for regex mode (user-provided regex)
function createRegexMode(searchTerm: string, flags: string): RegExp | null {
  try {
    // Add multiline flag for ^ and $ to work with line boundaries
    if (!flags.includes('m')) {
      flags += 'm'
    }
    return new RegExp(searchTerm, flags)
  } catch (e) {
    // Invalid regex, return null
    return null
  }
}

// Helper function to create a regex from search term based on mode
function createSearchRegex(
  searchTerm: string,
  mode: SearchMode,
  ignoreCase: boolean = false,
  global: boolean = false,
): RegExp | null {
  if (!searchTerm.trim()) return null

  let flags = ignoreCase ? 'i' : ''
  if (global) flags += 'g'

  switch (mode) {
    case 'standard':
      return createStandardRegex(searchTerm, flags)
    case 'like':
      return createLikeRegex(searchTerm, flags)
    case 'regex':
      return createRegexMode(searchTerm, flags)
    default:
      return null
  }
}

export function getTextStats(
  text: string,
  ignoreCase: boolean = false,
  includeLineBreaks: boolean = false,
): TextStats {
  const lines = text === '' ? [] : text.split('\n')
  const uniqueLines = new Set(
    lines
      .filter((line) => line.trim() !== '')
      .map((line) => (ignoreCase ? line.toLowerCase() : line)),
  )

  const charactersWithLineBreaks = text.length
  const charactersWithoutLineBreaks = text.replace(/[\r\n]/g, '').length

  return {
    lines: lines.length,
    uniqueLines: uniqueLines.size,
    characters: includeLineBreaks ? charactersWithLineBreaks : charactersWithoutLineBreaks,
    charactersWithLineBreaks,
  }
}

export function sortLines(
  text: string,
  mode: 'asc' | 'desc' | 'random',
  ignoreCase: boolean = false,
): string {
  const lines = text.split('\n')

  switch (mode) {
    case 'asc':
      return lines
        .sort((a, b) => {
          if (ignoreCase) {
            return a.toLowerCase().localeCompare(b.toLowerCase())
          }

          // Use simple string comparison for case-sensitive sorting
          // This puts uppercase letters before lowercase letters (ASCII order)
          return a < b ? -1 : a > b ? 1 : 0
        })
        .join('\n')
    case 'desc':
      return lines
        .sort((a, b) => {
          if (ignoreCase) {
            return b.toLowerCase().localeCompare(a.toLowerCase())
          }

          // Use simple string comparison for case-sensitive sorting
          return b < a ? -1 : b > a ? 1 : 0
        })
        .join('\n')
    case 'random':
      return lines.sort(() => Math.random() - 0.5).join('\n')
    default:
      return text
  }
}

export function reverseLines(text: string): string {
  return text.split('\n').reverse().join('\n')
}

export function removeDuplicates(text: string, ignoreCase: boolean = false): string {
  const lines = text.split('\n')
  const seen = new Set<string>()
  const result: string[] = []

  for (const line of lines) {
    const key = ignoreCase ? line.toLowerCase() : line
    if (!seen.has(key)) {
      seen.add(key)
      result.push(line)
    }
  }

  return result.join('\n')
}

export function searchAndHighlight(
  text: string,
  searchTerm: string,
  ignoreCase: boolean = false,
  mode: SearchMode = 'standard',
): string {
  if (!searchTerm.trim()) return escapeHtml(text)

  const regex = createSearchRegex(searchTerm, mode, ignoreCase, true)
  if (!regex) return escapeHtml(text)

  let result = ''
  let lastIndex = 0

  // Ensure we start from the beginning when using global regex
  regex.lastIndex = 0

  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    const fullMatch = match[0] ?? ''
    const matchIndex = match.index ?? 0
    const matchEnd = matchIndex + fullMatch.length

    // Avoid infinite loop for zero-length matches
    if (matchIndex === regex.lastIndex && fullMatch.length === 0) {
      regex.lastIndex += 1
    }

    if (matchIndex < lastIndex) {
      continue
    }

    result += escapeHtml(text.slice(lastIndex, matchIndex))

    if (mode === 'like' && match[1] !== undefined) {
      const capture = match[1]
      const captureStart = capture
        ? text.indexOf(capture, matchIndex)
        : -1

      if (capture && captureStart >= matchIndex) {
        const captureEnd = captureStart + capture.length
        result += escapeHtml(text.slice(matchIndex, captureStart))
        result += `<mark>${escapeHtml(capture)}</mark>`
        result += escapeHtml(text.slice(captureEnd, matchEnd))
      } else {
        result += `<mark>${escapeHtml(fullMatch)}</mark>`
      }
    } else if (fullMatch.length > 0) {
      result += `<mark>${escapeHtml(fullMatch)}</mark>`
    } else {
      result += '<mark></mark>'
    }

    lastIndex = matchEnd

    if (fullMatch.length === 0) {
      lastIndex = matchIndex
    }
  }

  result += escapeHtml(text.slice(lastIndex))

  return result
}

type Highlight = { start: number; end: number }

// Helper: Find highlights when only end delimiter is provided
function findHighlightsEndOnly(
  line: string,
  endDelimiter: string,
  stripDelimiters: boolean,
): Highlight[] {
  const highlights: Highlight[] = []
  let searchPos = 0

  while (searchPos < line.length) {
    const endIndex = line.indexOf(endDelimiter, searchPos)
    if (endIndex === -1) break

    if (stripDelimiters) {
      highlights.push({ start: searchPos, end: endIndex })
    } else {
      highlights.push({ start: searchPos, end: endIndex + endDelimiter.length })
    }
    searchPos = endIndex + endDelimiter.length
  }

  return highlights
}

// Helper: Find highlights when only start delimiter is provided
function findHighlightsStartOnly(
  line: string,
  startDelimiter: string,
  stripDelimiters: boolean,
): Highlight[] {
  const highlights: Highlight[] = []
  const startIndex = line.indexOf(startDelimiter, 0)

  if (startIndex !== -1) {
    if (stripDelimiters) {
      highlights.push({ start: startIndex + startDelimiter.length, end: line.length })
    } else {
      highlights.push({ start: startIndex, end: line.length })
    }
  }

  return highlights
}

// Helper: Find highlights when both delimiters are provided
function findHighlightsBothDelimiters(
  line: string,
  startDelimiter: string,
  endDelimiter: string,
  stripDelimiters: boolean,
): Highlight[] {
  const highlights: Highlight[] = []
  let searchStart = 0

  while (searchStart < line.length) {
    const startIndex = line.indexOf(startDelimiter, searchStart)
    if (startIndex === -1) break

    const endSearchStart = startIndex + startDelimiter.length
    const firstEndIndex = line.indexOf(endDelimiter, endSearchStart)

    if (firstEndIndex === -1) break

    // Check if there's a second end delimiter right after the first
    const secondEndIndex = line.indexOf(endDelimiter, firstEndIndex + endDelimiter.length)

    const endIndex = secondEndIndex !== -1 && secondEndIndex === firstEndIndex + endDelimiter.length
      ? secondEndIndex
      : firstEndIndex

    if (stripDelimiters) {
      highlights.push({ start: startIndex + startDelimiter.length, end: endIndex })
    } else {
      highlights.push({ start: startIndex, end: endIndex + endDelimiter.length })
    }

    searchStart = endIndex + endDelimiter.length
  }

  return highlights
}

// Helper: Apply highlights to a line
function applyHighlightsToLine(line: string, highlights: Highlight[]): string {
  if (highlights.length === 0) return escapeHtml(line)

  const sorted = [...highlights].sort((a, b) => a.start - b.start)
  let cursor = 0
  let result = ''

  for (const highlight of sorted) {
    if (highlight.start > cursor) {
      result += escapeHtml(line.slice(cursor, highlight.start))
    }

    const highlightText = line.slice(highlight.start, highlight.end)
    result += `<span class="highlight-extract">${escapeHtml(highlightText)}</span>`
    cursor = highlight.end
  }

  if (cursor < line.length) {
    result += escapeHtml(line.slice(cursor))
  }

  return result
}

export function highlightDelimiters(
  text: string,
  startDelimiter: string,
  endDelimiter: string,
  stripDelimiters: boolean = true,
): string {
  if (!startDelimiter && !endDelimiter) return text

  return text
    .split('\n')
    .map((line) => {
      if (line === '') return line

      let highlights: Highlight[]

      if (!startDelimiter && endDelimiter) {
        // Case 1: Only end delimiter
        highlights = findHighlightsEndOnly(line, endDelimiter, stripDelimiters)
      } else if (startDelimiter && !endDelimiter) {
        // Case 2: Only start delimiter
        highlights = findHighlightsStartOnly(line, startDelimiter, stripDelimiters)
      } else {
        // Case 3: Both delimiters
        highlights = findHighlightsBothDelimiters(
          line,
          startDelimiter,
          endDelimiter,
          stripDelimiters,
        )
      }

      return applyHighlightsToLine(line, highlights)
    })
    .join('\n')
}

export function filterLines(
  text: string,
  searchTerm: string,
  keep: boolean = true,
  ignoreCase: boolean = false,
  mode: SearchMode = 'standard',
): string {
  if (!searchTerm.trim()) return text

  const lines = text.split('\n')

  if (mode === 'like') {
    // For LIKE mode with line filtering, match full line
    const regex = likePatternToRegex(searchTerm, ignoreCase)
    const filtered = lines.filter((line) => {
      const matches = regex.test(line)
      return keep ? matches : !matches
    })
    return filtered.join('\n')
  }

  // For standard and regex modes, search within line
  const regex = createSearchRegex(searchTerm, mode, ignoreCase, false)
  if (!regex) return text

  const filtered = lines.filter((line) => {
    const matches = regex.test(line)
    return keep ? matches : !matches
  })
  return filtered.join('\n')
}

export function getCommonLines(
  leftText: string,
  rightText: string,
  ignoreCase: boolean = false,
): string {
  const leftLines = new Set(
    leftText.split('\n').map((line) => (ignoreCase ? line.toLowerCase() : line)),
  )
  const rightLines = rightText.split('\n')

  const common = rightLines.filter((line) => {
    const compareLine = ignoreCase ? line.toLowerCase() : line
    return leftLines.has(compareLine)
  })

  return [...new Set(common)].join('\n')
}

export function getLeftOnlyLines(
  leftText: string,
  rightText: string,
  ignoreCase: boolean = false,
): string {
  const rightLines = new Set(
    rightText.split('\n').map((line) => (ignoreCase ? line.toLowerCase() : line)),
  )
  const leftLines = leftText.split('\n')

  const leftOnly = leftLines.filter((line) => {
    const compareLine = ignoreCase ? line.toLowerCase() : line
    return !rightLines.has(compareLine)
  })

  return [...new Set(leftOnly)].join('\n')
}

export function getRightOnlyLines(
  leftText: string,
  rightText: string,
  ignoreCase: boolean = false,
): string {
  const leftLines = new Set(
    leftText.split('\n').map((line) => (ignoreCase ? line.toLowerCase() : line)),
  )
  const rightLines = rightText.split('\n')

  const rightOnly = rightLines.filter((line) => {
    const compareLine = ignoreCase ? line.toLowerCase() : line
    return !leftLines.has(compareLine)
  })

  return [...new Set(rightOnly)].join('\n')
}

export function getUniqueLines(
  leftText: string,
  rightText: string,
  ignoreCase: boolean = false,
): string {
  const leftOnly = getLeftOnlyLines(leftText, rightText, ignoreCase)
  const rightOnly = getRightOnlyLines(leftText, rightText, ignoreCase)

  return [leftOnly, rightOnly].filter((text) => text.trim()).join('\n')
}

export function trimLines(text: string): string {
  return text
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
}

export function trimStartLines(text: string): string {
  return text
    .split('\n')
    .map((line) => line.trimStart())
    .join('\n')
}

export function trimEndLines(text: string): string {
  return text
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
}

export function removeEmptyLines(text: string, ignoreBlanks: boolean = false): string {
  return text
    .split('\n')
    .filter((line) => {
      if (ignoreBlanks) {
        return line.trim() !== ''
      }
      return line !== ''
    })
    .join('\n')
}

export function highlightCommonLines(
  text: string,
  compareText: string,
  highlight: boolean,
  ignoreCase: boolean = false,
): string {
  const compareLines = new Set(
    compareText.split('\n').map((line) => (ignoreCase ? line.toLowerCase() : line)),
  )
  const lines = text.split('\n')

  return lines
    .map((line) => {
      const compareLine = ignoreCase ? line.toLowerCase() : line
      const isCommon = compareLines.has(compareLine)

      if (highlight && isCommon) {
        return `<span class="highlight-common">${escapeHtml(line)}</span>`
      } else if (!highlight && !isCommon) {
        return `<span class="highlight-different">${escapeHtml(line)}</span>`
      }
      return escapeHtml(line)
    })
    .join('\n')
}

export function joinLines(text: string, separator: string = ''): string {
  const lines = text.split('\n')
  return lines.join(separator)
}

export function splitText(text: string, separator: string): string {
  if (!separator) return text
  return text.split(separator).join('\n')
}

export function topLines(text: string, count: number): string {
  if (count <= 0) return ''
  const lines = text.split('\n')
  return lines.slice(0, count).join('\n')
}

export function bottomLines(text: string, count: number): string {
  if (count <= 0) return ''
  const lines = text.split('\n')
  return lines.slice(-count).join('\n')
}

export function addPrefix(text: string, prefix: string): string {
  if (!prefix) return text
  return text
    .split('\n')
    .map((line) => prefix + line)
    .join('\n')
}

export function addSuffix(text: string, suffix: string): string {
  if (!suffix) return text
  return text
    .split('\n')
    .map((line) => line + suffix)
    .join('\n')
}

export function replaceText(
  text: string,
  searchTerm: string,
  replacement: string,
  ignoreCase: boolean = false,
  mode: SearchMode = 'standard',
): string {
  if (!searchTerm) return text

  const regex = createSearchRegex(searchTerm, mode, ignoreCase, true)
  if (!regex) return text // Invalid regex or empty pattern

  // For LIKE mode, we have a capture group and boundaries, so replace the captured group
  if (mode === 'like') {
    return text.replace(regex, (match, capture1) => {
      // Replace the captured part (group 1) with the replacement text
      // Keep any surrounding whitespace/boundaries
      return match.replace(capture1, replacement)
    })
  }

  return text.replace(regex, replacement)
}

export function substringLines(text: string, startIndex: number, length?: number): string {
  return text
    .split('\n')
    .map((line) => {
      if (line === '') return line

      // Handle negative indices (count from end)
      let actualStart: number
      if (startIndex < 0) {
        // Negative index: start from the end
        // -1 means the last character (index: line.length - 1)
        actualStart = line.length + startIndex
        // If still negative, start from beginning
        if (actualStart < 0) actualStart = 0
      } else {
        // Positive index: convert from 1-based to 0-based
        actualStart = startIndex - 1
      }

      // If start index is beyond the line length, return empty string
      if (actualStart >= line.length) return ''

      // If length is provided, handle it
      if (length !== undefined) {
        if (length === 0) {
          // Special case: length 0 means extract from beginning to start index (exclusive)
          return line.substring(0, actualStart)
        } else if (length > 0) {
          // Positive length: extract forward from start
          return line.substring(actualStart, actualStart + length)
        } else {
          // Negative length: extract backward from BEFORE the start index
          // length of -2 means extract 2 characters before the start index (not including it)
          const absLength = Math.abs(length)
          const extractStart = Math.max(0, actualStart - absLength)
          return line.substring(extractStart, actualStart)
        }
      }

      // Otherwise, return substring from start to end
      return line.substring(actualStart)
    })
    .join('\n')
}

export function insertText(text: string, insertionText: string, position: number): string {
  return text
    .split('\n')
    .map((line) => {
      if (line === '') return line

      // Handle negative positions (count from end)
      let actualPosition: number
      if (position < 0) {
        // Negative position: insert from the end
        // -1 means before the last character (line.length - 1)
        // -2 means before the 2nd-to-last character, etc.
        // To insert after the last character, use position beyond line length
        actualPosition = line.length + position
        // If negative, insert at beginning
        if (actualPosition < 0) actualPosition = 0
      } else if (position === 0) {
        // Position 0 is invalid, but treat it as beginning
        actualPosition = 0
      } else {
        // Positive position: convert from 1-based to 0-based
        // Position 1 means insert before first character (index 0)
        actualPosition = position - 1
      }

      // If position is beyond the line length, insert at the end
      if (actualPosition >= line.length) {
        return line + insertionText
      }

      // Insert text at the specified position
      return line.substring(0, actualPosition) + insertionText + line.substring(actualPosition)
    })
    .join('\n')
}

// Helper: Extract text when only end delimiter is provided
function extractEndOnly(line: string, endDelimiter: string, stripDelimiters: boolean): string {
  const results: string[] = []
  let searchPos = 0

  while (searchPos < line.length) {
    const endIndex = line.indexOf(endDelimiter, searchPos)
    if (endIndex === -1) break

    if (stripDelimiters) {
      results.push(line.substring(searchPos, endIndex))
    } else {
      results.push(line.substring(searchPos, endIndex + endDelimiter.length))
    }
    searchPos = endIndex + endDelimiter.length
  }

  return results.length > 0 ? results.join('') : ''
}

// Helper: Extract text when only start delimiter is provided
function extractStartOnly(line: string, startDelimiter: string, stripDelimiters: boolean): string {
  const startIndex = line.indexOf(startDelimiter, 0)
  if (startIndex === -1) return ''

  if (stripDelimiters) {
    return line.substring(startIndex + startDelimiter.length)
  }
  return line.substring(startIndex)
}

// Helper: Extract text when both delimiters are provided
function extractBothDelimiters(
  line: string,
  startDelimiter: string,
  endDelimiter: string,
  stripDelimiters: boolean,
): string {
  const results: string[] = []
  let searchStart = 0

  while (searchStart < line.length) {
    const startIndex = line.indexOf(startDelimiter, searchStart)
    if (startIndex === -1) break

    const endSearchStart = startIndex + startDelimiter.length
    const firstEndIndex = line.indexOf(endDelimiter, endSearchStart)

    if (firstEndIndex === -1) break

    // Check if there's a second end delimiter right after the first
    const secondEndIndex = line.indexOf(endDelimiter, firstEndIndex + endDelimiter.length)

    const endIndex = secondEndIndex !== -1 && secondEndIndex === firstEndIndex + endDelimiter.length
      ? secondEndIndex
      : firstEndIndex

    if (stripDelimiters) {
      results.push(line.substring(endSearchStart, endIndex))
    } else {
      results.push(line.substring(startIndex, endIndex + endDelimiter.length))
    }

    searchStart = endIndex + endDelimiter.length
  }

  return results.length > 0 ? results.join('') : ''
}

export function extractBetween(
  text: string,
  startDelimiter: string,
  endDelimiter: string,
  stripDelimiters: boolean = true,
): string {
  if (!startDelimiter && !endDelimiter) return ''

  return text
    .split('\n')
    .map((line) => {
      if (line === '') return line

      if (!startDelimiter && endDelimiter) {
        // Case 1: Only end delimiter
        return extractEndOnly(line, endDelimiter, stripDelimiters)
      } else if (startDelimiter && !endDelimiter) {
        // Case 2: Only start delimiter
        return extractStartOnly(line, startDelimiter, stripDelimiters)
      } else {
        // Case 3: Both delimiters
        return extractBothDelimiters(line, startDelimiter, endDelimiter, stripDelimiters)
      }
    })
    .join('\n')
}
