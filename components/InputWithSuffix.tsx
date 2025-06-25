import React from 'react'

export interface InputWithSuffixProps extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  suffix: string
}

export default function InputWithSuffix(props: InputWithSuffixProps) {
  const { suffix, className = '', ...rest } = props

  return (
    <div className={`flex items-center border rounded px-2 py-1 bg-white ${className}`}>
      <input className="flex-1 outline-none bg-transparent text-gray-900 px-1" {...rest} />
      <span className="ml-2 text-gray-500 text-sm select-none">{suffix}</span>
    </div>
  )
}
