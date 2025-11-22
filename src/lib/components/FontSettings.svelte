<script lang="ts">
  import { autoPlacement, computePosition, offset, shift } from '@floating-ui/dom'
  import { fontFamily, fontSize } from '../stores'

  let isOpen = $state(false)
  let button = $state<HTMLButtonElement>()
  let dropdown = $state<HTMLDivElement>()

  // Subscribe to stores and keep local state in sync
  let currentFontFamily = $state('Inter')
  let currentFontSize = $state(14)

  $effect(() => {
    const unsubscribeFontFamily = fontFamily.subscribe((value) => {
      currentFontFamily = value
    })
    const unsubscribeFontSize = fontSize.subscribe((value) => {
      currentFontSize = value
    })
    return () => {
      unsubscribeFontFamily()
      unsubscribeFontSize()
    }
  })

  const fontFamilies = [
    { value: 'Inter', label: 'Inter' },
    {
      value:
        'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
      label: 'Monospace',
    },
    { value: 'ui-sans-serif, system-ui, sans-serif', label: 'Sans Serif' },
    { value: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif', label: 'Serif' },
  ]

  const fontSizes = [
    { value: '12px', label: 'Small' },
    { value: '14px', label: 'Medium' },
    { value: '16px', label: 'Large' },
    { value: '18px', label: 'Extra Large' },
  ]

  function toggleDropdown() {
    isOpen = !isOpen
    if (isOpen && button && dropdown) {
      setTimeout(updatePosition, 0)
    }
  }

  async function updatePosition() {
    if (!button || !dropdown) return

    const { x, y } = await computePosition(button, dropdown, {
      middleware: [offset(8), autoPlacement(), shift({ padding: 16 })],
    })

    dropdown.style.left = `${x}px`
    dropdown.style.top = `${y}px`
  }

  function handleClickOutside(event: MouseEvent) {
    if (
      isOpen &&
      button &&
      dropdown &&
      !button.contains(event.target as Node) &&
      !dropdown.contains(event.target as Node)
    ) {
      isOpen = false
    }
  }

  function updateFontFamily(value: string) {
    fontFamily.set(value)
  }

  function updateFontSize(value: string) {
    fontSize.set(parseInt(value))
  }
</script>

<svelte:window onclick={handleClickOutside} />

<div class="font-settings">
  <button
    bind:this={button}
    onclick={toggleDropdown}
    class="gear-button"
    title="Font Settings"
    type="button"
  >
    ⚙️
  </button>

  {#if isOpen}
    <div bind:this={dropdown} class="dropdown">
      <div class="dropdown-content">
        <div class="setting-group">
          <label for="font-family">Font Family:</label>
          <select
            id="font-family"
            value={currentFontFamily}
            onchange={(e) => updateFontFamily((e.target as HTMLSelectElement).value)}
          >
            {#each fontFamilies as font}
              <option value={font.value}>{font.label}</option>
            {/each}
          </select>
        </div>

        <div class="setting-group">
          <label for="font-size">Font Size:</label>
          <select
            id="font-size"
            value={currentFontSize}
            onchange={(e) => updateFontSize((e.target as HTMLSelectElement).value)}
          >
            {#each fontSizes as size}
              <option value={parseInt(size.value)}>{size.label}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .font-settings {
    position: relative;
  }

  .gear-button {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .gear-button:hover {
    background-color: var(--hover-bg);
  }

  .dropdown {
    position: fixed;
    z-index: 1000;
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 200px;
  }

  .dropdown-content {
    padding: 12px;
  }

  .setting-group {
    margin-bottom: 12px;
  }

  .setting-group:last-child {
    margin-bottom: 0;
  }

  .setting-group label {
    display: block;
    margin-bottom: 4px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .setting-group select {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--input-bg);
    color: var(--text-primary);
    font-size: 14px;
  }

  .setting-group select:focus {
    outline: none;
    border-color: var(--primary-color);
  }
</style>
