<script lang="ts">
  import {
    getCommonLines,
    getLeftOnlyLines,
    getRightOnlyLines,
    getUniqueLines,
    highlightCommonLines,
  } from '../textProcessing'
  import { type HistoryUpdateOptions } from '../undoRedo'
  import CommandButton from './CommandButton.svelte'

  interface Props {
    leftText: string
    rightText: string
    resultText: string
    leftSearchHighlight?: string
    rightSearchHighlight?: string
    currentIgnoreCase: boolean
    setLeftText: (text: string, options?: HistoryUpdateOptions) => void
    setRightText: (text: string, options?: HistoryUpdateOptions) => void
    setResultText: (text: string, options?: HistoryUpdateOptions) => void
  }

  let {
    leftText,
    rightText,
    resultText,
    leftSearchHighlight = $bindable(''),
    rightSearchHighlight = $bindable(''),
    currentIgnoreCase,
    setLeftText,
    setRightText,
    setResultText,
  }: Props = $props()

  // Comparison commands
  function extractCommon() {
    setResultText(getCommonLines(leftText, rightText, currentIgnoreCase), {
      label: 'Extract common lines',
    })
  }

  function extractLeftOnly() {
    setResultText(getLeftOnlyLines(leftText, rightText, currentIgnoreCase), {
      label: 'Extract A-only lines',
    })
  }

  function extractRightOnly() {
    setResultText(getRightOnlyLines(leftText, rightText, currentIgnoreCase), {
      label: 'Extract B-only lines',
    })
  }

  function extractUnique() {
    setResultText(getUniqueLines(leftText, rightText, currentIgnoreCase), {
      label: 'Extract unique lines',
    })
  }

  // Highlighting commands
  function highlightLeftCommon() {
    leftSearchHighlight = highlightCommonLines(leftText, rightText, true, currentIgnoreCase)
  }

  function highlightLeftDifferent() {
    leftSearchHighlight = highlightCommonLines(leftText, rightText, false, currentIgnoreCase)
  }

  function highlightRightCommon() {
    rightSearchHighlight = highlightCommonLines(rightText, leftText, true, currentIgnoreCase)
  }

  function highlightRightDifferent() {
    rightSearchHighlight = highlightCommonLines(rightText, leftText, false, currentIgnoreCase)
  }

  // Transfer commands
  function copyAToB() {
    setRightText(leftText, { label: 'Copy A to B' })
  }

  function copyBToA() {
    setLeftText(rightText, { label: 'Copy B to A' })
  }

  function swapAB() {
    const tempText = leftText
    setLeftText(rightText, { label: 'Swap A ↔ B' })
    setRightText(tempText, { label: 'Swap A ↔ B' })
  }

  function copyResultToA() {
    setLeftText(resultText, { label: 'Copy Result to A' })
  }

  function copyResultToB() {
    setRightText(resultText, { label: 'Copy Result to B' })
  }

  function concatenateAB() {
    setResultText(`${leftText}\n${rightText}`, { label: 'Concatenate A + B' })
  }

  function concatenateBA() {
    setResultText(`${rightText}\n${leftText}`, { label: 'Concatenate B + A' })
  }
</script>

<div class="command-section">
  <h4 class="section-title">Line Comparison</h4>
  <div class="command-grid">
    <CommandButton
      icon="∩"
      label="Common"
      tooltip="Extract lines that appear in both panel A and panel B"
      action={extractCommon}
      disabled={!leftText.trim() || !rightText.trim()}
    />
    <CommandButton
      icon="⊖"
      label="A Only"
      tooltip="Extract lines that appear only in panel A (not in panel B)"
      action={extractLeftOnly}
      disabled={!leftText.trim() || !rightText.trim()}
    />
    <CommandButton
      icon="⊕"
      label="B Only"
      tooltip="Extract lines that appear only in panel B (not in panel A)"
      action={extractRightOnly}
      disabled={!leftText.trim() || !rightText.trim()}
    />
    <CommandButton
      icon="⊗"
      label="Unique"
      tooltip="Extract lines that appear in either panel A or B, but not both"
      action={extractUnique}
      disabled={!leftText.trim() || !rightText.trim()}
    />
  </div>
</div>

<div class="command-section">
  <h4 class="section-title">Highlighting</h4>
  <div class="command-grid">
    <CommandButton
      icon="🎯"
      label="A Common"
      tooltip="Highlight lines in panel A that also appear in panel B"
      action={highlightLeftCommon}
      disabled={!leftText.trim() || !rightText.trim()}
    />
    <CommandButton
      icon="🔍"
      label="A Different"
      tooltip="Highlight lines in panel A that do not appear in panel B"
      action={highlightLeftDifferent}
      disabled={!leftText.trim() || !rightText.trim()}
    />
    <CommandButton
      icon="🎯"
      label="B Common"
      tooltip="Highlight lines in panel B that also appear in panel A"
      action={highlightRightCommon}
      disabled={!leftText.trim() || !rightText.trim()}
    />
    <CommandButton
      icon="🔍"
      label="B Different"
      tooltip="Highlight lines in panel B that do not appear in panel A"
      action={highlightRightDifferent}
      disabled={!leftText.trim() || !rightText.trim()}
    />
  </div>
</div>

<div class="command-section">
  <h4 class="section-title">Content Transfer</h4>
  <div class="command-grid">
    <CommandButton
      icon="➡️"
      label="A → B"
      tooltip="Copy content from panel A to panel B"
      action={copyAToB}
      disabled={!leftText.trim()}
    />
    <CommandButton
      icon="⬅️"
      label="B → A"
      tooltip="Copy content from panel B to panel A"
      action={copyBToA}
      disabled={!rightText.trim()}
    />
    <CommandButton
      icon="↔️"
      label="A ↔ B"
      tooltip="Swap the contents of panel A and panel B"
      action={swapAB}
      disabled={!leftText.trim() && !rightText.trim()}
    />
    <CommandButton
      icon="📋"
      label="Result → A"
      tooltip="Copy the result content to panel A"
      action={copyResultToA}
      disabled={!resultText.trim()}
    />
    <CommandButton
      icon="📋"
      label="Result → B"
      tooltip="Copy the result content to panel B"
      action={copyResultToB}
      disabled={!resultText.trim()}
    />
    <CommandButton
      icon="+"
      label="A + B"
      tooltip="Concatenate panel A followed by panel B to the result"
      action={concatenateAB}
      disabled={!leftText.trim() && !rightText.trim()}
    />
    <CommandButton
      icon="+"
      label="B + A"
      tooltip="Concatenate panel B followed by panel A to the result"
      action={concatenateBA}
      disabled={!leftText.trim() && !rightText.trim()}
    />
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

  .command-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
