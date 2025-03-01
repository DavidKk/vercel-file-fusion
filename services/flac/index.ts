import { Flac } from './Flac'
import type { CoverImageMetadata } from './FlacCover'

export interface EmbedFlacMetadata {
  title?: string
  album?: string
  artist?: string
  lyrics?: string
  duration?: string
  cover?: ArrayBuffer
  coverMetadata?: Partial<CoverImageMetadata>
}

export function embedFlacMetadata(arrayBuffer: ArrayBuffer, metadata: Partial<EmbedFlacMetadata> = {}) {
  const { title: TITLE, album: ALBUM, artist: ARTIST, lyrics: LYRICS, duration: DURATION, cover, coverMetadata } = metadata

  const flac = new Flac(arrayBuffer)
  TITLE && flac.setVorbisComment('TITLE', TITLE)
  ALBUM && flac.setVorbisComment('ALBUM', ALBUM)
  ARTIST && flac.setVorbisComment('ARTIST', ARTIST)
  LYRICS && flac.setVorbisComment('LYRICS', LYRICS)
  DURATION && flac.setVorbisComment('DURATION', DURATION)
  cover && flac.setCoverImage(cover, coverMetadata)

  return flac.toBuffer()
}
