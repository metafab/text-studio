<script lang="ts">
  import {
    copyToClipboard,
    downloadText,
    handleDragOver,
    handleDrop,
    readClipboardText,
    readFileAsText,
  } from '../fileUtils'
  import {
    fontFamily,
    fontSize,
    ignoreCase,
    includeLineBreaks,
    showLineNumbers,
    showWordWrap,
  } from '../stores'
  import { getTextStats, type TextStats } from '../textProcessing'
  import { EXAMPLE_TEXTS, type ExampleText } from '../exampleTexts'

  interface Props {
    label: string
    paneId: string
    value?: string
    placeholder?: string
    searchHighlight?: string
    extractHighlight?: string
    isActive?: boolean
    onActivate: () => void
    onMaximize: () => void
    isMaximized?: boolean
  }

  let {
    label,
    paneId,
    value = $bindable(''),
    placeholder = '',
    searchHighlight = '',
    extractHighlight = '',
    isActive = false,
    onActivate,
    onMaximize,
    isMaximized = false,
  }: Props = $props()

  let textarea = $state<HTMLTextAreaElement>()
  let fileInput = $state<HTMLInputElement>()
  let isDragging = $state(false)
  let searchOverlay = $state<HTMLDivElement>()
  let extractOverlay = $state<HTMLDivElement>()
  let errorMessage = $state<string | null>(null)
  let showError = $state(false)
  let showExamples = $state(false)

  // Derived values from stores using $ prefix
  let currentFontFamily = $derived($fontFamily)
  let currentFontSize = $derived($fontSize)
  let currentIgnoreCase = $derived($ignoreCase)
  let currentIncludeLineBreaks = $derived($includeLineBreaks)
  let currentShowLineNumbers = $derived($showLineNumbers)
  let currentShowWordWrap = $derived($showWordWrap)

  let lineNumbersContent = $state<HTMLDivElement>()
  let wrapMeasure = $state<HTMLDivElement>()

  let lineCount = $derived.by(() => {
    if (!value) {
      return 1
    }
    const matches = value.match(/\r\n|\n|\r/g)
    return (matches ? matches.length : 0) + 1
  })

  let lineNumberDigits = $derived(Math.max(2, String(lineCount).length))
  let gutterWidth = $derived(currentShowLineNumbers ? 5 + lineNumberDigits * 10 : 0)
  let lineNumbersText = $state('1')
  let lineNumbersStyle = $derived(
    `font-family: ${currentFontFamily}; font-size: ${currentFontSize}px; line-height: 1.5;`
  )

  // Derived values
  let stats = $derived(getTextStats(value, currentIgnoreCase, currentIncludeLineBreaks))
  let textareaStyle = $derived(
    `font-family: ${currentFontFamily}; font-size: ${currentFontSize}px; white-space: ${currentShowWordWrap ? 'pre-wrap' : 'pre'}; overflow-wrap: ${currentShowWordWrap ? 'break-word' : 'normal'}; word-break: ${currentShowWordWrap ? 'break-word' : 'normal'};`
  )
  let highlightStyle = $derived(
    `font-family: ${currentFontFamily}; font-size: ${currentFontSize}px; line-height: 1.5; white-space: ${currentShowWordWrap ? 'pre-wrap' : 'pre'}; overflow-wrap: ${currentShowWordWrap ? 'break-word' : 'normal'}; word-wrap: ${currentShowWordWrap ? 'break-word' : 'normal'};`
  )
  let isPanelEmpty = $derived(!value.trim())
  let examplesMenuId = $derived(`examples-menu-${paneId}`)
  let shouldShowQuickActions = $derived(paneId !== 'result')

  function syncScroll() {
    if (textarea) {
      if (searchOverlay) {
        searchOverlay.scrollTop = textarea.scrollTop
        searchOverlay.scrollLeft = textarea.scrollLeft
      }
      if (extractOverlay) {
        extractOverlay.scrollTop = textarea.scrollTop
        extractOverlay.scrollLeft = textarea.scrollLeft
      }
      if (lineNumbersContent) {
        lineNumbersContent.style.transform = `translateY(-${textarea.scrollTop}px)`
      }
    }
  }

  function showErrorMessage(message: string) {
    errorMessage = message
    showError = true
    setTimeout(() => {
      showError = false
    }, 3000)
  }

  async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement
    const files = target.files
    if (files && files.length > 0) {
      try {
        const content = await readFileAsText(files[0])
        value = content
        onActivate()
        textarea?.focus()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to read file'
        showErrorMessage(message)
      } finally {
        target.value = ''
      }
    }
  }

  async function onDrop(event: DragEvent) {
    try {
      const contents = await handleDrop(event)
      if (contents.length > 0) {
        value = contents[0]
        onActivate()
        textarea?.focus()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process dropped file'
      showErrorMessage(message)
    } finally {
      isDragging = false
    }
  }

  function onDragOver(event: DragEvent) {
    handleDragOver(event)
    isDragging = true
  }

  function onDragLeave() {
    isDragging = false
  }

  function activatePanel() {
    onActivate()
    textarea?.focus()
  }

  async function copyContent() {
    try {
      await copyToClipboard(value)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to copy content'
      showErrorMessage(message)
    }
  }

  function downloadContent() {
    try {
      downloadText(value, `${label.toLowerCase()}-text.txt`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to download file'
      showErrorMessage(message)
    }
  }

  function clearContent() {
    value = ''
  }

  function handleFocus() {
    onActivate()
  }

  function toggleLineBreaks() {
    includeLineBreaks.update((value) => !value)
  }

  function triggerFilePicker() {
    activatePanel()
    fileInput?.click()
  }

  async function pasteFromClipboard() {
    try {
      const text = await readClipboardText()
      activatePanel()
      value = text
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to read clipboard contents'
      showErrorMessage(message)
    }
  }

  function toggleExamplesMenu() {
    showExamples = !showExamples
  }

  function applyExample(example: ExampleText) {
    value = example.content
    activatePanel()
    showExamples = false
  }

  $effect(() => {
    if ((!isPanelEmpty || !shouldShowQuickActions) && showExamples) {
      showExamples = false
    }
  })

  $effect(() => {
    if (textarea) {
      requestAnimationFrame(syncScroll)
    }
    if (!currentShowLineNumbers && lineNumbersContent) {
      lineNumbersContent.style.transform = 'translateY(0)'
    }
  })

  function getLineHeightPx(element: HTMLElement | null) {
    if (!element) {
      return currentFontSize * 1.5
    }
    const style = getComputedStyle(element)
    const lineHeight = style.lineHeight
    if (lineHeight === 'normal') {
      return parseFloat(style.fontSize) * 1.5
    }
    const parsed = parseFloat(lineHeight)
    return Number.isNaN(parsed) ? parseFloat(style.fontSize) * 1.5 : parsed
  }

  function updateLineNumbers() {
    const lines = value.split(/\r\n|\n|\r/)
    if (!currentShowLineNumbers) {
      lineNumbersText =
        lines.length === 0 ? '1' : lines.map((_, index) => String(index + 1)).join('\n')
      return
    }

    if (!currentShowWordWrap || !textarea || !wrapMeasure) {
      lineNumbersText =
        lines.length === 0 ? '1' : lines.map((_, index) => String(index + 1)).join('\n')
      return
    }

    const measure = wrapMeasure
    if (!measure) {
      lineNumbersText =
        lines.length === 0 ? '1' : lines.map((_, index) => String(index + 1)).join('\n')
      return
    }

    const textareaStyle = getComputedStyle(textarea)
    const paddingLeft = parseFloat(textareaStyle.paddingLeft) || 0
    const paddingRight = parseFloat(textareaStyle.paddingRight) || 0
    const contentWidth = textarea.clientWidth - paddingLeft - paddingRight

    measure.style.width = `${Math.max(contentWidth, 0)}px`
    measure.style.fontFamily = textareaStyle.fontFamily
    measure.style.fontSize = textareaStyle.fontSize
    measure.style.lineHeight = textareaStyle.lineHeight
    measure.style.letterSpacing = textareaStyle.letterSpacing
    measure.style.wordSpacing = textareaStyle.wordSpacing

    const lineHeightPx = getLineHeightPx(textarea)

    const numbers: string[] = []
    lines.forEach((line, index) => {
      measure.textContent = line.length === 0 ? '\u200b' : line
      const height = measure.scrollHeight
      const wrapCount = Math.max(1, Math.round(height / lineHeightPx))
      numbers.push(String(index + 1))
      for (let i = 1; i < wrapCount; i += 1) {
        numbers.push('')
      }
    })

    lineNumbersText = numbers.length === 0 ? '1' : numbers.join('\n')
  }

  $effect(() => {
    updateLineNumbers()
  })
</script>

<div class="textarea-panel" class:active={isActive}>
  <div class="panel-header">
    <h3 class="panel-title">
      {label}
      {#if isActive}
        <span class="active-indicator">●</span>
      {/if}
    </h3>
    <div class="panel-actions">
      <button
        class="action-btn"
        title="Upload file"
        onclick={triggerFilePicker}
        aria-label="Upload file to {label} panel"
      >
        📁
      </button>
      <button
        class="action-btn"
        title="Copy content"
        onclick={copyContent}
        disabled={!value.trim()}
        aria-label="Copy {label} panel content to clipboard"
      >
        📋
      </button>
      <button
        class="action-btn"
        title="Download content"
        onclick={downloadContent}
        disabled={!value.trim()}
        aria-label="Download {label} panel content as file"
      >
        💾
      </button>
      <button
        class="action-btn danger"
        title="Clear content"
        onclick={clearContent}
        disabled={!value.trim()}
        aria-label="Clear {label} panel content"
      >
        🗑️
      </button>
      <button
        class="action-btn maximize-btn"
        title={isMaximized ? 'Restore panel' : 'Maximize panel'}
        onclick={onMaximize}
        aria-label={isMaximized ? `Restore {label} panel to normal size` : `Maximize {label} panel`}
        aria-pressed={isMaximized}
      >
        {#if isMaximized}
          <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%" stroke="currentColor">
            <g transform="matrix(-1, 0, 0, -1, 23, 23)" style="">
              <path d="M 8 18 L 10 18 L 10 10 L 18 10 L 18 8 L 8 8 L 8 18 Z"></path>
            </g>
            <g transform="matrix(-1, 0, 0, -1, 47, 25)" style="">
              <path d="m 20,10 0,2 4,0 0,4 2,0 L 26,10 l -6,0 0,0 z"></path>
              <path d="M 16 10 L 16 12 L 24 12 L 24 20 L 26 20 L 26 10 L 16 10 Z"></path>
            </g>
            <g transform="matrix(-1, 0, 0, -1, 48, 48)" style="">
              <path d="M 25 25 L 17 25 L 17 27 L 27 27 L 27 17 L 25 17 L 25 25 Z"></path>
            </g>
            <g transform="matrix(-1, 0, 0, -1, 24, 48)" style="">
              <path d="M 11 17 L 9 17 L 9 27 L 19 27 L 19 25 L 11 25 L 11 17 Z"></path>
            </g>
          </svg>
        {:else}
          <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%" stroke="currentColor">
            <g class="ytp-fullscreen-button-corner-0" transform="matrix(1, 0, 0, 1, -3, -3)">
              <path
                class="ytp-svg-fill"
                d="M 8 18 L 10 18 L 10 10 L 18 10 L 18 8 L 8 8 L 8 18 Z"
                id="ytp-id-59"
              >
              </path>
            </g>
            <g class="ytp-fullscreen-button-corner-1" transform="matrix(1, 0, 0, 1, 5, -5)">
              <path
                class="ytp-svg-fill ytp-svg-shadow"
                d="m 20,10 0,2 4,0 0,4 2,0 L 26,10 l -6,0 0,0 z"
              >
              </path>
              <path
                class="ytp-svg-fill"
                d="M 16 10 L 16 12 L 24 12 L 24 20 L 26 20 L 26 10 L 16 10 Z"
                id="ytp-id-60"
              >
              </path>
            </g>
            <g class="ytp-fullscreen-button-corner-2" transform="matrix(1, 0, 0, 1, 4, 4)">
              <path
                class="ytp-svg-fill"
                d="M 25 25 L 17 25 L 17 27 L 27 27 L 27 17 L 25 17 L 25 25 Z"
                id="ytp-id-61"
              >
              </path>
            </g>
            <g class="ytp-fullscreen-button-corner-3" transform="matrix(1, 0, 0, 1, -4, 4)">
              <path
                class="ytp-svg-fill"
                d="M 11 17 L 9 17 L 9 27 L 19 27 L 19 25 L 11 25 L 11 17 Z"
                id="ytp-id-62"
              >
              </path>
            </g>
          </svg>
        {/if}
      </button>
    </div>
  </div>

  <div
    class="textarea-container"
    class:dragging={isDragging}
    class:with-line-numbers={currentShowLineNumbers}
    class:wrap-enabled={currentShowWordWrap}
    style={`--gutter-width: ${currentShowLineNumbers ? `${gutterWidth}px` : '0px'};`}
  >
    {#if currentShowLineNumbers}
      <div class="line-numbers" aria-hidden="true">
        <div bind:this={lineNumbersContent} class="line-numbers-content" style={lineNumbersStyle}>
          {lineNumbersText}
        </div>
      </div>
    {/if}
    <textarea
      bind:this={textarea}
      bind:value
      {placeholder}
      style={textareaStyle}
      ondragover={onDragOver}
      ondragleave={onDragLeave}
      ondrop={onDrop}
      onscroll={syncScroll}
      onfocus={handleFocus}
      onclick={handleFocus}
      class:has-highlight={searchHighlight || extractHighlight}
      aria-label="{label} text input"
      aria-multiline="true"
    ></textarea>
    {#if extractHighlight}
      <div
        bind:this={extractOverlay}
        class="highlight-overlay extract-overlay"
        style={highlightStyle}
      >
        {@html extractHighlight}
      </div>
    {/if}
    {#if searchHighlight}
      <div
        bind:this={searchOverlay}
        class="highlight-overlay search-overlay"
        style={highlightStyle}
      >
        {@html searchHighlight}
      </div>
    {/if}
    {#if shouldShowQuickActions && isPanelEmpty && !isDragging}
      <div class="empty-state" role="note" aria-live="polite">
        <p class="empty-message">This panel is empty. Try a quick action to get started.</p>
        <div class="empty-actions">
          <button type="button" class="empty-action" onclick={triggerFilePicker}>
            📁 Load from file
          </button>
          <button type="button" class="empty-action" onclick={pasteFromClipboard}>
            📋 Paste
          </button>
          <div class="examples-group">
            <button
              type="button"
              class="empty-action examples-toggle"
              onclick={toggleExamplesMenu}
              aria-expanded={showExamples}
              aria-controls={examplesMenuId}
              aria-haspopup="true"
            >
              🧪 Examples
            </button>
            {#if showExamples}
              <div class="examples-dropdown" role="menu" id={examplesMenuId}>
                {#each EXAMPLE_TEXTS as example}
                  <button
                    type="button"
                    class="examples-item"
                    role="menuitem"
                    onclick={() => applyExample(example)}
                  >
                    <span class="example-label">{example.label}</span>
                    <span class="example-description">{example.description}</span>
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}
    {#if isDragging}
      <div class="drag-overlay">
        <div class="drag-message">📁 Drop file here</div>
      </div>
    {/if}
  </div>

  <div class="stats-bar" role="status" aria-live="polite">
    <span class="stat">Lines: {stats.lines}</span>
    <span class="stat">Unique: {stats.uniqueLines}</span>
    <button
      class="stat clickable"
      onclick={toggleLineBreaks}
      title={currentIncludeLineBreaks
        ? 'Click to ignore line breaks'
        : 'Click to include line breaks'}
      aria-label={currentIncludeLineBreaks
        ? 'Character count includes line breaks. Click to exclude line breaks.'
        : 'Character count excludes line breaks. Click to include line breaks.'}
      aria-pressed={currentIncludeLineBreaks}
    >
      Chars: {stats.characters}
    </button>
  </div>

  {#if showError && errorMessage}
    <div class="error-notification" role="alert" aria-live="assertive">
      ⚠️ {errorMessage}
    </div>
  {/if}

  <input bind:this={fileInput} type="file" style="display: none" onchange={handleFileSelect} />

  <div bind:this={wrapMeasure} class="wrap-measure" aria-hidden="true"></div>
</div>

<style>
  .textarea-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--surface-color);
    overflow: visible;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
  }

  .textarea-panel.active {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: var(--header-bg);
    border-bottom: 1px solid var(--border-color);
  }

  .panel-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .active-indicator {
    color: var(--primary-color);
    margin-left: 8px;
    font-size: 12px;
  }

  .panel-actions {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    padding: 6px 8px;
    border: none;
    border-radius: 4px;
    background: transparent;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.2s;
    color: var(--text-primary);
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .maximize-btn {
    padding: 0;
  }

  .action-btn:hover {
    background: var(--hover-bg);
  }

  .action-btn:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-btn.danger:hover {
    background: rgba(239, 68, 68, 0.1);
  }

  .maximize-btn:hover {
    background: rgba(59, 130, 246, 0.1);
  }

  .maximize-btn svg {
    width: 100%;
    height: 100%;
    fill: var(--text-primary);
  }

  .maximize-btn svg path {
    fill: var(--text-primary);
  }

  .textarea-container {
    position: relative;
    flex: 1;
    min-height: 200px;
    --gutter-width: 0px;
  }

  .textarea-container.dragging {
    border: 2px dashed var(--primary-color);
    background: var(--primary-bg);
  }

  textarea {
    width: 100%;
    height: 100%;
    padding: 16px;
    padding-left: calc(16px + var(--gutter-width, 0px));
    border: none;
    outline: none;
    resize: none;
    background: transparent;
    color: var(--text-primary);
    line-height: 1.5;
    position: relative;
    z-index: 1;
    white-space: pre;
    overflow-wrap: normal;
    word-break: normal;
  }

  textarea:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: -2px;
  }

  textarea.has-highlight {
    color: rgba(0, 0, 0, 0);
    caret-color: var(--text-primary);
    background: transparent;
  }

  .highlight-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 16px;
    padding-left: calc(16px + var(--gutter-width, 0px));
    pointer-events: none;
    white-space: pre;
    word-wrap: normal;
    overflow-wrap: normal;
    overflow: hidden;
    color: var(--text-primary);
    font-weight: inherit;
    letter-spacing: inherit;
    word-spacing: inherit;
    text-align: left;
    box-sizing: border-box;
    line-height: 1.5;
  }

  .textarea-container.wrap-enabled textarea {
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .textarea-container.wrap-enabled .highlight-overlay {
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .line-numbers {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: var(--gutter-width, 0px);
    background: var(--surface-color);
    border-right: 1px solid var(--border-color);
    pointer-events: none;
    user-select: none;
    overflow: hidden;
    z-index: 2;
  }

  .line-numbers-content {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    text-align: right;
    color: var(--text-secondary);
    padding: 16px 8px;
    font-variant-numeric: tabular-nums;
    white-space: pre;
    box-sizing: border-box;
    transform: translateY(0);
  }

  .search-overlay {
    z-index: 0;
  }

  .extract-overlay {
    z-index: 1;
  }

  .highlight-overlay :global(.highlight-common) {
    background-color: rgba(34, 197, 94, 0.5);
    padding: 2px 4px;
    border-radius: 2px;
    color: inherit;
  }

  .highlight-overlay :global(.highlight-different) {
    background-color: rgba(239, 68, 68, 0.5);
    padding: 2px 4px;
    border-radius: 2px;
    color: inherit;
  }

  .highlight-overlay :global(mark) {
    background-color: rgba(255, 235, 59, 0.8);
    padding: 2px 4px;
    border-radius: 2px;
  }

  :global([data-theme='dark']) .highlight-overlay :global(mark) {
    color: darkblue;
  }

  .highlight-overlay :global(.highlight-extract) {
    background-color: transparent;
    border: 2px solid hotpink;
    padding: 0px 2px;
    border-radius: 2px;
    display: inline;
  }

  .empty-state {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--surface-color);
    border: 1px dashed var(--border-color);
    border-radius: 10px;
    padding: 20px 24px;
    max-width: 320px;
    width: calc(100% - 48px);
    box-shadow: 0 10px 32px rgba(0, 0, 0, 0.1);
    text-align: center;
    color: var(--text-secondary);
    z-index: 2;
  }

  .empty-state:focus-within {
    border-color: var(--primary-color);
  }

  .empty-message {
    margin: 0;
    font-size: 14px;
    line-height: 1.4;
  }

  .empty-actions {
    margin-top: 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
  }

  .empty-action {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    background: var(--hover-bg);
    color: var(--text-primary);
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
  }

  .empty-action:hover,
  .empty-action:focus-visible {
    background: rgba(59, 130, 246, 0.12);
    border-color: var(--primary-color);
    color: var(--primary-color);
  }

  .examples-group {
    position: relative;
  }

  .examples-toggle {
    padding-right: 32px;
  }

  .examples-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    min-width: 240px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    z-index: 3;
  }

  .examples-item {
    text-align: left;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    padding: 8px 10px;
    border-radius: 6px;
    background: transparent;
    border: none;
    color: var(--text-primary);
    cursor: pointer;
    transition:
      background-color 0.2s,
      color 0.2s;
    font-size: 13px;
  }

  .examples-item:hover,
  .examples-item:focus-visible {
    background: rgba(59, 130, 246, 0.12);
    color: var(--primary-color);
  }

  .example-label {
    font-weight: 600;
  }

  .example-description {
    font-size: 12px;
    color: var(--text-secondary);
  }

  @media (max-width: 640px) {
    .empty-state {
      padding: 16px 18px;
      max-width: 90%;
    }

    .empty-actions {
      flex-direction: column;
      gap: 8px;
    }

    .examples-dropdown {
      left: 0;
      transform: translateX(0);
      right: 0;
    }
  }

  .drag-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(59, 130, 246, 0.1);
    backdrop-filter: blur(2px);
  }

  .drag-message {
    padding: 24px;
    border-radius: 8px;
    background: var(--surface-color);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    font-size: 18px;
    color: var(--text-primary);
  }

  .stats-bar {
    display: flex;
    gap: 16px;
    padding: 8px 16px;
    background: var(--stats-bg);
    border-top: 1px solid var(--border-color);
    font-size: 12px;
    font-family: 'Courier New', monospace;
  }

  .stat {
    color: var(--text-secondary);
  }

  .stat.clickable {
    cursor: pointer;
    transition: color 0.2s;
  }

  .stat.clickable:hover {
    color: var(--primary-color);
  }

  .error-notification {
    position: absolute;
    bottom: 50px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(239, 68, 68, 0.95);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    font-size: 14px;
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
    max-width: 80%;
    text-align: center;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  .wrap-measure {
    position: absolute;
    visibility: hidden;
    pointer-events: none;
    white-space: pre-wrap;
    top: -9999px;
    left: -9999px;
    padding: 0;
    border: 0;
  }
</style>
