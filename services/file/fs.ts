/** Get a subdirectory handle by path from a parent directory handle */
export async function getDirectoryHandleByPath(directoryHandle: FileSystemDirectoryHandle, path: string) {
  // Handle empty or root path
  if (!path || path === '.' || path === '/') {
    return directoryHandle
  }

  // Split path into parts and filter out empty parts
  const pathParts = path.split('/').filter(Boolean)
  let currentHandle = directoryHandle

  // Traverse each part of the path
  for (const part of pathParts) {
    try {
      // Get the directory handle for this part
      currentHandle = await currentHandle.getDirectoryHandle(part)
    } catch (error) {
      // If we can't find the directory, re-throw a more descriptive error
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Could not find directory '${part}' in path '${path}': ${message}`)
    }
  }

  return currentHandle
}

/** Check if a handle is a file */
export function isFileHandle(handle: any): handle is FileSystemFileHandle {
  return typeof handle === 'object' && handle !== null && 'kind' in handle && handle.kind === 'file' && typeof (handle as FileSystemFileHandle).getFile === 'function'
}

/** Check if a handle is a directory */
export function isDirectoryHandle(handle: any): handle is FileSystemDirectoryHandle {
  return (
    typeof handle === 'object' &&
    handle !== null &&
    'kind' in handle &&
    handle.kind === 'directory' &&
    typeof (handle as FileSystemDirectoryHandle).getDirectoryHandle === 'function'
  )
}

/** Move a directory recursively */
export async function moveDirectoryRecursive(
  sourceDir: FileSystemDirectoryHandle,
  targetParentDir: FileSystemDirectoryHandle,
  targetNameFn: (dir: FileSystemDirectoryHandle) => Promise<string> | string
) {
  const targetName = await targetNameFn(sourceDir)
  const currentTargetDir = await safeGetDirectoryHandle(targetParentDir, targetName, true)
  if (!currentTargetDir) {
    return false
  }

  for await (const [, handle] of sourceDir.entries()) {
    if (isFileHandle(handle)) {
      await handle.move(currentTargetDir)
      continue
    }

    if (isDirectoryHandle(handle)) {
      if (await moveDirectoryRecursive(handle, currentTargetDir, targetNameFn)) {
        await safeRemoveEntry(sourceDir, handle.name, true)
      }
    }
  }

  return targetName !== sourceDir.name
}

/** Safe wrapper for getting a file handle that handles errors gracefully */
export async function safeGetFileHandle(dirHandle: FileSystemDirectoryHandle, fileName: string, createIfMissing = false) {
  try {
    return await dirHandle.getFileHandle(fileName, { create: createIfMissing })
  } catch (err: unknown) {
    if (typeof err === 'object' && err != null && 'name' in err && 'message' in err) {
      if (err.name === 'NotFoundError') {
        return null
      }

      if (err.name === 'SecurityError') {
        return null
      }
    }

    throw err
  }
}

/** Safe wrapper for getting a directory handle that handles errors gracefully */
export async function safeGetDirectoryHandle(parentDir: FileSystemDirectoryHandle, dirName: string, createIfMissing = true) {
  try {
    return await parentDir.getDirectoryHandle(dirName, { create: createIfMissing })
  } catch (err: unknown) {
    if (typeof err === 'object' && err != null && 'name' in err && 'message' in err) {
      if (err.name === 'NotFoundError') {
        return null
      }

      if (err.name === 'SecurityError') {
        return null
      }
    }

    throw err
  }
}

/** Safe wrapper for removing an entry that handles errors gracefully */
export async function safeRemoveEntry(dirHandle: FileSystemDirectoryHandle, name: string, recursive = false) {
  try {
    await dirHandle.removeEntry(name, { recursive })
    return true
  } catch (err: unknown) {
    if (typeof err === 'object' && err != null && 'name' in err && 'message' in err) {
      if (err.name === 'NotFoundError') {
        return false
      }

      if (err.name === 'SecurityError') {
        return false
      }
    }

    throw err
  }
}
