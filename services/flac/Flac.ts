import { MAX_CONTENT_SIZE } from './constants'
import type { CoverImageMetadata } from './FlacCover'
import { FlacCover } from './FlacCover'
import { FlacMetadata } from './FlacMetadata'
import { FlacVorbisComments } from './FlacVorbisComments'
import { decodeMetadata } from './metadata/metadata'

export class Flac {
  protected _metadatas: FlacMetadata[] = []
  protected audioContent: ArrayBuffer

  protected get metadatas() {
    return this._metadatas.sort((a, b) => {
      if (a.type === 0 && b.type !== 0) {
        return -1
      }

      if (a.type !== 0 && b.type === 0) {
        return 1
      }

      if (a.isLast && !b.isLast) {
        return 1
      }

      if (!a.isLast && b.isLast) {
        return -1
      }

      return 0
    })
  }

  protected get metadatasSize() {
    return this._metadatas.reduce((size, block) => size + 4 + block.size, 0)
  }

  constructor(contnet: ArrayBuffer) {
    let offset = 4

    while (offset + 4 <= contnet.byteLength) {
      const { type, size, byte, isLast } = decodeMetadata(contnet, offset)
      const content = contnet.slice(offset + 4, offset + 4 + size)

      switch (type) {
        case FlacCover.TYPE: {
          const metadata = new FlacCover(byte, content)
          this._metadatas.push(metadata)
          break
        }

        case FlacVorbisComments.TYPE: {
          const metadata = new FlacVorbisComments(byte, content)
          this._metadatas.push(metadata)
          break
        }

        default: {
          const metadata = new FlacMetadata(byte, content)
          this._metadatas.push(metadata)
          break
        }
      }

      offset += 4 + size
      if (isLast) {
        break
      }
    }

    this.audioContent = contnet.slice(4 + this.metadatasSize)
  }

  public getCoverImage() {
    return this._metadatas.find((metadata) => metadata instanceof FlacCover)
  }

  public setCoverImage(image: ArrayBuffer, metadata?: Partial<CoverImageMetadata>) {
    const index = this._metadatas.findIndex((metadata) => metadata instanceof FlacCover)
    if (index !== -1) {
      this._metadatas.splice(index, 1)
    }

    const cover = new FlacCover()
    cover.updateImage(image, metadata)

    // insert cover image after streaminfo
    this._metadatas.splice(1, 0, cover)
  }

  public setVorbisComment(key: string, value: string) {
    let vorbis = this._metadatas.find((metadata) => metadata instanceof FlacVorbisComments)
    if (!vorbis) {
      vorbis = new FlacVorbisComments()
      this._metadatas.splice(0, 0, vorbis)
    }

    vorbis.setComment(key, value)
  }

  public toBuffer() {
    const header = new Uint8Array([0x66, 0x4c, 0x61, 0x43]) // "fLaC"
    const audioContent = new Uint8Array(this.audioContent)

    // calculate metadata total size
    const metadataSize = this._metadatas.reduce((size, metadata) => {
      const content = metadata.toBuffer()
      return size + content.byteLength
    }, 0)

    const totalLength = header.length + metadataSize + audioContent.length
    if (totalLength > MAX_CONTENT_SIZE) {
      throw new Error('Flac content size is too large')
    }

    const data = new Uint8Array(totalLength)
    let offset = 0

    // write header
    data.set(header, offset)
    offset += header.length

    // write metadata
    for (const metadata of this.metadatas) {
      const content = metadata.toBuffer()
      data.set(new Uint8Array(content), offset)
      offset += content.byteLength
    }

    // write audio content
    data.set(audioContent, offset)

    return data.buffer
  }
}
