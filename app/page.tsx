import Meta, { generate } from '@/components/Meta'

const { generateMetadata, metaProps } = generate({
  title: 'File Fusion - Powerful File Processing Toolkit',
  description:
    'This project is designed for quick batch processing of files, such as batch compression or encryption and decryption, and batch renaming of files. All processing is done locally, not on a server.',
})

export { generateMetadata }

export default function Home() {
  return (
    <div className="flex flex-col items-center p-10 pt-20">
      <Meta {...metaProps} />
    </div>
  )
}
