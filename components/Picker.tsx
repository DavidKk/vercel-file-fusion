import { useDropzone } from 'react-dropzone'

export interface PickerProps {
  message: string
  onSelect: (acceptedFiles: File[]) => void
  accept: { [key: string]: string[] }
  disabled: boolean
  selectedFiles?: File[]
  onlyDirectory?: boolean
}

export default function Picker(props: PickerProps) {
  const { message, onSelect, accept, disabled, selectedFiles = [], onlyDirectory } = props

  const onDrop = (acceptedFiles: File[]) => {
    if (onlyDirectory) {
      const directories = acceptedFiles.filter((file) => file.type === '')
      onSelect(directories)
    } else {
      onSelect(acceptedFiles)
    }
  }

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept,
    disabled,
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed border-[2px] rounded-md border-gray-400 p-6 text-center cursor-pointer w-full h-auto flex flex-col items-center justify-center transition-opacity ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <input {...getInputProps()} disabled={disabled} />
      {selectedFiles.length === 0 ? (
        <p className="text-gray-500 text-md py-10">{message}</p>
      ) : (
        <ul className="w-full flex flex-col text-gray-700 text-md gap-2">
          {selectedFiles.slice(0, 4).map((file) => (
            <li key={file.name}>{file.name}</li>
          ))}

          {selectedFiles.length > 4 && <li>...</li>}
        </ul>
      )}
    </div>
  )
}
