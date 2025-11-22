<script lang="ts">
  import { onMount, tick } from 'svelte'
  import TextAreaPanel from './lib/components/TextAreaPanel.svelte'
  import CommandPanel, { type CommandPanelFocusTarget } from './lib/components/CommandPanel.svelte'
  import CommandPalette from './lib/components/CommandPalette.svelte'
  import type { CommandPaletteCommand } from './lib/components/CommandPalette.svelte'
  import FontSettings from './lib/components/FontSettings.svelte'
  import ThemeToggle from './lib/components/ThemeToggle.svelte'
  import HelpButton from './lib/components/HelpButton.svelte'
  import {
    theme,
    ignoreCase,
    outputDestination,
    showLineNumbers,
    showWordWrap,
    searchMode,
    type SearchMode,
  } from './lib/stores'
  import {
    sortLines,
    reverseLines,
    removeDuplicates,
    trimLines,
    trimStartLines,
    trimEndLines,
    removeEmptyLines,
    getCommonLines,
    getLeftOnlyLines,
    getRightOnlyLines,
    getUniqueLines,
    highlightCommonLines,
  } from './lib/textProcessing'
  import {
    createInitialHistory,
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    jumpToHistory,
    type HistoryState,
    type HistoryUpdateOptions,
  } from './lib/undoRedo'
  import { isMacPlatform as detectMacPlatform } from './lib/platform'

  // UI Constants
  const MIN_PANEL_SIZE_PERCENT = 20
  const MAX_PANEL_SIZE_PERCENT = 80
  const MIN_COMMAND_PANEL_WIDTH = 250
  const MAX_COMMAND_PANEL_WIDTH = 600
  const DEFAULT_COMMAND_PANEL_WIDTH = 400
  const DEFAULT_TOP_PANEL_HEIGHT = 85

  let leftText = $state('')
  let rightText = $state('')
  let resultText = $state('')
  let leftSearchHighlight = $state('')
  let leftExtractHighlight = $state('')
  let rightSearchHighlight = $state('')
  let rightExtractHighlight = $state('')
  let resultSearchHighlight = $state('')
  let resultExtractHighlight = $state('')
  let activePaneId = $state('a')

  // History state for undo/redo
  let leftHistory = $state<HistoryState>(createInitialHistory())
  let rightHistory = $state<HistoryState>(createInitialHistory())
  let resultHistory = $state<HistoryState>(createInitialHistory())
  let isUpdatingFromHistory = $state(false)

  // Panel sizing state
  let leftPanelWidth = $state(50) // percentage
  let topPanelHeight = $state(DEFAULT_TOP_PANEL_HEIGHT) // percentage - start with Result panel minimized
  let commandPanelWidth = $state(DEFAULT_COMMAND_PANEL_WIDTH) // pixels
  let commandPanelVisible = $state(true)
  type CommandPanelHandle = {
    focusInput: (target: CommandPanelFocusTarget) => void
  }
  let commandPanelRef = $state<CommandPanelHandle>()
  let maximizedPanel = $state<string | null>(null)
  let hasResultBeenPopulated = $state(false) // Track if Result panel has ever had content
  let commandPaletteOpen = $state(false)

  // Dragging state
  let isDraggingVertical = $state(false)
  let isDraggingHorizontal = $state(false)
  let isDraggingCommand = $state(false)

  // Theme state
  let currentTheme = $derived($theme)
  let currentIgnoreCase = $derived($ignoreCase)
  let currentOutputDestination = $derived($outputDestination)
  let currentShowLineNumbers = $derived($showLineNumbers)
  let currentShowWordWrap = $derived($showWordWrap)
  let currentSearchMode: SearchMode = $derived($searchMode)
  let isMacPlatform = $derived(detectMacPlatform())
  let commandPaletteShortcut = $derived(isMacPlatform ? 'Cmd+K' : 'Ctrl+K')
  let undoShortcutHint = $derived(isMacPlatform ? 'Cmd+Z' : 'Ctrl+Z')
  let redoShortcutHint = $derived(isMacPlatform ? 'Cmd+Shift+Z' : 'Ctrl+Y')

  let activeTextValue = $derived(
    activePaneId === 'a' ? leftText : activePaneId === 'b' ? rightText : resultText
  )

  function setLeftText(text: string, options: HistoryUpdateOptions = {}) {
    if (!isUpdatingFromHistory && text !== leftText) {
      if (leftHistory.present.value !== leftText) {
        leftHistory = addToHistory(leftHistory, leftText, { label: 'Manual edit' })
      }
      leftHistory = addToHistory(leftHistory, text, options)
    }
    leftText = text
    leftSearchHighlight = ''
    leftExtractHighlight = ''
  }

  function setRightText(text: string, options: HistoryUpdateOptions = {}) {
    if (!isUpdatingFromHistory && text !== rightText) {
      if (rightHistory.present.value !== rightText) {
        rightHistory = addToHistory(rightHistory, rightText, { label: 'Manual edit' })
      }
      rightHistory = addToHistory(rightHistory, text, options)
    }
    rightText = text
    rightSearchHighlight = ''
    rightExtractHighlight = ''
  }

  function setResultText(text: string, options: HistoryUpdateOptions = {}) {
    if (!isUpdatingFromHistory && text !== resultText) {
      if (resultHistory.present.value !== resultText) {
        resultHistory = addToHistory(resultHistory, resultText, { label: 'Manual edit' })
      }
      resultHistory = addToHistory(resultHistory, text, options)
    }
    resultText = text

    // If this is the first time Result panel gets content, expand it to default height
    if (!hasResultBeenPopulated && text.trim() && maximizedPanel === null) {
      topPanelHeight = 50 // Set to default 50/50 split
      hasResultBeenPopulated = true
    }
  }

  function undoActive() {
    isUpdatingFromHistory = true
    if (activePaneId === 'a' && canUndo(leftHistory)) {
      leftHistory = undo(leftHistory)
      leftText = leftHistory.present.value
    } else if (activePaneId === 'b' && canUndo(rightHistory)) {
      rightHistory = undo(rightHistory)
      rightText = rightHistory.present.value
    } else if (activePaneId === 'result' && canUndo(resultHistory)) {
      resultHistory = undo(resultHistory)
      resultText = resultHistory.present.value
    }
    isUpdatingFromHistory = false
  }

  function redoActive() {
    isUpdatingFromHistory = true
    if (activePaneId === 'a' && canRedo(leftHistory)) {
      leftHistory = redo(leftHistory)
      leftText = leftHistory.present.value
    } else if (activePaneId === 'b' && canRedo(rightHistory)) {
      rightHistory = redo(rightHistory)
      rightText = rightHistory.present.value
    } else if (activePaneId === 'result' && canRedo(resultHistory)) {
      resultHistory = redo(resultHistory)
      resultText = resultHistory.present.value
    }
    isUpdatingFromHistory = false
  }

  function getSourceText() {
    return activePaneId === 'a' ? leftText : activePaneId === 'b' ? rightText : resultText
  }

  function getOutputSetter(
    input?: MouseEvent | 'shift' | 'alt'
  ): (text: string, options?: HistoryUpdateOptions) => void {
    let modifier: 'shift' | 'alt' | undefined

    if (typeof input === 'string') {
      modifier = input
    } else if (input) {
      modifier = input.altKey ? 'alt' : input.shiftKey ? 'shift' : undefined
    }

    if (modifier === 'shift') {
      return activePaneId === 'result' ? setLeftText : setResultText
    }

    if (modifier === 'alt') {
      if (activePaneId === 'result') {
        return setRightText
      }
      if (activePaneId === 'a') {
        return setRightText
      }
      return setLeftText
    }

    if (currentOutputDestination === 'result') {
      return setResultText
    }
    return activePaneId === 'a' ? setLeftText : activePaneId === 'b' ? setRightText : setResultText
  }

  function applyTransform(
    transform: (text: string) => string,
    modifier?: 'shift' | 'alt',
    options: HistoryUpdateOptions = {}
  ) {
    const source = getSourceText()
    if (!source.trim()) {
      return
    }
    const setter = getOutputSetter(modifier)
    setter(transform(source), options)
  }

  function clearActivePane() {
    const setter =
      activePaneId === 'a' ? setLeftText : activePaneId === 'b' ? setRightText : setResultText
    setter('', { label: `Clear pane ${activePaneId.toUpperCase()}` })
  }

  function extractCommonLines() {
    if (!leftText.trim() || !rightText.trim()) {
      return
    }
    setResultText(getCommonLines(leftText, rightText, currentIgnoreCase), {
      label: 'Extract common lines',
    })
  }

  function extractLeftOnlyLines() {
    if (!leftText.trim() || !rightText.trim()) {
      return
    }
    setResultText(getLeftOnlyLines(leftText, rightText, currentIgnoreCase), {
      label: 'Extract A-only lines',
    })
  }

  function extractRightOnlyLines() {
    if (!leftText.trim() || !rightText.trim()) {
      return
    }
    setResultText(getRightOnlyLines(leftText, rightText, currentIgnoreCase), {
      label: 'Extract B-only lines',
    })
  }

  function extractUniqueLines() {
    if (!leftText.trim() || !rightText.trim()) {
      return
    }
    setResultText(getUniqueLines(leftText, rightText, currentIgnoreCase), {
      label: 'Extract unique lines',
    })
  }

  function highlightPaneACommon() {
    if (!leftText.trim() || !rightText.trim()) {
      return
    }
    leftSearchHighlight = highlightCommonLines(leftText, rightText, true, currentIgnoreCase)
  }

  function highlightPaneADifferent() {
    if (!leftText.trim() || !rightText.trim()) {
      return
    }
    leftSearchHighlight = highlightCommonLines(leftText, rightText, false, currentIgnoreCase)
  }

  function highlightPaneBCommon() {
    if (!leftText.trim() || !rightText.trim()) {
      return
    }
    rightSearchHighlight = highlightCommonLines(rightText, leftText, true, currentIgnoreCase)
  }

  function highlightPaneBDifferent() {
    if (!leftText.trim() || !rightText.trim()) {
      return
    }
    rightSearchHighlight = highlightCommonLines(rightText, leftText, false, currentIgnoreCase)
  }

  function copyPaneAToB() {
    if (!leftText.trim()) {
      return
    }
    setRightText(leftText, { label: 'Copy A to B' })
  }

  function copyPaneBToA() {
    if (!rightText.trim()) {
      return
    }
    setLeftText(rightText, { label: 'Copy B to A' })
  }

  function swapPaneContents() {
    if (!leftText.trim() && !rightText.trim()) {
      return
    }
    const temp = leftText
    setLeftText(rightText, { label: 'Swap A ↔ B' })
    setRightText(temp, { label: 'Swap A ↔ B' })
  }

  function copyResultToPaneA() {
    if (!resultText.trim()) {
      return
    }
    setLeftText(resultText, { label: 'Copy Result to A' })
  }

  function copyResultToPaneB() {
    if (!resultText.trim()) {
      return
    }
    setRightText(resultText, { label: 'Copy Result to B' })
  }

  function concatenatePaneAThenB() {
    if (!leftText.trim() && !rightText.trim()) {
      return
    }
    setResultText(`${leftText}\n${rightText}`, { label: 'Concatenate A + B' })
  }

  function concatenatePaneBThenA() {
    if (!leftText.trim() && !rightText.trim()) {
      return
    }
    setResultText(`${rightText}\n${leftText}`, { label: 'Concatenate B + A' })
  }

  function handleKeydown(event: KeyboardEvent) {
    const cmdOrCtrl = isMacPlatform ? event.metaKey : event.ctrlKey

    if (cmdOrCtrl && event.key.toLowerCase() === 'k') {
      event.preventDefault()
      commandPaletteOpen = !commandPaletteOpen
      return
    }

    if (commandPaletteOpen) {
      if (event.key === 'Escape') {
        event.preventDefault()
        commandPaletteOpen = false
      }
      return
    }

    // Undo: Cmd+Z (Mac) or Ctrl+Z (Windows/Linux)
    if (cmdOrCtrl && event.key.toLowerCase() === 'z' && !event.shiftKey) {
      event.preventDefault()
      undoActive()
      return
    }

    // Redo: Cmd+Shift+Z (Mac) or Ctrl+Y (Windows/Linux)
    if (
      (isMacPlatform && cmdOrCtrl && event.key.toLowerCase() === 'z' && event.shiftKey) ||
      (!isMacPlatform && cmdOrCtrl && event.key.toLowerCase() === 'y')
    ) {
      event.preventDefault()
      redoActive()
      return
    }
  }

  let activeHistory = $derived(
    activePaneId === 'a' ? leftHistory : activePaneId === 'b' ? rightHistory : resultHistory
  )

  function selectHistoryIndex(index: number) {
    isUpdatingFromHistory = true
    if (activePaneId === 'a') {
      leftHistory = jumpToHistory(leftHistory, index)
      leftText = leftHistory.present.value
    } else if (activePaneId === 'b') {
      rightHistory = jumpToHistory(rightHistory, index)
      rightText = rightHistory.present.value
    } else {
      resultHistory = jumpToHistory(resultHistory, index)
      resultText = resultHistory.present.value
    }
    isUpdatingFromHistory = false
  }

  function toggleMaximize(panelId: string) {
    if (maximizedPanel === panelId) {
      maximizedPanel = null
    } else {
      maximizedPanel = panelId
    }
  }

  function toggleCommandPanel() {
    commandPanelVisible = !commandPanelVisible
  }

  async function focusCommandPanelInput(target: CommandPanelFocusTarget) {
    if (!commandPanelVisible) {
      commandPanelVisible = true
    }
    await tick()
    await tick()
    requestAnimationFrame(() => {
      commandPanelRef?.focusInput(target)
    })
  }

  let commandPaletteCommands = $derived.by(() => {
    const activeLabel = activePaneId.toUpperCase()
    const hasActiveText = activeTextValue.trim().length > 0

    const commonCommands = [
      {
        id: 'toggle-command-panel',
        label: commandPanelVisible ? 'Hide Command Panel' : 'Show Command Panel',
        description: 'Toggle the command sidebar visibility',
        group: 'View',
        run: toggleCommandPanel,
      },
      {
        id: 'toggle-theme',
        label: currentTheme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme',
        description: 'Toggle between light and dark themes',
        group: 'View',
        run: () => theme.set(currentTheme === 'dark' ? 'light' : 'dark'),
      },
      {
        id: 'toggle-line-numbers',
        label: currentShowLineNumbers ? 'Hide Line Numbers' : 'Show Line Numbers',
        description: 'Toggle line numbers in the text panels',
        group: 'View',
        run: () => showLineNumbers.set(!currentShowLineNumbers),
      },
      {
        id: 'toggle-word-wrap',
        label: currentShowWordWrap ? 'Disable Word Wrap' : 'Enable Word Wrap',
        description: 'Toggle soft wrapping in the text panels',
        group: 'View',
        run: () => showWordWrap.set(!currentShowWordWrap),
      },
      {
        id: 'open-help',
        label: 'Open Help',
        description: 'Open the help and documentation in a new tab',
        group: 'Resources',
        run: () => {
          if (typeof window !== 'undefined') {
            window.open('/help.html', '_blank')
          }
        },
      },
      {
        id: 'undo',
        label: `Undo (${activeLabel})`,
        description: `Undo the last change in pane ${activeLabel}`,
        group: 'History',
        shortcut: undoShortcutHint,
        run: undoActive,
        disabled: !canUndo(activeHistory),
      },
      {
        id: 'redo',
        label: `Redo (${activeLabel})`,
        description: `Redo the last undone change in pane ${activeLabel}`,
        group: 'History',
        shortcut: redoShortcutHint,
        run: redoActive,
        disabled: !canRedo(activeHistory),
      },
      {
        id: 'clear-active-pane',
        label: `Clear Pane ${activeLabel}`,
        description: 'Remove all text from the active pane',
        group: 'Editing',
        run: clearActivePane,
        disabled: !hasActiveText,
      },
      {
        id: 'activate-pane-a',
        label: 'Activate Pane A',
        description: 'Set pane A as the active editing target',
        group: 'Navigation',
        run: () => (activePaneId = 'a'),
        disabled: activePaneId === 'a',
      },
      {
        id: 'activate-pane-b',
        label: 'Activate Pane B',
        description: 'Set pane B as the active editing target',
        group: 'Navigation',
        run: () => (activePaneId = 'b'),
        disabled: activePaneId === 'b',
      },
      {
        id: 'activate-pane-result',
        label: 'Activate Result Pane',
        description: 'Set the result pane as the active editing target',
        group: 'Navigation',
        run: () => (activePaneId = 'result'),
        disabled: activePaneId === 'result',
      },
      {
        id: 'toggle-ignore-case',
        label: currentIgnoreCase ? 'Disable Ignore Case' : 'Enable Ignore Case',
        description: 'Toggle case-insensitive comparisons for search and commands',
        group: 'Options',
        run: () => ignoreCase.set(!currentIgnoreCase),
      },
      {
        id: 'destination-active',
        label: 'Send Commands to Active Pane',
        description: 'Apply command output to the active pane',
        group: 'Options',
        run: () => outputDestination.set('active'),
        disabled: currentOutputDestination === 'active',
      },
      {
        id: 'destination-result',
        label: 'Send Commands to Result Pane',
        description: 'Apply command output to the result pane',
        group: 'Options',
        run: () => outputDestination.set('result'),
        disabled: currentOutputDestination === 'result',
      },
    ]

    const transformCommands = [
      {
        id: 'sort-lines-asc',
        label: 'Sort Lines A → Z',
        description: `Sort lines in ascending order (${currentIgnoreCase ? 'ignore case' : 'case-sensitive'})`,
        group: 'Transform',
        run: (modifier?: 'shift' | 'alt') =>
          applyTransform((text) => sortLines(text, 'asc', currentIgnoreCase), modifier, {
            label: 'Sort lines A → Z',
          }),
        disabled: !hasActiveText,
      },
      {
        id: 'sort-lines-desc',
        label: 'Sort Lines Z → A',
        description: `Sort lines in descending order (${currentIgnoreCase ? 'ignore case' : 'case-sensitive'})`,
        group: 'Transform',
        run: (modifier?: 'shift' | 'alt') =>
          applyTransform((text) => sortLines(text, 'desc', currentIgnoreCase), modifier, {
            label: 'Sort lines Z → A',
          }),
        disabled: !hasActiveText,
      },
      {
        id: 'shuffle-lines',
        label: 'Shuffle Lines',
        description: 'Randomly reorder all lines',
        group: 'Transform',
        run: (modifier?: 'shift' | 'alt') =>
          applyTransform((text) => sortLines(text, 'random', currentIgnoreCase), modifier, {
            label: 'Shuffle lines',
          }),
        disabled: !hasActiveText,
      },
      {
        id: 'reverse-lines',
        label: 'Reverse Lines',
        description: 'Reverse the order of lines',
        group: 'Transform',
        run: (modifier?: 'shift' | 'alt') =>
          applyTransform((text) => reverseLines(text), modifier, { label: 'Reverse lines' }),
        disabled: !hasActiveText,
      },
      {
        id: 'remove-duplicates',
        label: 'Remove Duplicate Lines',
        description: `Remove duplicate lines (${currentIgnoreCase ? 'ignore case' : 'case-sensitive'})`,
        group: 'Transform',
        run: (modifier?: 'shift' | 'alt') =>
          applyTransform((text) => removeDuplicates(text, currentIgnoreCase), modifier, {
            label: 'Remove duplicate lines',
          }),
        disabled: !hasActiveText,
      },
      {
        id: 'uppercase',
        label: 'Convert to Uppercase',
        description: 'Convert all text to uppercase',
        group: 'Transform',
        run: (modifier?: 'shift' | 'alt') =>
          applyTransform((text) => text.toUpperCase(), modifier, { label: 'Convert to uppercase' }),
        disabled: !hasActiveText,
      },
      {
        id: 'lowercase',
        label: 'Convert to Lowercase',
        description: 'Convert all text to lowercase',
        group: 'Transform',
        run: (modifier?: 'shift' | 'alt') =>
          applyTransform((text) => text.toLowerCase(), modifier, { label: 'Convert to lowercase' }),
        disabled: !hasActiveText,
      },
      {
        id: 'trim-lines',
        label: 'Trim Lines',
        description: 'Remove whitespace from the start and end of each line',
        group: 'Transform',
        run: (modifier?: 'shift' | 'alt') =>
          applyTransform((text) => trimLines(text), modifier, { label: 'Trim lines' }),
        disabled: !hasActiveText,
      },
      {
        id: 'trim-lines-start',
        label: 'Trim Line Start',
        description: 'Remove leading whitespace from each line',
        group: 'Transform',
        run: (modifier?: 'shift' | 'alt') =>
          applyTransform((text) => trimStartLines(text), modifier, {
            label: 'Trim line start',
          }),
        disabled: !hasActiveText,
      },
      {
        id: 'trim-lines-end',
        label: 'Trim Line End',
        description: 'Remove trailing whitespace from each line',
        group: 'Transform',
        run: (modifier?: 'shift' | 'alt') =>
          applyTransform((text) => trimEndLines(text), modifier, { label: 'Trim line end' }),
        disabled: !hasActiveText,
      },
      {
        id: 'remove-empty-lines',
        label: 'Remove Empty Lines',
        description: 'Remove empty lines from the text',
        group: 'Transform',
        run: (modifier?: 'shift' | 'alt') =>
          applyTransform((text) => removeEmptyLines(text, false), modifier, {
            label: 'Remove empty lines',
          }),
        disabled: !hasActiveText,
      },
      {
        id: 'remove-empty-lines-blank',
        label: 'Remove Empty and Blank Lines',
        description: 'Remove empty lines and lines that only contain whitespace',
        group: 'Transform',
        run: (modifier?: 'shift' | 'alt') =>
          applyTransform((text) => removeEmptyLines(text, true), modifier, {
            label: 'Remove empty & blank lines',
          }),
        disabled: !hasActiveText,
      },
    ]

    const comparisonCommands: CommandPaletteCommand[] = [
      {
        id: 'compare-common-lines',
        label: 'Extract Common Lines',
        description: 'Place lines shared by panes A and B into the result pane',
        group: 'Line Comparison',
        run: extractCommonLines,
        disabled: !leftText.trim() || !rightText.trim(),
      },
      {
        id: 'compare-a-only-lines',
        label: 'Extract A-Only Lines',
        description: 'Place lines that exist only in pane A into the result pane',
        group: 'Line Comparison',
        run: extractLeftOnlyLines,
        disabled: !leftText.trim() || !rightText.trim(),
      },
      {
        id: 'compare-b-only-lines',
        label: 'Extract B-Only Lines',
        description: 'Place lines that exist only in pane B into the result pane',
        group: 'Line Comparison',
        run: extractRightOnlyLines,
        disabled: !leftText.trim() || !rightText.trim(),
      },
      {
        id: 'compare-unique-lines',
        label: 'Extract Unique Lines',
        description: 'Place lines that appear in exactly one pane into the result pane',
        group: 'Line Comparison',
        run: extractUniqueLines,
        disabled: !leftText.trim() || !rightText.trim(),
      },
    ]

    const highlightingCommands: CommandPaletteCommand[] = [
      {
        id: 'highlight-a-common',
        label: 'Highlight A Common Lines',
        description: 'Highlight pane A lines that also exist in pane B',
        group: 'Highlighting',
        run: highlightPaneACommon,
        disabled: !leftText.trim() || !rightText.trim(),
      },
      {
        id: 'highlight-a-different',
        label: 'Highlight A Different Lines',
        description: 'Highlight pane A lines that do not exist in pane B',
        group: 'Highlighting',
        run: highlightPaneADifferent,
        disabled: !leftText.trim() || !rightText.trim(),
      },
      {
        id: 'highlight-b-common',
        label: 'Highlight B Common Lines',
        description: 'Highlight pane B lines that also exist in pane A',
        group: 'Highlighting',
        run: highlightPaneBCommon,
        disabled: !leftText.trim() || !rightText.trim(),
      },
      {
        id: 'highlight-b-different',
        label: 'Highlight B Different Lines',
        description: 'Highlight pane B lines that do not exist in pane A',
        group: 'Highlighting',
        run: highlightPaneBDifferent,
        disabled: !leftText.trim() || !rightText.trim(),
      },
    ]

    const searchCommands: CommandPaletteCommand[] = [
      {
        id: 'search-mode-standard',
        label: 'Search (standard)',
        description: 'Switch to exact text search and focus the search input',
        group: 'Search',
        run: () => {
          searchMode.set('standard')
          focusCommandPanelInput('search-term')
        },
      },
      {
        id: 'search-mode-like',
        label: 'Search (LIKE pattern)',
        description: 'Switch to SQL-style wildcard search and focus the search input',
        group: 'Search',
        run: () => {
          searchMode.set('like')
          focusCommandPanelInput('search-term')
        },
      },
      {
        id: 'search-mode-regex',
        label: 'Search (regex)',
        description: 'Switch to regex search and focus the search input',
        group: 'Search',
        run: () => {
          searchMode.set('regex')
          focusCommandPanelInput('search-term')
        },
      },
      {
        id: 'search-replace-text-input',
        label: 'Search: Replace Text',
        description: 'Focus the replacement text input for the Replace Text command',
        group: 'Search Input',
        run: () => focusCommandPanelInput('search-replacement'),
      },
    ]

    const transferCommands: CommandPaletteCommand[] = [
      {
        id: 'transfer-a-to-b',
        label: 'Copy A → B',
        description: 'Copy pane A content into pane B',
        group: 'Content Transfer',
        run: copyPaneAToB,
        disabled: !leftText.trim(),
      },
      {
        id: 'transfer-b-to-a',
        label: 'Copy B → A',
        description: 'Copy pane B content into pane A',
        group: 'Content Transfer',
        run: copyPaneBToA,
        disabled: !rightText.trim(),
      },
      {
        id: 'transfer-swap-ab',
        label: 'Swap A ↔ B',
        description: 'Swap the contents of panes A and B',
        group: 'Content Transfer',
        run: swapPaneContents,
        disabled: !leftText.trim() && !rightText.trim(),
      },
      {
        id: 'transfer-result-to-a',
        label: 'Copy Result → A',
        description: 'Copy the result pane into pane A',
        group: 'Content Transfer',
        run: copyResultToPaneA,
        disabled: !resultText.trim(),
      },
      {
        id: 'transfer-result-to-b',
        label: 'Copy Result → B',
        description: 'Copy the result pane into pane B',
        group: 'Content Transfer',
        run: copyResultToPaneB,
        disabled: !resultText.trim(),
      },
      {
        id: 'transfer-concat-ab',
        label: 'Concatenate A + B',
        description: 'Append pane B content after pane A and place in result',
        group: 'Content Transfer',
        run: concatenatePaneAThenB,
        disabled: !leftText.trim() && !rightText.trim(),
      },
      {
        id: 'transfer-concat-ba',
        label: 'Concatenate B + A',
        description: 'Append pane A content after pane B and place in result',
        group: 'Content Transfer',
        run: concatenatePaneBThenA,
        disabled: !leftText.trim() && !rightText.trim(),
      },
    ]

    const inputDependentCommands: CommandPaletteCommand[] = [
      {
        id: 'search-keep-lines-input',
        label: 'Search: Keep Matching Lines',
        description: 'Focus the search input to configure the Keep Lines command',
        group: 'Search Input',
        run: () => focusCommandPanelInput('search-term'),
      },
      {
        id: 'search-remove-lines-input',
        label: 'Search: Remove Matching Lines',
        description: 'Focus the search input to configure the Remove Lines command',
        group: 'Search Input',
        run: () => focusCommandPanelInput('search-term'),
      },
      {
        id: 'transform-join-lines-input',
        label: 'Join Lines (set separator)',
        description: 'Focus the separator input before running Join Lines',
        group: 'Transform Input',
        run: () => focusCommandPanelInput('transform-join-lines'),
      },
      {
        id: 'transform-split-text-input',
        label: 'Split Text (set separator)',
        description: 'Focus the separator input before running Split Text',
        group: 'Transform Input',
        run: () => focusCommandPanelInput('transform-split-text'),
      },
      {
        id: 'transform-keep-lines-input',
        label: 'Keep Top/Bottom Lines (set count)',
        description: 'Focus the count input before keeping top or bottom lines',
        group: 'Transform Input',
        run: () => focusCommandPanelInput('transform-keep-lines'),
      },
      {
        id: 'transform-prefix-suffix-input',
        label: 'Add Prefix/Suffix (set text)',
        description: 'Focus the prefix/suffix input before applying it',
        group: 'Transform Input',
        run: () => focusCommandPanelInput('transform-prefix-suffix'),
      },
      {
        id: 'transform-insert-text-input',
        label: 'Insert Text (set position)',
        description: 'Focus the position input before inserting text',
        group: 'Transform Input',
        run: () => focusCommandPanelInput('transform-insert-text'),
      },
      {
        id: 'transform-substring-input',
        label: 'Extract Substring (set start)',
        description: 'Focus the start index input before extracting substrings',
        group: 'Transform Input',
        run: () => focusCommandPanelInput('transform-substring'),
      },
      {
        id: 'transform-extract-between-input',
        label: 'Extract Between Delimiters (set start)',
        description: 'Focus the start delimiter input before extracting between delimiters',
        group: 'Transform Input',
        run: () => focusCommandPanelInput('transform-extract-between'),
      },
    ]

    return [
      ...commonCommands,
      ...transformCommands,
      ...comparisonCommands,
      ...highlightingCommands,
      ...searchCommands,
      ...inputDependentCommands,
      ...transferCommands,
    ] as CommandPaletteCommand[]
  })

  // Vertical splitter (between A/B and Result)
  function handleVerticalMouseDown(event: MouseEvent) {
    event.preventDefault()
    isDraggingVertical = true
  }

  // Horizontal splitter (between A and B)
  function handleHorizontalMouseDown(event: MouseEvent) {
    event.preventDefault()
    isDraggingHorizontal = true
  }

  // Command panel splitter
  function handleCommandMouseDown(event: MouseEvent) {
    event.preventDefault()
    isDraggingCommand = true
  }

  function handleMouseMove(event: MouseEvent) {
    if (isDraggingVertical) {
      const container = document.querySelector('.textarea-grid')
      if (container instanceof HTMLElement) {
        const rect = container.getBoundingClientRect()
        const newHeight = ((event.clientY - rect.top) / rect.height) * 100
        topPanelHeight = Math.max(
          MIN_PANEL_SIZE_PERCENT,
          Math.min(MAX_PANEL_SIZE_PERCENT, newHeight)
        )
      }
    }

    if (isDraggingHorizontal) {
      const container = document.querySelector('.textarea-grid')
      if (container instanceof HTMLElement) {
        const rect = container.getBoundingClientRect()
        const newWidth = ((event.clientX - rect.left) / rect.width) * 100
        leftPanelWidth = Math.max(
          MIN_PANEL_SIZE_PERCENT,
          Math.min(MAX_PANEL_SIZE_PERCENT, newWidth)
        )
      }
    }

    if (isDraggingCommand) {
      const container = document.querySelector('.main-container')
      if (container instanceof HTMLElement) {
        const rect = container.getBoundingClientRect()
        const newWidth = rect.right - event.clientX
        commandPanelWidth = Math.max(
          MIN_COMMAND_PANEL_WIDTH,
          Math.min(MAX_COMMAND_PANEL_WIDTH, newWidth)
        )
      }
    }
  }

  function handleMouseUp() {
    isDraggingVertical = false
    isDraggingHorizontal = false
    isDraggingCommand = false
  }

  // Apply theme to document
  $effect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', currentTheme)
    }
  })

  // Handle system theme changes
  onMount(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme-preference')) {
        theme.set(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)

    // Save theme preference
    const unsubscribe = theme.subscribe((value) => {
      localStorage.setItem('theme-preference', value)
    })

    // Add global mouse event listeners
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    // Add keyboard event listeners for shortcuts
    document.addEventListener('keydown', handleKeydown)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
      unsubscribe()
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('keydown', handleKeydown)
    }
  })
