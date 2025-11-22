# Command Ideas

Brainstormed concepts for expanding Text Processing Studio's command catalog. Each idea includes a quick summary, potential options, and open questions to investigate before implementation.

## Pattern & Matching Enhancements

### 1. Fuzzy Match Filter

- **Goal**: Retain/remove lines based on similarity threshold rather than exact matches.
- **Options**: Adjustable Levenshtein distance, normalize accents, choose scoring algorithm.
- **Questions**: How to communicate similarity score and performance impact in the UI?

### 2. Multi-Pattern Search Profiles

- **Goal**: Save reusable groups of search patterns and reuse them across commands.
- **Options**: Import/export profiles, tag patterns, bulk enable/disable.
- **Questions**: Where should profiles live (local storage vs. file import)?

### 3. Cross-Panel Pattern Sync

- **Goal**: Apply the same search or replace pattern across Left, Right, and Result panels in a single action.
- **Options**: Toggle panels, per-panel overrides, dry-run preview.
- **Questions**: How to surface conflicts when panels have different command histories?

## Text Transformation Ideas

### 4. Template-Based Replace

- **Goal**: Substitute each line into a template string (e.g., `Hello, {{line}}!`).
- **Options**: Support for numbered placeholders, escape sequences, preview of first N lines.
- **Questions**: Should templates support expressions (e.g., simple math, conditionals)?

### 5. Smart Case Conversion

- **Goal**: Convert text to title case, sentence case, or PascalCase with language-aware rules / Capitalize words.
- **Options**: Locale selection, ignore specific words, handle acronyms.
- **Questions**: Can we reuse existing libraries without bloating the bundle?
- **See**: https://titlecaseconverter.com/

### 6. Column Extractor

- **Goal**: Select columns by index or header from delimited text.
- **Options**: Auto-detect delimiter, header row toggle, keep delimiter in output.
- **Questions**: How to handle quoted delimiters and inconsistent row lengths?

## Structural Commands

### 7. Group By / Aggregation

- **Goal**: Group lines by key and output counts or concatenated values.
- **Options**: Pick delimiter, choose aggregate (count, sum, min/max for numeric segments).
- **Questions**: How to present results—per group blocks vs. tabular rows?

### 8. Chunk Split & Merge

- **Goal**: Split text into fixed-size chunks or merge lines into a specific batch size.
- **Options**: Size by characters vs. lines, overlap window, fill strategy for remainders.
- **Questions**: Should chunks be labeled or separated with custom markers?

### 9. Diff Summary Command

- **Goal**: Produce a condensed diff between any two panels with counts of additions/removals.
- **Options**: Unified vs. side-by-side summary, ignore whitespace toggle, export as Markdown.
- **Questions**: Can we leverage existing diff libraries without heavy dependencies?

## Workflow & Automation

### 10. Command Macros

- **Goal**: Record a sequence of commands and replay them on demand.
- **Options**: Step-by-step playback, edit macro sequence, share macros.
- **Questions**: How to version macros and ensure compatibility when commands evolve?

### 11. Scheduled Reapply

- **Goal**: Re-run the last command automatically when panel content changes (live mode).
- **Options**: Polling vs. event-driven, throttle interval, visual indicators.
- **Questions**: How to avoid accidental loops when combined with macros?

### 12. External API Hook

- **Goal**: Send panel content to an external endpoint, receive processed result back.
- **Options**: Configurable endpoints, request templates, simple authentication.
- **Questions**: What safeguards are needed to keep the privacy-first promise?

## Additional ideas:

- Pad Start and Pad End.
- Remove letter accents (diacritics, diacritical marks/points/signs) from Latin alphabets.
- Sort lines by their length, ascending or descending.
- Convert to camelCase, PascalCase, snake_case, kebab-case.
- Base64 encode/decode.
- URL encode/decode.
- Numeric sorting.
- Repeat text (with times to repeat and separator).

---

_Use this document as a living backlog. Add feasibility notes, prototype links, and user feedback as ideas evolve._
