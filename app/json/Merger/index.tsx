'use client'

import classNames from 'classnames'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

import FileList from './FileList'
import { deepMerge } from './mergeUtils'
import ResultDisplay from './ResultDisplay'

interface JSONFile {
  file: File
  order: number
}

interface ProcessResult {
  id: string
  name: string
  size: number
  data: any
  success?: boolean
  error?: string
  loading?: boolean
  timestamp: number
}

export default function Merger() {
  // State for the selected files
  const [files, setFiles] = useState<JSONFile[]>([])

  // UI and progress states
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<ProcessResult[]>([])
  const [totalProgress, setTotalProgress] = useState(0)

  /**
   * Update file order
   */
  const updateFileOrder = (fromIndex: number, toIndex: number) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      const [movedItem] = newFiles.splice(fromIndex, 1)
      newFiles.splice(toIndex, 0, movedItem)

      // Update order for all files
      return newFiles.map((file, i) => ({ ...file, order: i }))
    })
  }

  /**
   * Remove a file from the list
   */
  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      newFiles.splice(index, 1)
      // Reorder remaining files
      return newFiles.map((file, i) => ({ ...file, order: i }))
    })
  }

  /**
   * Merge multiple JSON files using a deep merge approach
   * Supports ultra-large JSON data merging
   * Files are merged in order, earlier files (higher in the list) have higher priority
   * When keys conflict, values from files lower in the list will override values from files higher in the list
   * For nested objects, properties are merged recursively
   */
  const mergeJSONFiles = async (inputFiles: JSONFile[]) => {
    setProcessing(true)
    setTotalProgress(0)

    // 为这次合并操作生成唯一ID和时间戳
    const mergeId = Date.now().toString()
    const timestamp = Date.now()

    try {
      // Sort files by order (top to bottom)
      const sortedFiles = [...inputFiles].sort((a, b) => a.order - b.order)

      // Create a single object to hold merged data
      let mergedData = {}

      // Process files one by one to manage memory usage
      // Earlier files (higher in the list) are processed first
      // Later files (lower in the list) will override earlier ones when keys conflict
      for (let i = 0; i < sortedFiles.length; i++) {
        const { file } = sortedFiles[i]
        setTotalProgress(Math.round((i / sortedFiles.length) * 100))

        try {
          const text = await file.text()
          const jsonData = JSON.parse(text)

          // Deep merge approach
          // For ultra-large data, we merge at the top level
          // Files lower in the list will override files higher in the list when keys conflict
          // For nested objects, properties are merged recursively
          mergedData = deepMerge(mergedData, jsonData)
        } catch (error) {
          throw new Error(`Failed to parse ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      setTotalProgress(100)

      // 添加这次合并结果到历史记录中
      const resultEntry: ProcessResult = {
        id: mergeId,
        name: `merged_result_${timestamp}.json`,
        size: JSON.stringify(mergedData).length,
        data: mergedData,
        success: true,
        loading: false,
        timestamp,
      }

      setResult((prev) => [...prev, resultEntry])
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error merging JSON files:', error)
      alert(`Error merging files: ${error instanceof Error ? error.message : 'Unknown error'}`)

      // 添加错误记录到历史记录中
      const errorEntry: ProcessResult = {
        id: mergeId,
        name: 'merge_operation_failed.json',
        size: 0,
        data: null,
        success: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp,
      }

      setResult((prev) => [...prev, errorEntry])
    } finally {
      setProcessing(false)
    }
  }

  /**
   * Handle file drop: reset state and process files
   */
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      // Add new files to the existing list
      setFiles((prev) => {
        const newFiles = [...prev]
        const startIndex = newFiles.length
        const addedFiles = acceptedFiles.map((file, index) => ({
          file,
          order: startIndex + index,
        }))
        return [...newFiles, ...addedFiles]
      })
      setTotalProgress(0)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
    },
    maxFiles: 0, // 0 means unlimited
  })

  /**
   * Save (download) the processed data
   */
  const saveProcessedData = async (data: any, filename: string) => {
    if (!data) {
      return
    }

    try {
      // Create blob from processed data
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })

      // Create download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving file:', error)
      alert('Error saving file. Please try again.')
    }
  }

  return (
    <div className="w-full mt-4">
      <div
        {...getRootProps()}
        className={classNames('border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors', {
          'border-blue-500 bg-blue-50': isDragActive,
          'border-gray-300 hover:border-blue-400': !isDragActive,
        })}
      >
        <input {...getInputProps()} />
        <div className="text-gray-600">
          {processing
            ? 'Processing...'
            : files.length > 0
              ? `Selected ${files.length} file(s)`
              : isDragActive
                ? 'Drop JSON files here'
                : 'Drag and drop multiple JSON files here, or click to select'}
        </div>
        <div className="text-gray-500 text-sm mt-2">Drag and drop JSON files here</div>
      </div>

      {/* File list with reordering controls */}
      <FileList files={files} onRemoveFile={removeFile} onUpdateFileOrder={updateFileOrder} />

      {/* Merge button - placed between file list and results */}
      {files.length > 0 && (
        <div className="mt-4 w-full">
          <button
            className="w-full px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            onClick={() => mergeJSONFiles(files)}
            disabled={processing || files.length === 0}
          >
            {processing ? 'Merging...' : 'Merge Files'}
          </button>
        </div>
      )}

      {/* Results section */}
      {result.length > 0 && <ResultDisplay result={result} totalProgress={totalProgress} onDownload={saveProcessedData} />}
    </div>
  )
}
