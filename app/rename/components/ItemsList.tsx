import type { FileInfo, DirectoryInfo } from '@/app/rename/types/types'

export type ItemsListProps = {
  files: FileInfo[]
  directories: DirectoryInfo[]
}

export function ItemsList({ files, directories }: ItemsListProps) {
  const totalItems = files.length + directories.length
  if (totalItems === 0) return <div className="text-center text-gray-500 py-4">No files or folders found</div>

  const hasFileChanges = files.some((file) => file.name !== file.previewName)
  const hasDirChanges = directories.some((dir) => dir.name !== dir.previewName)
  const hasChanges = hasFileChanges || hasDirChanges

  return (
    <div className="max-h-[300px] overflow-y-auto border rounded-md">
      <div className="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 flex items-center justify-between">
        <span>
          Items to rename ({files.length} files, {directories.length} folders)
        </span>
        {hasChanges && (
          <span className="text-green-600 text-xs">
            {files.filter((f) => f.name !== f.previewName).length + directories.filter((d) => d.name !== d.previewName).length} items will be renamed
          </span>
        )}
      </div>
      <div className="divide-y divide-gray-200">
        {directories.map((dir, index) => {
          const willChange = dir.name !== dir.previewName
          return (
            <div key={`dir-${index}`} className={`px-4 py-3 flex items-center justify-between ${willChange ? 'bg-blue-50' : ''}`}>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm truncate max-w-[400px] text-gray-900 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                  {dir.path}
                </span>
                {willChange && (
                  <span className="text-xs text-blue-600 flex items-center mt-1 ml-6">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    {dir.previewPath}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {willChange && <span className="text-xs text-blue-600 font-medium">Will be renamed</span>}
                <span className="text-xs text-gray-500">Folder</span>
              </div>
            </div>
          )
        })}
        {files.map((file, index) => {
          const willChange = file.name !== file.previewName
          return (
            <div key={`file-${index}`} className={`px-4 py-3 flex items-center justify-between ${willChange ? 'bg-blue-50' : ''}`}>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm truncate max-w-[400px] text-gray-900 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {file.path}
                </span>
                {willChange && (
                  <span className="text-xs text-blue-600 flex items-center mt-1 ml-6">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    {file.previewPath}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {willChange && <span className="text-xs text-blue-600 font-medium">Will be renamed</span>}
                <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
