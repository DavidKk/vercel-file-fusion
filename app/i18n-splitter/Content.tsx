'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import classNames from 'classnames'
import FileProgressBar from '@/components/FileProgressBar'
import InputWithSuffix from '@/components/InputWithSuffix'

interface SplitResult {
  name: string
  size: number
  success?: boolean
  error?: string
  loading?: boolean
}

export default function Content() {
  // State for the selected file
  const [file, setFile] = useState<File | null>(null)

  // Max chunk size in KB
  const [maxSize, setMaxSize] = useState<number>(2048)

  // UI and progress states
  const [splitting, setSplitting] = useState(false)
  const [result, setResult] = useState<SplitResult[]>([])
  const [totalProgress, setTotalProgress] = useState(0)
  const [viewMode, setViewMode] = useState<'all' | 'error'>('all')

  // Chunks and their info (used before saving)
  const [chunks, setChunks] = useState<Record<string, any>[]>([])
  const [chunkInfos, setChunkInfos] = useState<{ name: string; size: number }[]>([])

  // Whether the user can save/download
  const [readyToSave, setReadyToSave] = useState(false)

  /**
   * Split the input JSON file into chunks based on maxSize (KB).
   * This is called after file selection, before any saving.
   * Prepares chunkInfos for preview in the UI.
   */
  const prepareChunks = async (inputFile: File) => {
    setSplitting(true)
    setTotalProgress(0)

    try {
      const text = await inputFile.text()
      const json = JSON.parse(text)
      const tempChunks: Record<string, any>[] = []

      let currentChunk: Record<string, any> = {}
      let currentSize = 0

      for (const [key, value] of Object.entries(json)) {
        const entrySize = JSON.stringify({ [key]: value }).length // approximate byte size

        // If adding this entry would exceed maxSize, start a new chunk
        if (currentSize + entrySize > maxSize * 1024) {
          tempChunks.push(currentChunk)
          currentChunk = {}
          currentSize = 0
        }

        currentChunk[key] = value
        currentSize += entrySize
      }

      // Push the last chunk if it has content
      if (Object.keys(currentChunk).length > 0) {
        tempChunks.push(currentChunk)
      }

      setChunks(tempChunks)
      setChunkInfos(
        tempChunks.map((chunk, index) => ({
          name: `${inputFile.name.replace('.json', '')}_part${index + 1}.json`,
          size: JSON.stringify(chunk, null, 2).length,
        }))
      )

      setReadyToSave(true)
    } catch (error) {
      // eslint-disable-next-line
      console.error('Error splitting JSON:', error)

      alert('Error processing the file. Please make sure it is a valid JSON file.')

      setChunks([])
      setChunkInfos([])
      setReadyToSave(false)
    } finally {
      setSplitting(false)
    }
  }

  /**
   * Save (download) all prepared chunks to the user-selected directory.
   * This is only triggered when the user clicks the Download button.
   * Updates the result state for status display.
   */
  const saveChunks = async () => {
    if (!file || chunks.length === 0) {
      return
    }

    setSplitting(true)
    setTotalProgress(0)
    setResult(
      chunks.map((_, index) => ({
        name: `${file.name.replace('.json', '')}_part${index + 1}.json`,
        size: 0,
        loading: true,
      }))
    )

    try {
      // Request directory access from the user
      const dirHandle = await window.showDirectoryPicker()

      // Write each chunk as a separate file
      const finalResults = await Promise.all(
        chunks.map(async (chunk, index) => {
          const outputFileName = `${file.name.replace('.json', '')}_part${index + 1}.json`

          try {
            const fileHandle = await dirHandle.getFileHandle(outputFileName, { create: true })
            const writable = await fileHandle.createWritable()
            await writable.write(JSON.stringify(chunk, null, 2))
            await writable.close()

            const outputFile = await fileHandle.getFile()
            setTotalProgress(((index + 1) / chunks.length) * 100)

            return {
              name: outputFileName,
              size: outputFile.size,
              success: true,
              loading: false,
            }
          } catch (error) {
            return {
              name: outputFileName,
              size: 0,
              success: false,
              loading: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            }
          }
        })
      )

      setResult(finalResults)
    } catch (error) {
      // eslint-disable-next-line
      console.error('Error saving files:', error)
      alert('Error saving files. Please try again.')
    } finally {
      setSplitting(false)
      setTimeout(() => setTotalProgress(0), 500)
    }
  }

  /**
   * Handle file drop: reset state, then split the file for preview.
   * This does not trigger any saving or permission requests.
   */
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0]
        setFile(selectedFile)
        setResult([])
        setTotalProgress(0)
        setReadyToSave(false)
        setChunks([])
        setChunkInfos([])
        await prepareChunks(selectedFile)
      }
    },
    [maxSize]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
    },
    maxFiles: 1,
  })

  const filteredResults = result.filter((item) => viewMode === 'all' || !item.success)

  // Unified results list: shows chunk info before saving, and status after saving
  const getDisplayResults = () => {
    // If not saved yet, show chunkInfos (name, size, no status)
    if (!result.length) {
      return chunkInfos.map((info) => ({
        name: info.name,
        size: info.size,
        loading: false,
        success: undefined,
        error: undefined,
      }))
    }

    // After saving, show result
    return filteredResults
  }

  const renderResultHeader = () => {
    return (
      <div className="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 flex items-center justify-between">
        <span>Files</span>
        <div className="flex rounded-md overflow-hidden border border-gray-300">
          <button className={`px-3 py-1 text-xs ${viewMode === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`} onClick={() => setViewMode('all')}>
            All
          </button>
          <button
            className={`px-3 py-1 text-xs border-l ${viewMode === 'error' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            onClick={() => setViewMode('error')}
          >
            Fails
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
          message={totalProgress >= 100 ? 'Finish' : 'Processing...'}
        />
      </div>
    )
  }

  const renderResultBody = () => {
    const displayResults = getDisplayResults()
    if (!displayResults?.length) {
      return <div className="px-4 py-3 text-center text-gray-500">No Data</div>
    }

    return (
      <div
        className="divide-y divide-gray-200 max-h-[300px] overflow-y-auto"
        ref={(el: HTMLDivElement) => {
          if (!el) {
            return
          }

          el.scrollTop = el.scrollHeight
        }}
      >
        {displayResults.map((item, index) => (
          <div key={index} className="px-4 py-3 flex items-center">
            <div className="flex items-center gap-2">
              {/* Only show status icon if saving has started */}
              {result.length > 0 ? (
                item.loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent" />
                ) : item.success ? (
                  <span className="text-green-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                ) : (
                  <span className="text-red-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                )
              ) : null}

              <div className="column grow flex flex-col">
                <span className="text-sm text-gray-900 truncate max-w-[400px]">{item.name}</span>
                {item.error && <span className="text-sm text-red-500">{item.error}</span>}
                <span className="text-sm text-gray-500">{(item.size / 1024).toFixed(2)} KB</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="w-full mt-4">
      <div className="flex items-center justify-end gap-4">
        <InputWithSuffix value={maxSize} onChange={(e) => setMaxSize(Math.max(1, Number(e.target.value)))} suffix="KB" min="1" placeholder="Enter value" type="number" />
      </div>

      <div
        {...getRootProps()}
        className={classNames('mt-4 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors', {
          'border-blue-500 bg-blue-50': isDragActive,
          'border-gray-300 hover:border-blue-400': !isDragActive,
        })}
      >
        <input {...getInputProps()} />
        <div className="text-gray-600">
          {splitting ? 'Processing...' : file ? `Selected: ${file.name}` : isDragActive ? 'Drop the JSON file here' : 'Drag and drop a JSON file here, or click to select'}
        </div>
      </div>

      {/* Results section always visible if chunkInfos or result exists */}
      {(chunkInfos.length > 0 || result.length > 0 || totalProgress > 0) && (
        <div className="mt-4 w-full border rounded-md overflow-hidden">
          {renderResultHeader()}
          {renderResultProgress()}
          {renderResultBody()}
        </div>
      )}

      {readyToSave && (
        <div className="mt-4 flex justify-end">
          <button
            className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            onClick={saveChunks}
            disabled={splitting || chunkInfos.length === 0}
          >
            Download
          </button>
        </div>
      )}
    </div>
  )
}
