<script lang="ts">
  interface Props {
    icon: string
    label: string
    action: (event?: MouseEvent) => void
    disabled?: boolean
    variant?: 'primary' | 'secondary' | 'danger'
    tooltip?: string
  }

  let {
    icon,
    label,
    action,
    disabled = false,
    variant = 'secondary',
    tooltip = '',
  }: Props = $props()

  function handleClick(event: MouseEvent) {
    // Close any open SplitButton dropdowns
    window.dispatchEvent(new CustomEvent('close-split-button-dropdown'))
    action(event)
  }
</script>

<button class="command-btn {variant}" {disabled} onclick={handleClick} title={tooltip || label}>
  <span class="icon">{icon}</span>
  <span class="label">{label}</span>
</button>

<style>
  .command-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px 16px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--surface-color);
    cursor: pointer;
    transition: all 0.2s;
    min-width: 80px;
  }

  .command-btn:hover:not(:disabled) {
    background: var(--hover-bg);
    border-color: var(--primary-color);
    transform: translateY(-1px);
  }

  .command-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .command-btn.primary {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  }

  .command-btn.primary:hover:not(:disabled) {
    background: var(--primary-hover);
    border-color: var(--primary-hover);
  }

  .command-btn.danger:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.1);
    border-color: #ef4444;
  }

  .icon {
    font-size: 20px;
    line-height: 1;
    color: var(--text-primary);
  }

  .label {
    font-size: 11px;
    font-weight: 500;
    text-align: center;
    line-height: 1.2;
    color: var(--text-secondary);
  }

  .primary .label {
    color: white;
  }
</style>
