import Meta from '@/components/Meta'
import Unzip from './Unzip'

export default function UnzipPage() {
  return (
    <div className="w-[100vw] h-[100vh] flex flex-col items-center">
      <div className="flex flex-col gap-4 w-2/3 max-w-3xl mx-auto mt-10">
        <Meta
          title="Local Unzip"
          description="Unzip files directly in your browser. Batch decrypt and unzip. Support of the Zip64 format. Support of WinZIP AES and PKWare ZipCrypto encryption. Using @zip.js/zip.js library."
        />
        <Unzip />
      </div>
    </div>
  )
}
