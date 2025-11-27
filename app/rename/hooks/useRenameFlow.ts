import { useEffect, useState } from 'react'

import { type ConversionType, type DirectoryInfo, type FileInfo, isConversionType } from '@/app/rename/types/types'
import { convertChinese } from '@/services/chinese-converter'
import { dirname, getDirectoryHandleByPath, moveDirectoryRecursive } from '@/services/file'
import { openDirectoryPicker } from '@/services/file/common'

export type ResultItemMethod = 'move' | 'copy' | 'rename'

export type ResultItem = {
  file: string
  method: ResultItemMethod
  loading?: boolean
  success?: boolean
  error?: string
}

function newResultItem(file: string, method: ResultItemMethod): ResultItem {
  return { file, method, success: false, error: undefined, loading: false }
}

const CONVERSION_TYPE_STORAGE_TOKEN = 'CONVERSION_TYPE'

export function useRenameFlow() {
  const [currentFile, setCurrentFile] = useState('')
  const [totalProgress, setTotalProgress] = useState(0)
  const [sourceDirectory, setSourceDirectory] = useState<FileSystemDirectoryHandle | null>(null)
  const [fileList, setFileList] = useState<FileInfo[]>([])
  const [directoryList, setDirectoryList] = useState<DirectoryInfo[]>([])
  const [results, setResults] = useState<ResultItem[]>([])
  const [conversionType, setConversionType] = useState<ConversionType>('hant-to-hans')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    localStorage.setItem(CONVERSION_TYPE_STORAGE_TOKEN, conversionType)
  }, [conversionType])

  useEffect(() => {
    const storedConversionType = localStorage.getItem(CONVERSION_TYPE_STORAGE_TOKEN) as ConversionType
    if (isConversionType(storedConversionType)) {
      setConversionType(storedConversionType)
    }
  }, [])

  const convertName = (name: string) => {
    if (conversionType === 'hant-to-hans') {
      return convertChinese(name, 'zh-Hant', 'zh-Hans')
    }

    return convertChinese(name, 'zh-Hans', 'zh-Hant')
  }

  const getAllFilesAndDirectories = async (directoryHandle: FileSystemDirectoryHandle, basePath = '') => {
    const files: FileInfo[] = []
    const directories: DirectoryInfo[] = []

    const processDirectory = async (currentDirHandle: FileSystemDirectoryHandle, currentPath: string) => {
      for await (const [name, handle] of currentDirHandle.entries()) {
        const fullPath = currentPath ? `${currentPath}/${name}` : name

        if (handle.kind === 'file') {
          const file = await handle.getFile()
          const previewName = convertName(name)
          const previewPath = currentPath ? convertName(`${currentPath}/${previewName}`) : previewName

          files.push({
            name,
            path: fullPath,
            previewName,
            previewPath,
            size: file.size,
            type: file.type,
            handle,
            directoryPath: currentPath,
          })
        } else if (handle.kind === 'directory') {
          const previewName = convertName(name)
          const previewPath = currentPath ? convertName(`${currentPath}/${previewName}`) : previewName

          directories.push({
            name,
            path: fullPath,
            previewName,
            previewPath,
            handle,
            parentHandle: currentDirHandle,
            directoryPath: currentPath,
          })

          await processDirectory(handle, fullPath)
        }
      }
    }

    await processDirectory(directoryHandle, basePath)
    return { files, directories }
  }

  const renameFiles = async (files: FileInfo[], rootDirectoryHandle?: FileSystemDirectoryHandle) => {
    if (!(files && files.length > 0)) {
      return
    }

    if (!rootDirectoryHandle) {
      return
    }

    const results: ResultItem[] = []
    for await (const file of files) {
      const result = newResultItem(file.path, 'rename')
      results.push(result)

      try {
        const directoryPath = dirname(file.path)
        const directoryHandle = await getDirectoryHandleByPath(rootDirectoryHandle, directoryPath)
        await file.handle.move(directoryHandle, file.previewName)

        result.success = true
        setResults([...results])
      } catch (err) {
        result.error = err instanceof Error ? err.message : 'Unknown error'
        setResults([...results])
      } finally {
        result.loading = false
        setResults([...results])
      }
    }
  }

  const renameDirectories = async (directories: DirectoryInfo[], rootDirectoryHandle?: FileSystemDirectoryHandle) => {
    if (!(directories && directories.length > 0)) {
      return
    }

    if (!rootDirectoryHandle) {
      return
    }

    for (const directory of directories) {
      if (await moveDirectoryRecursive(directory.handle, directory.parentHandle, (handle) => convertName(handle.name))) {
        await directory.parentHandle.removeEntry(directory.name, { recursive: true })
      }
    }
  }

  const startRename = async (files?: FileInfo[], directories?: DirectoryInfo[], rootDirectoryHandle?: FileSystemDirectoryHandle) => {
    if (!(files && files.length > 0)) {
      return
    }

    if (!(directories && directories.length > 0)) {
      return
    }

    if (!rootDirectoryHandle) {
      return
    }

    // reset
    setIsProcessing(true)
    setResults([])
    setCurrentFile('')

    try {
      await renameFiles(files, rootDirectoryHandle)
      await renameDirectories(directories, rootDirectoryHandle)

      setTotalProgress(100)
      setIsProcessing(false)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error)

      setTotalProgress(0)
      setIsProcessing(false)
    }
  }

  const selectSourceFolder = async () => {
    const directoryHandle = await openDirectoryPicker({ mode: 'readwrite' })
    setSourceDirectory(directoryHandle)
    setResults([])
    setTotalProgress(0)

    const { files, directories } = await getAllFilesAndDirectories(directoryHandle)
    setFileList(files)
    setDirectoryList(directories)

    if (!(files.length > 0 || directories.length > 0)) {
      return
    }

    await startRename(files, directories, directoryHandle)
  }

  return {
    // state
    currentFile,
    totalProgress,
    sourceDirectory,
    fileList,
    directoryList,
    results,
    conversionType,
    isProcessing,

    // actions
    setConversionType,
    selectSourceFolder,
    startRename,
  }
}
