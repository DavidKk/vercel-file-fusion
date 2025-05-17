import { useEffect, useState } from 'react'

interface Option {
  value: any
  label: string
}

interface MultiSelectProps {
  values?: any[]
  placeholder?: string
  options?: Option[]
  onChange?: (values: any[]) => void
  disabled?: boolean
}

export default function MultiSelect(props: MultiSelectProps) {
  const { options = [], values = [], placeholder, onChange, disabled = false } = props
  const [selectedValues, setSelectedValues] = useState<any[]>(values)
  const [isOpen, setIsOpen] = useState(false)

  const toggleOption = (value: any) => {
    const newValues = selectedValues.includes(value) ? selectedValues.filter((v) => v !== value) : [...selectedValues, value]

    setSelectedValues(newValues)
    onChange && onChange(newValues)
  }

  const clearSelection = () => {
    setSelectedValues([])
    onChange && onChange([])
  }

  useEffect(() => {
    setSelectedValues(values)
  }, [values])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.multi-select-container')) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative w-auto text-sm flex flex-nowarp shrink-0 multi-select-container">
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`h-8 w-full pl-4 pr-8 border rounded-sm box-border hover:border-gray-500 bg-white flex items-center justify-between cursor-pointer appearance-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex flex-wrap gap-1 overflow-hidden">
          {selectedValues.length > 0 ? (
            options
              .filter((option) => selectedValues.includes(option.value))
              .map((option) => (
                <div key={option.value} className="flex items-center bg-gray-50 rounded-sm px-2 py-0.5 text-xs">
                  <span className="mr-1 text-black">{option.label}</span>
                  {!disabled && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleOption(option.value)
                      }}
                      className="text-gray-500 hover:text-gray-800"
                    >
                      &#10005;
                    </button>
                  )}
                </div>
              ))
          ) : (
            <span className="text-gray-400">{placeholder || 'Select options'}</span>
          )}
        </div>
        <div className="flex h-4 w-4 items-center justify-center absolute right-2 top-1/2 transform -translate-y-1/2">
          {selectedValues.length > 0 && !disabled ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                clearSelection()
              }}
              className="text-gray-500 hover:text-gray-800"
            >
              &#10005;
            </button>
          ) : (
            <div className="pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
              </svg>
            </div>
          )}
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-[100%] z-10 w-full mt-1 bg-white border border-gray-200 rounded-sm shadow-md max-h-60 overflow-auto">
          {options.length > 0 ? (
            options.map((option) => (
              <div key={option.value} className="px-4 py-1.5 hover:bg-gray-100 cursor-pointer flex items-center" onClick={() => toggleOption(option.value)}>
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={() => {}} // Handled by parent div click
                  className="mr-2"
                />
                <span className={selectedValues.includes(option.value) ? 'text-black' : 'text-gray-600'}>{option.label}</span>
              </div>
            ))
          ) : (
            <div className="px-4 py-1.5 text-gray-500">No options available</div>
          )}
        </div>
      )}
    </div>
  )
}
