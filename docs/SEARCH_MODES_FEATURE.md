# Search Modes Feature

## Overview

Added three search mode options to the Text Processing Studio application, providing users with flexible ways to search, filter, and replace text.

📖 **[View detailed examples and usage patterns →](SEARCH_MODES_EXAMPLES.md)**

## Search Modes

### 1. Standard (Default)

- **Description**: Exact text matching with literal string search
- **Use Case**: Simple, straightforward text searches
- **Example**: Searching for "hello" finds exact matches of "hello"
- **Special Characters**: All special characters are treated literally (no escaping needed)

### 2. LIKE Pattern

- **Description**: SQL-style pattern matching with wildcards
- **Use Case**: Flexible pattern matching without regex complexity
- **Wildcards**:
  - `%` - Matches any sequence of non-whitespace characters (zero or more)
  - `_` - Matches exactly one character
- **Examples**:
  - `hello%` matches "hello", "hello123", "helloworld"
  - `%world` matches "world", "myworld", "123world"
  - `h_llo` matches "hello", "hallo", "hillo"
  - `test%file` matches "test-my-file", "test_config_file"

### 3. Regex

- **Description**: Full JavaScript regular expression support with **multiline mode enabled**
- **Use Case**: Advanced pattern matching with complex requirements
- **Multiline Mode**: The `^` and `$` anchors match at line boundaries, not just the start/end of the entire text
- **Testing Tool**: [Regex101](https://regex101.com/) - Test and debug your regex patterns (select "JavaScript" flavor)
- **Examples**:
  - `llo$` matches "hello", "bello" (lines ending with "llo")
  - `^hello` matches "hello world", "hello there" (lines starting with "hello")
  - `h.llo` matches "hello", "hallo"
  - `[0-9]+` matches sequences of digits
  - `world$` matches "world" at the end of any line
  - `(\\w+) (\\w+)` with replacement `$2 $1` swaps two words

## User Interface

### Location

The search mode selector is located in the "Search & Filter" section of the Command Panel.

### Components

1. **Radio Button Group**: Three options (Standard, LIKE Pattern, Regex)
2. **Tooltips**: Each option has a tooltip explaining its usage
3. **Dynamic Hints**: Contextual hint text updates based on selected mode
4. **Dynamic Placeholder**: Search input placeholder adapts to show example patterns

### Visual Feedback

- Selected mode is highlighted
- Hint text shows icon (💡) with mode-specific guidance
- Real-time highlighting updates across all panels

## Features Affected

All search-related operations now support the three modes:

1. **Search & Highlight**: Real-time highlighting across all text panels
2. **Keep Lines**: Filter to keep only matching lines
3. **Remove Lines**: Filter to remove matching lines
4. **Replace Text**: Replace matches with specified text (supports regex capture groups)

## Technical Implementation

### Files Modified

1. **src/lib/stores.ts**
   - Added `SearchMode` type: `'standard' | 'like' | 'regex'`
   - Added `searchMode` writable store with default value `'standard'`

2. **src/lib/textProcessing.ts**
   - Added `SearchMode` type export
   - Created helper functions:
     - `likePatternToRegex()`: Converts LIKE patterns to regex for line filtering
     - `createSearchRegex()`: Creates appropriate regex based on mode
   - Updated functions to accept `mode` parameter:
     - `searchAndHighlight()`
     - `filterLines()`
     - `replaceText()`

3. **src/lib/components/CommandPanel.svelte**
   - Imported `SearchMode` type and `searchMode` store
   - Added reactive state `currentSearchMode`
   - Added search mode selector UI with radio buttons
   - Updated all search-related function calls to pass current mode
   - Added dynamic placeholder and hint text

4. **src/lib/textProcessing.test.ts**
   - Added comprehensive test suites for LIKE and Regex modes
   - Tests cover:
     - `searchAndHighlight()` with all three modes
     - `filterLines()` with all three modes
     - `replaceText()` with all three modes
   - All 158 tests pass

### Key Implementation Details

#### LIKE Pattern Matching

- For line filtering: Full-line match with anchors (^...$)
- For highlighting/replacement: Within-line matching
- Uses `\\S*` for `%` to match non-whitespace sequences
- Preserves word boundaries while matching patterns

#### Error Handling

- Invalid regex patterns return original text unchanged
- Empty search terms are handled gracefully
- Case sensitivity is preserved across all modes

## User Guidance

### In-App Hints

Each mode displays a contextual hint:

- **Standard**: "💡 Searches for exact text matches"
- **LIKE Pattern**: "💡 Use % for any text, _ for single character"
- **Regex**: "💡 Enter a JavaScript regular expression pattern"

### Tooltips

Detailed tooltips on radio buttons explain:

- What each mode does
- Syntax/wildcards available
- Example patterns and matches

## Testing

All functionality has been thoroughly tested:

- ✅ 158 unit tests passing
- ✅ Standard mode maintains backward compatibility
- ✅ LIKE patterns work with both wildcards (% and _)
- ✅ Regex mode supports capture groups and replacements
- ✅ Case sensitivity toggle works with all modes
- ✅ Real-time highlighting updates correctly
- ✅ Invalid regex patterns handled gracefully

## Backward Compatibility

The feature maintains 100% backward compatibility:

- Default mode is "Standard" (exact text matching)
- Existing functionality unchanged when using Standard mode
- No breaking changes to existing code or user workflows

## Performance Considerations

- Regex compilation is efficient and cached per operation
- LIKE pattern conversion to regex is lightweight
- Real-time highlighting uses debouncing via Svelte's reactive system
- No performance impact on non-search operations

## Future Enhancements

Potential future improvements:

1. Save user's preferred search mode in localStorage
2. Add keyboard shortcuts to switch between modes
3. Add syntax highlighting for regex patterns
4. Add regex pattern builder/tester UI
5. Support named capture groups in replacements
