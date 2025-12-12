<script lang="ts">
  import { searchMode } from '../stores'
  import { filterLines, replaceText, searchAndHighlight, type SearchMode } from '../textProcessing'
  import { type HistoryUpdateOptions } from '../undoRedo'
  import CommandButton from './CommandButton.svelte'

  interface Props {
    leftText: string
    rightText: string
    resultText: string
    leftSearchHighlight?: string
    rightSearchHighlight?: string
    resultSearchHighlight?: string
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
    leftSearchHighlight = $bindable(''),
    rightSearchHighlight = $bindable(''),
    resultSearchHighlight = $bindable(''),
    activePaneId,
    currentIgnoreCase,
    modifierHint,
    getOutputSetter,
    getSourceText,
  }: Props = $props()

  let searchTerm = $state('')
  let replacementText = $state('')
  let currentSearchMode = $state<SearchMode>('standard')

  let searchTermInput = $state<HTMLInputElement>()
  let replacementInput = $state<HTMLInputElement>()

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

  export type SearchPanelFocusTarget = 'search-term' | 'search-replacement'

  export function focusInput(target: SearchPanelFocusTarget) {
    requestAnimationFrame(() => {
      switch (target) {
        case 'search-term': {
          focusElement(searchTermInput)
          break
        }
        case 'search-replacement': {
          focusElement(replacementInput)
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

  $effect(() => {
    const unsubscribe = searchMode.subscribe((value) => {
      currentSearchMode = value
    })
    return unsubscribe
  })

  // Real-time search highlighting
  $effect(() => {
    if (searchTerm.trim()) {
      leftSearchHighlight = searchAndHighlight(
        leftText,
        searchTerm,
        currentIgnoreCase,
        currentSearchMode
      )
      rightSearchHighlight = searchAndHighlight(
        rightText,
        searchTerm,
        currentIgnoreCase,
        currentSearchMode
      )
      resultSearchHighlight = searchAndHighlight(
        resultText,
        searchTerm,
        currentIgnoreCase,
        currentSearchMode
      )
    } else {
      leftSearchHighlight = ''
      rightSearchHighlight = ''
      resultSearchHighlight = ''
    }
  })

  function filterActiveKeep(event?: MouseEvent) {
    if (searchTerm.trim()) {
      const outputSetter = getOutputSetter(event)
      outputSetter(
        filterLines(getSourceText(), searchTerm, true, currentIgnoreCase, currentSearchMode),
        { label: `Keep lines matching "${searchTerm}"` }
      )
    }
  }

  function filterActiveRemove(event?: MouseEvent) {
    if (searchTerm.trim()) {
      const outputSetter = getOutputSetter(event)
      outputSetter(
        filterLines(getSourceText(), searchTerm, false, currentIgnoreCase, currentSearchMode),
        { label: `Remove lines matching "${searchTerm}"` }
      )
    }
  }

  function replaceActiveText(event?: MouseEvent) {
    if (searchTerm.trim()) {
      const outputSetter = getOutputSetter(event)
      outputSetter(
        replaceText(
          getSourceText(),
          searchTerm,
          replacementText,
          currentIgnoreCase,
          currentSearchMode
        ),
        { label: `Replace "${searchTerm}" with "${replacementText}"` }
      )
    }
  }

  function clearAllSearchHighlights() {
    leftSearchHighlight = ''
    rightSearchHighlight = ''
    resultSearchHighlight = ''
    searchTerm = ''
  }
</script>

<div class="command-section">
  <h4 class="section-title">
    Search & Filter
    <span class="active-pane-indicator">({activePaneId})</span>
  </h4>
  <div class="search-controls">
    <div class="search-mode-selector">
      <div class="search-mode-label">Search Mode:</div>
      <div class="search-mode-options">
        <label
          class="radio-option"
          title="Standard: Exact text match (e.g., 'hello' finds 'hello')"
        >
          <input
            type="radio"
            name="searchMode"
            value="standard"
            checked={currentSearchMode === 'standard'}
            onchange={() => searchMode.set('standard')}
          />
          <span>Standard</span>
        </label>
        <label
          class="radio-option"
          title="LIKE: SQL-style wildcards (% = any text, _ = single char)
Pattern anchoring: 'Apple%' matches lines starting with 'Apple', '%txt' matches lines ending with 'txt'
Example: '%hello%' finds 'hello' anywhere"
        >
          <input
            type="radio"
            name="searchMode"
            value="like"
            checked={currentSearchMode === 'like'}
            onchange={() => searchMode.set('like')}
          />
          <span>LIKE Pattern</span>
        </label>
        <label
          class="radio-option"
          title="Regex: Regular expression pattern (multiline mode enabled)
^ and $ match line boundaries
Example: 'llo$' matches lines ending with 'llo', '^hello' matches lines starting with 'hello'
'h.llo' matches 'hello' or 'hallo', '[0-9]+' matches numbers"
        >
          <input
            type="radio"
            name="searchMode"
            value="regex"
            checked={currentSearchMode === 'regex'}
            onchange={() => searchMode.set('regex')}
          />
          <span>Regex</span>
        </label>
      </div>
      <div class="search-mode-hint">
        {#if currentSearchMode === 'standard'}
          <span class="hint-text">💡 Searches for exact text matches</span>
        {:else if currentSearchMode === 'like'}
          <span class="hint-text"
            >💡 Use % for any text, _ for single char. Line filtering: hel% = starts with "hel", %lo
            = ends with "lo"</span
          >
        {:else if currentSearchMode === 'regex'}
          <span class="hint-text"
            >💡 Enter a JavaScript regex pattern (multiline mode: ^ and $ work on lines) · <a
              href="https://regex101.com/"
              target="_blank"
              rel="noopener noreferrer"
              class="regex-link">Test on Regex101</a
            ></span
          >
        {/if}
      </div>
    </div>
    <div class="search-input-wrapper">
      <input
        type="text"
        placeholder={currentSearchMode === 'standard'
          ? 'Enter search term...'
          : currentSearchMode === 'like'
            ? 'e.g. hello% or _test%'
            : 'e.g. h.llo or [0-9]+'}
        bind:value={searchTerm}
        class="search-input"
        bind:this={searchTermInput}
        name="search-term"
      />
      {#if searchTerm.trim() || leftSearchHighlight || rightSearchHighlight || resultSearchHighlight}
        <button
          class="clear-search-btn"
          onclick={clearAllSearchHighlights}
          title="Clear the search term and remove all search highlights"
          aria-label="Clear search"
        >
          ✕
        </button>
      {/if}
    </div>
    <div class="search-actions">
      <CommandButton
        icon="✅"
        label="Keep Lines"
        tooltip="Keep only lines that contain the search term{modifierHint}"
        action={filterActiveKeep}
        disabled={!searchTerm.trim() || !activeText.trim()}
      />
      <CommandButton
        icon="❌"
        label="Remove Lines"
        tooltip="Remove all lines that contain the search term{modifierHint}"
        action={filterActiveRemove}
        disabled={!searchTerm.trim() || !activeText.trim()}
      />
    </div>

    <div class="command-input-group">
      <div class="input-label">Replace Text</div>
      <div class="input-with-button">
        <input
          type="text"
          placeholder="Replacement text (can be empty)"
          bind:value={replacementText}
          class="command-input"
          bind:this={replacementInput}
          name="replacement-text"
        />
        <CommandButton
          icon="🔄"
          label="Replace"
          tooltip="Replace all occurrences of the search term with the replacement text (can be empty){modifierHint}"
          action={replaceActiveText}
          disabled={!searchTerm.trim() || !activeText.trim()}
        />
      </div>
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

  .search-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .search-mode-selector {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    border-radius: 4px;
  }

  .search-mode-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    margin: 0;
  }

  .search-mode-options {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .radio-option {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    font-size: 13px;
    color: var(--text-primary);
    user-select: none;
  }

  .radio-option input[type='radio'] {
    cursor: pointer;
    margin: 0;
  }

  .radio-option span {
    white-space: nowrap;
  }

  .search-mode-hint {
    margin-top: 2px;
  }

  .hint-text {
    font-size: 11px;
    color: var(--text-secondary);
    font-style: italic;
  }

  .regex-link {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 500;
    font-style: normal;
  }

  .regex-link:hover {
    text-decoration: underline;
  }

  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
    gap: 8px;
  }

  .search-input {
    flex: 1;
    padding: 8px 12px;
    padding-right: 36px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--input-bg);
    color: var(--text-primary);
    font-size: 14px;
    width: 100%;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--primary-color);
  }

  .clear-search-btn {
    position: absolute;
    right: 8px;
    padding: 4px 8px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    border-radius: 4px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .clear-search-btn:hover {
    background: var(--hover-bg);
    color: var(--text-primary);
  }

  .clear-search-btn:active {
    transform: scale(0.95);
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
</style>
