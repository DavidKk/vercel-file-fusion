import { useState, useEffect } from 'react'
import type { DirectoryEntry, FileEntry } from '@/services/file/types'

export interface ResourcePickerProps {
  selectedHandle?: FileSystemDirectoryHandle
  handleSelect: () => void
  selectableItems: (FileEntry | DirectoryEntry)[]
  onItemSelect: (selectedItems: Set<string>) => void
  selects: Set<string>
  disabled: boolean
  afterItemRender?: (item: FileEntry | DirectoryEntry) => React.ReactNode
}

export default function ResourcePicker(props: ResourcePickerProps) {
  const { selectedHandle, handleSelect: onWorkspaceSelect, selectableItems, onItemSelect, selects, disabled, afterItemRender } = props
  const [allSelected, setAllSelected] = useState(false)

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allItemNames = new Set(selectableItems.map(({ name }) => name))
      onItemSelect(allItemNames)
    } else {
      onItemSelect(new Set())
    }
  }

  const handleSelect = (itemName: string) => {
    const newSelectedItems = new Set(selects)
    if (newSelectedItems.has(itemName)) {
      newSelectedItems.delete(itemName)
    } else {
      newSelectedItems.add(itemName)
    }

    onItemSelect(newSelectedItems)
  }

  useEffect(() => {
    setAllSelected(selects.size === selectableItems.length)
  }, [selects, selectableItems])

  return (
    <div className="w-full">
      {!selectedHandle ? (
        <div onClick={onWorkspaceSelect} className="border-2 border-dashed border-[2px] rounded-md border-gray-300 p-6 text-center cursor-pointer">
          <p className="text-gray-400 text-xl py-10">Select Directory</p>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-2">
          {selectableItems.length === 0 ? (
            <div onClick={onWorkspaceSelect} className="text-gray-500 text-md py-10 text-center cursor-pointer">
              <p>No items available. Click to select another directory</p>
            </div>
          ) : (
            <>
              <label className="flex items-center gap-2 px-4 border-[1px] border-dashed border-gray-300 text-black p-2 rounded">
                <input type="checkbox" checked={allSelected} onChange={handleSelectAll} disabled={disabled} />
                <span>Select All</span>
              </label>

              <div className="flex flex-col gap-2 max-h-[40vh]">
                {selectableItems.map((item) => (
                  <label className="flex items-center gap-2 px-4 bg-gray-100 text-black p-2 rounded" key={item.name}>
                    <input type="checkbox" checked={selects.has(item.name)} onChange={() => handleSelect(item.name)} disabled={disabled} />
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</span>
                    <div className="ml-auto inline-flex gap-1">{afterItemRender ? afterItemRender(item) : null}</div>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
