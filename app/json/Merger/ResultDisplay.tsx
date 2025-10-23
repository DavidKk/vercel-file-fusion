'use client'

import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

import FileProgressBar from '@/components/FileProgressBar'
import { formatFileSize } from '@/utils/format'

interface ProcessResult {
  id: string
  name: string
  size: number
  data: any
  success?: boolean
  error?: string
  loading?: boolean
  timestamp: number
}

interface ResultDisplayProps {
  result: ProcessResult[]
  totalProgress: number

  onDownload: (data: any, filename: string) => void
}

export default function ResultDisplay({ result, totalProgress, onDownload }: ResultDisplayProps) {
  const renderResultProgress = () => {
    if (totalProgress === 0) {
      return null
    }

    return (
      <div className="border-b border-gray-300">
        <FileProgressBar
          bgClassName="rounded-none"
          barClassName="rounded-none"
          noText={true}
          progress={totalProgress}
          message={totalProgress >= 100 ? 'Finish' : 'Processing...'}
        />
      </div>
    )
  }

  const renderResultBody = () => {
    if (!result.length) {
      return <div className="px-4 py-3 text-center text-gray-500 text-sm">No Data</div>
    }

    // 按时间戳倒序排列，最新的在前面
    const sortedResults = [...result].sort((a, b) => b.timestamp - a.timestamp)

    return (
      <div className="divide-y divide-gray-200 max-h-[300px] overflow-y-auto">
        {sortedResults.map((item) => (
          <div key={item.id} className="px-4 py-2 flex items-center">
            <div className="flex items-center gap-3 flex-grow">
              {item.loading ? (
                <div className="flex items-center justify-center p-2 text-gray-400">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent" />
                </div>
              ) : item.success ? (
                <div className="flex items-center justify-center p-2 text-gray-400">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                </div>
              ) : (
                <div className="flex items-center justify-center p-2 text-gray-400">
                  <XCircleIcon className="w-5 h-5 text-red-500" />
                </div>
              )}

              <div className="column grow flex flex-col min-w-0">
                <div className="flex justify-between items-start">
                  <span className="text-sm text-gray-900 truncate">{item.name}</span>
                  {item.success && item.data && (
                    <button
                      className="ml-2 flex-shrink-0 px-2 py-1 text-white bg-indigo-500 hover:bg-indigo-600 rounded text-xs font-bold"
                      onClick={() => onDownload(item.data, item.name)}
                    >
                      DOWNLOAD
                    </button>
                  )}
                </div>

                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-500">{formatFileSize(item.size)}</span>
                  <span className="text-gray-400">{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>

                {item.error && <div className="text-xs text-red-500 mt-1 truncate">{item.error}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="mt-4 w-full border border-gray-300 rounded-md overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 flex justify-between items-center">
        <span>Results</span>
        {result.some((r) => r.success) && <span className="text-xs text-gray-500">{result.filter((r) => r.success).length} successful merge(s)</span>}
      </div>
      {renderResultProgress()}
      {renderResultBody()}
    </div>
  )
}
