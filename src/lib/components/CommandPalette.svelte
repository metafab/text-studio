<script lang="ts">
  import { onMount } from 'svelte'
  import { isMacPlatform as detectMacPlatform } from '../platform'

  export interface CommandPaletteCommand {
    id: string
    label: string
    description?: string
    group?: string
    shortcut?: string
    run: (modifier?: 'shift' | 'alt') => void
    disabled?: boolean
  }

  interface EnhancedCommand extends CommandPaletteCommand {
    searchable: string
  }

  interface Props {
    open: boolean
    commands: CommandPaletteCommand[]
    close: () => void
  }

  let { open, commands, close }: Props = $props()

  let searchQuery = $state('')
  let highlightedIndex = $state(0)
  let searchInput = $state<HTMLInputElement>()
  let listElement = $state<HTMLDivElement>()
  let recentCommandIds = $state<string[]>([])

  const RECENT_STORAGE_KEY = 'text-studio-command-palette-recent'

  let preparedCommands = $derived(
    commands.map((command) => ({
      ...command,
      searchable:
        `${command.label} ${command.description ?? ''} ${command.group ?? ''}`.toLowerCase(),
    })) as EnhancedCommand[]
  )

  let filteredCommands = $derived(
    preparedCommands.filter((command) => {
      const query = searchQuery.trim().toLowerCase()
      if (!query) {
        return true
      }
      return command.searchable.includes(query)
    })
  )

  let visibleCommands = $derived.by(() => {
    const list = filteredCommands
    if (!list.length) {
      return list
    }
    if (!recentCommandIds.length) {
      return list
    }

    const recentPriority = new Map<string, number>()
    let rank = 0
    for (const id of recentCommandIds) {
      for (const command of list) {
        if (command.id === id) {
          recentPriority.set(id, rank)
          rank += 1
          break
        }
      }
    }

    if (recentPriority.size === 0) {
      return list
    }

    const sorted = [...list]
    sorted.sort((a, b) => {
      const aRank = recentPriority.has(a.id) ? recentPriority.get(a.id)! : Number.MAX_SAFE_INTEGER
      const bRank = recentPriority.has(b.id) ? recentPriority.get(b.id)! : Number.MAX_SAFE_INTEGER
      if (aRank !== bRank) {
        return aRank - bRank
      }
      return a.label.localeCompare(b.label)
    })

    return sorted
  })

  let isMacPlatform = $derived(detectMacPlatform())
  let altKeyLabel = $derived(isMacPlatform ? 'Option' : 'Alt')

  function getFirstEnabledIndex(list: EnhancedCommand[]) {
    for (let i = 0; i < list.length; i += 1) {
      if (!list[i].disabled) {
        return i
      }
    }
    return list.length ? 0 : -1
  }

  function getLastEnabledIndex(list: EnhancedCommand[]) {
    for (let i = list.length - 1; i >= 0; i -= 1) {
      if (!list[i].disabled) {
        return i
      }
    }
    return list.length ? list.length - 1 : -1
  }

  function focusSearchInput() {
    requestAnimationFrame(() => {
      searchInput?.focus()
      searchInput?.select()
    })
  }

  function recordRecent(commandId: string) {
    const validIds = new Set(preparedCommands.map((command) => command.id))
    if (!validIds.has(commandId)) {
      return
    }
    const next = [
      commandId,
      ...recentCommandIds.filter((id) => id !== commandId && validIds.has(id)),
    ]
    recentCommandIds = next.slice(0, 20)
  }

  onMount(() => {
    if (typeof localStorage === 'undefined') {
      return
    }
    try {
      const stored = localStorage.getItem(RECENT_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          const initial = parsed.filter((value): value is string => typeof value === 'string')
          if (initial.length) {
            recentCommandIds = initial.slice(0, 20)
          }
        }
      }
    } catch (error) {
      console.warn('Failed to restore recent commands', error)
    }
  })

  $effect(() => {
    const validIds = new Set(preparedCommands.map((command) => command.id))
    const filtered = recentCommandIds.filter((id) => validIds.has(id))
    if (filtered.length !== recentCommandIds.length) {
      recentCommandIds = filtered
    }
  })

  $effect(() => {
    if (typeof localStorage === 'undefined') {
      return
    }
    try {
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recentCommandIds))
    } catch (error) {
      console.warn('Failed to persist recent commands', error)
    }
  })

  let wasOpen = $state(false)

  $effect(() => {
    if (open && !wasOpen) {
      searchQuery = ''
      highlightedIndex = getFirstEnabledIndex(visibleCommands)
      focusSearchInput()
    }
    wasOpen = open
  })

  $effect(() => {
    if (!open) {
      return
    }
    const list = visibleCommands
    if (!list.length) {
      highlightedIndex = -1
      return
    }
    if (
      highlightedIndex < 0 ||
      highlightedIndex >= list.length ||
      list[highlightedIndex]?.disabled
    ) {
      highlightedIndex = getFirstEnabledIndex(list)
    }
  })

  $effect(() => {
    if (!open) {
      return
    }
    if (highlightedIndex < 0) {
      return
    }
    const list = visibleCommands
    const active = list[highlightedIndex]
    if (!active) {
      return
    }
    const element = listElement?.querySelector<HTMLButtonElement>(
      `[data-command-id="${active.id}"]`
    )
    element?.scrollIntoView({ block: 'nearest' })
  })

  function moveHighlight(direction: 1 | -1) {
    const list = visibleCommands
    if (!list.length) {
      highlightedIndex = -1
      return
    }
    if (highlightedIndex === -1) {
      highlightedIndex = direction === 1 ? getFirstEnabledIndex(list) : getLastEnabledIndex(list)
      return
    }
    let nextIndex = highlightedIndex
    for (let i = 0; i < list.length; i += 1) {
      nextIndex = direction === 1 ? nextIndex + 1 : nextIndex - 1
      if (nextIndex < 0) {
        nextIndex = list.length - 1
      } else if (nextIndex >= list.length) {
        nextIndex = 0
      }
      if (!list[nextIndex].disabled) {
        highlightedIndex = nextIndex
        return
      }
    }
  }

  function executeCommand(command: CommandPaletteCommand | undefined, modifier?: 'shift' | 'alt') {
    if (!command || command.disabled) {
      return
    }
    try {
      command.run(modifier)
      recordRecent(command.id)
    } catch (error) {
      console.error('Command palette command failed', error)
    } finally {
      close()
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!open) {
      return
    }
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault()
        moveHighlight(1)
        break
      }
      case 'ArrowUp': {
        event.preventDefault()
        moveHighlight(-1)
        break
      }
      case 'Tab': {
        event.preventDefault()
        moveHighlight(event.shiftKey ? -1 : 1)
        break
      }
      case 'Enter': {
        event.preventDefault()
        const modifier = event.altKey ? 'alt' : event.shiftKey ? 'shift' : undefined
        executeCommand(visibleCommands[highlightedIndex], modifier)
        break
      }
      case 'Escape': {
        event.preventDefault()
        close()
        break
      }
      default:
        break
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      close()
    }
  }
