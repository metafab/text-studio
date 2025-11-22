import { writable } from 'svelte/store'

// Search mode types
export type SearchMode = 'standard' | 'like' | 'regex'

// Global state stores (will be migrated to runes in components)
export const theme = writable<'light' | 'dark'>('light')
export const fontFamily = writable<string>('Inter')
export const fontSize = writable<number>(14)
export const ignoreCase = writable<boolean>(true)
export const includeLineBreaks = writable<boolean>(false)
export const showLineNumbers = writable<boolean>(false)
export const showWordWrap = writable<boolean>(true)
export const outputDestination = writable<'active' | 'result'>('active')
export const searchMode = writable<SearchMode>('standard')

// Initialize theme from system preference
if (typeof window !== 'undefined') {
  const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
  theme.set(darkMode ? 'dark' : 'light')
}
