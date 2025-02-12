import type { DirectoryEntry, FileEntry } from './types'

export async function readFile(fileHandle: FileSystemFileHandle) {
  const file = await fileHandle.getFile()
  const contents = await file.text()
  return contents
}

export async function readdir(directoryHandle?: FileSystemDirectoryHandle): Promise<Array<FileEntry | DirectoryEntry>> {
  if (!directoryHandle) {
    directoryHandle = await showDirectoryPicker()
  }

  const files: Array<FileEntry | DirectoryEntry> = []
  for await (const entry of directoryHandle.values()) {
    if (entry.kind === 'directory') {
      const subFiles = await readdir(entry as FileSystemDirectoryHandle)
      files.push({ kind: 'directory', name: entry.name, files: subFiles })
    } else if (entry.kind === 'file') {
      files.push({ kind: 'file', name: entry.name })
    }
  }

  return files
}
