'use client'

import { useRef, useState } from 'react'
import { useRequest } from 'ahooks'
import { BlobReader, ERR_ENCRYPTED, ERR_INVALID_PASSWORD, Uint8ArrayWriter, ZipReader, ZipReaderConstructorOptions } from '@zip.js/zip.js'
import { useDropzone } from 'react-dropzone'
import { writeFileToDirectory } from '@/services/file/writer'
import { Ellipsis } from '@/components/Ellipsis'
import Alert, { AlertImperativeHandler } from '@/components/Alert'
import { FileContent } from '@/services/file/types'
import { transcodeEntryFileName } from '@/services/zip/decode'

export default function Unzip() {
  const [currentZip, setCurrentZip] = useState('')
  const [currentFile, setCurrentFile] = useState('')
  const [totalProgress, setTotalProgress] = useState(0)
  const [password, setPassword] = useState('')
  const alertRef = useRef<AlertImperativeHandler>(null)

  const { run: onDrop } = useRequest(
    async (acceptedFiles: File[]) => {
      const directoryHandle = await showDirectoryPicker()
      let totalFiles = 0
      let processedFiles = 0

      for await (const file of acceptedFiles) {
        const zipFileName = file.name
        setCurrentZip(zipFileName)

        const unzipOptions: ZipReaderConstructorOptions = {}
        if (password) {
          unzipOptions.password = password
        }

        const zipReader = new ZipReader(new BlobReader(file), unzipOptions)
        const entries = await zipReader.getEntries()
        totalFiles += entries.filter((entry) => !entry.directory && entry.getData).length

        for await (const entry of entries) {
          if (entry.directory || !entry.getData) {
            continue
          }

          const name = transcodeEntryFileName(entry)
          let content: FileContent

          try {
            content = await entry.getData(new Uint8ArrayWriter(), {
              onprogress: async (progress, total) => {
                const readProgress = (progress / total) * 50
                const totalProgress = ((processedFiles + readProgress / 100) / totalFiles) * 100
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
              const totalProgress = ((processedFiles + 0.5 + writeProgress / 100) / totalFiles) * 100
              setTotalProgress(totalProgress)
            },
          })

          processedFiles += 1
        }
      }
    },
    {
      manual: true,
      onError: (error) => {
        alertRef.current?.show(error.message, { type: 'error' })
      },
      onFinally: () => {
        setTotalProgress(0)
        setCurrentZip('')
        setCurrentFile('')
      },
    }
  )

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      zip: ['.zip'],
    },
    disabled: totalProgress > 0,
  })

  return (
    <div className="w-[100vw] h-[100vh] flex flex-col items-center justify-center">
      <div className="w-2/3 max-w-3xl mx-auto">
        <input className="w-full mb-4 p-2 border rounded" type="password" placeholder="Enter password (if any)" value={password} onChange={(e) => setPassword(e.target.value)} />

        <div
          {...getRootProps()}
          className={`border-2 border-dashed border-[4px] rounded-md border-gray-400 p-6 text-center cursor-pointer w-full h-80 flex items-center justify-center transition-opacity ${totalProgress > 0 ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <input {...getInputProps()} disabled={totalProgress > 0} />
          <p className="text-gray-500 text-md">Drag and drop ZIP files here, or click to select files</p>
        </div>

        <div className="mt-4 w-full h-10">
          <Alert ref={alertRef} />

          {totalProgress > 0 && (
            <div className="w-auto">
              <div className="w-full bg-gray-200 rounded-lg">
                <div className="transition-[width] bg-blue-600 text-md font-medium text-blue-100 text-center p-1 leading-none rounded-lg" style={{ width: `${totalProgress}%` }}>
                  {totalProgress.toFixed(2)}%
                </div>
              </div>

              <p className="text-gray-800 text-md mt-2">
                {currentZip}: extracting {currentFile}
                <span className="pl-1 font-medium">
                  <Ellipsis />
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
