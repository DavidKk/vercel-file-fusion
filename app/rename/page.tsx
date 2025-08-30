import Meta, { generate } from '@/components/Meta'
import { Rename } from './Rename'
import { Tooltips } from './Tooltips'

const LinkAliases = {
  'https://github.com/DavidKk/go-file-fusion-rename': 'go-file-fusion-rename',
}

const { generateMetadata, metaProps } = generate({
  title: 'Local Rename - File Fusion',
  description:
    'Batch rename files and folders with Chinese Simplified/Traditional conversion. Uses browser native move API for efficient file operations. If your browser does not support the move API, please use the alternative tool at https://github.com/DavidKk/go-file-fusion-rename',
})

export { generateMetadata }

export default function Page() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex flex-col gap-4 w-2/3 max-w-3xl mx-auto py-10">
        <Meta {...metaProps} linkAliases={LinkAliases}>
          {<Tooltips />}
        </Meta>
        <Rename />
      </div>
    </div>
  )
}
