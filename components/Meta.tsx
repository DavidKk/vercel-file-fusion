import type { ReactElement } from 'react'

export interface MetaProps {
  title?: string | ReactElement
  description?: string
}

export default function Meta(props: MetaProps) {
  const { title, description } = props

  return (
    <>
      <h1 className="text-2xl font-bold flex items-center gap-2">{title}</h1>
      <p className="text-gray-700">{description}</p>
    </>
  )
}
