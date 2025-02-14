export interface MetaProps {
  title?: string
  description?: string
}

export default function Meta(props: MetaProps) {
  const { title, description } = props

  return (
    <>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-gray-700">{description}</p>
    </>
  )
}
