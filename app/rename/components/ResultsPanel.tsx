import FileProgressBar from '@/components/FileProgressBar'
import { Spinner } from '@/components/Spinner'

import type { ResultItem } from '../hooks/useRenameFlow'

export type ResultsPanelProps = {
  results: ResultItem[]
  totalProgress: number
  currentFile: string
}

export function ResultsPanel({ results, totalProgress, currentFile }: ResultsPanelProps) {
  return (
    <div className="mt-4 w-full border rounded-md overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 flex items-center justify-between">
        <span>Rename Results</span>
        {results.length > 0 && (
          <div className="flex items-center gap-4 text-xs">
            <span className="text-blue-600">Method: Move API</span>
            <span className="text-green-600">Success: {results.filter((r) => r.success).length}</span>
            <span className="text-red-600">Failed: {results.filter((r) => !r.success && !r.loading).length}</span>
          </div>
        )}
      </div>

      {totalProgress > 0 && (
        <div className="border-b border-gray-200">
          <FileProgressBar
            bgClassName="rounded-none"
            barClassName="rounded-none"
            noText={true}
            progress={totalProgress}
            message={totalProgress >= 100 ? 'Completed — will clean up permissions in 2 seconds' : `Processing: ${currentFile}`}
          />
        </div>
      )}

      <div className="divide-y divide-gray-200 max-h-[200px] overflow-y-auto">
        {results.map((result, index) => (
          <div key={index} className="px-4 py-3 flex items-center">
            <div className="flex items-center gap-2">
              {result.loading ? (
                <Spinner color="text-indigo-500" />
              ) : result.success ? (
                <span className="text-green-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              ) : (
                <span className="text-red-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              )}
              <div className="flex flex-col flex-1">
                <span className="text-sm text-gray-900 truncate max-w-[400px]">{result.file}</span>
                {result.error && <span className="text-sm text-red-500">{result.error}</span>}
                {result.success && <span className="text-xs text-blue-500">Used Move API</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
