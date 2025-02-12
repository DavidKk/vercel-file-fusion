import { FileContent } from './types'

export async function writeFile(fileHandle: FileSystemFileHandle, content: FileContent) {
  const writable = await fileHandle.createWritable()
  await writable.write(content)
  await writable.close()
}

export async function createFileAndWriteFile(content: FileContent) {
  if (!('showSaveFilePicker' in window)) {
    throw new Error('showSaveFilePicker is not supported in this browser.')
  }

  const fileHandle = await window.showSaveFilePicker()
  await writeFile(fileHandle, content)
}

export async function writeToDirectory(directoryHandle: FileSystemDirectoryHandle, fileName: string, content: FileContent) {
  const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true })
  await writeFile(fileHandle, content)
}

export interface WritableFile {
  name: string
  content: FileContent
}

export interface CreateDirectoryAndWriteFileOptions {
  directoryHandle?: FileSystemDirectoryHandle
}

async function getOrCreateDirectoryHandle(directoryHandle: FileSystemDirectoryHandle, path: string): Promise<FileSystemDirectoryHandle> {
  const parts = path.split('/')
  let currentHandle = directoryHandle

  for (const part of parts) {
    currentHandle = await currentHandle.getDirectoryHandle(part, { create: true })
  }

  return currentHandle
}

export async function createDirectoryAndWriteFile(directoryName: string, files: WritableFile[], options?: CreateDirectoryAndWriteFileOptions) {
  const { directoryHandle = await showDirectoryPicker() } = options || {}
  const newDirectoryHandle = await getOrCreateDirectoryHandle(directoryHandle, directoryName)

  for await (const { name, content } of files) {
    try {
      const filePathParts = name.split('/')
      const fileName = filePathParts.pop()!
      const fileDirectoryHandle = await getOrCreateDirectoryHandle(newDirectoryHandle, filePathParts.join('/'))
      await writeToDirectory(fileDirectoryHandle, fileName, content)
    } catch (error) {
      console.error(`Error writing file ${name}:`, error)
      throw error
    }
  }
}
