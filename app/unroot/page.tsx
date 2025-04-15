import Meta, { generate } from '@/components/Meta'
import Unroot from './Unroot'

const { generateMetadata, metaProps } = generate({
  title: 'Unroot - File Fusion',
  description: 'Unroot is a tool for extracting files from root directories. It helps you organize files by moving them out of nested folders into a single directory.',
})

export { generateMetadata }

export default function ZipPage() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex flex-col gap-4 w-2/3 max-w-3xl mx-auto py-10">
        <Meta {...metaProps} />
        <Unroot />
      </div>
    </div>
  )
}
