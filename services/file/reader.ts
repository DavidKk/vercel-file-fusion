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
      files.push({ kind: 'directory', name: entry.name, files: subFiles, handle: entry })
    } else if (entry.kind === 'file') {
      files.push({ kind: 'file', name: entry.name, handle: entry })
    }
  }

  return files
}

export async function globFiles(directoryHandle: FileSystemDirectoryHandle): Promise<FileEntry[]> {
  const files: FileEntry[] = []

  async function readDirectory(handle: FileSystemDirectoryHandle) {
    for await (const entry of handle.values()) {
      if (entry.kind === 'file') {
        const path = [handle.name, entry.name].join('/')
        files.push({ kind: 'file', name: path, handle: entry })
        continue
      }

      if (entry.kind === 'directory') {
        await readDirectory(entry)
        continue
      }
    }
  }

  await readDirectory(directoryHandle)
  return files
}
