'use client'

import { useRequest } from 'ahooks'
import { useEffect, useMemo, useState } from 'react'

import FileProgressBar from '@/components/FileProgressBar'
import PageLoading from '@/components/PageLoading'
import Picker from '@/components/Picker'
import { Spinner } from '@/components/Spinner'
import { openDirectoryPicker } from '@/services/file/common'
import { sanitizeFileName } from '@/services/file/name'
import { writeFileToDirectory } from '@/services/file/writer'

import { type ExtractedFile, useUnrarExtractor } from './hooks/useUnrarExtractor'
import { useUnrarModule } from './hooks/useUnrarModule'

type ViewMode = 'all' | 'error'

type UnrarResult = {
  file: string
  success?: boolean
  error?: string
  loading?: boolean
}

export default function Unrar() {
  const [ready, setReady] = useState(false)
  const [currentRar, setCurrentRar] = useState('')
  const [currentFile, setCurrentFile] = useState('')
  const [totalProgress, setTotalProgress] = useState(0)
  const [password, setPassword] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [addRootFolder, setAddRootFolder] = useState(false)
  const [results, setResults] = useState<UnrarResult[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const { module: unrarModule, loading: moduleLoading, progress: moduleProgress, error: moduleError } = useUnrarModule()
  const { extract, clear, isExtracting, error: extractError } = useUnrarExtractor(unrarModule)
  const moduleErrorMessage = moduleError?.message ?? null
  const filteredResults = useMemo(() => {
    if (viewMode === 'error') {
      return results.filter((result) => !result.success)
    }

    return results
  }, [results, viewMode])

  const handleReloadModule = () => {
    window.location.reload()
  }

  const renderModuleStatus = () => {
    if (moduleLoading && !unrarModule) {
      return (
        <div className="flex items-center gap-2 rounded border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
          <Spinner color="text-indigo-500" />
          <span>正在加载 UnRAR 模块… {Math.min(100, Math.round(moduleProgress))}%</span>
        </div>
      )
    }

    if (moduleErrorMessage) {
      return (
        <div className="flex flex-col gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          <span>加载 UnRAR 模块失败：{moduleErrorMessage}</span>
          <button type="button" onClick={handleReloadModule} className="w-fit rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700">
            重新加载
          </button>
        </div>
      )
    }

    return null
  }

  const renderExtractionStatus = () => {
    if (!extractError) {
      return null
    }

    return <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">解压失败：{extractError.message}</div>
  }

  const { run: startUnrar } = useRequest(
    async () => {
      if (!selectedFiles.length) {
        return
      }

      if (!unrarModule) {
        const errorMessage = moduleErrorMessage ?? 'UnRAR 模块尚未准备好'
        setResults(selectedFiles.map((file) => ({ file: file.name, success: false, loading: false, error: errorMessage })))
        return
      }

      clear()
      setResults([])
      setTotalProgress(0)

      const directoryHandle = await openDirectoryPicker()
      const totalRars = selectedFiles.length || 1
      let processedRars = 0
      const resolvedPassword = password.trim()

      for await (const file of selectedFiles) {
        const rarFileName = file.name
        setCurrentRar(rarFileName)
        setCurrentFile('')

        setResults((prev) => [...prev, { file: rarFileName, loading: true }])

        try {
          const extractedFiles = await extract(file, resolvedPassword)
          const filesToWrite = extractedFiles.filter((item): item is ExtractedFile & { data: Uint8Array } => !item.isDirectory && !!item.data)
          const totalFiles = filesToWrite.length || 1
          let processedFiles = 0

          for (const entry of filesToWrite) {
            const name = addRootFolder ? `${rarFileName.replace(/\.(rar|RAR)$/i, '')}/${entry.name}` : entry.name
            const sanitizedName = name
              .split('/')
              .map((item: string) => sanitizeFileName(item))
              .join('/')

            setCurrentFile(name)

            await writeFileToDirectory(sanitizedName, entry.data, {
              directoryHandle,
              onProgress(progress, total) {
                const writeProgress = (progress / total) * 100
                const totalProgressValue = ((processedRars + (processedFiles + writeProgress / 100) / totalFiles) / totalRars) * 100
                setTotalProgress(totalProgressValue)
              },
            })

            processedFiles += 1
          }

          setResults((prev) => prev.map((result) => (result.file === rarFileName ? { ...result, success: true, loading: false } : result)))
        } catch (error) {
          const message = error instanceof Error ? error.message : '未知错误'
          setResults((prev) => prev.map((result) => (result.file === rarFileName ? { ...result, success: false, loading: false, error: message } : result)))
        } finally {
          processedRars += 1
          setTotalProgress((processedRars / totalRars) * 100)
          clear()
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
        setCurrentRar('')
        setCurrentFile('')
      },
    }
  )

  useEffect(() => {
    const savedPassword = localStorage.getItem('unrarPassword')
    const savedAddRootFolder = localStorage.getItem('unrarAddRootFolder')

    if (savedPassword) {
      setPassword(savedPassword)
    }

    if (savedAddRootFolder) {
      setAddRootFolder(savedAddRootFolder === 'true')
    }

    setReady(true)
  }, [])

  useEffect(() => {
    localStorage.setItem('unrarPassword', password)
  }, [password])

  useEffect(() => {
    localStorage.setItem('unrarAddRootFolder', addRootFolder.toString())
  }, [addRootFolder])

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
          message={totalProgress >= 100 ? 'Finish' : `${currentRar}: extracting ${currentFile}`}
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

  return (
    <div className="flex flex-col gap-2">
      {renderModuleStatus()}
      {renderExtractionStatus()}
      <input
        className="w-full p-2 border rounded"
        type="password"
        placeholder="Enter password (if any)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={totalProgress > 0 || isExtracting}
      />

      <Picker
        message="Drag and drop RAR files here, or click to select files"
        onSelect={(acceptedFiles) => setSelectedFiles(acceptedFiles)}
        accept={{
          'application/vnd.rar': ['.rar'],
          'application/x-rar-compressed': ['.rar'],
        }}
        disabled={totalProgress > 0 || moduleLoading || !unrarModule || isExtracting}
        selectedFiles={selectedFiles}
      />

      <div className="w-full flex flex-col">
        <label className="px-2 text-gray-600 inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={addRootFolder} onChange={(e) => setAddRootFolder(e.target.checked)} />
          <span className="ml-2">Add root folder for each unrar</span>
        </label>
      </div>

      <button
        onClick={() => startUnrar()}
        className="w-full bg-indigo-600 text-white p-2 rounded disabled:opacity-50"
        disabled={selectedFiles.length === 0 || totalProgress > 0 || moduleLoading || !unrarModule || isExtracting}
      >
        Start Unraring
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
