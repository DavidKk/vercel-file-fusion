import { Ellipsis } from './Ellipsis'

export interface FileProgressBarProps {
  progress: number
  message?: string
  ellipsis?: boolean
}

export default function FileProgressBar(props: FileProgressBarProps) {
  const { progress, message, ellipsis = true } = props

  return (
    <div className="w-auto">
      <div className="w-full bg-gray-200 rounded-lg">
        <div className="transition-[width] bg-indigo-600 text-md font-medium text-indigo-100 text-center p-1 leading-none rounded-lg" style={{ width: `${progress}%` }}>
          {progress.toFixed(2)}%
        </div>
      </div>

      <p className="text-gray-800 text-md mt-2">
        {message}
        {ellipsis && (
          <span className="pl-1 font-medium">
            <Ellipsis />
          </span>
        )}
      </p>
    </div>
  )
}
