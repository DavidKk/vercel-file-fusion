'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRequest } from 'ahooks'
import { ZipReader, ZipWriter, BlobReader, BlobWriter } from '@zip.js/zip.js'
import type { ZipWriterConstructorOptions } from '@zip.js/zip.js'
import { showDirectoryPicker } from '@/services/file/common'
import FileProgressBar from '@/components/FileProgressBar'
import PageLoading from '@/components/PageLoading'
import Picker from '@/components/Picker'
import { Spinner } from '@/components/Spinner'

type ViewMode = 'all' | 'error'

type UnzipResult = {
  file: string
  success?: boolean
  error?: string
  loading?: boolean
}

export default function Unroot() {
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [currentUnrootFile, setCurrentUnrootFile] = useState('')
  const [currentFile, setCurrentFile] = useState('')
  const [totalProgress, setTotalProgress] = useState(0)
  const [results, setResults] = useState<UnzipResult[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const filteredResults = useMemo(() => {
    if (viewMode === 'error') {
      return results.filter((result) => !result.success)
    }

    return results
  }, [results, viewMode])

  useEffect(() => {
    setReady(true)
  }, [])

  const { run: startUnroot } = useRequest(
    async () => {
      let totalUnrootFiles = selectedFiles.length
      if (totalUnrootFiles === 0) {
        throw new Error('No files selected')
      }

      // Maully select output directory
      const outputDirHandle = await showDirectoryPicker({ mode: 'readwrite' })

      // Reset results
      setResults([])

      let processedUnrootFiles = 0
      for await (const file of selectedFiles) {
        const zipFileName = file.name
        const zipReader = new ZipReader(new BlobReader(file))
        const entries = await zipReader.getEntries()
        if (entries.length === 0) {
          totalUnrootFiles--
          continue
        }

        // Check for single root directory
        const rootDirs = new Set()
        for (const entry of entries) {
          const parts = entry.filename.split('/')
          if (!(parts.length > 1)) {
            continue
          }

          rootDirs.add(parts[0])
        }

        // If there's more than one root directory, skip this file
        if (rootDirs.size !== 1) {
          totalUnrootFiles--
          continue
        }

        // Unroot files
        let processedFiles = 0

        const outputFileName = zipFileName.replace(/\.zip$/, '.unroot.zip')
        setCurrentUnrootFile(outputFileName)
        setResults((prev) => [...prev, { file: outputFileName, loading: true }])

        try {
          // Create new zip file
          const zipOptions: ZipWriterConstructorOptions = {}
          if (password) {
            zipOptions.password = password
          }

          const zipWriter = new ZipWriter(new BlobWriter('application/zip'), zipOptions)
          const totalFiles = entries.length
          for await (const entry of entries) {
            if (entry.directory) {
              continue
            }

            const parts = entry.filename.split('/')
            const name = parts.slice(1).join('/')

            // Verify entry and get data
            if (!entry || !entry.getData) {
              throw new Error(`Invalid entry in ${zipFileName}`)
            }

            const fileData = await entry.getData(new BlobWriter())
            if (!fileData) {
              throw new Error(`Failed to extract data from ${entry.filename}`)
            }

            await zipWriter.add(name, new BlobReader(fileData), {
              onprogress: async (progress, total) => {
                const writeProgress = (progress / total) * 50
                const totalProgress = ((processedUnrootFiles + (processedFiles + writeProgress / 100) / totalFiles) / totalUnrootFiles) * 100

                setTotalProgress(totalProgress)
                setCurrentFile(name)
              },
            })

            processedFiles += 1
          }

          const zipBlob = await zipWriter.close()

          const zipFile = new File([zipBlob], outputFileName, { type: 'application/zip' })

          const writable = await outputDirHandle.getFileHandle(outputFileName, { create: true })

          const writableStream = await writable.createWritable()
          await writableStream.write(zipFile)
          await writableStream.close()

          // Update results
          processedFiles += 1
          setTotalProgress((processedFiles / totalUnrootFiles) * 100)
          setResults((prev) => prev.map((result) => (result.file === outputFileName ? { ...result, success: true, loading: false } : result)))
        } catch (error) {
          setResults((prev) =>
            prev.map((result) =>
              result.file === outputFileName ? { ...result, success: false, loading: false, error: error instanceof Error ? error.message : 'Unknown error' } : result
            )
          )
        }

        processedUnrootFiles += 1
        setTotalProgress((processedUnrootFiles / totalUnrootFiles) * 100)
      }
    },
    {
      manual: true,
      onSuccess: () => {
        setTotalProgress(100)
        setSelectedFiles([])
        setTimeout(() => setTotalProgress(0), 500)
      },
      onError: (error) => {
        // eslint-disable-next-line no-console
        console.error(error)

        setTotalProgress(0)
      },
      onFinally: () => {
        setCurrentUnrootFile('')
        setCurrentFile('')
      },
    }
  )

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
          message={totalProgress >= 100 ? 'Finish' : `${currentUnrootFile}: processing ${currentFile}`}
        />
      </div>
    )
  }

  const renderResultBody = () => {
    if (!filteredResults?.length) {
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
    )
  }

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
        accept={{
          'application/x-zip-compressed': ['.zip'],
        }}
        disabled={totalProgress > 0}
        selectedFiles={selectedFiles}
      />

      <button onClick={() => startUnroot()} className="w-full bg-indigo-600 text-white p-2 rounded disabled:opacity-50" disabled={selectedFiles.length === 0 || totalProgress > 0}>
        Start Unroot
      </button>

      {(results.length > 0 || totalProgress > 0) && (
        <div className="mt-4 w-full border rounded-md overflow-hidden">
          {renderResultHeader()}
          {renderResultProgress()}
          {renderResultBody()}
        </div>
      )}
    </div>
  )
}
