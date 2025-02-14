import { Spinner } from '@/components/Spinner'
import type { Invoice } from './type'

export type InvoiceItemColor = 'normal' | 'selected' | 'error'

export interface InvoiceItemProps extends Invoice {
  file: string
  loading?: boolean
  color: InvoiceItemColor
}

export function InvoiceItem(props: InvoiceItemProps) {
  const { file, code, amount, date, loading, color } = props
  const colors = {
    selected: 'bg-blue-100',
    error: 'bg-red-100',
    normal: 'bg-white',
  }

  return (
    <div className={`grid grid-cols-4 gap-2 px-4 py-2 border rounded-sm shadow ${colors[color]}`}>
      <span className="col-span-1">{file}</span>

      {loading ? (
        <div className="col-span-3 flex items-center justify-end">
          <Spinner color="text-blue-600" />
        </div>
      ) : !amount ? (
        <span className="col-span-3 text-center">unidentified</span>
      ) : (
        <>
          <span className="col-span-1 text-left">{code ? `#${code}` : '-'}</span>
          <span className="col-span-1 text-center">{amount ? `￥${amount}` : '-'}</span>
          <span className="col-span-1 text-right">{date ?? '-'}</span>
        </>
      )}
    </div>
  )
}
