import Meta, { generate } from '@/components/Meta'

import Unrar from './Unrar'

const { generateMetadata, metaProps } = generate({
  title: 'Local Unrar - File Fusion',
  description: 'Unrar files directly in your browser. Batch decrypt and unrar. Support of password-protected RAR files. Using @unrar-browser/core library.',
})

export { generateMetadata }

export default function UnrarPage() {
  return (
    <div className="w-full  flex flex-col items-center">
      <div className="flex flex-col gap-4 w-2/3 max-w-3xl mx-auto py-10">
        <Meta {...metaProps} />
        <Unrar />
      </div>
    </div>
  )
}
