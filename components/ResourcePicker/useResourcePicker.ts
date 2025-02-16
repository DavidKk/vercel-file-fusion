import { globFiles } from '@/services/file/reader'
import { useInterval } from 'ahooks'
import { useState } from 'react'

interface UseResourcePickerOptions {
  only?: 'file' | 'directory'
  fileTypes?: string[]
  // when only is 'file'
  deep?: boolean
}

export default function useResourcePicker(options: UseResourcePickerOptions) {
  const { fileTypes, only, deep } = options || {}
  const [selectedHandle, setSelectedHandle] = useState<FileSystemDirectoryHandle>()
  const [selectableItems, setSelectableItems] = useState<(FileSystemDirectoryHandle | FileSystemFileHandle)[]>([])
  const [selects, setSelects] = useState<Set<string>>(new Set())

  const syncWorkspace = async (handle: FileSystemDirectoryHandle) => {
    const directories = []
    const files = []

    const entries = deep ? (await globFiles(handle)).map(({ handle }) => handle) : handle.values()
    for await (const entry of entries) {
      if (only !== 'file' && entry.kind === 'directory') {
        directories.push(entry)
      } else if (only !== 'directory' && entry.kind === 'file') {
        const extname = entry.name.split('.').pop()!
        if (!fileTypes || fileTypes.includes(extname)) {
          files.push(entry)
        }
      }
    }

    const sortedItems = [...directories, ...files].sort((a, b) => a.name.localeCompare(b.name))
    setSelectableItems(sortedItems)
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
    setSelectableItems,
    handleSelect,
    setSelects,
    onItemSelect: setSelects,
    selects,
  }
}
