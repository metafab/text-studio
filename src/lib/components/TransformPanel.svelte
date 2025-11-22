<script lang="ts">
  import {
    addPrefix,
    addSuffix,
    bottomLines,
    extractBetween,
    highlightDelimiters,
    insertText,
    joinLines,
    removeDuplicates,
    removeEmptyLines,
    reverseLines,
    sortLines,
    splitText,
    substringLines,
    topLines,
    trimEndLines,
    trimLines,
    trimStartLines,
  } from '../textProcessing'
  import CommandButton from './CommandButton.svelte'
  import SplitButton from './SplitButton.svelte'
  import { type HistoryUpdateOptions } from '../undoRedo'

  interface Props {
    leftText: string
    rightText: string
    resultText: string
    leftExtractHighlight?: string
    rightExtractHighlight?: string
    resultExtractHighlight?: string
    activePaneId: string
    currentIgnoreCase: boolean
    modifierHint: string
    getOutputSetter: (event?: MouseEvent) => (text: string, options?: HistoryUpdateOptions) => void
    getSourceText: () => string
  }

  let {
    leftText,
    rightText,
    resultText,
    leftExtractHighlight = $bindable(''),
    rightExtractHighlight = $bindable(''),
    resultExtractHighlight = $bindable(''),
    activePaneId,
    currentIgnoreCase,
    modifierHint,
    getOutputSetter,
    getSourceText,
  }: Props = $props()

  let joinSeparator = $state('')
  let splitSeparator = $state('')
  let topLinesCount = $state('10')
  let prefixSuffixText = $state('')
  let substringStart = $state('1')
  let substringLength = $state('')
  let insertPosition = $state('1')
  let insertTextValue = $state('')
  let extractStartDelimiter = $state('')
  let extractEndDelimiter = $state('')
  let extractStripDelimiters = $state(true)

  let joinSeparatorInput = $state<HTMLInputElement>()
  let splitSeparatorInput = $state<HTMLInputElement>()
  let topLinesInput = $state<HTMLInputElement>()
  let prefixSuffixInput = $state<HTMLInputElement>()
  let insertPositionInput = $state<HTMLInputElement>()
  let substringStartInput = $state<HTMLInputElement>()
  let extractStartInput = $state<HTMLInputElement>()

  function focusElement(element?: HTMLElement | null) {
    if (!element) {
      return
    }
    element.scrollIntoView({ block: 'center', behavior: 'smooth' })
    element.focus()
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      element.select()
    }
  }

  export type TransformPanelFocusTarget =
    | 'transform-join-lines'
    | 'transform-split-text'
    | 'transform-keep-lines'
    | 'transform-prefix-suffix'
    | 'transform-insert-text'
    | 'transform-substring'
    | 'transform-extract-between'

  export function focusInput(target: TransformPanelFocusTarget) {
    requestAnimationFrame(() => {
      switch (target) {
        case 'transform-join-lines': {
          focusElement(joinSeparatorInput)
          break
        }
        case 'transform-split-text': {
          focusElement(splitSeparatorInput)
          break
        }
        case 'transform-keep-lines': {
          focusElement(topLinesInput)
          break
        }
        case 'transform-prefix-suffix': {
          focusElement(prefixSuffixInput)
          break
        }
        case 'transform-insert-text': {
          focusElement(insertPositionInput)
          break
        }
        case 'transform-substring': {
          focusElement(substringStartInput)
          break
        }
        case 'transform-extract-between': {
          focusElement(extractStartInput)
          break
        }
        default:
          break
      }
    })
  }

  let activeText = $derived(
    activePaneId === 'a' ? leftText : activePaneId === 'b' ? rightText : resultText
  )

  // Real-time delimiter highlighting
  $effect(() => {
    if (extractStartDelimiter || extractEndDelimiter) {
      leftExtractHighlight = highlightDelimiters(
        leftText,
        extractStartDelimiter,
        extractEndDelimiter,
        extractStripDelimiters
      )
      rightExtractHighlight = highlightDelimiters(
        rightText,
        extractStartDelimiter,
        extractEndDelimiter,
        extractStripDelimiters
      )
      resultExtractHighlight = highlightDelimiters(
        resultText,
        extractStartDelimiter,
        extractEndDelimiter,
        extractStripDelimiters
      )
    } else {
      leftExtractHighlight = ''
      rightExtractHighlight = ''
      resultExtractHighlight = ''
    }
  })

  function sortActiveAsc(event?: MouseEvent) {
    const outputSetter = getOutputSetter(event)
    outputSetter(sortLines(getSourceText(), 'asc', currentIgnoreCase), {
      label: 'Sort lines A → Z',
    })
  }

  function sortActiveDesc(event?: MouseEvent) {
    const outputSetter = getOutputSetter(event)
    outputSetter(sortLines(getSourceText(), 'desc', currentIgnoreCase), {
      label: 'Sort lines Z → A',
    })
  }

  function sortActiveRandom(event?: MouseEvent) {
    const outputSetter = getOutputSetter(event)
    outputSetter(sortLines(getSourceText(), 'random', currentIgnoreCase), {
      label: 'Shuffle lines',
    })
  }

  function reverseActiveLines(event?: MouseEvent) {
    const outputSetter = getOutputSetter(event)
    outputSetter(reverseLines(getSourceText()), { label: 'Reverse lines' })
  }

  function removeActiveDuplicates(event?: MouseEvent) {
    const outputSetter = getOutputSetter(event)
    outputSetter(removeDuplicates(getSourceText(), currentIgnoreCase), {
      label: 'Remove duplicate lines',
    })
  }

  function activeToUppercase(event?: MouseEvent) {
    const outputSetter = getOutputSetter(event)
    outputSetter(getSourceText().toUpperCase(), { label: 'Convert to uppercase' })
  }

  function activeToLowercase(event?: MouseEvent) {
    const outputSetter = getOutputSetter(event)
    outputSetter(getSourceText().toLowerCase(), { label: 'Convert to lowercase' })
  }

  function trimActiveLines(event?: MouseEvent) {
    const outputSetter = getOutputSetter(event)
    outputSetter(trimLines(getSourceText()), { label: 'Trim lines' })
  }

  function trimStartActiveLines(event?: MouseEvent) {
    const outputSetter = getOutputSetter(event)
    outputSetter(trimStartLines(getSourceText()), { label: 'Trim line start' })
  }

  function trimEndActiveLines(event?: MouseEvent) {
    const outputSetter = getOutputSetter(event)
    outputSetter(trimEndLines(getSourceText()), { label: 'Trim line end' })
  }

  function removeActiveEmptyLines(event?: MouseEvent) {
    const outputSetter = getOutputSetter(event)
    outputSetter(removeEmptyLines(getSourceText(), false), {
      label: 'Remove empty lines',
    })
  }

  function removeActiveEmptyLinesIgnoreBlanks(event?: MouseEvent) {
    const outputSetter = getOutputSetter(event)
    outputSetter(removeEmptyLines(getSourceText(), true), {
      label: 'Remove empty & blank lines',
    })
  }

  function joinActiveLines(event?: MouseEvent) {
    const outputSetter = getOutputSetter(event)
    const label = joinSeparator ? `Join lines (sep: "${joinSeparator}")` : 'Join lines'
    outputSetter(joinLines(getSourceText(), joinSeparator), { label })
  }

  function splitActiveText(event?: MouseEvent) {
    if (splitSeparator !== '') {
      const outputSetter = getOutputSetter(event)
      outputSetter(splitText(getSourceText(), splitSeparator), {
        label: `Split text (sep: "${splitSeparator}")`,
      })
    }
  }

  function keepTopLines(event?: MouseEvent) {
    const count = parseInt(topLinesCount, 10)
    if (!isNaN(count) && count > 0) {
      const outputSetter = getOutputSetter(event)
      outputSetter(topLines(getSourceText(), count), {
        label: `Keep top ${count} lines`,
      })
    }
  }

  function keepBottomLines(event?: MouseEvent) {
    const count = parseInt(topLinesCount, 10)
    if (!isNaN(count) && count > 0) {
      const outputSetter = getOutputSetter(event)
      outputSetter(bottomLines(getSourceText(), count), {
        label: `Keep bottom ${count} lines`,
      })
    }
  }

  function addPrefixToLines(event?: MouseEvent) {
    if (prefixSuffixText !== '') {
      const outputSetter = getOutputSetter(event)
      outputSetter(addPrefix(getSourceText(), prefixSuffixText), {
        label: `Add prefix "${prefixSuffixText}"`,
      })
    }
  }

  function addSuffixToLines(event?: MouseEvent) {
    if (prefixSuffixText !== '') {
      const outputSetter = getOutputSetter(event)
      outputSetter(addSuffix(getSourceText(), prefixSuffixText), {
        label: `Add suffix "${prefixSuffixText}"`,
      })
    }
  }

  function applySubstring(event?: MouseEvent) {
    const startIndex = parseInt(substringStart, 10)
    if (!isNaN(startIndex) && startIndex !== 0) {
      const outputSetter = getOutputSetter(event)

      const lengthStr = String(substringLength ?? '').trim()
      if (lengthStr === '') {
        outputSetter(substringLines(getSourceText(), startIndex), {
          label: `Substring start ${startIndex}`,
        })
      } else {
        const length = parseInt(lengthStr, 10)
        if (!isNaN(length)) {
          outputSetter(substringLines(getSourceText(), startIndex, length), {
            label: `Substring ${startIndex}, len ${length}`,
          })
        }
      }
    }
  }

  function applyInsert(event?: MouseEvent) {
    const position = parseInt(insertPosition, 10)
    if (!isNaN(position) && position !== 0 && insertTextValue !== '') {
      const outputSetter = getOutputSetter(event)
      outputSetter(insertText(getSourceText(), insertTextValue, position), {
        label: `Insert "${insertTextValue}" @ ${position}`,
      })
    }
  }

  function applyExtractBetween(event?: MouseEvent) {
    if (extractStartDelimiter !== '' || extractEndDelimiter !== '') {
      const outputSetter = getOutputSetter(event)
      const labelParts = []
      if (extractStartDelimiter) {
        labelParts.push(`start "${extractStartDelimiter}"`)
      }
      if (extractEndDelimiter) {
        labelParts.push(`end "${extractEndDelimiter}"`)
      }
      if (extractStripDelimiters) {
        labelParts.push('strip')
      }
      const label =
        labelParts.length > 0 ? `Extract between (${labelParts.join(', ')})` : 'Extract between'
      outputSetter(
        extractBetween(
          getSourceText(),
          extractStartDelimiter,
          extractEndDelimiter,
          extractStripDelimiters
        ),
        { label }
      )
    }
  }

  let extractBetweenIcon = $derived(
    extractStartDelimiter && extractEndDelimiter
      ? '↹'
      : extractStartDelimiter && !extractEndDelimiter
        ? '⇤'
        : !extractStartDelimiter && extractEndDelimiter
          ? '⇥'
          : '↹'
  )

  let extractBetweenTooltip = $derived(
    extractStartDelimiter && extractEndDelimiter
      ? `Extract text between two delimiters from each line.\nExample: 'ab<cd>ef' with '<' and '>' extracts 'cd'\nStrip option removes the delimiters from the result${modifierHint}`
      : extractStartDelimiter && !extractEndDelimiter
        ? `Extract text from start delimiter to end of line.\nExample: 'ab<cdef' with '<' extracts 'cdef'\nStrip option removes the delimiter from the result${modifierHint}`
        : !extractStartDelimiter && extractEndDelimiter
          ? `Extract text from start of line to end delimiter.\nExample: 'abcd>ef' with '>' extracts 'abcd'\nStrip option removes the delimiter from the result${modifierHint}`
          : `Extract text between delimiters, or from/to delimiter.\nProvide at least one delimiter${modifierHint}`
  )
