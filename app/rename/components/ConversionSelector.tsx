import type { ConversionType, ConversionOption } from '@/app/rename/types/types'

export type ConversionSelectorProps = {
  value: ConversionType
  onChange: (value: ConversionType) => void
  disabled: boolean
  options: ConversionOption[]
}

export function ConversionSelector({ value, onChange, disabled, options }: ConversionSelectorProps) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">Conversion Type</label>
      <select className="w-full p-2 border rounded" value={value} onChange={(e) => onChange(e.target.value as ConversionType)} disabled={disabled}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
