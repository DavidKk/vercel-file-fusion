import { MAX_CONTENT_SIZE } from './constants'
import type { CoverImageMetadata } from './FlacCover'
import { FlacCover } from './FlacCover'
import { FlacMetadata } from './FlacMetadata'
import { FlacVorbis } from './FlacVorbis'
import { parseBlock } from './share'

export class Flac {
  protected metadatas: FlacMetadata[] = []
  protected audioContent: ArrayBuffer

  protected get headerSize() {
    return this.metadatas.reduce((size, block) => size + 4 + block.size, 0)
  }

  constructor(contnet: ArrayBuffer) {
    let offset = 4

    while (offset + 4 <= contnet.byteLength) {
      const { type, size, byte, isLast } = parseBlock(contnet, offset)
      const content = contnet.slice(offset + 4, offset + 4 + size)
      switch (type) {
        case FlacCover.TYPE: {
          this.metadatas.push(new FlacCover(byte, content))
          break
        }

        case FlacVorbis.TYPE: {
          this.metadatas.push(new FlacVorbis(byte, content))
          break
        }

        default: {
          this.metadatas.push(new FlacMetadata(byte, content))
          break
        }
      }

      offset += 4 + size
      if (isLast) {
        break
      }
    }

    this.audioContent = contnet.slice(4 + this.headerSize)
  }

  public setCoverImage(image: ArrayBuffer, metadata?: Partial<CoverImageMetadata>) {
    let cover = this.metadatas.find((metadata) => metadata instanceof FlacCover)
    if (!cover) {
      cover = new FlacCover()
      cover.updateImage(image, metadata)
      this.metadatas.splice(0, 0, cover)
    }

    cover.setContent(image)
  }

  public setVorbisComment(key: string, value: string) {
    let vorbis = this.metadatas.find((metadata) => metadata instanceof FlacVorbis)
    if (!vorbis) {
      vorbis = new FlacVorbis()
      this.metadatas.splice(0, 0, vorbis)
    }

    vorbis.setComment(key, value)
  }

  public toBuffer() {
    const datas = this.metadatas.reduce((acc: number[], metadata) => {
      const content = metadata.toBuffer()
      const values = Array.from(new Uint8Array(content))
      return acc.concat(values)
    }, [])

    const audioContent = new Uint8Array(this.audioContent)
    const header = new Uint8Array([0x66, 0x4c, 0x61, 0x43]) // "fLaC"

    const totalLength = header.length + datas.length + audioContent.length
    if (totalLength > MAX_CONTENT_SIZE) {
      throw new Error('Flac content size is too large')
    }

    const data = new Uint8Array(totalLength)

    data.set(header, 0)
    data.set(datas, header.length)
    data.set(audioContent, header.length + datas.length)

    return data.buffer
  }
}
