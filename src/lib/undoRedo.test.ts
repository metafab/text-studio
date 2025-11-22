import { describe, expect, it } from 'vitest'
import {
  addToHistory,
  canRedo,
  canUndo,
  createInitialHistory,
  jumpToHistory,
  type HistoryEntry,
  type HistoryState,
  redo,
  undo,
} from '../lib/undoRedo'

describe('Undo/Redo Functionality', () => {
  describe('createInitialHistory', () => {
    it('should create initial history state', () => {
      const history = createInitialHistory()
      expect(history.past).toEqual([])
      expect(history.present.value).toBe('')
      expect(history.present.label).toBe('Initial state')
      expect(history.future).toEqual([])
    })
  })

  describe('canUndo', () => {
    it('should return false for initial history', () => {
      const history = createInitialHistory()
      expect(canUndo(history)).toBe(false)
    })

    it('should return true when there are past states', () => {
      const history: HistoryState = {
        past: [createEntry('previous')],
        present: createEntry('current'),
        future: [],
      }
      expect(canUndo(history)).toBe(true)
    })
  })

  describe('canRedo', () => {
    it('should return false for initial history', () => {
      const history = createInitialHistory()
      expect(canRedo(history)).toBe(false)
    })

    it('should return true when there are future states', () => {
      const history: HistoryState = {
        past: [],
        present: createEntry('current'),
        future: [createEntry('next')],
      }
      expect(canRedo(history)).toBe(true)
    })
  })

  describe('addToHistory', () => {
    it('should add new value to history', () => {
      let history = createInitialHistory()
      history = addToHistory(history, 'first', { label: 'First value' })

      expect(history.past).toHaveLength(1)
      expect(history.past[0].value).toBe('')
      expect(history.present.value).toBe('first')
      expect(history.present.label).toBe('First value')
      expect(history.future).toEqual([])
    })

    it('should not add duplicate values', () => {
      let history = createInitialHistory()
      history = addToHistory(history, 'test', { label: 'Test value' })
      const beforeDuplicate = { ...history }
      history = addToHistory(history, 'test', { label: 'Duplicate attempt' })

      expect(history).toEqual(beforeDuplicate)
    })

    it('should clear future when adding new value', () => {
      let history: HistoryState = {
        past: [createEntry('first')],
        present: createEntry('second'),
        future: [createEntry('third'), createEntry('fourth')],
      }

      history = addToHistory(history, 'new', { label: 'New value' })

      expect(history.past.map((entry) => entry.value)).toEqual(['first', 'second'])
      expect(history.future).toEqual([])
      expect(history.present.value).toBe('new')
      expect(history.present.label).toBe('New value')
    })

    it('should build up history correctly', () => {
      let history = createInitialHistory()
      history = addToHistory(history, 'first', { label: 'First' })
      history = addToHistory(history, 'second', { label: 'Second' })
      history = addToHistory(history, 'third', { label: 'Third' })

      expect(history.past.map((entry) => entry.value)).toEqual(['', 'first', 'second'])
      expect(history.present.value).toBe('third')
      expect(history.future).toEqual([])
    })
  })

  describe('undo', () => {
    it('should not change history when cannot undo', () => {
      const history = createInitialHistory()
      const result = undo(history)
      expect(result).toEqual(history)
    })

    it('should undo to previous state', () => {
      const history: HistoryState = {
        past: [createEntry('first'), createEntry('second')],
        present: createEntry('third'),
        future: [],
      }

      const result = undo(history)

      expect(result.past.map((entry) => entry.value)).toEqual(['first'])
      expect(result.present.value).toBe('second')
      expect(result.future.map((entry) => entry.value)).toEqual(['third'])
    })

    it('should work with single past state', () => {
      const history: HistoryState = {
        past: [createEntry('first')],
        present: createEntry('second'),
        future: [],
      }

      const result = undo(history)

      expect(result.past).toEqual([])
      expect(result.present.value).toBe('first')
      expect(result.future.map((entry) => entry.value)).toEqual(['second'])
    })

    it('should preserve existing future states', () => {
      const history: HistoryState = {
        past: [createEntry('first')],
        present: createEntry('second'),
        future: [createEntry('third'), createEntry('fourth')],
      }

      const result = undo(history)

      expect(result.past).toEqual([])
      expect(result.present.value).toBe('first')
      expect(result.future.map((entry) => entry.value)).toEqual(['second', 'third', 'fourth'])
    })
  })

  describe('redo', () => {
    it('should not change history when cannot redo', () => {
      const history = createInitialHistory()
      const result = redo(history)
      expect(result).toEqual(history)
    })

    it('should redo to next state', () => {
      const history: HistoryState = {
        past: [],
        present: createEntry('first'),
        future: [createEntry('second'), createEntry('third')],
      }

      const result = redo(history)

      expect(result.past.map((entry) => entry.value)).toEqual(['first'])
      expect(result.present.value).toBe('second')
      expect(result.future.map((entry) => entry.value)).toEqual(['third'])
    })

    it('should work with single future state', () => {
      const history: HistoryState = {
        past: [],
        present: createEntry('first'),
        future: [createEntry('second')],
      }

      const result = redo(history)

      expect(result.past.map((entry) => entry.value)).toEqual(['first'])
      expect(result.present.value).toBe('second')
      expect(result.future).toEqual([])
    })

    it('should preserve existing past states', () => {
      const history: HistoryState = {
        past: [createEntry('first'), createEntry('second')],
        present: createEntry('third'),
        future: [createEntry('fourth')],
      }

      const result = redo(history)

      expect(result.past.map((entry) => entry.value)).toEqual(['first', 'second', 'third'])
      expect(result.present.value).toBe('fourth')
      expect(result.future).toEqual([])
    })
  })

  describe('undo/redo integration', () => {
    it('should support multiple undo/redo operations', () => {
      let history = createInitialHistory()

      // Build up history
      history = addToHistory(history, 'a', { label: 'a' })
      history = addToHistory(history, 'b', { label: 'b' })
      history = addToHistory(history, 'c', { label: 'c' })

      expect(history.present.value).toBe('c')
      expect(canUndo(history)).toBe(true)
      expect(canRedo(history)).toBe(false)

      // Undo twice
      history = undo(history)
      expect(history.present.value).toBe('b')
      expect(canUndo(history)).toBe(true)
      expect(canRedo(history)).toBe(true)

      history = undo(history)
      expect(history.present.value).toBe('a')
      expect(canUndo(history)).toBe(true)
      expect(canRedo(history)).toBe(true)

      // Redo once
      history = redo(history)
      expect(history.present.value).toBe('b')
      expect(canUndo(history)).toBe(true)
      expect(canRedo(history)).toBe(true)

      // Add new value (should clear future)
      history = addToHistory(history, 'd', { label: 'd' })
      expect(history.present.value).toBe('d')
      expect(canUndo(history)).toBe(true)
      expect(canRedo(history)).toBe(false)
    })

    it('should handle edge case of undoing to beginning', () => {
      let history = createInitialHistory()
      history = addToHistory(history, 'first', { label: 'first' })

      // Undo to initial state
      history = undo(history)
      expect(history.present.value).toBe('')
      expect(canUndo(history)).toBe(false)
      expect(canRedo(history)).toBe(true)

      // Try to undo again (should not change)
      const beforeUndo = { ...history }
      history = undo(history)
      expect(history).toEqual(beforeUndo)
    })
  })

  describe('jumpToHistory', () => {
    it('should jump to the specified history index', () => {
      let history = createInitialHistory()
      history = addToHistory(history, 'first', { label: 'first' })
      history = addToHistory(history, 'second', { label: 'second' })
      history = addToHistory(history, 'third', { label: 'third' })

      const result = jumpToHistory(history, 1)
      expect(result.present.value).toBe('first')
      expect(result.future.map((entry) => entry.value)).toEqual(['second', 'third'])
    })

    it('should clamp index bounds', () => {
      let history = createInitialHistory()
      history = addToHistory(history, 'first', { label: 'first' })
      history = addToHistory(history, 'second', { label: 'second' })

      const below = jumpToHistory(history, -10)
      expect(below.present.value).toBe('')

      const above = jumpToHistory(history, 100)
      expect(above.present.value).toBe('second')
    })
  })
})

function createEntry(value: string, label = 'manual'): HistoryEntry {
  return {
    value,
    label,
    timestamp: Date.now(),
  }
}
