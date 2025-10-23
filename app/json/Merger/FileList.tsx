'use client'

import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

import { formatFileSize } from '@/utils/format'

interface JSONFile {
  file: File
  order: number
}

interface DragState {
  draggedIndex: number | null
}

interface FileListProps {
  files: JSONFile[]
  onRemoveFile: (index: number) => void
  onUpdateFileOrder: (fromIndex: number, toIndex: number) => void
}

export default function FileList({ files, onRemoveFile, onUpdateFileOrder }: FileListProps) {
  // Drag and drop state
  const [dragState, setDragState] = useState<DragState>({
    draggedIndex: null,
  })

  /**
   * Handle drag start
   */
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString())
    setDragState({ draggedIndex: index })
  }

  /**
   * Handle drag over
   */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  /**
   * Handle drop
   */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault()
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10)

    if (!isNaN(fromIndex) && fromIndex !== targetIndex) {
      onUpdateFileOrder(fromIndex, targetIndex)
    }

    setDragState({ draggedIndex: null })
  }

  /**
   * Handle drag end
   */
  const handleDragEnd = () => {
    setDragState({ draggedIndex: null })
  }

  if (files.length === 0) {
    return null
  }

  return (
    <div className="mt-4 w-full border rounded-md overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">Files to merge</div>
      <div className="divide-y divide-gray-200 max-h-[300px] overflow-y-auto">
        {files.map((jsonFile, index) => {
          const isDragged = dragState.draggedIndex === index

          return (
            <div
              key={`${jsonFile.file.name}-${index}`}
              className={`px-4 py-2 flex items-center ${isDragged ? 'opacity-50 bg-blue-50' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="flex flex-col cursor-move p-2 text-gray-400" aria-label="Drag to reorder">
                  <Bars3Icon className="w-5 h-5" />
                </div>

                <div className="column grow flex flex-col min-w-0">
                  <span className="text-sm text-gray-900 truncate">{jsonFile.file.name}</span>
                  <span className="text-xs text-gray-500">{formatFileSize(jsonFile.file.size)}</span>
                </div>

                <button className="flex-shrink-0 p-1 text-white bg-red-500 hover:bg-red-600 rounded" onClick={() => onRemoveFile(index)}>
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="px-4 py-2 bg-gray-50">
        <div className="text-xs text-gray-500">Drag files to reorder (top files have higher priority)</div>
      </div>
    </div>
  )
}