</script>

{#if open}
  <div class="palette-backdrop" role="presentation" onclick={handleBackdropClick}>
    <div
      class="palette-container"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      tabindex="-1"
      onkeydown={handleKeydown}
    >
      <input
        class="palette-search"
        type="text"
        placeholder="Type a command..."
        bind:value={searchQuery}
        bind:this={searchInput}
        aria-label="Search commands"
      />
      <p class="palette-tip" role="note">
        Tip: Shift+Enter sends output to the Result pane. {altKeyLabel}+Enter sends it to the
        opposite pane.
      </p>
      <div class="palette-results" role="listbox" bind:this={listElement}>
        {#if visibleCommands.length === 0}
          <div class="palette-empty" role="option" aria-disabled="true" aria-selected="false">
            No commands found
          </div>
        {:else}
          {#each visibleCommands as command, index (command.id)}
            <button
              type="button"
              class="palette-item"
              class:active={index === highlightedIndex && !command.disabled}
              class:disabled={command.disabled}
              data-command-id={command.id}
              role="option"
              aria-selected={index === highlightedIndex}
              aria-disabled={Boolean(command.disabled)}
              onmousedown={(event) => event.preventDefault()}
              onclick={(event) => {
                const modifier = event.altKey ? 'alt' : event.shiftKey ? 'shift' : undefined
                executeCommand(command, modifier)
              }}
            >
              <div class="palette-item-main">
                <span class="palette-item-label">{command.label}</span>
                {#if command.shortcut}
                  <span class="palette-item-shortcut">{command.shortcut}</span>
                {/if}
              </div>
              <div class="palette-item-meta">
                {#if command.group}
                  <span class="palette-item-group">{command.group}</span>
                {/if}
                {#if command.description}
                  <span class="palette-item-description">{command.description}</span>
                {/if}
              </div>
            </button>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .palette-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 80px 16px 16px;
    z-index: 2000;
  }

  .palette-container {
    width: min(640px, 100%);
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: 0 24px 48px rgba(15, 23, 42, 0.4);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .palette-search {
    width: 100%;
    padding: 12px 14px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--background-color);
    color: var(--text-primary);
    font-size: 15px;
  }

  .palette-search:focus {
    outline: 2px solid var(--primary-color);
    outline-offset: 1px;
  }

  .palette-tip {
    margin: 0;
    font-size: 12px;
    color: var(--text-secondary);
  }

  .palette-results {
    max-height: 320px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .palette-item {
    width: 100%;
    text-align: left;
    background: transparent;
    border: none;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    color: var(--text-primary);
    cursor: pointer;
    border-radius: 8px;
    transition: background 0.15s ease;
  }

  .palette-item:hover:not(.disabled),
  .palette-item.active:not(.disabled) {
    background: var(--hover-bg);
  }

  .palette-item.disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .palette-item-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    font-weight: 600;
    font-size: 14px;
  }

  .palette-item-meta {
    display: flex;
    gap: 12px;
    align-items: baseline;
    font-size: 12px;
    color: var(--text-secondary);
  }

  .palette-item-group {
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .palette-item-shortcut {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 12px;
    color: var(--text-secondary);
    background: rgba(148, 163, 184, 0.12);
    padding: 2px 6px;
    border-radius: 6px;
  }

  .palette-item-description {
    flex: 1;
  }

  .palette-empty {
    padding: 24px 12px;
    text-align: center;
    color: var(--text-secondary);
    font-size: 14px;
  }

  @media (max-width: 600px) {
    .palette-container {
      padding: 12px;
      gap: 10px;
    }

    .palette-search {
      padding: 10px 12px;
      font-size: 14px;
    }

    .palette-tip {
      font-size: 11px;
    }

    .palette-item {
      padding: 10px;
    }
  }
</style>
