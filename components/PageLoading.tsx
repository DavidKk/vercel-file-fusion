import { Spinner } from './Spinner'

export default function PageLoading() {
  return (
    <div className="w-[100vw] h-[100vh] flex items-center justify-center gap-4">
      <Spinner color="text-indigo-600" />
      <span>Loading...</span>
    </div>
  )
}
