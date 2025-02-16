import { Flac } from './Flac'
import type { CoverImageMetadata } from './FlacCover'

export interface EmbedFlacMetadata {
  ALBUM?: string
  ARTIST?: string
  LYRICS?: string
  cover?: ArrayBuffer
  coverMetadata?: Partial<CoverImageMetadata>
}

export function embedFlacMetadata(arrayBuffer: ArrayBuffer, metadata: Partial<EmbedFlacMetadata>) {
  const flac = new Flac(arrayBuffer)
  for (const [name, value] of Object.entries(metadata)) {
    if (name === 'coverMetadata') {
      continue
    }

    if (name === 'cover') {
      flac.setCoverImage(value as ArrayBuffer, metadata['coverMetadata'])
      continue
    }

    flac.setVorbisComment(name, value as any)
  }

  return flac.toBuffer()
}
