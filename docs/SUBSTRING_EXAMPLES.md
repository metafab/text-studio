# Substring Command Examples

The Substring command replaces each line with a substring of it based on:

- **Start index**: 1-based position (1 = first character)
- **Length**: Optional number of characters to keep
  - If not provided: keeps all remaining characters from start position
  - If positive: extracts characters forward from start position
  - If negative: extracts characters backward (before start position)
  - If zero (0): extracts everything from beginning up to (but not including) start position

## Positive Start Index Examples

### Example 1: Extract from position 3 (no length)

**Input:**

```
hello world
apple banana
test string
```

**Command:** Start=3, Length=(empty)

**Output:**

```
llo world
ple banana
st string
```

### Example 2: Extract from position 1 with length 5

**Input:**

```
hello world
apple banana
test string
```

**Command:** Start=1, Length=5

**Output:**

```
hello
apple
test
```

### Example 3: Extract from position 7 with length 5

**Input:**

```
hello world
apple banana
test string
```

**Command:** Start=7, Length=5

**Output:**

```
world
banan
tring
```

## Negative Start Index Examples

Negative indices count from the end of each line:

- `-1` = last character
- `-2` = second-to-last character
- etc.

### Example 4: Extract last 5 characters

**Input:**

```
hello world
apple banana
test string
```

**Command:** Start=-5, Length=(empty)

**Output:**

```
world
anana
tring
```

### Example 5: Extract 3 characters starting from 5th from end

**Input:**

```
hello world
apple banana
test string
```

**Command:** Start=-5, Length=3

**Output:**

```
wor
ana
tri
```

## Negative Length Examples

Negative length extracts characters **before** the start position:

### Example 6: Extract 2 characters before position 7

**Input:**

```
hello world
apple banana
test string
```

**Command:** Start=7, Length=-2

**Output:**

```
o 
e 
 s
```

_Explanation: Position 7 is 'w'/'b'/'s'. Two characters before that position are extracted._

### Example 7: Extract 3 characters before position -5 (from end)

**Input:**

```
hello world
apple banana
test string
```

**Command:** Start=-5, Length=-3

**Output:**

```
lo 
e b
t s
```

_Explanation: Position -5 from end is 'w'/'a'/'r'. Three characters before that are extracted._

### Example 8: Extract 1 character before position 5

**Input:**

```
hello
apple
test
```

**Command:** Start=5, Length=-1

**Output:**

```
l
l
```

_Explanation: Position 5 is 'o'/'e'/'t'. One character before is extracted (or empty if line is too short)._

## Edge Cases

### Empty lines are preserved

**Input:**

```
hello

apple
```

**Command:** Start=2, Length=3

**Output:**

```
ell

ppl
```

### Lines shorter than start index return empty

**Input:**

```
hi
hello
test
```

**Command:** Start=20, Length=5

**Output:**

```
```

### Different line lengths

**Input:**

```
short
this is a longer line
med
```

**Command:** Start=5, Length=3

**Output:**

```
t
 is
```

### Negative length from start position

**Input:**

```
hello world
apple banana
```

**Command:** Start=1, Length=-1

**Output:**

```
```

_Explanation: Position 1 is the first character, so there's nothing before it._

## Length = 0 Examples

Length of 0 extracts everything **before** the start position (from beginning to start, exclusive):

### Example 9: Extract everything before position 7

**Input:**

```
hello world
apple banana
test string
```

**Command:** Start=7, Length=0

**Output:**

```
hello 
apple 
test s
```

_Explanation: Position 7 is 'w'/'b'/'s'. Length 0 extracts everything before that position._

### Example 10: Extract everything before position -5 (from end)

**Input:**

```
hello world
apple banana
test string
```

**Command:** Start=-5, Length=0

**Output:**

```
hello 
apple b
test s
```

_Explanation: Position -5 from end is 'w'/'a'/'s'. Length 0 extracts everything before that._

### Example 11: Length 0 from position 1 (returns empty)

**Input:**

```
hello
apple
test
```

**Command:** Start=1, Length=0

**Output:**

```
```

_Explanation: Position 1 is the first character, so there's nothing before it._

## Use Cases

1. **Extract file extensions**: Start from last dot position
2. **Remove prefixes**: Start=N where N is after the prefix
3. **Get first N characters**: Start=1, Length=N
4. **Get last N characters**: Start=-N
5. **Extract middle portion**: Start=N, Length=M
6. **Remove first N characters**: Start=N+1
7. **Extract characters before a position**: Use negative length
8. **Get context around a position**: Combine with multiple commands
9. **Extract everything before a marker**: Use Length=0 with position of marker
10. **Split at position**: Use Length=0 to get before, no length to get after
