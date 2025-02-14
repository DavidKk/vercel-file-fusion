'use client'

import { useRef, useState, useEffect } from 'react'
import { useRequest } from 'ahooks'
import { BlobReader, ERR_ENCRYPTED, ERR_INVALID_PASSWORD, Uint8ArrayWriter, ZipReader, type ZipReaderConstructorOptions } from '@zip.js/zip.js'
import type { FileContent } from '@/services/file/types'
import { transcodeEntryFileName } from '@/services/zip/decode'
import { writeFileToDirectory } from '@/services/file/writer'
import Alert, { type AlertImperativeHandler } from '@/components/Alert'
import Picker from '@/components/Picker'
import FileProgressBar from '@/components/FileProgressBar'
import PageLoading from '@/components/PageLoading'

export default function Unzip() {
  const [ready, setReady] = useState(false)
  const [currentZip, setCurrentZip] = useState('')
  const [currentFile, setCurrentFile] = useState('')
  const [totalProgress, setTotalProgress] = useState(0)
  const [password, setPassword] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [addRootFolder, setAddRootFolder] = useState(false)
  const alertRef = useRef<AlertImperativeHandler>(null)

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

  const { run: startUnzip } = useRequest(
    async () => {
      const directoryHandle = await showDirectoryPicker()
      const totalZips = selectedFiles.length
      let processedZips = 0

      for await (const file of selectedFiles) {
        const zipFileName = file.name
        setCurrentZip(zipFileName)

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

          await writeFileToDirectory(name, content, {
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
        setTotalProgress(0)
        alertRef.current?.show(error.message, { type: 'error' })
      },
      onFinally: () => {
        setCurrentZip('')
        setCurrentFile('')
      },
    }
  )

  if (!ready) {
    return <PageLoading />
  }

  return (
    <div className="flex flex-col gap-2">
      <input className="w-full p-2 border rounded" type="text" placeholder="Enter password (if any)" value={password} onChange={(e) => setPassword(e.target.value)} />

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

      <button onClick={() => startUnzip()} className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50" disabled={selectedFiles.length === 0 || totalProgress > 0}>
        Start Unzipping
      </button>

      <div className="mt-4 w-full h-10">
        <Alert ref={alertRef} />

        {totalProgress > 0 && <FileProgressBar progress={totalProgress} message={totalProgress >= 100 ? 'Finish' : `${currentZip}: extracting ${currentFile}`} />}
      </div>
    </div>
  )
}
