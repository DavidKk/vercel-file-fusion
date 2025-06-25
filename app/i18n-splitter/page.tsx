import Meta, { generate } from '@/components/Meta'
import Content from './Content'

const { generateMetadata, metaProps } = generate({
  title: 'I18N JSON Splitter - Split Large I18N Files',
  description: 'Split large I18N JSON files into smaller chunks with customizable size limits. Process your internationalization files efficiently.',
})

export { generateMetadata }

export default function I18NSplitter() {
  return (
    <div className="flex flex-col items-center p-10 pt-20 max-w-4xl mx-auto">
      <Meta {...metaProps} />
      <Content />
    </div>
  )
}
