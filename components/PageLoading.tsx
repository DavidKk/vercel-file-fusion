import { Spinner } from './Spinner'

export default function PageLoading() {
  return (
    <div className="w-full flex items-center justify-center gap-4">
      <Spinner color="text-indigo-600" />
      <span>Loading...</span>
    </div>
  )
}
