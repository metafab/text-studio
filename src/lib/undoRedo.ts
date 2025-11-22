export interface HistoryEntry {
  value: string
  label: string
  timestamp: number
}

export interface HistoryState {
  past: HistoryEntry[]
  present: HistoryEntry
  future: HistoryEntry[]
}

export interface UndoRedoManager {
  a: HistoryState
  b: HistoryState
  result: HistoryState
}

export interface HistoryUpdateOptions {
  label?: string
}

function createEntry(value: string, label: string): HistoryEntry {
  return {
    value,
    label,
    timestamp: Date.now(),
  }
}

export function createInitialHistory(initialValue = '', label = 'Initial state'): HistoryState {
  return {
    past: [],
    present: createEntry(initialValue, label),
    future: [],
  }
}

export function canUndo(history: HistoryState): boolean {
  return history.past.length > 0
}

export function canRedo(history: HistoryState): boolean {
  return history.future.length > 0
}

export function addToHistory(
  history: HistoryState,
  newValue: string,
  options: HistoryUpdateOptions = {},
): HistoryState {
  if (newValue === history.present.value) {
    return history
  }

  const label = options.label ?? 'Manual edit'

  return {
    past: [...history.past, history.present],
    present: createEntry(newValue, label),
    future: [],
  }
}

export function undo(history: HistoryState): HistoryState {
  if (!canUndo(history)) {
    return history
  }

  const previous = history.past[history.past.length - 1]
  const newPast = history.past.slice(0, -1)

  return {
    past: newPast,
    present: previous,
    future: [history.present, ...history.future],
  }
}

export function redo(history: HistoryState): HistoryState {
  if (!canRedo(history)) {
    return history
  }

  const next = history.future[0]
  const newFuture = history.future.slice(1)

  return {
    past: [...history.past, history.present],
    present: next,
    future: newFuture,
  }
}

export function jumpToHistory(history: HistoryState, index: number): HistoryState {
  const entries = [...history.past, history.present, ...history.future]
  if (entries.length === 0) {
    return history
  }

  const clampedIndex = Math.max(0, Math.min(entries.length - 1, index))
  const newPast = entries.slice(0, clampedIndex)
  const newPresent = entries[clampedIndex]
  const newFuture = entries.slice(clampedIndex + 1)

  return {
    past: newPast,
    present: newPresent,
    future: newFuture,
  }
}
