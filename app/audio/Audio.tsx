'use client'

import { useState, useEffect, useRef } from 'react'
import { useRequest } from 'ahooks'
import { showOpenFilePicker, showDirectoryPicker } from '@/services/file/common'
import { globFiles, readFile, readFileToArrayBuffer } from '@/services/file/reader'
import { createDirectoryAndWriteFile, writeFileToDirectory } from '@/services/file/writer'
import { embedFlacMetadata } from '@/services/flac'
import { getImageMimeType } from '@/services/image/getImageMimeType'
import { getImageSize } from '@/services/image/getImageSize'
import Alert, { type AlertImperativeHandler } from '@/components/Alert'
import ResourcePicker, { useResourcePicker } from '@/components/ResourcePicker'
import PageLoading from '@/components/PageLoading'
import FileProgressBar from '@/components/FileProgressBar'
import { COVER_EXTNAME, LYRICS_EXTNAME, METADATA_EXTNAME } from './constants'
import FeatherIcon from 'feather-icons-react'
import { basename } from '@/services/file/path'

interface FileCache {
  cover?: { handle: FileSystemFileHandle; entry: { name: string } }
  lyrics?: { handle: FileSystemFileHandle; entry: { name: string } }
  metadata?: { handle: FileSystemFileHandle; entry: { name: string } }
}

export default function Audio() {
  const [ready, setReady] = useState(false)
  const [currentFile, setCurrentFile] = useState('')
  const [totalProgress, setTotalProgress] = useState(0)
  const [fileCache, setFileCache] = useState<Record<string, FileCache>>({})
  const alertRef = useRef<AlertImperativeHandler>(null)

  const workspaceContext = useResourcePicker({ fileTypes: ['flac'], only: 'file', deep: true })
  const { selectedHandle: workspaceHandle, selected: isWorkspaceSelected, selects: selectedFiles, selectableItems: availableItems, setSelects: setSelectedFiles } = workspaceContext

  const { run: startEmbedding, loading } = useRequest(
    async () => {
      const outputDirHandle = await showDirectoryPicker()
      const totalFiles = selectedFiles.size
      let processedFiles = 0

      for await (const itemEntry of availableItems) {
        if (!selectedFiles.has(itemEntry.name) || itemEntry.kind !== 'file') continue

        const itemName = itemEntry.name
        setCurrentFile(itemName)
        const cache = fileCache[itemName]

        try {
          const cover = cache?.cover ? await readFileToArrayBuffer(cache.cover.handle) : undefined
          const format = cache?.cover ? getImageMimeType(cache.cover.entry.name) : undefined
          const coverSize = cover && format ? await getImageSize(cover, format) : {}
          const coverMetadata = { ...coverSize, format }
          const LYRICS = cache?.lyrics ? await readFile(cache.lyrics.handle) : undefined
          const metadataContent = cache?.metadata ? await readFile(cache.metadata.handle) : '{}'
          const metadata = Object.fromEntries(
            (function* () {
              try {
                const data = JSON.parse(metadataContent)
                for (const [key, value] of Object.entries(data)) {
                  const name = key.toLocaleUpperCase()
                  if (typeof value === 'number' || typeof value === 'string') {
                    yield [name, value]
                  }
                }
              } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Failed to parse metadata file:', error)
              }
            })()
          )

          const arrayBuffer = await readFileToArrayBuffer(itemEntry.handle)
          const content = embedFlacMetadata(arrayBuffer, { ...metadata, LYRICS, cover, coverMetadata })

          await writeFileToDirectory(itemName, content, {
            directoryHandle: outputDirHandle,
            onProgress(progress, total) {
              const writeProgress = (progress / total) * 100
              const totalProgress = ((processedFiles + writeProgress / 100) / totalFiles) * 100
              setTotalProgress(totalProgress)
            },
          })
        } catch (error) {
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
        alertRef.current?.show(error.message, { type: 'error' })
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

        const coverEntry = entries.find((entry) => possibleCovers.includes(basename(entry.name)))
        const lyricsEntry = entries.find((entry) => possibleLyrics.includes(basename(entry.name)))
        const metadataEntry = entries.find((entry) => possibleMetadata.includes(basename(entry.name)))

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
        alertRef.current?.show(error.message, { type: 'error' })
      }
    }
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

      <div className="w-full h-10 flex flex-col gap-4">
        <Alert ref={alertRef} />
        {totalProgress > 0 && <FileProgressBar progress={totalProgress} message={totalProgress >= 100 ? 'Finish' : `Processing ${currentFile}`} />}
      </div>
    </div>
  )
}
