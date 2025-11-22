import { saveAs } from 'file-saver'

export function downloadText(content: string, filename: string = 'text-file.txt'): void {
  try {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    saveAs(blob, filename)
  } catch (error) {
    throw new Error(
      `Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    if (!navigator.clipboard) {
      throw new Error('Clipboard API not available')
    }
    await navigator.clipboard.writeText(text)
  } catch (error) {
    throw new Error(
      `Failed to copy to clipboard: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

export async function readClipboardText(): Promise<string> {
  try {
    if (!navigator.clipboard || typeof navigator.clipboard.readText !== 'function') {
      throw new Error('Clipboard read not available. Try Cmd/Ctrl+V instead.')
    }

    return await navigator.clipboard.readText()
  } catch (error) {
    throw new Error(
      `Failed to read clipboard: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'))
      return
    }

    // Check file size (e.g., 10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        resolve(result)
      } else {
        reject(new Error('Failed to read file as text'))
      }
    }
    reader.onerror = () =>
      reject(new Error(`Failed to read file: ${reader.error?.message || 'Unknown error'}`))
    reader.readAsText(file)
  })
}

export function handleDragOver(event: DragEvent): void {
  event.preventDefault()
  event.stopPropagation()
}

export function handleDrop(event: DragEvent): Promise<string[]> {
  event.preventDefault()
  event.stopPropagation()

  const files = Array.from(event.dataTransfer?.files || [])
  const textFiles = files

  return Promise.all(textFiles.map(readFileAsText))
}
