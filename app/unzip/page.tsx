import Meta, { generate } from '@/components/Meta'
import Unzip from './Unzip'

const { generateMetadata, metaProps } = generate({
  title: 'Local Unzip - File Fusion',
  description:
    'Unzip files directly in your browser. Batch decrypt and unzip. Support of the Zip64 format. Support of WinZIP AES and PKWare ZipCrypto encryption. Using @zip.js/zip.js library.',
})

export { generateMetadata }

export default function UnzipPage() {
  return (
    <div className="w-full  flex flex-col items-center">
      <div className="flex flex-col gap-4 w-2/3 max-w-3xl mx-auto py-10">
        <Meta {...metaProps} />
        <Unzip />
      </div>
    </div>
  )
}
