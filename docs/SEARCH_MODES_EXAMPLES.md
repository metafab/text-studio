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

**Use case**: Flexible pattern matching with wildcards

### Wildcards

- `%` = matches any sequence of non-whitespace characters
- `_` = matches exactly one character

### Line Filtering Behavior (Keep/Remove Lines)

When filtering lines, LIKE patterns work with **line boundaries**:

- Pattern without `%` at the start (e.g., `hel%`) matches lines that **START** with the literal part
- Pattern without `%` at the end (e.g., `%lo`) matches lines that **END** with the literal part

**Example:**

```
Lines: "hello", "hello 2", "3 hello"
Pattern "hel%": Matches "hello" and "hello 2" (start with "hel")
Pattern "%lo": Matches "hello" and "3 hello" (end with "lo")
Pattern "%ello%": Matches all three lines (contains "ello")
```

### Highlighting and Replacement Behavior

When highlighting or replacing within text, LIKE patterns work with **word boundaries**:

- Patterns match words at the start of text or after whitespace
- Pattern matches until the end of the word (non-whitespace sequence)

### Example 1: Prefix Match

```
Text: "hello, hello123, helloworld, hi there"
Pattern: "hello%"
Matches: "hello", "hello123", "helloworld" (but not "hi")
```

### Example 2: Suffix Match

```
Text: "myfile.txt, yourfile.txt, readme.md"
Pattern: "%.txt"
Matches: "myfile.txt", "yourfile.txt" (but not "readme.md")
```

### Example 3: Middle Wildcard

```
Text: "test-file-name, test_var_name, testfunction, my-test-value"
Pattern: "test%name"
Matches: "test-file-name", "test_var_name" (but not "testfunction" or "my-test-value")
```

### Example 4: Single Character Wildcard

```
Text: "cat, cot, cut, cart"
Pattern: "c_t"
Matches: "cat", "cot", "cut" (but not "cart" - it has 4 letters)
```

### Example 5: Combined Wildcards

```
Text: "hello, hallo, hillo, hollo"
Pattern: "h_llo"
Matches: "hello", "hallo", "hillo", "hollo"

Text: "test1, test12, test123"
Pattern: "test%"
Matches: "test1", "test12", "test123"
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
| Wildcard patterns     | ❌              | ✅               | ✅                |
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
- Matching filenames or identifiers
- Prefix/suffix matching

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
Keep Lines: "test-file-name.txt", "mytest-value.txt"
Remove Lines: "test-config.xml", "production-file.txt"
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
Text: "test123 and test456"
Pattern: "test%"
Replace: "item"
Result: "item and item"
```

### Regex Mode - Replace with Capture Groups

```
Text: "Price: $100, Discount: $20"
Pattern: "\\$(\\d+)"
Replace: "USD $1.00"
Result: "Price: USD 100.00, Discount: USD 20.00"
```
