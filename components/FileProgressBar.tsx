import { Ellipsis } from './Ellipsis'

export interface FileProgressBarProps {
  progress: number
  message?: string
  ellipsis?: boolean
  bgClassName?: string
  barClassName?: string
  noText?: boolean
}

export default function FileProgressBar(props: FileProgressBarProps) {
  const { progress, message, ellipsis = true, bgClassName = '', barClassName = '', noText = false } = props

  return (
    <div className="w-auto">
      <div className={`w-full bg-gray-200 rounded-lg ${bgClassName}`}>
        <div
          className={`transition-[width] bg-indigo-600 text-sm font-medium text-indigo-100 text-center p-1 leading-none rounded-lg ${barClassName}`}
          style={{ width: `${progress}%` }}
        >
          {noText ? '' : progress.toFixed(2) + '%'}
        </div>
      </div>

      {noText ? null : (
        <p className="text-gray-800 text-md mt-2">
          {message}
          {ellipsis && (
            <span className="pl-1 font-medium">
              <Ellipsis />
            </span>
          )}
        </p>
      )}
    </div>
  )
}
