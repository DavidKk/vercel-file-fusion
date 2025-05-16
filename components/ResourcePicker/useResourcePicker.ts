import { useInterval, useDebounceFn } from 'ahooks'
import { useState, useCallback } from 'react'
import { openDirectoryPicker } from '@/services/file/common'
import { globFiles } from '@/services/file/reader'
import type { FileEntry, DirectoryEntry } from '@/services/file/types'

interface UseResourcePickerOptions {
  only?: 'file' | 'directory'
  fileTypes?: string[]
  // when only is 'file'
  deep?: boolean
}

export default function useResourcePicker(options: UseResourcePickerOptions) {
  const { fileTypes, only, deep } = options || {}
  const [selectedHandle, setSelectedHandle] = useState<FileSystemDirectoryHandle>()
  const [selectableItems, setSelectableItems] = useState<(FileEntry | DirectoryEntry)[]>([])
  const [selects, setSelects] = useState<Set<string>>(new Set())

  const syncWorkspace = useCallback(
    async (directoryHandle: FileSystemDirectoryHandle) => {
      const directories: DirectoryEntry[] = []
      const files: FileEntry[] = []

      if (deep) {
        for (const entry of await globFiles(directoryHandle)) {
          const extname = entry.name.split('.').pop()!
          if (!fileTypes || fileTypes.includes(extname)) {
            files.push(entry)
          }
        }
      } else {
        for await (const handle of directoryHandle.values()) {
          const name = handle.name
          if (only !== 'file' && handle.kind === 'directory') {
            directories.push({ kind: 'directory', name, handle, files: [] })
            continue
          }

          if (only !== 'directory' && handle.kind === 'file') {
            const extname = name.split('.').pop()!
            if (!fileTypes || fileTypes.includes(extname)) {
              files.push({ kind: 'file', name, handle })
            }

            continue
          }
        }
      }

      const sortedItems = [...directories, ...files].sort((a, b) => a.name.localeCompare(b.name))

      // Compare old and new file lists, only update state when there are changes
      const hasChanges = selectableItems.length !== sortedItems.length || selectableItems.some((item, index) => item.name !== sortedItems[index]?.name)
      if (hasChanges) {
        setSelectableItems(sortedItems)
      }
    },
    [deep, fileTypes, only, selectableItems]
  )

  const { run: debouncedSync } = useDebounceFn(
    (directoryHandle: FileSystemDirectoryHandle) => {
      syncWorkspace(directoryHandle)
    },
    { wait: 300 }
  )

  const handleSelect = async () => {
    const directoryHandle = await openDirectoryPicker()
    setSelectedHandle(directoryHandle)
    syncWorkspace(directoryHandle)
  }

  useInterval(() => {
    selectedHandle && debouncedSync(selectedHandle)
  }, 1e3)

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
