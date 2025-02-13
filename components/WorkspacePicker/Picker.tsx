import { useState, useEffect } from 'react'

export interface WorkspacePickerProps {
  selectedHandle?: FileSystemDirectoryHandle
  handleSelect: () => void
  selectableItems: FileSystemDirectoryHandle[]
  onItemSelect: (selectedFolders: Set<string>) => void
  selects: Set<string>
  disabled: boolean
}

export default function WorkspacePicker(props: WorkspacePickerProps) {
  const { selectedHandle, handleSelect, selectableItems, onItemSelect, selects, disabled } = props
  const [allSelected, setAllSelected] = useState(false)

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allFolderNames = new Set(selectableItems.map((folder) => folder.name))
      onItemSelect(allFolderNames)
    } else {
      onItemSelect(new Set())
    }
  }

  const handleSelectFolder = (folderName: string) => {
    const newSelectedFolders = new Set(selects)
    if (newSelectedFolders.has(folderName)) {
      newSelectedFolders.delete(folderName)
    } else {
      newSelectedFolders.add(folderName)
    }

    onItemSelect(newSelectedFolders)
  }

  useEffect(() => {
    setAllSelected(selects.size === selectableItems.length)
  }, [selects, selectableItems])

  return (
    <div className="w-full">
      {!selectedHandle ? (
        <div onClick={handleSelect} className="border-2 border-dashed border-[2px] rounded-md border-gray-300 p-6 text-center cursor-pointer">
          <p className="text-gray-400 text-xl py-10">Select Directory</p>
        </div>
      ) : (
        <div className="mt-4 w-full flex flex-col gap-2">
          {selectableItems.length === 0 ? (
            <div onClick={handleSelect} className="text-gray-500 text-md py-10 text-center cursor-pointer">
              <p>No selectableItems available and click re-choose</p>
            </div>
          ) : (
            <>
              <label className="flex items-center gap-2 px-4 border-[1px] border-dashed border-gray-300 text-black p-2 rounded">
                <input type="checkbox" checked={allSelected} onChange={handleSelectAll} disabled={disabled} />
                <span>Select All</span>
              </label>

              <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto">
                {selectableItems.map((folder) => (
                  <label className="flex items-center gap-2 px-4 bg-gray-100 text-black p-2 rounded" key={folder.name}>
                    <input type="checkbox" checked={selects.has(folder.name)} onChange={() => handleSelectFolder(folder.name)} disabled={disabled} />

                    <span>/{folder.name}</span>
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
