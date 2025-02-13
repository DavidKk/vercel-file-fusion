import { useInterval } from 'ahooks'
import { useState } from 'react'

export default function useWorkspace() {
  const [selectedHandle, setSelectedHandle] = useState<FileSystemDirectoryHandle>()
  const [files, setFiles] = useState<FileSystemFileHandle[]>([])
  const [selectableItems, setFolders] = useState<FileSystemDirectoryHandle[]>([])
  const [selects, setSelects] = useState<Set<string>>(new Set())

  const syncWorkspace = async (handle: FileSystemDirectoryHandle) => {
    const selectableItems = []
    const files = []

    for await (const entry of handle.values()) {
      if (entry.kind === 'directory') {
        selectableItems.push(entry)
      } else if (entry.kind === 'file') {
        files.push(entry)
      }
    }

    setFolders(selectableItems)
    setFiles(files)
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
    files,
    selectableItems,
    setFolders,
    handleSelect,
    setSelects,
    onItemSelect: setSelects,
    selects,
  }
}
