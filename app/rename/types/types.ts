export type FileInfo = {
  name: string
  path: string
  previewName: string
  previewPath: string
  size: number
  type: string
  handle: FileSystemFileHandle
  directoryPath: string
}

export type DirectoryInfo = {
  name: string
  path: string
  previewName: string
  previewPath: string
  handle: FileSystemDirectoryHandle
  parentHandle: FileSystemDirectoryHandle
  directoryPath: string
}

export type ConversionType = 'hant-to-hans' | 'hans-to-hant'

export type ConversionOption = {
  value: string
  label: string
}

export const CONVERSION_OPTIONS: ConversionOption[] = [
  { value: 'hant-to-hans', label: '繁转简' },
  { value: 'hans-to-hant', label: '简转繁' },
]

export const isConversionType = (() => {
  const items = new Set(CONVERSION_OPTIONS.map((option) => option.value))
  return (value: string): value is ConversionType => items.has(value)
})()
