export interface MetaProps {
  title?: string
  description?: string
}

export default function Meta(props: MetaProps) {
  const { title, description } = props

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <p className="mb-4 text-gray-700">{description}</p>
    </>
  )
}
