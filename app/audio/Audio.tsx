'use client'

import { useState, useEffect, useRef } from 'react'
import { useRequest } from 'ahooks'
import { showOpenFilePicker, showDirectoryPicker } from '@/services/file/common'
import { globFiles, readFile, readFileToArrayBuffer } from '@/services/file/reader'
import { writeFileToDirectory } from '@/services/file/writer'
import { embedFlacMetadata } from '@/services/flac'
import { getImageMimeType } from '@/services/image/getImageMimeType'
import { getImageSize } from '@/services/image/getImageSize'
import Alert, { type AlertImperativeHandler } from '@/components/Alert'
import ResourcePicker, { useResourcePicker } from '@/components/ResourcePicker'
import PageLoading from '@/components/PageLoading'
import FileProgressBar from '@/components/FileProgressBar'
import { COVER_EXTNAME, LYRICS_EXTNAME, METADATA_EXTNAME } from './constants'
import FeatherIcon from 'feather-icons-react'

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

  useEffect(() => {
    setReady(true)
  }, [])

  useEffect(() => {
    if (!workspaceHandle || !availableItems.length) return

    const updateFileCache = async () => {
      const entries = await globFiles(workspaceHandle)
      const newCache: Record<string, FileCache> = {}

      for (const itemHandle of availableItems) {
        if (itemHandle.kind !== 'file') continue

        const itemName = itemHandle.name
        const name = itemName.split('.').slice(0, -1).join('.')
        const possibleCovers = COVER_EXTNAME.map((extname) => `${name}${extname}`)
        const possibleLyrics = LYRICS_EXTNAME.map((extname) => `${name}${extname}`)
        const possibleMetadata = METADATA_EXTNAME.map((extname) => `${name}${extname}`)

        const coverEntry = entries.find((entry) => {
          const filename = entry.name.split('/').pop()!
          return possibleCovers.includes(filename)
        })

        const lyricsEntry = entries.find((entry) => {
          const filename = entry.name.split('/').pop()!
          return possibleLyrics.includes(filename)
        })

        const metadataEntry = entries.find((entry) => {
          const filename = entry.name.split('/').pop()!
          return possibleMetadata.includes(filename)
        })

        newCache[itemName] = {
          cover: coverEntry ? { handle: coverEntry.handle, entry: coverEntry } : undefined,
          lyrics: lyricsEntry ? { handle: lyricsEntry.handle, entry: lyricsEntry } : undefined,
          metadata: metadataEntry ? { handle: metadataEntry.handle, entry: metadataEntry } : undefined,
        }
      }

      setFileCache(newCache)
    }

    updateFileCache()
  }, [workspaceHandle, availableItems])

  const { run: startEmbedding, loading } = useRequest(
    async () => {
      const outputDirHandle = await showDirectoryPicker()
      const totalFiles = selectedFiles.size
      let processedFiles = 0

      for await (const itemHandle of availableItems) {
        if (!selectedFiles.has(itemHandle.name) || itemHandle.kind !== 'file') continue

        const itemName = itemHandle.name
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

          const arrayBuffer = await readFileToArrayBuffer(itemHandle)
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

      const file = await fileHandle.getFile()
      const name = itemName.split('.').slice(0, -1).join('.')
      const newFileHandle = await workspaceHandle?.getFileHandle(name + (type === 'cover' ? COVER_EXTNAME[0] : type === 'lyrics' ? LYRICS_EXTNAME[0] : METADATA_EXTNAME[0]), {
        create: true,
      })
      if (!newFileHandle) return

      const writable = await newFileHandle.createWritable()
      await writable.write(file)
      await writable.close()

      setFileCache((prev) => ({
        ...prev,
        [itemName]: {
          ...prev[itemName],
          [type]: { handle: newFileHandle, entry: { name: newFileHandle.name } },
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
                className={`cursor-pointer p-[1px] text-white rounded-sm ${cache.cover ? 'bg-green-500' : 'bg-red-500'}`}
                title="found cover image file"
              >
                <FeatherIcon icon="image" size={16} />
              </a>
              <a
                onClick={() => handleFileSelect('lyrics', item.name)}
                className={`cursor-pointer p-[1px] text-white rounded-sm ${cache.lyrics ? 'bg-green-500' : 'bg-red-500'}`}
                title="found lyrics file"
              >
                <FeatherIcon icon="align-left" size={16} />
              </a>
              <a
                onClick={() => handleFileSelect('metadata', item.name)}
                className={`cursor-pointer p-[1px] text-white rounded-sm ${cache.metadata ? 'bg-green-500' : 'bg-red-500'}`}
                title="found metadata json file"
              >
                <FeatherIcon icon="disc" size={16} />
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
