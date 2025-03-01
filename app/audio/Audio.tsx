'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRequest } from 'ahooks'
import { showOpenFilePicker, showDirectoryPicker } from '@/services/file/common'
import { globFiles, readFile, readFileToArrayBuffer } from '@/services/file/reader'
import { createDirectoryAndWriteFile, writeFileToDirectory } from '@/services/file/writer'
import { embedFlacMetadata } from '@/services/flac'
import { getImageMimeType } from '@/services/image/getImageMimeType'
import { getImageSize } from '@/services/image/getImageSize'
import ResourcePicker, { useResourcePicker } from '@/components/ResourcePicker'
import PageLoading from '@/components/PageLoading'
import FileProgressBar from '@/components/FileProgressBar'
import FeatherIcon from 'feather-icons-react'
import { basename } from '@/services/file/path'
import { fuzzyMatchFileName } from '@/services/file/fuzzyMatch'
import { COVER_EXTNAME, LYRICS_EXTNAME, METADATA_EXTNAME } from './constants'

interface FileCache {
  cover?: { handle: FileSystemFileHandle; entry: { name: string } }
  lyrics?: { handle: FileSystemFileHandle; entry: { name: string } }
  metadata?: { handle: FileSystemFileHandle; entry: { name: string } }
}

type AudioResult = {
  file: string
  success?: boolean
  error?: string
  loading?: boolean
}

