import { useInterval } from 'ahooks'
import { useState } from 'react'

interface UseResourcePickerOptions {
  only?: 'file' | 'directory'
  fileTypes?: string[]
}

export default function useResourcePicker(options: UseResourcePickerOptions) {
  const { only, fileTypes } = options || {}
  const [selectedHandle, setSelectedHandle] = useState<FileSystemDirectoryHandle>()
  const [selectableItems, setFolders] = useState<(FileSystemDirectoryHandle | FileSystemFileHandle)[]>([])
  const [selects, setSelects] = useState<Set<string>>(new Set())

  const syncWorkspace = async (handle: FileSystemDirectoryHandle) => {
    const directories = []
    const files = []

    for await (const entry of handle.values()) {
      if (only !== 'file' && entry.kind === 'directory') {
        directories.push(entry)
      } else if (only !== 'directory' && entry.kind === 'file') {
        const extname = entry.name.split('.').pop()!
        if (!fileTypes || fileTypes.includes(extname)) {
          files.push(entry)
        }
      }
    }

    setFolders([...directories, ...files])
  }

  const handleSelect = async () => {
    const directoryHandle = await showDirectoryPicker()
    setSelectedHandle(directoryHandle)
    syncWorkspace(directoryHandle)
  }

  useInterval(() => selectedHandle && syncWorkspace(selectedHandle), 1e3)

  return {
    selected: !!selectedHandle,
    selectedHandle,
    selectableItems,
    setFolders,
    handleSelect,
    setSelects,
    onItemSelect: setSelects,
    selects,
  }
}
