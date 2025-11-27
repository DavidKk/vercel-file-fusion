'use client'

import { BlobReader, BlobWriter, ZipWriter, type ZipWriterConstructorOptions } from '@zip.js/zip.js'
import { useRequest } from 'ahooks'
import { useEffect, useRef, useState } from 'react'

import Alert, { type AlertImperativeHandler } from '@/components/Alert'
import FileProgressBar from '@/components/FileProgressBar'
import PageLoading from '@/components/PageLoading'
import ResourcePicker, { useResourcePicker } from '@/components/ResourcePicker'
import { openDirectoryPicker } from '@/services/file/common'
import { globFiles, readFile } from '@/services/file/reader'
import { isDirectoryEntry } from '@/services/file/types'

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
      const totalFolders = selectedFolders.size
      if (totalFolders === 0) {
        throw new Error('No files selected')
      }

      const outputDirHandle = await openDirectoryPicker({ mode: 'readwrite' })

      let processedFolders = 0
      for await (const itemEntry of availableItems) {
        if (!selectedFolders.has(itemEntry.name)) {
          continue
        }

        const itemName = itemEntry.name
        setCurrentFolder(itemName)

        const zipOptions: ZipWriterConstructorOptions = {}
        if (password) {
          zipOptions.password = password
        }

        const files = new Map<string, FileSystemFileHandle>()
        if (isDirectoryEntry(itemEntry)) {
          const fileEntries = await globFiles(itemEntry.handle)
          for (const fileEntry of fileEntries) {
            files.set(fileEntry.name, fileEntry.handle)
          }
        } else {
          files.set(itemEntry.name, itemEntry.handle)
        }

        const totalFiles = files.size
        if (totalFiles === 0) {
          alertRef.current?.show(`File ${itemEntry.name} is empty and will be skipped.`, { type: 'warn' })
          continue
        }

        const zipWriter = new ZipWriter(new BlobWriter('application/zip'), zipOptions)

        let processedFiles = 0
        for (const [name, file] of files.entries()) {
          const basename = name.split('/').pop()!
          if (EXCLUDES_FILES.includes(basename)) {
            continue
          }

          const fileData = await readFile(file)
          const blob = new Blob([fileData], { type: 'text/plain' })
          const fileName = addRootFolder ? `${itemName}/${name}` : name
          await zipWriter.add(fileName, new BlobReader(blob), {
            onprogress: async (progress, total) => {
              const writeProgress = (progress / total) * 50
              const totalProgress = ((processedFolders + (processedFiles + writeProgress / 100) / totalFiles) / totalFolders) * 100
              setTotalProgress(totalProgress)
              setCurrentFile(name)
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
        // eslint-disable-next-line no-console
        console.error(error)

        setTotalProgress(0)
        alertRef.current?.show(error.message, { type: 'error' })
      },
      onFinally: () => {
        setCurrentFolder('')
        setCurrentFile('')
      },
    }
  )

  const { run: startMergeZip, loading: mergeLoading } = useRequest(
    async () => {
      const zipOptions: ZipWriterConstructorOptions = {}
      if (password) {
        zipOptions.password = password
      }

      const zipWriter = new ZipWriter(new BlobWriter('application/zip'), zipOptions)
      const allFiles = new Map<string, FileSystemFileHandle>()

      for await (const itemEntry of availableItems) {
        if (!selectedFolders.has(itemEntry.name)) {
          continue
        }

        if (isDirectoryEntry(itemEntry)) {
          const fileEntries = await globFiles(itemEntry.handle)
          for (const fileEntry of fileEntries) {
            allFiles.set(fileEntry.name, fileEntry.handle)
          }
        } else {
          allFiles.set(itemEntry.name, itemEntry.handle)
        }
      }

      const totalFiles = allFiles.size
      if (totalFiles === 0) {
        alertRef.current?.show('No files selected or all files are empty', { type: 'warn' })
        return
      }

      for (const [name, file] of allFiles.entries()) {
        const basename = name.split('/').pop()!
        if (EXCLUDES_FILES.includes(basename)) {
          continue
        }

        setCurrentFile(name)
        const fileData = await readFile(file)
        const blob = new Blob([fileData], { type: 'text/plain' })
        await zipWriter.add(name, new BlobReader(blob), {
          onprogress: async (progress, total) => {
            const writeProgress = (progress / total) * 100
            setTotalProgress(writeProgress)
          },
        })
      }

      const zipBlob = await zipWriter.close()

      const outputFileName = 'merged_files.zip'
      const zipFile = new File([zipBlob], outputFileName, { type: 'application/zip' })

      const outputDirHandle = await openDirectoryPicker({ mode: 'readwrite' })
      const writable = await outputDirHandle.getFileHandle(outputFileName, { create: true })

      const writableStream = await writable.createWritable()
      await writableStream.write(zipFile)
      await writableStream.close()

      setTotalProgress(100)
    },
    {
      manual: true,
      onSuccess: () => {
        setTotalProgress(100)
        setSelectedFolders(new Set())
        setTimeout(() => setTotalProgress(0), 500)
      },
      onError: (error) => {
        // eslint-disable-next-line no-console
        console.error(error)

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
    <div className="flex flex-col gap-2">
      <ResourcePicker {...workspaceContext} disabled={loading || mergeLoading} />

      {isWorkspaceSelected && (
        <>
          <div className="w-full">
            <input className="w-full p-2 border rounded" type="text" placeholder="Enter password (if any)" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>

          <div className="w-full flex flex-col">
            <label className="text-gray-600 inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={addRootFolder} onChange={(e) => setAddRootFolder(e.target.checked)} />
              <span className="ml-2">Add root folder for zip</span>
            </label>
          </div>

          <div className="w-full flex gap-2">
            <button
              onClick={() => startZip()}
              className="flex-1 bg-indigo-600 text-white p-2 rounded disabled:opacity-50"
              disabled={selectedFolders.size === 0 || totalProgress > 0}
            >
              Zip Individually
            </button>
            <button
              onClick={() => startMergeZip()}
              className="flex-1 bg-indigo-600 text-white p-2 rounded disabled:opacity-50"
              disabled={selectedFolders.size === 0 || totalProgress > 0}
            >
              Merge to Single Zip
            </button>
          </div>
        </>
      )}

      <div className="w-full h-10 flex flex-col gap-4">
        <Alert ref={alertRef} />
        {totalProgress > 0 && (
          <FileProgressBar progress={totalProgress} message={totalProgress >= 100 ? 'Finish' : `${currentFolder ? currentFolder + ': ' : ''}compressing ${currentFile}`} />
        )}
      </div>
    </div>
  )
}
