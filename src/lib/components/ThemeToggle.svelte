<script lang="ts">
  import { theme } from '../stores'

  let currentTheme = $state('light')

  // Subscribe to theme store and keep local state in sync
  $effect(() => {
    const unsubscribe = theme.subscribe((value) => {
      currentTheme = value
    })
    return unsubscribe
  })

  function toggleTheme() {
    theme.update((t) => (t === 'light' ? 'dark' : 'light'))
  }
</script>

<button class="theme-toggle" onclick={toggleTheme} title="Toggle theme">
  {currentTheme === 'light' ? '🌙' : '☀️'}
</button>

<style>
  .theme-toggle {
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--surface-color);
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s;
  }

  .theme-toggle:hover {
    background: var(--hover-bg);
  }
</style>
