import Meta, { generate } from '@/components/Meta'

import XLSXToCSV from './XLSXToCSV'

const { generateMetadata, metaProps } = generate({
  title: 'Excel to CSV Converter - File Fusion',
  description: 'Convert Excel files to CSV format directly in your browser. Supports batch conversion with progress tracking. Powered by xlsx library.',
})

export { generateMetadata }

export default function XLSXToCSVPage() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex flex-col gap-4 w-2/3 max-w-3xl mx-auto py-10">
        <Meta {...metaProps} />
        <XLSXToCSV />
      </div>
    </div>
  )
}
