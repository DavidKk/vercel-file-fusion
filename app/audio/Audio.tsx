'use client'

import { useState, useEffect, useRef } from 'react'
import { useRequest } from 'ahooks'
import { showDirectoryPicker } from '@/services/file/common'
import { globFiles, readFile, readFileToArrayBuffer } from '@/services/file/reader'
import { writeFileToDirectory } from '@/services/file/writer'
import { embedFlacMetadata } from '@/services/flac'
import Alert, { type AlertImperativeHandler } from '@/components/Alert'
import ResourcePicker, { useResourcePicker } from '@/components/ResourcePicker'
import PageLoading from '@/components/PageLoading'
import FileProgressBar from '@/components/FileProgressBar'
import { COVER_EXTNAME, LYRICS_EXTNAME } from './constants'

export default function Audio() {
  const [ready, setReady] = useState(false)
  const [currentFile, setCurrentFile] = useState('')
  const [totalProgress, setTotalProgress] = useState(0)
  const alertRef = useRef<AlertImperativeHandler>(null)

  const workspaceContext = useResourcePicker({ fileTypes: ['flac'], only: 'file', deep: true })
  const { selectedHandle: workspaceHandle, selected: isWorkspaceSelected, selects: selectedFiles, selectableItems: availableItems, setSelects: setSelectedFiles } = workspaceContext

  useEffect(() => {
    setReady(true)
  }, [])

  const { run: startEmbedding, loading } = useRequest(
    async () => {
      const outputDirHandle = await showDirectoryPicker()
      const totalFiles = selectedFiles.size
      let processedFiles = 0

      const entries = await globFiles(workspaceHandle!)
      for await (const itemHandle of availableItems) {
        if (!selectedFiles.has(itemHandle.name)) {
          continue
        }

        if (itemHandle.kind !== 'file') {
          continue
        }

        const itemName = itemHandle.name
        setCurrentFile(itemName)

        const name = itemName.split('.').slice(0, -1).join('.')
        const possibleCovers = COVER_EXTNAME.map((extname) => `${name}${extname}`)
        const possibleLyrics = LYRICS_EXTNAME.map((extname) => `${name}${extname}`)

        // const coverEntry = entries.find((entry) => {
        //   const filename = entry.name.split('/').pop()!
        //   return possibleCovers.includes(filename)
        // })

        const lyricsEntry = entries.find((entry) => {
          const filename = entry.name.split('/').pop()!
          return possibleLyrics.includes(filename)
        })

        try {
          const LYRICS = lyricsEntry ? await readFile(lyricsEntry.handle) : undefined
          const arrayBuffer = await readFileToArrayBuffer(itemHandle)
          const content = embedFlacMetadata(arrayBuffer, { LYRICS })
  
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

  return (
    <div className="flex flex-col gap-2">
      <ResourcePicker {...workspaceContext} disabled={loading} />

      {isWorkspaceSelected && (
        <button onClick={() => startEmbedding()} className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50" disabled={selectedFiles.size === 0 || totalProgress > 0}>
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
