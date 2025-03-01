'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRequest } from 'ahooks'
import { BlobReader, ERR_ENCRYPTED, ERR_INVALID_PASSWORD, Uint8ArrayWriter, ZipReader, type ZipReaderConstructorOptions } from '@zip.js/zip.js'
import type { FileContent } from '@/services/file/types'
import { transcodeEntryFileName } from '@/services/zip/decode'
import { writeFileToDirectory } from '@/services/file/writer'
import { sanitizeFileName } from '@/services/file/name'
import Picker from '@/components/Picker'
import FileProgressBar from '@/components/FileProgressBar'
import PageLoading from '@/components/PageLoading'
import { Spinner } from '@/components/Spinner'

type ViewMode = 'all' | 'error'

type UnzipResult = {
  file: string
  success?: boolean
  error?: string
  loading?: boolean
}

export default function Unzip() {
  const [ready, setReady] = useState(false)
  const [currentZip, setCurrentZip] = useState('')
  const [currentFile, setCurrentFile] = useState('')
  const [totalProgress, setTotalProgress] = useState(0)
  const [password, setPassword] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [addRootFolder, setAddRootFolder] = useState(false)
  const [unzipResults, setUnzipResults] = useState<UnzipResult[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const filteredResults = useMemo(() => {
    if (viewMode === 'error') {
      return unzipResults.filter((result) => !result.success)
    }

    return unzipResults
  }, [unzipResults, viewMode])

  const { run: startUnzip } = useRequest(
    async () => {
      setUnzipResults([])
      const directoryHandle = await showDirectoryPicker()
      const totalZips = selectedFiles.length
      let processedZips = 0

      for await (const file of selectedFiles) {
        const zipFileName = file.name
        setCurrentZip(zipFileName)

        setUnzipResults((prev) => [...prev, { file: zipFileName, loading: true }])

        try {
          const unzipOptions: ZipReaderConstructorOptions = {}
          if (password) {
            unzipOptions.password = password
          }

          const zipReader = new ZipReader(new BlobReader(file), unzipOptions)
          const entries = await zipReader.getEntries()
          const totalFiles = entries.filter((entry) => !entry.directory && entry.getData).length
          let processedFiles = 0

          for await (const entry of entries) {
            if (entry.directory || !entry.getData) {
              continue
            }

            const name = addRootFolder ? `${zipFileName.replace('.zip', '')}/${transcodeEntryFileName(entry)}` : transcodeEntryFileName(entry)
            const sanitizedName = name
              .split('/')
              .map((item) => sanitizeFileName(item))
              .join('/')

            let content: FileContent
            try {
              content = await entry.getData(new Uint8ArrayWriter(), {
                onprogress: async (progress, total) => {
                  const readProgress = (progress / total) * 50
                  const totalProgress = ((processedZips + (processedFiles + readProgress / 100) / totalFiles) / totalZips) * 100
                  setTotalProgress(totalProgress)
                },
              })
            } catch (error) {
              if (error instanceof Error) {
                if (error.message === ERR_ENCRYPTED || error.message === ERR_INVALID_PASSWORD) {
                  throw new Error('Incorrect password')
                }
              }

              throw error
            }

            await writeFileToDirectory(sanitizedName, content, {
              directoryHandle,
              onProgress(progress, total) {
                setCurrentFile(name)

                const writeProgress = (progress / total) * 50
                const totalProgress = ((processedZips + (processedFiles + 0.5 + writeProgress / 100) / totalFiles) / totalZips) * 100
                setTotalProgress(totalProgress)
              },
            })

            processedFiles += 1
          }

          processedZips += 1
          setTotalProgress((processedZips / totalZips) * 100)
          setUnzipResults((prev) => prev.map((result) => (result.file === zipFileName ? { ...result, success: true, loading: false } : result)))
        } catch (error) {
          setUnzipResults((prev) =>
            prev.map((result) => (result.file === zipFileName ? { ...result, success: false, loading: false, error: error instanceof Error ? error.message : '未知错误' } : result))
          )
        }
      }
    },
    {
      manual: true,
      onSuccess: () => {
        setTotalProgress(100)
        setSelectedFiles([])
        setTimeout(() => setTotalProgress(0), 500)
      },
      onError: () => {
        setTotalProgress(0)
      },
      onFinally: () => {
        setCurrentZip('')
        setCurrentFile('')
      },
    }
  )

  useEffect(() => {
    const savedPassword = localStorage.getItem('unzipPassword')
    const savedAddRootFolder = localStorage.getItem('unzipAddRootFolder')

    if (savedPassword) {
      setPassword(savedPassword)
    }

    if (savedAddRootFolder) {
      setAddRootFolder(savedAddRootFolder === 'true')
    }

    setReady(true)
  }, [])

  useEffect(() => {
    localStorage.setItem('unzipPassword', password)
  }, [password])

  useEffect(() => {
    localStorage.setItem('unzipAddRootFolder', addRootFolder.toString())
  }, [addRootFolder])

  if (!ready) {
    return <PageLoading />
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        className="w-full p-2 border rounded"
        type="password"
        placeholder="Enter password (if any)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={totalProgress > 0}
      />

      <Picker
        message="Drag and drop ZIP files here, or click to select files"
        onSelect={(acceptedFiles) => setSelectedFiles(acceptedFiles)}
        accept={{ zip: ['.zip'] }}
        disabled={totalProgress > 0}
        selectedFiles={selectedFiles}
      />

      <div className="w-full flex flex-col">
        <label className="px-2 text-gray-600 inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={addRootFolder} onChange={(e) => setAddRootFolder(e.target.checked)} />
          <span className="ml-2">Add root folder for each unzip</span>
        </label>
      </div>

      <button onClick={() => startUnzip()} className="w-full bg-indigo-600 text-white p-2 rounded disabled:opacity-50" disabled={selectedFiles.length === 0 || totalProgress > 0}>
        Start Unzipping
      </button>

      {(unzipResults.length > 0 || totalProgress > 0) && (
        <div className="mt-4 w-full border rounded-md overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 flex items-center justify-between">
            <span>Extraction Results</span>
            <div className="flex rounded-md overflow-hidden border border-gray-300">
              <button
                className={`px-3 py-1 text-xs ${viewMode === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setViewMode('all')}
              >
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

          {totalProgress > 0 && (
            <div className="border-b border-gray-200">
              <FileProgressBar
                bgClassName="rounded-none"
                barClassName="rounded-none"
                noText={true}
                progress={totalProgress}
                message={totalProgress >= 100 ? 'Finish' : `${currentZip}: extracting ${currentFile}`}
              />
            </div>
          )}

          <div
            className="divide-y divide-gray-200 max-h-[300px] overflow-y-auto"
            ref={(el: HTMLDivElement) => {
              if (!el) {
                return
              }

              el.scrollTop = el.scrollHeight
            }}
          >
            {filteredResults.map((result, index) => (
              <div key={index} className="px-4 py-3 flex items-center">
                <div className="flex items-center gap-2">
                  {result.loading ? (
                    <Spinner color="text-indigo-500" />
                  ) : result.success ? (
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
                  )}

                  <div className="column grow flex flex-col">
                    <span className="text-sm text-gray-900 truncate max-w-[400px]">{result.file}</span>
                    {!result.success && <span className="text-sm text-red-500">{result.error}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
