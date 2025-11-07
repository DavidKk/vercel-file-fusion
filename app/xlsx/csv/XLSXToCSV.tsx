'use client'

import { useRequest } from 'ahooks'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'

import Alert, { type AlertImperativeHandler } from '@/components/Alert'
import FileProgressBar from '@/components/FileProgressBar'
import PageLoading from '@/components/PageLoading'
import ResourcePicker, { useResourcePicker } from '@/components/ResourcePicker'
import { openDirectoryPicker } from '@/services/file/common'
import { writeFileToDirectory } from '@/services/file/writer'

type ConvertResult = {
  file: string
  success?: boolean
  error?: string
  loading?: boolean
}

type ViewMode = 'all' | 'error'

/**
 * Converts XLSX files to CSV format
 * Supports batch conversion with progress tracking
 */
export default function XLSXToCSV() {
  const [ready, setReady] = useState(false)
  const [currentFile, setCurrentFile] = useState('')
  const [totalProgress, setTotalProgress] = useState(0)
  const [results, setResults] = useState<ConvertResult[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const alertRef = useRef<AlertImperativeHandler>(null)

  const workspaceContext = useResourcePicker({ fileTypes: ['xlsx'], only: 'file', deep: true })
  const { selected: isWorkspaceSelected, selectableItems: availableItems, selects: selectedFiles, setSelects: setSelectedFiles } = workspaceContext

  const filteredResults = useMemo(() => {
    if (viewMode === 'error') {
      return results.filter((result) => !result.success)
    }
    return results
  }, [results, viewMode])

  useEffect(() => {
    setReady(true)
  }, [])

  /**
   * Converts XLSX file to CSV format
   * @param arrayBuffer The XLSX file content as ArrayBuffer
   * @returns CSV content as string
   */
  function convertXLSXToCSV(arrayBuffer: ArrayBuffer): string {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]

    // Convert to CSV format
    const csv = XLSX.utils.sheet_to_csv(worksheet)
    return csv
  }

  /**
   * Gets the CSV filename from XLSX filename
   * @param xlsxFileName Original XLSX filename
   * @returns CSV filename
   */
  function getCSVFileName(xlsxFileName: string): string {
    return xlsxFileName.replace(/\.xlsx?$/i, '.csv')
  }

  const { run: startConvert, loading } = useRequest(
    async () => {
      setResults([])
      const outputDirHandle = await openDirectoryPicker({ mode: 'readwrite' })
      const totalFiles = selectedFiles.size

      let processedFiles = 0

      for await (const itemEntry of availableItems) {
        if (!selectedFiles.has(itemEntry.name) || itemEntry.kind !== 'file') {
          continue
        }

        const itemName = itemEntry.name
        setCurrentFile(itemName)
        setResults((prev) => [...prev, { file: itemName, loading: true }])

        try {
          const fileData = await itemEntry.handle.getFile()
          const arrayBuffer = await fileData.arrayBuffer()

          if (arrayBuffer.byteLength === 0) {
            throw new Error('File is empty')
          }

          const csvContent = convertXLSXToCSV(arrayBuffer)
          const csvFileName = getCSVFileName(itemName)

          await writeFileToDirectory(csvFileName, csvContent, {
            directoryHandle: outputDirHandle,
            onProgress(progress, total) {
              const fileProgress = (progress / total) * 50
              const overallProgress = ((processedFiles + fileProgress / 100) / totalFiles) * 100
              setTotalProgress(overallProgress)
            },
          })

          processedFiles += 1
          setTotalProgress((processedFiles / totalFiles) * 100)
          setResults((prev) => prev.map((result) => (result.file === itemName ? { ...result, success: true, loading: false } : result)))
        } catch (error) {
          setResults((prev) =>
            prev.map((result) =>
              result.file === itemName ? { ...result, success: false, loading: false, error: error instanceof Error ? error.message : 'Unknown error' } : result
            )
          )
        }
      }
    },
    {
      manual: true,
      onSuccess: () => {
        setTotalProgress(100)
        setSelectedFiles(new Set())
        setTimeout(() => setTotalProgress(0), 500)
      },
      onError: (error) => {
        // eslint-disable-next-line no-console
        console.error(error)

        setTotalProgress(0)
        alertRef.current?.show(error instanceof Error ? error.message : 'Unknown error', { type: 'error' })
      },
      onFinally: () => {
        setCurrentFile('')
      },
    }
  )

  if (!ready) {
    return <PageLoading />
  }

  /**
   * Renders the result header with view mode toggle
   */
  function renderResultHeader() {
    return (
      <div className="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 flex items-center justify-between">
        <span>Results</span>
        <div className="flex rounded-md overflow-hidden border border-gray-300">
          <button className={`px-3 py-1 text-xs ${viewMode === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`} onClick={() => setViewMode('all')}>
            All
          </button>
          <button
            className={`px-3 py-1 text-xs border-l ${viewMode === 'error' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            onClick={() => setViewMode('error')}
          >
            Errors
          </button>
        </div>
      </div>
    )
  }

  /**
   * Renders the progress bar
   */
  function renderResultProgress() {
    if (totalProgress === 0) {
      return null
    }

    return (
      <div className="border-b border-gray-200">
        <FileProgressBar
          bgClassName="rounded-none"
          barClassName="rounded-none"
          noText={true}
          progress={totalProgress}
          message={totalProgress >= 100 ? 'Completed' : `${currentFile}: Converting`}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <ResourcePicker {...workspaceContext} disabled={loading} />

      {isWorkspaceSelected && (
        <button className="w-full bg-indigo-600 text-white p-2 rounded disabled:opacity-50" disabled={selectedFiles.size === 0 || totalProgress > 0} onClick={startConvert}>
          Convert to CSV
        </button>
      )}

      {results.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {renderResultHeader()}
          {renderResultProgress()}
          <div className="divide-y divide-gray-200">
            {filteredResults.map((result) => (
              <div key={result.file} className="px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{result.file}</span>
                  {result.loading ? (
                    <span className="text-gray-500">Processing...</span>
                  ) : result.success ? (
                    <span className="text-green-600">Success</span>
                  ) : (
                    <span className="text-red-600">{result.error}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Alert ref={alertRef} />
    </div>
  )
}
