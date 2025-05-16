'use client'

import { useRef, useState, useMemo, useEffect } from 'react'
import { useRequest } from 'ahooks'
import * as XLSX from 'xlsx'
import Alert, { type AlertImperativeHandler } from '@/components/Alert'
import ResourcePicker, { useResourcePicker } from '@/components/ResourcePicker'
import FileProgressBar from '@/components/FileProgressBar'
import PageLoading from '@/components/PageLoading'
import { openDirectoryPicker } from '@/services/file/common'

type MergeResult = {
  file: string
  success?: boolean
  error?: string
  loading?: boolean
}

type ViewMode = 'all' | 'error'

export default function XLSXMerge() {
  const [ready, setReady] = useState(false)
  const [currentFile, setCurrentFile] = useState('')
  const [totalProgress, setTotalProgress] = useState(0)
  const [results, setResults] = useState<MergeResult[]>([])
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

  const { run: startMerge, loading } = useRequest(
    async () => {
      setResults([])
      const outputDirHandle = await openDirectoryPicker()
      const totalFiles = selectedFiles.size
      let processedFiles = 0
      let mergedData: any[] = []
      let headers: string[] = []

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
          const workbook = XLSX.read(arrayBuffer)
          const worksheet = workbook.Sheets[workbook.SheetNames[0]]
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

          if (data.length === 0) {
            throw new Error('File is empty')
          }

          const currentHeaders = data[0] as string[]
          if (headers.length === 0) {
            headers = currentHeaders
          } else if (JSON.stringify(headers) !== JSON.stringify(currentHeaders)) {
            throw new Error('Headers do not match')
          }

          mergedData = mergedData.concat(data.slice(1))
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

      if (mergedData.length > 0) {
        const mergedWorkbook = XLSX.utils.book_new()
        const mergedWorksheet = XLSX.utils.json_to_sheet([headers, ...mergedData], { skipHeader: true })
        XLSX.utils.book_append_sheet(mergedWorkbook, mergedWorksheet, 'Sheet1')
        const mergedBuffer = XLSX.write(mergedWorkbook, { type: 'array' })
        const mergedBlob = new Blob([mergedBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const mergedFile = new File([mergedBlob], 'merged.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

        const writable = await outputDirHandle.getFileHandle('merged.xlsx', { create: true })
        const writableStream = await writable.createWritable()
        await writableStream.write(mergedFile)
        await writableStream.close()
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
        alertRef.current?.show(error.message, { type: 'error' })
      },
      onFinally: () => {
        setCurrentFile('')
      },
    }
  )

  if (!ready) {
    return <PageLoading />
  }

  const renderResultHeader = () => {
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

  const renderResultProgress = () => {
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
          message={totalProgress >= 100 ? 'Completed' : `${currentFile}: Merging`}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <ResourcePicker {...workspaceContext} disabled={loading} />

      {isWorkspaceSelected && (
        <button className="w-full bg-indigo-600 text-white p-2 rounded disabled:opacity-50" disabled={selectedFiles.size === 0 || totalProgress > 0} onClick={startMerge}>
          Merge
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
