<script lang="ts">
  import { ignoreCase, outputDestination } from '../stores'
  import { isMacPlatform as detectMacPlatform } from '../platform'
  import { type HistoryState, type HistoryUpdateOptions } from '../undoRedo'
  import ComparisonPanel from './ComparisonPanel.svelte'
  import OptionsPanel from './OptionsPanel.svelte'
  import SearchPanel, { type SearchPanelFocusTarget } from './SearchPanel.svelte'
  import TransformPanel, { type TransformPanelFocusTarget } from './TransformPanel.svelte'

  interface Props {
    leftText: string
    rightText: string
    resultText: string
    leftSearchHighlight?: string
    leftExtractHighlight?: string
    rightSearchHighlight?: string
    rightExtractHighlight?: string
    resultSearchHighlight?: string
    resultExtractHighlight?: string
    activePaneId?: string
    setLeftText: (text: string, options?: HistoryUpdateOptions) => void
    setRightText: (text: string, options?: HistoryUpdateOptions) => void
    setResultText: (text: string, options?: HistoryUpdateOptions) => void
    undoActive: () => void
    redoActive: () => void
    canUndo: boolean
    canRedo: boolean
    historyState: HistoryState
    selectHistoryIndex: (index: number) => void
  }

  let {
    leftText,
    rightText,
    resultText,
    leftSearchHighlight = $bindable(''),
    leftExtractHighlight = $bindable(''),
    rightSearchHighlight = $bindable(''),
    rightExtractHighlight = $bindable(''),
    resultSearchHighlight = $bindable(''),
    resultExtractHighlight = $bindable(''),
    activePaneId = $bindable('a'),
    setLeftText,
    setRightText,
    setResultText,
    undoActive,
    redoActive,
    canUndo,
    canRedo,
    historyState,
    selectHistoryIndex,
  }: Props = $props()

  // Store subscription state
  let currentIgnoreCase = $state(true)
  let currentOutputDestination = $state<'active' | 'result'>('active')

  type TransformPanelHandle = {
    focusInput: (target: TransformPanelFocusTarget) => void
  }

  type SearchPanelHandle = {
    focusInput: (target: SearchPanelFocusTarget) => void
  }

  let transformPanelRef = $state<TransformPanelHandle>()
  let searchPanelRef = $state<SearchPanelHandle>()

  $effect(() => {
    const unsubscribe = ignoreCase.subscribe((value) => {
      currentIgnoreCase = value
    })
    return unsubscribe
  })

  $effect(() => {
    const unsubscribe = outputDestination.subscribe((value) => {
      currentOutputDestination = value
    })
    return unsubscribe
  })

  // Detect platform for modifier key hint
  let isMac = $derived(detectMacPlatform())

  const modifierHint = $derived.by(() => {
    const altKey = isMac ? 'Option' : 'Alt'
    if (activePaneId === 'result') {
      return `\nTip: Shift+Click → A | ${altKey}+Click → B`
    } else if (activePaneId === 'a') {
      return `\nTip: Shift+Click → Result | ${altKey}+Click → B`
    } else {
      return `\nTip: Shift+Click → Result | ${altKey}+Click → A`
    }
  })

  // Get active text and setter based on selected pane
  let activeText = $derived(
    activePaneId === 'a' ? leftText : activePaneId === 'b' ? rightText : resultText
  )

  let activeSetText = $derived(
    activePaneId === 'a' ? setLeftText : activePaneId === 'b' ? setRightText : setResultText
  )

  export type CommandPanelFocusTarget = TransformPanelFocusTarget | SearchPanelFocusTarget

  export function focusInput(target: CommandPanelFocusTarget) {
    if (target.startsWith('transform-')) {
      transformPanelRef?.focusInput(target as TransformPanelFocusTarget)
      return
    }
    searchPanelRef?.focusInput(target as SearchPanelFocusTarget)
  }

  // Helper functions for output destination
  function getOutputSetter(
    event?: MouseEvent
  ): (text: string, options?: HistoryUpdateOptions) => void {
    // Check for keyboard modifiers
    if (event) {
      if (event.shiftKey) {
        // Shift+Click: Result panel (or A if active is Result)
        return activePaneId === 'result' ? setLeftText : setResultText
      }
      if (event.altKey) {
        // Alt+Click or Option+Click: send to the other pane
        if (activePaneId === 'result') {
          return setRightText // B when active is Result
        } else if (activePaneId === 'a') {
          return setRightText // B when active is A
        } else {
          return setLeftText // A when active is B
        }
      }
    }

    // Normal click: follow the global setting
    if (currentOutputDestination === 'result') {
      return setResultText
    }
    return activeSetText
  }

  function getSourceText() {
    // When outputting to result, use active panel as source
    return activeText
  }
</script>

<div class="command-panel">
  <OptionsPanel
    {activePaneId}
    {canUndo}
    {canRedo}
    {undoActive}
    {redoActive}
    {historyState}
    onSelectHistory={selectHistoryIndex}
  />

  <TransformPanel
    {leftText}
    {rightText}
    {resultText}
    bind:leftExtractHighlight
    bind:rightExtractHighlight
    bind:resultExtractHighlight
    {activePaneId}
    {currentIgnoreCase}
    {modifierHint}
    {getOutputSetter}
    {getSourceText}
    bind:this={transformPanelRef}
  />

  <SearchPanel
    {leftText}
    {rightText}
    {resultText}
    bind:leftSearchHighlight
    bind:rightSearchHighlight
    bind:resultSearchHighlight
    {activePaneId}
    {currentIgnoreCase}
    {modifierHint}
    {getOutputSetter}
    {getSourceText}
    bind:this={searchPanelRef}
  />

  <ComparisonPanel
    {leftText}
    {rightText}
    {resultText}
    bind:leftSearchHighlight
    bind:rightSearchHighlight
    {currentIgnoreCase}
    {setLeftText}
    {setRightText}
    {setResultText}
  />
</div>

<style>
  .command-panel {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 16px;
    background: var(--surface-color);
    border-radius: 8px;
    border: 1px solid var(--border-color);
  }
</style>
