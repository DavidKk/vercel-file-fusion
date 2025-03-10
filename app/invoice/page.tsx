import Meta, { generate } from '@/components/Meta'
import PDFTextExtractor from './PDFTextExtractor'

const { generateMetadata, metaProps } = generate({
  title: 'Invoice Optimizer - File Fusion',
  description:
    'This tool analyzes the amounts from PDF electronic invoices and applies an algorithm to determine the optimal combination of invoices for reimbursement. It efficiently identifies the most suitable invoice set based on the input amount, ensuring the best possible match for expense reporting.',
})

export { generateMetadata }

export default function InvoicePage() {
  return (
    <div className="w-full  flex flex-col items-center">
      <div className="flex flex-col gap-4 w-2/3 max-w-3xl mx-auto py-10">
        <Meta {...metaProps} />
        <PDFTextExtractor />
      </div>
    </div>
  )
}
