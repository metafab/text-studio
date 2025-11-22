<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte'

  interface AltAction {
    label: string
    action: (event?: MouseEvent) => void
    tooltip?: string
  }

  interface Props {
    icon: string
    label: string
    mainAction: (event?: MouseEvent) => void
    altActions: AltAction[]
    disabled?: boolean
    variant?: 'primary' | 'secondary' | 'danger'
    tooltip?: string
  }

  let {
    icon,
    label,
    mainAction,
    altActions,
    disabled = false,
    variant = 'secondary',
    tooltip = '',
  }: Props = $props()

  const dispatch = createEventDispatcher()
  let isOpen = $state(false)
  let buttonElement: HTMLButtonElement | undefined = undefined
  let dropdownElement = $state<HTMLDivElement | undefined>(undefined)

  function handleMainClick(event: MouseEvent) {
    if (!disabled) {
      mainAction(event)
      dispatch('click', { type: 'main' })
    }
  }

  async function toggleDropdown() {
    if (disabled) return

    // Close other open dropdowns
    if (!isOpen) {
      window.dispatchEvent(new CustomEvent('close-split-button-dropdown'))
    }

    isOpen = !isOpen
    if (isOpen) await tick()
  }

  function handleCloseOtherDropdowns() {
    isOpen = false
  }

  function handleAltClick(altAction: AltAction, event: MouseEvent) {
    if (!disabled) {
      altAction.action(event)
      isOpen = false
      dispatch('click', { type: 'alt', label: altAction.label })
    }
  }

  function handleClickOutside(event: MouseEvent) {
    if (
      isOpen &&
      buttonElement &&
      !buttonElement.contains(event.target as Node) &&
      dropdownElement &&
      !dropdownElement.contains(event.target as Node)
    ) {
      isOpen = false
    }
  }

  $effect(() => {
    if (isOpen) {
      window.addEventListener('mousedown', handleClickOutside)
    } else {
      window.removeEventListener('mousedown', handleClickOutside)
    }
    return () => window.removeEventListener('mousedown', handleClickOutside)
  })

  $effect(() => {
    window.addEventListener('close-split-button-dropdown', handleCloseOtherDropdowns)
    return () =>
      window.removeEventListener('close-split-button-dropdown', handleCloseOtherDropdowns)
  })
</script>

<div class="split-button">
  <button
    class="split-main"
    onclick={handleMainClick}
    {disabled}
    aria-label={label}
    title={tooltip || label}
  >
    {#if icon}
      <span class="icon">{icon}</span>
    {/if}
    <span class="label">{label}</span>
  </button>
  <button
    class="split-dropdown"
    onclick={toggleDropdown}
    {disabled}
    aria-label="Show more actions"
    title="Show more actions"
  >
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 8L10 12L14 8"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>
  {#if isOpen}
    <div class="dropdown-menu" bind:this={dropdownElement}>
      {#each altActions as altAction}
        <button
          class="dropdown-item"
          onclick={(e) => handleAltClick(altAction, e)}
          {disabled}
          aria-label={altAction.label}
          title={altAction.tooltip || altAction.label}
        >
          {altAction.label}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .split-button {
    display: inline-flex;
    align-items: stretch;
    border-radius: 6px;
    overflow: visible;
    border: 1px solid var(--border-color);
    background: var(--surface-color);
    box-sizing: border-box;
    position: relative;
    font-family: inherit;
    transition: all 0.2s;
  }
  .split-button:hover {
    background: var(--hover-bg);
    border-color: var(--primary-color);
    transform: translateY(-1px);
  }
  .split-main {
    flex: 0 0 auto;
    width: 80px;
    padding: 12px 16px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 11px;
    font-family: inherit;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    white-space: normal;
    transition: background 0.15s;
    font-weight: 500;
    border-radius: 6px 0 0 6px;
    line-height: 1.2;
  }
  .split-main:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .split-dropdown {
    width: 32px;
    border: none;
    border-left: 1px solid var(--border-color);
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: background 0.15s;
    border-radius: 0 6px 6px 0;
  }
  .split-dropdown:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .split-main .icon {
    font-size: 20px;
    line-height: 1;
    color: var(--text-primary);
  }
  .split-main .label {
    font-size: 11px;
    font-weight: 500;
    text-align: center;
    line-height: 1.2;
    color: var(--text-secondary);
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .dropdown-menu {
    position: absolute;
    top: 110%;
    right: 0;
    min-width: 170px;
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.13);
    z-index: 1000;
    padding: 0.3em 0;
    animation: fadeIn 0.13s;
  }
  .dropdown-item {
    width: 100%;
    background: none;
    border: none;
    padding: 0.7em 1.2em;
    text-align: left;
    font-size: 11px;
    font-family: inherit;
    cursor: pointer;
    color: var(--text-secondary);
    border-radius: 3px;
    transition: background 0.13s;
    white-space: nowrap;
    font-weight: 500;
  }
  .dropdown-item:hover:not(:disabled) {
    background: var(--hover-bg);
  }
  .dropdown-item:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
