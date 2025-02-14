'use client'

import { useRef, useState, useEffect } from 'react'
import { useRequest } from 'ahooks'
import { BlobReader, BlobWriter, ZipWriter, ZipWriterConstructorOptions } from '@zip.js/zip.js'
import { globFiles, readFile } from '@/services/file/reader'
import { showDirectoryPicker } from '@/services/file/common'
import Alert, { AlertImperativeHandler } from '@/components/Alert'
import Meta from '@/components/Meta'
import ResourcePicker, { useResourcePicker } from '@/components/ResourcePicker'
import FileProgressBar from '@/components/FileProgressBar'
import PageLoading from '@/components/PageLoading'
import { EXCLUDES_FILES } from './constants'

export default function Zip() {
  const [ready, setReady] = useState(false)
  const [currentFolder, setCurrentFolder] = useState('')
  const [currentFile, setCurrentFile] = useState('')
  const [totalProgress, setTotalProgress] = useState(0)
  const [password, setPassword] = useState('')
  const [addRootFolder, setAddRootFolder] = useState(false)
  const alertRef = useRef<AlertImperativeHandler>(null)

  const workspaceContext = useResourcePicker({ fileTypes: ['zip'] })
  const { selected: isWorkspaceSelected, selects: selectedFolders, selectableItems: availableItems, setSelects: setSelectedFolders } = workspaceContext

  useEffect(() => {
    setReady(true)
  }, [])

  const { run: startZip, loading } = useRequest(
    async () => {
      const outputDirHandle = await showDirectoryPicker()
      const totalFolders = selectedFolders.size
      let processedFolders = 0

      for await (const itemHandle of availableItems) {
        if (!selectedFolders.has(itemHandle.name)) {
          continue
        }

        const itemName = itemHandle.name
        setCurrentFolder(itemName)

        const zipOptions: ZipWriterConstructorOptions = {}
        if (password) {
          zipOptions.password = password
        }

        let files = []
        if (itemHandle.kind === 'directory') {
          const fileEntries = await globFiles(itemHandle)
          for (const fileEntry of fileEntries) {
            files.push(fileEntry.handle)
          }
        } else {
          files.push(itemHandle)
        }

        const totalFiles = files.length
        if (totalFiles === 0) {
          alertRef.current?.show(`File ${itemHandle.name} is empty and will be skipped.`, { type: 'warn' })
          continue
        }

        const zipWriter = new ZipWriter(new BlobWriter('application/zip'), zipOptions)

        let processedFiles = 0
        for (const file of files) {
          const basename = file.name.split('/').pop()!
          if (EXCLUDES_FILES.includes(basename)) {
            continue
          }

          const fileData = await readFile(file)
          const blob = new Blob([fileData], { type: 'text/plain' })
          const fileName = addRootFolder ? `${itemName}/${file.name}` : file.name
          await zipWriter.add(fileName, new BlobReader(blob), {
            onprogress: async (progress, total) => {
              const writeProgress = (progress / total) * 50
              const totalProgress = ((processedFolders + (processedFiles + writeProgress / 100) / totalFiles) / totalFolders) * 100
              setTotalProgress(totalProgress)
              setCurrentFile(file.name)
            },
          })
          processedFiles += 1
        }

        const zipBlob = await zipWriter.close()
        const zipFile = new File([zipBlob], `${itemName}.zip`, { type: 'application/zip' })
        const writable = await outputDirHandle.getFileHandle(`${itemName}.zip`, { create: true })
        const writableStream = await writable.createWritable()
        await writableStream.write(zipFile)
        await writableStream.close()

        processedFolders += 1
        setTotalProgress((processedFolders / totalFolders) * 100)
      }
    },
    {
      manual: true,
      onSuccess: () => {
        setTotalProgress(100)
        setSelectedFolders(new Set())
        setTimeout(() => setTotalProgress(0), 500)
      },
      onError: (error) => {
        setTotalProgress(0)
        alertRef.current?.show(error.message, { type: 'error' })
      },
      onFinally: () => {
        setCurrentFolder('')
        setCurrentFile('')
      },
    }
  )

  if (!ready) {
    return <PageLoading />
  }

  return (
    <div className="w-[100vw] h-[100vh] flex flex-col items-center">
      <div className="flex flex-col gap-4 w-2/3 max-w-3xl mx-auto mt-10">
        <Meta title="Local Zip" description="Zip files directly in your browser. Batch compress availableFolders into zip files. Using @zip.js/zip.js library." />

        <ResourcePicker {...workspaceContext} disabled={loading} />

        {isWorkspaceSelected && (
          <>
            <div className="w-full">
              <input
                className="w-full p-2 border rounded"
                type="text"
                placeholder="Enter password (if any)"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <div className="w-full flex flex-col">
              <label className="text-gray-600 inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={addRootFolder} onChange={(e) => setAddRootFolder(e.target.checked)} />
                <span className="ml-2">Add root folder for each zip</span>
              </label>
            </div>

            <button onClick={() => startZip()} className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50" disabled={selectedFolders.size === 0 || totalProgress > 0}>
              Start Zipping
            </button>
          </>
        )}

        <div className="w-full h-10 flex flex-col gap-4">
          <Alert ref={alertRef} />
          {totalProgress > 0 && <FileProgressBar progress={totalProgress} message={totalProgress >= 100 ? 'Finish' : `${currentFolder}: compressing ${currentFile}`} />}
        </div>
      </div>
    </div>
  )
}