export default function Audio() {
  const [ready, setReady] = useState(false)
  const [currentFile, setCurrentFile] = useState('')
  const [totalProgress, setTotalProgress] = useState(0)
  const [fileCache, setFileCache] = useState<Record<string, FileCache>>({})
  const [audioResults, setAudioResults] = useState<AudioResult[]>([])
  const [viewMode, setViewMode] = useState<'all' | 'error'>('all')

  const filteredResults = useMemo(() => {
    if (viewMode === 'error') {
      return audioResults.filter((result) => !result.success)
    }
    return audioResults
  }, [audioResults, viewMode])

  const workspaceContext = useResourcePicker({ fileTypes: ['flac'], only: 'file', deep: true })
  const { selectedHandle: workspaceHandle, selected: isWorkspaceSelected, selects: selectedFiles, selectableItems: availableItems, setSelects: setSelectedFiles } = workspaceContext

  const { run: startEmbedding, loading } = useRequest(
    async () => {
      setAudioResults([])
      const outputDirHandle = await showDirectoryPicker()
      const totalFiles = selectedFiles.size
      let processedFiles = 0

      for await (const itemEntry of availableItems) {
        if (!selectedFiles.has(itemEntry.name) || itemEntry.kind !== 'file') continue

        const itemName = itemEntry.name
        setCurrentFile(itemName)
        const cache = fileCache[itemName]

        setAudioResults((prev) => [...prev, { file: itemName, loading: true }])

        try {
          const cover = cache?.cover ? await readFileToArrayBuffer(cache.cover.handle) : undefined
          const format = cache?.cover ? getImageMimeType(cache.cover.entry.name) : undefined
          const coverSize = cover && format ? await getImageSize(cover, format) : undefined
          const coverMetadata = { ...coverSize, format }
          const lyrics = cache?.lyrics ? await readFile(cache.lyrics.handle) : undefined
          const metadataContent = cache?.metadata ? await readFile(cache.metadata.handle) : '{}'
          const metadata = (() => {
            try {
              return JSON.parse(metadataContent)
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error('Failed to parse metadata file:', error)
              throw new Error('Failed to parse metadata file')
            }
          })()

          const arrayBuffer = await readFileToArrayBuffer(itemEntry.handle)
          const content = embedFlacMetadata(arrayBuffer, { ...metadata, lyrics, cover, coverMetadata })

          await writeFileToDirectory(basename(itemName), content, {
            directoryHandle: outputDirHandle,
            onProgress(progress, total) {
              const writeProgress = (progress / total) * 100
              const totalProgress = ((processedFiles + writeProgress / 100) / totalFiles) * 100
              setTotalProgress(totalProgress)
            },
          })

          setAudioResults((prev) => prev.map((result) => (result.file === itemName ? { ...result, success: true, loading: false } : result)))
        } catch (error) {
          setAudioResults((prev) =>
            prev.map((result) => (result.file === itemName ? { ...result, success: false, loading: false, error: error instanceof Error ? error.message : '未知错误' } : result))
          )

          // eslint-disable-next-line no-console
          console.error(error)
        }

        processedFiles += 1
        setTotalProgress((processedFiles / totalFiles) * 100)
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
      },
      onFinally: () => {
        setCurrentFile('')
      },
    }
  )

  useEffect(() => {
    setReady(true)
  }, [])

  const fileKeys = availableItems.map((item) => item.name).join(',')
  useEffect(() => {
    if (!workspaceHandle || !availableItems.length) {
      return
    }

    const updateFileCache = async () => {
      const entries = await globFiles(workspaceHandle)
      const newCache: Record<string, FileCache> = {}
      for (const itemHandle of availableItems) {
        if (itemHandle.kind !== 'file') {
          continue
        }

        const itemName = itemHandle.name
        const baseName = basename(itemName)
        const name = baseName.split('.').slice(0, -1).join('.')

        const possibleCovers = COVER_EXTNAME.map((extname) => `${name}${extname}`)
        const possibleLyrics = LYRICS_EXTNAME.map((extname) => `${name}${extname}`)
        const possibleMetadata = METADATA_EXTNAME.map((extname) => `${name}${extname}`)

        const coverEntry = entries.find((entry) => possibleCovers.some((cover) => fuzzyMatchFileName(cover, entry.name)))
        const lyricsEntry = entries.find((entry) => possibleLyrics.some((lyric) => fuzzyMatchFileName(lyric, entry.name)))
        const metadataEntry = entries.find((entry) => possibleMetadata.some((metadata) => fuzzyMatchFileName(metadata, entry.name)))

        newCache[itemName] = {
          cover: coverEntry ? { handle: coverEntry.handle, entry: coverEntry } : undefined,
          lyrics: lyricsEntry ? { handle: lyricsEntry.handle, entry: lyricsEntry } : undefined,
          metadata: metadataEntry ? { handle: metadataEntry.handle, entry: metadataEntry } : undefined,
        }
      }

      setFileCache(newCache)
    }

    updateFileCache()
  }, [workspaceHandle, fileKeys])

  if (!ready) {
    return <PageLoading />
  }

  const handleFileSelect = async (type: 'cover' | 'lyrics' | 'metadata', itemName: string) => {
    try {
      const [fileHandle] = await showOpenFilePicker({
        types: [
          {
            description: type === 'cover' ? 'Image files' : type === 'lyrics' ? 'Lyrics files' : 'Metadata files',
            accept: (type === 'cover'
              ? { 'image/*': COVER_EXTNAME }
              : type === 'lyrics'
                ? { 'text/plain': LYRICS_EXTNAME }
                : type === 'metadata'
                  ? { 'application/json': METADATA_EXTNAME }
                  : {}) as Record<MIMEType, FileExtension[]>,
          },
        ],
      })

      const directory = itemName.split('/').slice(0, -1).join('/')
      const basename = itemName.split('/').pop()!
      const name = basename.split('.').slice(0, -1).join('.')

      const file = await fileHandle.getFile()
      const extname = file.name.split('.').pop()!
      const filename = `${name}.${extname}`
      const content = await file.arrayBuffer()

      const [createdFileEntry] = await createDirectoryAndWriteFile(directory, [{ name: filename, content }], {
        directoryHandle: workspaceHandle,
      })

      setFileCache((prev) => ({
        ...prev,
        [itemName]: {
          ...prev[itemName],
          [type]: { handle: createdFileEntry, entry: { name: createdFileEntry.name } },
        },
      }))
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        // eslint-disable-next-line no-console
        console.error(error.message)
      }
    }
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
          message={totalProgress >= 100 ? 'Finish' : `Processing ${currentFile}`}
        />
      </div>
    )
  }

  const renderReusltBody = () => {
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
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent" />
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
      <ResourcePicker
        {...workspaceContext}
        disabled={loading}
        afterItemRender={(item) => {
          const cache = fileCache[item.name] || {}
          return (
            <>
              <a
                onClick={() => handleFileSelect('cover', item.name)}
                className={`group relative cursor-pointer p-[1px] text-white rounded-sm ${cache.cover ? 'bg-indigo-500' : 'bg-red-600'}`}
              >
                <FeatherIcon icon="image" size={16} />
                <div className="pointer-events-none absolute -top-7 -right-0 max-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {cache.cover ? basename(cache.cover.entry.name) : 'Select cover image file'}
                </div>
              </a>
              <a
                onClick={() => handleFileSelect('lyrics', item.name)}
                className={`group relative cursor-pointer p-[1px] text-white rounded-sm ${cache.lyrics ? 'bg-indigo-500' : 'bg-red-600'}`}
              >
                <FeatherIcon icon="align-left" size={16} />
                <div className="pointer-events-none absolute -top-7 -right-0 max-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {cache.lyrics ? basename(cache.lyrics.entry.name) : 'Select lyrics file'}
                </div>
              </a>
              <a
                onClick={() => handleFileSelect('metadata', item.name)}
                className={`group relative cursor-pointer p-[1px] text-white rounded-sm ${cache.metadata ? 'bg-indigo-500' : 'bg-red-600'}`}
              >
                <FeatherIcon icon="disc" size={16} />
                <div className="pointer-events-none absolute -top-7 -right-0 max-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {cache.metadata ? basename(cache.metadata.entry.name) : 'Select metadata file'}
                </div>
              </a>
            </>
          )
        }}
      />

      {isWorkspaceSelected && (
        <button
          onClick={() => startEmbedding()}
          className="w-full bg-indigo-600 text-white p-2 rounded disabled:opacity-50"
          disabled={selectedFiles.size === 0 || totalProgress > 0}
        >
          Embed Metadata
        </button>
      )}

      {(audioResults.length > 0 || totalProgress > 0) && (
        <div className="mt-4 w-full border rounded-md overflow-hidden">
          {renderResultHeader()}
          {renderResultProgress()}
          {renderReusltBody()}
        </div>
      )}
    </div>
  )
}
