import Meta, { generate } from '@/components/Meta'

import XLSXMerge from './XLSXMerge'

const { generateMetadata, metaProps } = generate({
  title: 'Excel Merge - File Fusion',
  description: 'Merge Excel files directly in your browser. Supports batch merging with automatic header consistency validation. Powered by xlsx library.',
})

export { generateMetadata }

export default function XLSXMergePage() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex flex-col gap-4 w-2/3 max-w-3xl mx-auto py-10">
        <Meta {...metaProps} />
        <XLSXMerge />
      </div>
    </div>
  )
}
