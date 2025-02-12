'use client'

import iconv from 'iconv-lite'
import { BlobReader, ERR_ENCRYPTED, ERR_INVALID_PASSWORD, Uint8ArrayWriter, ZipReader } from '@zip.js/zip.js'
import { useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { createDirectoryAndWriteFile, WritableFile } from '@/services/file/writer'
import { Ellipsis } from '@/components/Ellipsis'
import Alert, { AlertImperativeHandler } from '@/components/Alert'
import { useRequest } from 'ahooks'

export default function Unzip() {
  const [currentZip, setCurrentZip] = useState('')
  const [progress, setProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState('')
  const [password, setPassword] = useState('')
  const alertRef = useRef<AlertImperativeHandler>(null)

  const { run: onDrop } = useRequest(
    async (acceptedFiles: File[]) => {
      const directoryHandle = await showDirectoryPicker()

      for await (const file of acceptedFiles) {
        const zipFileName = file.name
        setCurrentZip(zipFileName)

        const zipReader = new ZipReader(new BlobReader(file), { password })
        const entries = await zipReader.getEntries()
        const totalFiles = entries.length

        let processedFiles = 0
        const files: WritableFile[] = []
        for await (const entry of entries) {
          if (entry.directory) {
            continue
          }

          if (!entry.getData) {
            continue
          }

          let name: string
          if (entry.filenameUTF8) {
            name = entry.filename
          } else {
            const buffer = new Uint8Array(entry.rawFilename).buffer
            name = iconv.decode(Buffer.from(buffer), 'utf-8')
          }

          setCurrentFile(name)

          try {
            const content = await entry.getData(new Uint8ArrayWriter())
            files.push({ name, content })
          } catch (error) {
            if (error instanceof Error) {
              if (error.message === ERR_ENCRYPTED || error.message === ERR_INVALID_PASSWORD) {
                throw new Error('Incorrect password')
              }
            }

            throw error
          }

          processedFiles++
          setProgress(Math.round((processedFiles / totalFiles) * 100))
        }

        const name = zipFileName.split('.').slice(0, -1).join('.')
        await createDirectoryAndWriteFile(name, files, { directoryHandle })
      }

      setCurrentFile('')
      setCurrentZip('')
      setProgress(0)
    },
    {
      manual: true,
      debounceWait: 1000,
      onError: (error) => {
        alertRef.current?.show(error.message, { type: 'error' })
      },
    }
  )

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      zip: ['.zip'],
    },
    disabled: progress > 0,
  })

  return (
    <div className="w-[100vw] h-[100vh] flex flex-col items-center justify-center">
      <div className="w-2/3 max-w-3xl mx-auto">
        <input className="w-full mb-4 p-2 border rounded" type="password" placeholder="Enter password (if any)" value={password} onChange={(e) => setPassword(e.target.value)} />

        <div
          {...getRootProps()}
          className={`border-2 border-dashed border-[4px] rounded-md border-gray-400 p-6 text-center cursor-pointer w-full h-80 flex items-center justify-center transition-opacity ${progress > 0 ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <input {...getInputProps()} disabled={progress > 0} />
          <p className="text-gray-500 text-md">Drag and drop ZIP files here, or click to select files</p>
        </div>

        <div className="mt-4 w-full h-10">
          <Alert ref={alertRef} />

          {progress > 0 && (
            <div className="w-auto">
              <div className="w-full bg-gray-200 rounded-lg">
                <div className="bg-blue-600 text-md font-medium text-blue-100 text-center p-1 leading-none rounded-lg" style={{ width: `${progress}%` }}>
                  {progress}%
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