</script>

<svelte:head>
  <title>Text Processing Studio</title>
  <meta
    name="description"
    content="Comprehensive text processing web application with comparison, transformation, and analysis tools"
  />
</svelte:head>

<svelte:window
  onselectstart={(e) =>
    (isDraggingVertical || isDraggingHorizontal || isDraggingCommand) && e.preventDefault()}
/>

<main class="app">
  <header class="app-header">
    <div class="header-content">
      <div class="title-section">
        <h1 class="app-title">Text Processing Studio</h1>
        <p class="app-description">Text comparison, transformation, filtering, sorting, and more</p>
        <p class="privacy-notice">
          🔒 Everything is done in your browser. No content is sent to a server. Open source
          project.
        </p>
        <p class="shortcut-hint">Press {commandPaletteShortcut} to open the command palette.</p>
      </div>
      <div class="header-controls">
        <button
          class="toggle-command-btn"
          onclick={toggleCommandPanel}
          title={commandPanelVisible ? 'Hide command panel' : 'Show command panel'}
        >
          {commandPanelVisible ? '▶' : '◀'}
        </button>
        <HelpButton />
        <a
          class="github-link"
          href="https://github.com/metafab/text-studio"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open GitHub repository"
          title="View GitHub repository"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 .296C5.373.296 0 5.67 0 12.296c0 5.292 3.438 9.787 8.207 11.385.6.111.793-.261.793-.58 0-.287-.011-1.244-.017-2.258-3.338.726-4.042-1.61-4.042-1.61-.546-1.388-1.333-1.758-1.333-1.758-1.089-.745.083-.73.083-.73 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.761-1.605-2.665-.303-5.466-1.333-5.466-5.932 0-1.31.468-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23a11.5 11.5 0 0 1 3.003-.404c1.019.005 2.045.138 3.003.404 2.291-1.552 3.297-1.23 3.297-1.23.655 1.652.243 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.61-2.804 5.625-5.476 5.921.43.371.814 1.102.814 2.222 0 1.604-.015 2.896-.015 3.286 0 .321.19.697.8.578C20.565 22.079 24 17.585 24 12.296 24 5.67 18.627.296 12 .296Z"
            />
          </svg>
        </a>
        <FontSettings />
        <ThemeToggle />
      </div>
    </div>
  </header>

  <div class="main-container">
    <div
      class="content-area"
      style="width: {commandPanelVisible ? `calc(100% - ${commandPanelWidth}px - 4px)` : '100%'};"
    >
      <div
        class="textarea-grid"
        class:maximized-a={maximizedPanel === 'a'}
        class:maximized-b={maximizedPanel === 'b'}
        class:maximized-result={maximizedPanel === 'result'}
      >
        <div
          class="textarea-wrapper panel-a"
          style="width: {leftPanelWidth}%; height: {topPanelHeight}%;"
        >
          <TextAreaPanel
            label="A"
            paneId="a"
            bind:value={leftText}
            placeholder="Enter or paste text here, or drag & drop a file..."
            searchHighlight={leftSearchHighlight}
            extractHighlight={leftExtractHighlight}
            isActive={activePaneId === 'a'}
            onActivate={() => (activePaneId = 'a')}
            onMaximize={() => toggleMaximize('a')}
            isMaximized={maximizedPanel === 'a'}
          />
        </div>

        <div
          class="textarea-wrapper panel-b"
          style="width: {100 -
            leftPanelWidth}%; height: {topPanelHeight}%; left: {leftPanelWidth}%;"
        >
          <TextAreaPanel
            label="B"
            paneId="b"
            bind:value={rightText}
            placeholder="Enter or paste text here, or drag & drop a file..."
            searchHighlight={rightSearchHighlight}
            extractHighlight={rightExtractHighlight}
            isActive={activePaneId === 'b'}
            onActivate={() => (activePaneId = 'b')}
            onMaximize={() => toggleMaximize('b')}
            isMaximized={maximizedPanel === 'b'}
          />
        </div>

        <div
          class="textarea-wrapper panel-result"
          style="width: 100%; height: {100 - topPanelHeight}%; top: {topPanelHeight}%;"
        >
          <TextAreaPanel
            label="Result"
            paneId="result"
            bind:value={resultText}
            placeholder="Results will appear here..."
            searchHighlight={resultSearchHighlight}
            extractHighlight={resultExtractHighlight}
            isActive={activePaneId === 'result'}
            onActivate={() => (activePaneId = 'result')}
            onMaximize={() => toggleMaximize('result')}
            isMaximized={maximizedPanel === 'result'}
          />
        </div>

        <!-- Horizontal splitter (between A and B) -->
        {#if maximizedPanel === null}
          <button
            class="splitter horizontal-splitter"
            style="left: {leftPanelWidth}%; height: {topPanelHeight}%;"
            onmousedown={handleHorizontalMouseDown}
            aria-label="Resize horizontal panels"
          ></button>

          <!-- Vertical splitter (between top panels and result) -->
          <button
            class="splitter vertical-splitter"
            style="top: {topPanelHeight}%; width: 100%;"
            onmousedown={handleVerticalMouseDown}
            aria-label="Resize vertical panels"
          ></button>
        {/if}
      </div>
    </div>

    {#if commandPanelVisible}
      <!-- Command panel splitter -->
      <button
        class="splitter command-splitter"
        style="right: {commandPanelWidth}px;"
        onmousedown={handleCommandMouseDown}
        aria-label="Resize command panel"
      ></button>

      <aside class="command-sidebar" style="width: {commandPanelWidth}px;">
        <CommandPanel
          bind:this={commandPanelRef}
          {leftText}
          {rightText}
          {resultText}
          bind:leftSearchHighlight
          bind:leftExtractHighlight
          bind:rightSearchHighlight
          bind:rightExtractHighlight
          bind:resultSearchHighlight
          bind:resultExtractHighlight
          bind:activePaneId
          {setLeftText}
          {setRightText}
          {setResultText}
          {undoActive}
          {redoActive}
          canUndo={canUndo(activeHistory)}
          canRedo={canRedo(activeHistory)}
          historyState={activeHistory}
          {selectHistoryIndex}
        />
      </aside>
    {/if}
  </div>
</main>

<CommandPalette
  open={commandPaletteOpen}
  commands={commandPaletteCommands}
  close={() => (commandPaletteOpen = false)}
/>

<style>
  .app {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0;
    user-select: none;
  }

  .app-header {
    margin-bottom: 24px;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
  }

  .title-section {
    flex: 1;
  }

  .header-controls {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .toggle-command-btn {
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--surface-color);
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
    color: var(--text-primary);
  }

  .toggle-command-btn:hover {
    background: var(--hover-bg);
  }

  .github-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--surface-color);
    color: var(--text-primary);
    transition: all 0.2s;
    text-decoration: none;
  }

  .github-link:hover {
    background: var(--hover-bg);
  }

  .github-link svg {
    width: 18px;
    height: 18px;
    fill: currentColor;
  }

  .app-title {
    margin: 0 0 8px 0;
    font-size: 2.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, var(--primary-color), #8b5cf6);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1.2;
  }

  .app-description {
    margin: 0;
    font-size: 1.125rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .privacy-notice {
    margin: 8px 0 0 0;
    font-size: 0.875rem;
    color: var(--success-color);
    line-height: 1.4;
    font-weight: 500;
  }

  .shortcut-hint {
    margin: 6px 0 0 0;
    font-size: 0.8rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  .main-container {
    display: flex;
    gap: 0;
    min-height: 60vh;
    position: relative;
  }

  .content-area {
    flex: 1;
    min-width: 0;
  }

  .textarea-grid {
    position: relative;
    width: 100%;
    height: calc(100vh - 200px);
    min-height: 500px;
  }

  .textarea-grid.maximized-a .panel-b,
  .textarea-grid.maximized-a .panel-result {
    display: none;
  }

  .textarea-grid.maximized-b .panel-a,
  .textarea-grid.maximized-b .panel-result {
    display: none;
  }

  .textarea-grid.maximized-result .panel-a,
  .textarea-grid.maximized-result .panel-b {
    display: none;
  }

  .textarea-grid.maximized-a .panel-a,
  .textarea-grid.maximized-b .panel-b,
  .textarea-grid.maximized-result .panel-result {
    width: 100% !important;
    height: 100% !important;
    top: 0 !important;
    left: 0 !important;
  }

  .textarea-wrapper {
    position: absolute;
    border: 1px solid var(--border-color);
  }

  .panel-a {
    top: 0;
    left: 0;
  }

  .panel-b {
    top: 0;
  }

  .panel-result {
    left: 0;
  }

  .splitter {
    position: absolute;
    background: transparent;
    border: none;
    padding: 0;
    transition: all 0.2s;
    z-index: 10;
  }

  .splitter::before {
    content: '';
    position: absolute;
    background: var(--border-color);
    transition:
      background-color 0.2s,
      opacity 0.2s;
  }

  .splitter:hover::before {
    background: var(--primary-color);
    opacity: 0.8;
  }

  .splitter:focus {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  .horizontal-splitter {
    width: 8px;
    cursor: col-resize;
    top: 0;
    margin-left: -4px;
  }

  .horizontal-splitter::before {
    left: 50%;
    top: 0;
    bottom: 0;
    width: 1px;
    transform: translateX(-50%);
  }

  .horizontal-splitter:hover {
    width: 8px;
  }

  .horizontal-splitter:hover::before {
    width: 2px;
  }

  .vertical-splitter {
    height: 8px;
    cursor: row-resize;
    left: 0;
    margin-top: -4px;
  }

  .vertical-splitter::before {
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    transform: translateY(-50%);
  }

  .vertical-splitter:hover {
    height: 8px;
  }

  .vertical-splitter:hover::before {
    height: 2px;
  }

  .command-splitter {
    width: 8px;
    height: 100%;
    cursor: col-resize;
  }

  .command-splitter::before {
    left: 50%;
    top: 0;
    bottom: 0;
    width: 1px;
    transform: translateX(-50%);
  }

  .command-splitter:hover::before {
    width: 2px;
  }

  .command-sidebar {
    overflow-y: auto;
    max-height: calc(100vh - 200px);
    flex-shrink: 0;
  }

  /* Responsive design */
  @media (max-width: 1200px) {
    .main-container {
      flex-direction: column;
      gap: 16px;
    }

    .content-area {
      width: 100% !important;
    }

    .command-sidebar {
      width: 100% !important;
      max-height: none;
    }

    .command-splitter {
      display: none;
    }
  }

  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      align-items: stretch;
      gap: 16px;
    }

    .header-controls {
      justify-content: flex-end;
    }

    .app-title {
      font-size: 2rem;
    }

    .app-description {
      font-size: 1rem;
    }

    .textarea-grid {
      position: static;
      display: flex;
      flex-direction: column;
      height: auto;
      gap: 16px;
    }

    .textarea-wrapper {
      position: static !important;
      width: 100% !important;
      height: 300px !important;
      top: auto !important;
      left: auto !important;
    }

    .splitter {
      display: none;
    }
  }

  @media (max-width: 480px) {
    .app-title {
      font-size: 1.5rem;
    }
  }
</style>
