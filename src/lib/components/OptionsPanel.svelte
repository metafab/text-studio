<script lang="ts">
  import { ignoreCase, outputDestination, showLineNumbers, showWordWrap } from '../stores'
  import { type HistoryState } from '../undoRedo'
  import { isMacPlatform as detectMacPlatform } from '../platform'
  import CommandButton from './CommandButton.svelte'

  interface Props {
    activePaneId: string
    canUndo: boolean
    canRedo: boolean
    undoActive: () => void
    redoActive: () => void
    historyState: HistoryState
    onSelectHistory: (index: number) => void
  }

  let {
    activePaneId,
    canUndo,
    canRedo,
    undoActive,
    redoActive,
    historyState,
    onSelectHistory,
  }: Props = $props()

  // Store subscription state
  let currentIgnoreCase = $state(true)
  let currentShowLineNumbers = $state(false)
  let currentShowWordWrap = $state(true)
  let currentOutputDestination = $state<'active' | 'result'>('active')
  let selectedHistoryIndex = $state(0)

  $effect(() => {
    const unsubscribe = ignoreCase.subscribe((value) => {
      currentIgnoreCase = value
    })
    return unsubscribe
  })

  $effect(() => {
    const unsubscribe = showLineNumbers.subscribe((value) => {
      currentShowLineNumbers = value
    })
    return unsubscribe
  })

  $effect(() => {
    const unsubscribe = showWordWrap.subscribe((value) => {
      currentShowWordWrap = value
    })
    return unsubscribe
  })

  $effect(() => {
    const unsubscribe = outputDestination.subscribe((value) => {
      currentOutputDestination = value
    })
    return unsubscribe
  })

  // Detect platform for keyboard shortcuts in tooltips
  let isMac = $derived(detectMacPlatform())
  let undoShortcut = $derived(isMac ? 'Cmd+Z' : 'Ctrl+Z')
  let redoShortcut = $derived(isMac ? 'Cmd+Shift+Z' : 'Ctrl+Y')

  const MAX_HISTORY_OPTIONS = 20

  function sanitizePreview(text: string): string {
    const compact = text.replace(/\s+/g, ' ').trim()
    return compact.length > 40 ? `${compact.slice(0, 37)}…` : compact
  }

  let currentHistoryIndex = $derived(historyState.past.length)

  let historyEntries = $derived.by(() => {
    const entries = [...historyState.past, historyState.present, ...historyState.future]
    if (entries.length === 0) {
      return []
    }

    const total = entries.length
    const windowStartCandidate = Math.max(0, currentHistoryIndex - MAX_HISTORY_OPTIONS + 1)
    const maxPossibleStart = Math.max(0, total - MAX_HISTORY_OPTIONS)
    const start = Math.min(windowStartCandidate, maxPossibleStart)
    const end = Math.min(total, start + MAX_HISTORY_OPTIONS)

    return entries.slice(start, end).map((entry, idx) => {
      const absoluteIndex = start + idx
      const position =
        absoluteIndex < historyState.past.length
          ? 'past'
          : absoluteIndex === historyState.past.length
            ? 'present'
            : 'future'
      const prefix =
        position === 'present' ? 'Current' : position === 'past' ? 'Undo to' : 'Redo to'

      return {
        index: absoluteIndex,
        label: entry.label,
        display: `${prefix} • ${entry.label}`,
        preview: sanitizePreview(entry.value),
        isCurrent: position === 'present',
        timestamp: entry.timestamp,
      }
    })
  })

  $effect(() => {
    selectedHistoryIndex = currentHistoryIndex
  })

  function handleHistoryChange(event: Event) {
    const target = event.target as HTMLSelectElement
    const nextIndex = Number(target.value)
    if (Number.isNaN(nextIndex)) {
      return
    }
    selectedHistoryIndex = nextIndex
    onSelectHistory(nextIndex)
  }
</script>

<div class="command-section">
  <h4 class="section-title">Options</h4>
  <div class="options-grid">
    <label class="checkbox-label">
      <input
        type="checkbox"
        checked={currentIgnoreCase}
        onchange={(e) => ignoreCase.set((e.target as HTMLInputElement).checked)}
      />
      Ignore case
    </label>
    <label class="checkbox-label">
      <input
        type="checkbox"
        checked={currentShowLineNumbers}
        onchange={(e) => showLineNumbers.set((e.target as HTMLInputElement).checked)}
      />
      Show line numbers
    </label>
    <label class="checkbox-label">
      <input
        type="checkbox"
        checked={currentShowWordWrap}
        onchange={(e) => showWordWrap.set((e.target as HTMLInputElement).checked)}
      />
      Wrap long lines
    </label>
  </div>
</div>

<div class="command-section">
  <h4 class="section-title">Output Destination</h4>
  <div class="output-destination-toggle">
    <button
      class="destination-btn"
      class:active={currentOutputDestination === 'active'}
      onclick={() => outputDestination.set('active')}
      title="Apply commands to the currently active panel"
    >
      ➡️ Active Panel ({activePaneId.toUpperCase()})
    </button>
    <button
      class="destination-btn"
      class:active={currentOutputDestination === 'result'}
      onclick={() => outputDestination.set('result')}
      title="Send command results to the Result panel"
    >
      📊 Result Panel
    </button>
  </div>
</div>

<div class="command-section">
  <h4 class="section-title">
    History
    <span class="active-pane-indicator">({activePaneId})</span>
  </h4>
  <div class="command-grid">
    <CommandButton
      icon="↶"
      label="Undo"
      tooltip="Undo last action ({undoShortcut})"
      action={undoActive}
      disabled={!canUndo}
    />
    <CommandButton
      icon="↷"
      label="Redo"
      tooltip="Redo last undone action ({redoShortcut})"
      action={redoActive}
      disabled={!canRedo}
    />
  </div>
  {#if historyEntries.length > 0}
    <div class="history-dropdown-group">
      <label class="history-label" for={`history-select-${activePaneId}`}>
        Recent operations
      </label>
      <select
        id={`history-select-${activePaneId}`}
        class="history-dropdown"
        value={selectedHistoryIndex}
        onchange={handleHistoryChange}
      >
        {#each historyEntries as entry}
          <option value={entry.index} title={entry.preview ? entry.preview : entry.label}>
            {entry.display}{entry.preview ? ` — ${entry.preview}` : ''}
          </option>
        {/each}
      </select>
    </div>
  {:else}
    <div class="history-empty">No operations yet</div>
  {/if}
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

  .history-dropdown-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .history-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .history-dropdown {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--input-bg);
    color: var(--text-primary);
    font-size: 13px;
  }

  .history-dropdown:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
  }

  .history-empty {
    font-size: 12px;
    color: var(--text-secondary);
  }

  .options-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
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

  .output-destination-toggle {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .destination-btn {
    padding: 10px 12px;
    border: 2px solid var(--border-color);
    border-radius: 6px;
    background: var(--surface-color);
    color: var(--text-primary);
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s;
    text-align: center;
  }

  .destination-btn:hover {
    background: var(--hover-bg);
    border-color: var(--primary-color);
  }

  .destination-btn.active {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  }
</style>
