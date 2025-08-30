'use client'

import { useMemo } from 'react'
import { supportsMoveAPI } from '@/services/file'
import { useClient } from '@/hooks/useClient'
import { useRenameFlow } from '@/app/rename/hooks/useRenameFlow'
import { ConversionSelector } from '@/app/rename/components/ConversionSelector'
import { ItemsList } from '@/app/rename/components/ItemsList'
import { ResultsPanel } from '@/app/rename/components/ResultsPanel'
import { CONVERSION_OPTIONS, type ConversionType } from '@/app/rename/types/types'


export function Rename() {
  const { currentFile, totalProgress, sourceDirectory, fileList, directoryList, results, conversionType, isProcessing, setConversionType, selectSourceFolder } = useRenameFlow()
  const isClient = useClient()
  const moveAPISupported = useMemo(() => (isClient ? supportsMoveAPI() : false), [isClient])

  return (
    <>
      <ConversionSelector
        value={conversionType as ConversionType}
        onChange={setConversionType as (v: ConversionType) => void}
        disabled={isProcessing}
        options={CONVERSION_OPTIONS}
      />

      <div className="w-full">
        <button onClick={() => selectSourceFolder()} className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:opacity-50" disabled={!moveAPISupported || isProcessing}>
          {isProcessing ? 'Processing…' : sourceDirectory ? 'Re-select folder' : 'Select folder and start renaming'}
        </button>
        {sourceDirectory && !isProcessing && <p className="text-sm text-gray-600 mt-1">Source folder: {sourceDirectory.name}</p>}
      </div>

      {(fileList.length > 0 || directoryList.length > 0) && <ItemsList files={fileList} directories={directoryList} />}
      {(results.length > 0 || totalProgress > 0) && <ResultsPanel results={results} totalProgress={totalProgress} currentFile={currentFile} />}
    </>
  )
}
