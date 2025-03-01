import Meta from '@/components/Meta'
import Audio from './Audio'

export default function AudioPage() {
  return (
    <div className="w-full min-h-[calc(100vh-60px)] flex flex-col items-center">
      <div className="flex flex-col gap-4 w-2/3 max-w-3xl mx-auto py-10">
        <Meta
          title={<span>Audio Meta Embedder</span>}
          description="Audio Meta Embedder is a tool for embedding metadata into FLAC audio files. Currently, it only supports embedding lyrics and FLAC files. Please ensure the lyrics file name matches the audio file name."
        />

        <Audio />
      </div>
    </div>
  )
}
