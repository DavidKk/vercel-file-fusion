import type { FileContent } from './types'
import { showDirectoryPicker } from './common'

export interface WritableFile {
  name: string
  content: FileContent
}

/**
 * Checks if the directory handle has write permission
 */
export async function isWriteableDirectoryHandle(handle: FileSystemDirectoryHandle) {
  let state = await handle.queryPermission({ mode: 'readwrite' })
  if (state === 'prompt') {
    state = await handle.requestPermission({ mode: 'readwrite' })
  }

  return state === 'granted'
}

export interface WriteFileOptions {
  /**
   * The size of each chunk when writing large files (in bytes).
   * Default is 8MB (8 * 1024 * 1024 bytes), which provides:
   * - Optimal memory usage: Prevents excessive memory consumption
   * - Browser compatibility: Works well across different browsers
   * - File system performance: Balances write speed and system load
   * - Progress feedback: Reasonable frequency for progress updates
   * - Error handling: Manageable chunk size for retry operations
   */
  chunkSize?: number
  onProgress?: (progress: number, total: number) => void
}

/**
 * Writes content to a file with optional progress tracking and chunked writing
 */
export async function writeFile(fileHandle: FileSystemFileHandle, content: FileContent, options: WriteFileOptions = {}) {
  const { chunkSize = 8 * 1024 * 1024, onProgress } = options || {}
  const writable = await fileHandle.createWritable()

  if (onProgress) {
    const totalSize =
      typeof content === 'string'
        ? content.length
        : content instanceof ArrayBuffer
          ? content.byteLength
          : content instanceof Blob
            ? content.size
            : content instanceof Uint8Array
              ? content.length
              : 0

    let writtenSize = 0
    while (writtenSize < totalSize) {
      const chunk = content.slice(writtenSize, writtenSize + chunkSize)
      await writable.write(chunk)

      writtenSize += chunkSize
      onProgress(writtenSize > totalSize ? totalSize : writtenSize, totalSize)
    }
  } else {
    await writable.write(content)
  }

  await writable.close()
}

export interface CreateFileAndWriteFileOptions extends WriteFileOptions {}

/**
 * Creates a new file using system file picker and writes content to it
 */
export async function createFileAndWriteFile(content: FileContent, options?: CreateFileAndWriteFileOptions) {
  if (!('showSaveFilePicker' in window)) {
    throw new Error('showSaveFilePicker is not supported in this browser.')
  }

  const fileHandle = await window.showSaveFilePicker()
  await writeFile(fileHandle, content, options)
}

export interface WriteFileToDirectoryOptions extends WriteFileOptions {
  directoryHandle?: FileSystemDirectoryHandle
}

/**
 * Writes content to a file in the specified directory, creating the directory structure if needed
 */
export async function writeFileToDirectory(name: string, content: FileContent, options?: WriteFileToDirectoryOptions) {
  const { directoryHandle = await showDirectoryPicker({ mode: 'readwrite' }) } = options || {}
  if (!(await isWriteableDirectoryHandle(directoryHandle))) {
    throw new Error('Permission denied for directory')
  }

  const filePathParts = name.split('/')
  const fileName = filePathParts.pop()!
  const fileDirectoryHandle = await getOrCreateDirectoryHandle(directoryHandle, filePathParts.join('/'))
  const fileHandle = await fileDirectoryHandle.getFileHandle(fileName, { create: true })

  try {
    await writeFile(fileHandle, content, options)
  } catch {
    throw new Error(`Write file ${name} fail`)
  }

  return fileHandle
}

export interface CreateDirectoryAndWriteFileOptions extends WriteFileOptions {
  directoryHandle?: FileSystemDirectoryHandle
}

/**
 * Creates a new directory and writes multiple files to it
 */
export async function createDirectoryAndWriteFile(directoryName: string, files: WritableFile[], options?: CreateDirectoryAndWriteFileOptions) {
  const { directoryHandle = await showDirectoryPicker({ mode: 'readwrite' }) } = options || {}
  if (!(await isWriteableDirectoryHandle(directoryHandle))) {
    throw new Error('Permission denied for directory')
  }

  const newDirectoryHandle = await getOrCreateDirectoryHandle(directoryHandle, directoryName)
  const handles: FileSystemFileHandle[] = []
  for await (const { name, content } of files) {
    const fileHandle = await writeFileToDirectory(name, content, {
      ...options,
      directoryHandle: newDirectoryHandle,
    })

    handles.push(fileHandle)
  }

  return handles
}

/**
 * Creates or retrieves directory handles for each segment of the provided path
 */
async function getOrCreateDirectoryHandle(directoryHandle: FileSystemDirectoryHandle, path: string): Promise<FileSystemDirectoryHandle> {
  if (!path) {
    return directoryHandle
  }

  const parts = path.split('/')

  let currentHandle = directoryHandle
  for await (const part of parts) {
    if (!(await isWriteableDirectoryHandle(currentHandle))) {
      throw new Error('Permission denied for directory')
    }

    currentHandle = await currentHandle.getDirectoryHandle(part, { create: true })
  }

  return currentHandle
}
