# Search Modes Examples

## Standard Mode (Default)

**Use case**: Simple exact text matching

### Example 1: Basic Search

```
Text: "hello world, hello universe"
Search: "hello"
Result: Matches "hello" exactly (2 matches)
```

### Example 2: Special Characters

```
Text: "price: $10.00, discount: $5.00"
Search: "$10"
Result: Matches "$10" literally (parentheses, dots, etc. are treated as literal characters)
```

## LIKE Pattern Mode

**Use case**: Flexible pattern matching with SQL-style wildcards

### Wildcards

- `%` = matches any sequence of characters (including spaces)
- `_` = matches exactly one character

### How LIKE Patterns Work

LIKE patterns use **line boundaries** for matching. The position of `%` wildcards determines the anchoring:

- **`pattern%`** (ends with %): Matches lines **starting with** the pattern (anchored at line start)
- **`%pattern`** (starts with %): Matches lines **ending with** the pattern (anchored at line end)
- **`%pattern%`** (both sides): Matches the pattern **anywhere** in the line (no anchoring, finds multiple occurrences)
- **`pattern`** (no %): Matches the pattern **anywhere** in the line (no anchoring)

**Example:**

```
Lines: "hello", "hello 2", "3 hello"
Pattern "hel%": Matches entire lines starting with "hel"
  - "hello" ✓ (entire line)
  - "hello 2" ✓ (entire line)
  - "3 hello" ✗

Pattern "%lo": Matches entire lines ending with "lo"
  - "hello" ✓ (entire line)
  - "3 hello" ✓ (entire line)
  - "hello 2" ✗

Pattern "%ello%": Matches "ello" anywhere (multiple occurrences)
  - In "hello world hello": matches "hello" (twice)
```

### Example 1: Line Start Match (pattern%)

```
Text: "Apple pie
Banana split
Apple juice"

Pattern: "Apple%"
Result: Matches entire lines starting with "Apple":
  - "Apple pie" ✓
  - "Apple juice" ✓
  - "Banana split" ✗
```

### Example 2: Line End Match (%pattern)

```
Text: "hello world say hello
test data
goodbye hello"

Pattern: "%hello"
Result: Matches entire lines ending with "hello":
  - "hello world say hello" ✓
  - "goodbye hello" ✓
  - "test data" ✗
```

### Example 3: Match Anywhere (%pattern%)

```
Text: "hello hallo hillo"
Pattern: "%h_llo%"
Result: Matches each occurrence:
  - "hello" ✓
  - "hallo" ✓
  - "hillo" ✓
```

### Example 4: Match Anywhere (no %)

```
Text: "cat cot cut cart"
Pattern: "c_t"
Result: Matches "cat", "cot", "cut" (but not "cart" - it has 4 letters)
```

### Example 5: File Extensions

```
Text: "myfile.txt
yourfile.txt
readme.md"

Pattern: "%.txt"
Result: Matches lines ending with ".txt":
  - "myfile.txt" ✓
  - "yourfile.txt" ✓
  - "readme.md" ✗
```

### Example 6: Combined Wildcards

```
Text: "test-file-name.txt
test-config.xml
production-file.txt"

Pattern: "test%txt"
Result: Matches lines starting with "test" and ending with "txt":
  - "test-file-name.txt" ✓
  - "test-config.xml" ✗
  - "production-file.txt" ✗
```

## Regex Mode

**Use case**: Advanced pattern matching with full regex power

**Important**: Regex mode operates in **multiline mode**, meaning `^` and `$` match at line boundaries, not just the start/end of the entire text.

### Example 1: Line-End Anchor ($)

```
Text: "hello\nworld\nbello"
Pattern: "llo$"
Matches: Lines ending with "llo": "hello", "bello" (but not "world")

For highlighting: "he[llo]\nworld\nbe[llo]"
For filtering (Keep Lines): "hello\nbello"
```

### Example 2: Line-Start Anchor (^)

```
Text: "hello world\nworld peace\nhello there"
Pattern: "^hello"
Matches: Lines starting with "hello": "hello world", "hello there"

For highlighting: "[hello] world\nworld peace\n[hello] there"
For filtering (Keep Lines): "hello world\nhello there"
```

