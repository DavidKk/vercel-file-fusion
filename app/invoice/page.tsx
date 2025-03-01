import Meta from '@/components/Meta'
import PDFTextExtractor from './PDFTextExtractor'

export default function InvoicePage() {
  return (
    <div className="w-full min-h-[calc(100vh-60px)] flex flex-col items-center">
      <div className="flex flex-col gap-4 w-2/3 max-w-3xl mx-auto py-10">
        <Meta
          title="Invoice Optimizer"
          description="This tool analyzes the amounts from PDF electronic invoices and applies an algorithm to determine the optimal combination of invoices for reimbursement. It efficiently identifies the most suitable invoice set based on the input amount, ensuring the best possible match for expense reporting."
        />

        <PDFTextExtractor />
      </div>
    </div>
  )
}
