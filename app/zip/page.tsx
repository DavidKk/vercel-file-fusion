import Meta, { generate } from '@/components/Meta'

import Zip from './Zip'

const { generateMetadata, metaProps } = generate({
  title: 'Local Zip - File Fusion',
  description: 'Zip files directly in your browser. Batch compress available folders into zip files. Using @zip.js/zip.js library.',
})

export { generateMetadata }

export default function ZipPage() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex flex-col gap-4 w-2/3 max-w-3xl mx-auto py-10">
        <Meta {...metaProps} />
        <Zip />
      </div>
    </div>
  )
}