### Example 3: Character Classes

```
Text: "test123, hello456, world"
Pattern: "[0-9]+"
Matches: "123", "456" (sequences of digits)
```

### Example 2: Anchors

```
Text: "hello world\nworld peace\nhello there"
Pattern: "^hello"
Matches: Lines starting with "hello": "hello world", "hello there"
```

### Example 3: Alternation

```
Text: "I like apples, oranges, and bananas"
Pattern: "apples|oranges"
Matches: "apples", "oranges"
```

### Example 4: Quantifiers

```
Text: "a, aa, aaa, aaaa"
Pattern: "a{2,3}"
Matches: "aa", "aaa"
```

### Example 5: Word Boundaries

```
Text: "hello, helloworld, say hello"
Pattern: "\\bhello\\b"
Matches: "hello" (standalone word only, not "helloworld")
```

### Example 6: Capture Groups for Replacement

```
Text: "John Smith, Jane Doe"
Pattern: "(\\w+) (\\w+)"
Replacement: "$2, $1"
Result: "Smith, John, Doe, Jane"
```

### Example 7: Email Validation

```
Text: "Contact: user@example.com or admin@site.org"
Pattern: "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b"
Matches: "user@example.com", "admin@site.org"
```

### Example 8: Lookahead/Lookbehind

```
Text: "price: $100, discount: $20"
Pattern: "(?<=\\$)\\d+"
Matches: "100", "20" (numbers after $ sign)
```

## Comparison Table

| Feature               | Standard        | LIKE             | Regex             |
| --------------------- | --------------- | ---------------- | ----------------- |
| Exact text matching   | ✅              | ❌               | ✅                |
| Wildcard patterns     | ❌              | ✅ (% and _)     | ✅                |
| Line boundary control | ❌              | ✅ (via %)       | ✅ (^ and $)      |
| Special char escaping | Auto            | % and _ only     | Manual            |
| Capture groups        | ❌              | ❌               | ✅                |
| Learning curve        | Easy            | Medium           | Hard              |
| Performance           | Fast            | Fast             | Fast              |
| Use case              | Simple searches | Pattern matching | Advanced patterns |

## Tips & Best Practices

### When to Use Standard Mode

- Looking for exact text
- Searching for text with special characters (no escaping needed)
- Simple, straightforward searches

### When to Use LIKE Mode

- Need wildcards but not full regex
- SQL-style patterns are familiar
- Matching lines with specific prefixes or suffixes
- Finding patterns that start or end lines

### When to Use Regex Mode

- Complex pattern requirements
- Need capture groups for replacements
- Advanced text manipulation
- Validating formats (emails, URLs, etc.)

## Filter Lines Examples

### Standard Mode - Filter

```
Input Lines:
apple pie
banana split
apple juice
cherry tart

Search: "apple"
Keep Lines: "apple pie", "apple juice"
Remove Lines: "banana split", "cherry tart"
```

### LIKE Mode - Filter

```
Input Lines:
test-file-name.txt
test-config.xml
mytest-value.txt
production-file.txt

Pattern: "test%txt"
Keep Lines: "test-file-name.txt"
Remove Lines: "test-config.xml", "mytest-value.txt", "production-file.txt"

Note: Pattern matches lines starting with "test" AND ending with "txt"
```

### Regex Mode - Filter

```
Input Lines:
user123
admin456
guest
moderator789

Pattern: "\\d+$"
Keep Lines: "user123", "admin456", "moderator789"
Remove Lines: "guest"
```

## Replace Examples

### Standard Mode - Replace

```
Text: "hello world, hello universe"
Search: "hello"
Replace: "hi"
Result: "hi world, hi universe"
```

### LIKE Mode - Replace

```
Text: "Apple pie
Banana split
Apple juice"

Pattern: "Apple%"
Replace: "Orange"
Result: "Orange
Banana split
Orange"

Note: Replaces entire lines starting with "Apple"
```

### Regex Mode - Replace with Capture Groups

```
Text: "Price: $100, Discount: $20"
Pattern: "\\$(\\d+)"
Replace: "USD $1.00"
Result: "Price: USD 100.00, Discount: USD 20.00"
```
