import Meta, { generate } from '@/components/Meta'

import Merger from './Merger/index'

const { generateMetadata, metaProps } = generate({
  title: 'Large JSON Processor - Merge & Split Large JSON Files',
  description: 'Process large JSON files with merge and split capabilities. Efficiently handle ultra-large JSON datasets in your browser.',
})

export { generateMetadata }

export default function JSONProcessor() {
  return (
    <div className="flex flex-col items-center p-10 pt-20 max-w-4xl mx-auto">
      <Meta {...metaProps} />
      <Merger />
    </div>
  )
}