</script>

<div class="command-section">
  <h4 class="section-title">
    Text Transformation
    <span class="active-pane-indicator">({activePaneId})</span>
  </h4>
  <div class="command-grid">
    <CommandButton
      icon="🔤"
      label="Sort A-Z"
      tooltip="Sort lines in ascending alphabetical order (A to Z){modifierHint}"
      action={sortActiveAsc}
      disabled={!activeText.trim()}
    />
    <CommandButton
      icon="🔡"
      label="Sort Z-A"
      tooltip="Sort lines in descending alphabetical order (Z to A){modifierHint}"
      action={sortActiveDesc}
      disabled={!activeText.trim()}
    />
    <CommandButton
      icon="🎲"
      label="Random"
      tooltip="Shuffle lines into random order{modifierHint}"
      action={sortActiveRandom}
      disabled={!activeText.trim()}
    />
    <CommandButton
      icon="🔄"
      label="Reverse"
      tooltip="Reverse the order of all lines{modifierHint}"
      action={reverseActiveLines}
      disabled={!activeText.trim()}
    />
    <CommandButton
      icon="🗑️"
      label="Remove Dupes"
      tooltip="Remove duplicate lines, keeping only unique lines{modifierHint}"
      action={removeActiveDuplicates}
      disabled={!activeText.trim()}
    />
    <CommandButton
      icon="a→A"
      label="Uppercase"
      tooltip="Convert all text to UPPERCASE{modifierHint}"
      action={activeToUppercase}
      disabled={!activeText.trim()}
    />
    <CommandButton
      icon="A→a"
      label="Lowercase"
      tooltip="Convert all text to lowercase{modifierHint}"
      action={activeToLowercase}
      disabled={!activeText.trim()}
    />
    <SplitButton
      icon="✂️"
      label="Trim"
      mainAction={trimActiveLines}
      tooltip={`Remove whitespace from the start and end of each line${modifierHint}`}
      altActions={[
        {
          label: 'Trim Start',
          action: trimStartActiveLines,
          tooltip: `Remove whitespace from the start of each line${modifierHint}`,
        },
        {
          label: 'Trim End',
          action: trimEndActiveLines,
          tooltip: `Remove whitespace from the end of each line${modifierHint}`,
        },
      ]}
      disabled={!activeText.trim()}
    />
    <SplitButton
      icon="📄"
      label="Remove Empty"
      mainAction={removeActiveEmptyLines}
      tooltip={`Remove empty lines${modifierHint}`}
      altActions={[
        {
          label: 'Remove Empty & Blank',
          action: removeActiveEmptyLinesIgnoreBlanks,
          tooltip: `Remove empty and blank lines (lines with only whitespace)${modifierHint}`,
        },
      ]}
      disabled={!activeText.trim()}
    />
  </div>

  <div class="command-input-group">
    <div class="input-label">Join Lines</div>
    <div class="input-with-button">
      <input
        type="text"
        placeholder="Separator (optional)"
        bind:value={joinSeparator}
        class="command-input"
        bind:this={joinSeparatorInput}
      />
      <CommandButton
        icon="🔗"
        label="Join"
        tooltip="Join all lines into a single line with optional separator{modifierHint}"
        action={joinActiveLines}
        disabled={!activeText.trim()}
      />
    </div>
  </div>

  <div class="command-input-group">
    <div class="input-label">Split Text</div>
    <div class="input-with-button">
      <input
        type="text"
        placeholder="Separator (required)"
        bind:value={splitSeparator}
        class="command-input"
        bind:this={splitSeparatorInput}
      />
      <CommandButton
        icon="✂️"
        label="Split"
        tooltip="Split text into multiple lines using the specified separator{modifierHint}"
        action={splitActiveText}
        disabled={!activeText.trim() || splitSeparator === ''}
      />
    </div>
  </div>

  <div class="command-input-group">
    <div class="input-label">Keep Top or Bottom N Lines</div>
    <div class="input-with-button">
      <input
        type="number"
        placeholder="Number of lines"
        bind:value={topLinesCount}
        min="1"
        class="command-input"
        bind:this={topLinesInput}
      />
      <SplitButton
        icon="🔝"
        label="Top"
        mainAction={keepTopLines}
        tooltip="Keep only the first N lines{modifierHint}"
        altActions={[
          {
            label: 'Bottom',
            action: keepBottomLines,
            tooltip: `Keep only the last N lines${modifierHint}`,
          },
        ]}
        disabled={!activeText.trim() ||
          topLinesCount === '' ||
          isNaN(parseInt(topLinesCount, 10)) ||
          parseInt(topLinesCount, 10) <= 0}
      />
    </div>
  </div>

  <div class="command-input-group">
    <div class="input-label">Add Prefix or Suffix to Each Line</div>
    <div class="input-with-button">
      <input
        type="text"
        placeholder="Prefix or suffix text"
        bind:value={prefixSuffixText}
        class="command-input"
        bind:this={prefixSuffixInput}
      />
      <SplitButton
        icon="⬅️"
        label="Prefix"
        mainAction={addPrefixToLines}
        tooltip="Add text to the beginning of each line{modifierHint}"
        altActions={[
          {
            label: 'Suffix',
            action: addSuffixToLines,
            tooltip: `Add text to the end of each line${modifierHint}`,
          },
        ]}
        disabled={!activeText.trim() || prefixSuffixText === ''}
      />
    </div>
  </div>

  <div class="command-input-group">
    <div class="input-label">Insert Text at Position in Each Line</div>
    <div class="input-with-button">
      <input
        type="number"
        placeholder="Position"
        title="Position (1-based, negative from end)"
        bind:value={insertPosition}
        class="command-input"
        style="flex: 0 0 50px; max-width: 60px"
        bind:this={insertPositionInput}
      />
      <input
        type="text"
        placeholder="Text to insert"
        title="Text to insert at the specified position"
        bind:value={insertTextValue}
        class="command-input"
        style="flex: 1 1 auto; min-width: 80px"
      />
      <CommandButton
        icon="📍"
        label="Insert"
        tooltip="Insert text at a specific position in each line.
