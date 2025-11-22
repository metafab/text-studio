# Testing

This project uses [Vitest](https://vitest.dev/) for unit testing.

## Running Tests

```bash
# Run tests once
pnpm test:run

# Run tests in watch mode (automatically re-runs when files change)
pnpm test

# Run tests with UI interface
pnpm test:ui
```

## Test Coverage

The test suite includes comprehensive unit tests for:

### Text Processing Functions (`src/lib/textProcessing.test.ts`)

- **getTextStats** - Text statistics calculation (lines, characters, unique lines)
- **sortLines** - Line sorting (ascending, descending, random, case-sensitive/insensitive)
- **reverseLines** - Reverse line order
- **removeDuplicates** - Remove duplicate lines with case sensitivity options
- **searchAndHighlight** - Search and highlight text with regex escaping
- **filterLines** - Filter lines by search term (keep/remove)
- **getCommonLines** - Find lines common between two texts
- **getLeftOnlyLines** - Find lines unique to left text
- **getRightOnlyLines** - Find lines unique to right text
- **getUniqueLines** - Combine unique lines from both texts
- **trimLines** - Trim whitespace from lines (all, start, end)
- **removeEmptyLines** - Remove empty/blank lines
- **highlightCommonLines** - Highlight common/different lines with HTML
- **joinLines** - Join lines with custom separator
- **splitText** - Split text by separator into lines

### Undo/Redo Functionality (`src/lib/undoRedo.test.ts`)

- **createInitialHistory** - Initial history state creation
- **canUndo/canRedo** - History state validation
- **addToHistory** - Adding new states to history
- **undo/redo** - Undo/redo operations
- **Integration tests** - Complete undo/redo workflows

## Test Structure

Tests are organized by functionality and include:

- **Edge cases** - Empty strings, single lines, special characters
- **Options testing** - Case sensitivity, different modes
- **Error handling** - Invalid inputs, boundary conditions
- **Integration scenarios** - Complex workflows

All tests use descriptive names and test both the happy path and edge cases to ensure robust functionality.

## Test Files Location

- `src/lib/textProcessing.test.ts` - Text processing function tests
- `src/lib/undoRedo.test.ts` - Undo/redo functionality tests
- `src/test/setup.ts` - Test environment setup
- `vitest.config.ts` - Vitest configuration
