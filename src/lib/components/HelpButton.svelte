<script lang="ts">
  function openHelp() {
    window.open('/help.html', '_blank')
  }
</script>

<button class="help-button" onclick={openHelp} title="Help & Documentation (opens in new tab)">
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2" />
    <path
      d="M10 14V14.01M10 11C10 11 10 10.5 10 10C10 9 11 9 11 8C11 7 10 6 9 6C8 6 7.5 6.5 7.5 7.5"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    />
  </svg>
  <span>Help</span>
</button>

<style>
  .help-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--surface-color);
    color: var(--text-primary);
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
  }

  .help-button:hover {
    background: var(--hover-bg);
    border-color: var(--primary-color);
    color: var(--primary-color);
  }

  .help-button svg {
    flex-shrink: 0;
  }

  @media (max-width: 480px) {
    .help-button span {
      display: none;
    }

    .help-button {
      padding: 8px 12px;
    }
  }
</style>
