import Meta from '@/components/Meta'
import Zip from './Zip'

export default function ZipPage() {
  return (
    <div className="w-[100vw] h-[100vh] flex flex-col items-center">
      <div className="flex flex-col gap-4 w-2/3 max-w-3xl mx-auto mt-10">
        <Meta title="Local Zip" description="Zip files directly in your browser. Batch compress available folders into zip files. Using @zip.js/zip.js library." />
        <Zip />
      </div>
    </div>
  )
}