Position: 1-based (1 = before first char), negative = from end (-1 = before last char){modifierHint}"
        action={applyInsert}
        disabled={!activeText.trim() ||
          insertPosition === '' ||
          isNaN(parseInt(insertPosition, 10)) ||
          parseInt(insertPosition, 10) === 0 ||
          insertTextValue === ''}
      />
    </div>
  </div>

  <div class="command-input-group">
    <div class="input-label">Extract Substring from Each Line</div>
    <div class="input-with-button">
      <input
        type="number"
        placeholder="Start index"
        title="Start index (1-based, negative from end)"
        bind:value={substringStart}
        class="command-input"
        style="flex: 0 0 50px; max-width: 60px"
        bind:this={substringStartInput}
      />
      <input
        type="number"
        placeholder="Length"
        title="Length (optional, negative = before)"
        bind:value={substringLength}
        class="command-input"
        style="flex: 1 1 auto; min-width: 80px"
      />
      <CommandButton
        icon="✂️"
        label="Substring"
        tooltip="Extract a substring from each line.
Start index: 1-based (1 = first char), negative = from end (-1 = last char)
Length: positive = forward, negative = backward, 0 = everything before, blank = all remaining{modifierHint}"
        action={applySubstring}
        disabled={!activeText.trim() ||
          substringStart === '' ||
          isNaN(parseInt(substringStart, 10)) ||
          parseInt(substringStart, 10) === 0}
      />
    </div>
  </div>

  <div class="command-input-group">
    <div class="input-label">Extract Text Between Delimiters</div>
    <div class="input-with-button">
      <input
        type="text"
        placeholder="Start delimiter"
        title="Starting delimiter. e.g. <  [ ( &quot;
