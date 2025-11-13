import { useCallback, useState } from 'react'

import type { UnrarModule } from './useUnrarModule'

export interface ExtractedFile {
  name: string
  size: number | bigint
  isDirectory: boolean
  data: Uint8Array | null
}

interface UseUnrarExtractorResult {
  extractedFiles: ExtractedFile[]
  isExtracting: boolean
  error: Error | null
  extract: (file: File, options?: ExtractOptions) => Promise<ExtractedFile[]>
  clear: () => void
}

interface ExtractOptions {
  password?: string
}

export function useUnrarExtractor(module: UnrarModule | null): UseUnrarExtractorResult {
  const [extractedFiles, setExtractedFiles] = useState<ExtractedFile[]>([])
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const extractRarFile = useCallback(
    async (arrayBuffer: ArrayBuffer, options?: ExtractOptions): Promise<ExtractedFile[]> => {
      if (!module) {
        throw new Error('UnRAR module not loaded')
      }

      const FS = module.FS
      const fileName = '/temp.rar'

      FS.writeFile(fileName, new Uint8Array(arrayBuffer))

      module.setPassword(options?.password ?? '')

      const cmdData = new module.CommandData()
      const archive = new module.Archive(cmdData)

      if (!archive.openFile(fileName)) {
        FS.unlink(fileName)
        throw new Error('Cannot open RAR file')
      }

      if (!archive.isArchive(true)) {
        FS.unlink(fileName)
        throw new Error('Not a valid RAR file')
      }

      const files: ExtractedFile[] = []

      while (archive.readHeader() > 0) {
        const headerType = archive.getHeaderType()

        if (headerType === module.HeaderType.HEAD_FILE) {
          const name = archive.getFileName()
          const size = archive.getFileSize()
          const isDirectory = archive.isDirectory()

          let data: Uint8Array | null = null

          if (!isDirectory) {
            const fileData = archive.readFileData()
            const dataSize = fileData.size()
            data = new Uint8Array(dataSize)
            for (let i = 0; i < dataSize; i++) {
              data[i] = fileData.get(i)
            }
          }

          files.push({ name, size, isDirectory, data })
        } else if (headerType === module.HeaderType.HEAD_ENDARC) {
          break
        }

        archive.seekToNext()
      }

      FS.unlink(fileName)
      return files
    },
    [module]
  )

  const extract = useCallback(
    async (file: File, options?: ExtractOptions) => {
      if (!module || isExtracting) {
        return []
      }

      setIsExtracting(true)
      setExtractedFiles([])
      setError(null)

      try {
        const arrayBuffer = await file.arrayBuffer()
        const files = await extractRarFile(arrayBuffer, options)
        setExtractedFiles(files)
        return files
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        setExtractedFiles([])
        throw error
      } finally {
        setIsExtracting(false)
      }
    },
    [module, isExtracting, extractRarFile]
  )

  const clear = useCallback(() => {
    setExtractedFiles([])
    setError(null)
  }, [])

  return {
    extractedFiles,
    isExtracting,
    error,
    extract,
    clear,
  }
}