Leave empty to extract from beginning of line"
        bind:value={extractStartDelimiter}
        class="command-input"
        style="width: 80px"
        bind:this={extractStartInput}
      />
      <input
        type="text"
        placeholder="End delimiter"
        title="Ending delimiter. e.g. > ] ) &quot;
Leave empty to extract to end of line"
        bind:value={extractEndDelimiter}
        class="command-input"
        style="width: 80px"
      />
      <label
        class="checkbox-label"
        style="margin: 0; padding: 0 8px"
        title="When checked, removes delimiters from the extracted text. When unchecked, includes delimiters in the result.
Example with '<' and '>': 
  Stripped: 'ab<cd>ef' → 'cd'
  Not stripped: 'ab<cd>ef' → '<cd>'"
      >
        <input
          type="checkbox"
          checked={extractStripDelimiters}
          onchange={(e) => (extractStripDelimiters = (e.target as HTMLInputElement).checked)}
        />
        <span style="font-size: 12px; white-space: nowrap">Strip</span>
      </label>
      <CommandButton
        icon={extractBetweenIcon}
        label="Extract"
        tooltip={extractBetweenTooltip}
        action={applyExtractBetween}
        disabled={!activeText.trim() ||
          (extractStartDelimiter === '' && extractEndDelimiter === '')}
      />
    </div>
  </div>
</div>

<style>
  .command-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .section-title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .active-pane-indicator {
    font-size: 12px;
    color: var(--primary-color);
    font-weight: 500;
    text-transform: capitalize;
  }

  .command-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .command-input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .input-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    margin: 0;
  }

  .input-with-button {
    display: flex;
    gap: 8px;
    align-items: stretch;
  }

  .command-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--input-bg);
    color: var(--text-primary);
    font-size: 14px;
  }

  .command-input:focus {
    outline: none;
    border-color: var(--primary-color);
  }

  .checkbox-label {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
    color: var(--text-primary);
  }

  input[type='checkbox'] {
    margin: 0;
  }
</style>
