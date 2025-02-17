import { FlacMetadata } from './FlacMetadata'
import { parseCoverImage } from './share'

/**
 * @see https://www.rfc-editor.org/rfc/rfc9639.html#section-8.8
 */
export interface CoverImageMetadata {
  format: string
  description: string
  width: number
  height: number
  colourDepth: number
  indexedColor: number
}

export class FlacCover extends FlacMetadata {
  static TYPE = 6

  protected format = ''
  protected description = ''
  protected width = 0
  protected height = 0
  protected colourDepth = 0
  protected indexedColor = 0

  constructor(byte: number = FlacCover.TYPE, data?: ArrayBuffer) {
    super(byte, new ArrayBuffer(0))

    if (data) {
      const { format, description, width, height, colourDepth, indexedColor, content } = parseCoverImage(data)
      this.format = format
      this.description = description
      this.width = width
      this.height = height
      this.colourDepth = colourDepth
      this.indexedColor = indexedColor
      this._content = content
    }
  }

  public updateImage(image: ArrayBuffer, metadta?: Partial<CoverImageMetadata>) {
    if (metadta) {
      this.format = metadta.format || this.format
      this.description = metadta.description || this.description
      this.width = metadta.width || this.width
      this.height = metadta.height || this.height
      this.colourDepth = metadta.colourDepth || this.colourDepth
      this.indexedColor = metadta.indexedColor || this.indexedColor
    }

    this._content = image
  }

  public get content() {
    const encoder = new TextEncoder()
    const formatBytes = encoder.encode(this.format)
    const descriptionBytes = encoder.encode(this.description)
    const buffer = new ArrayBuffer(4 + 4 + formatBytes.length + 4 + descriptionBytes.length + 4 + 4 + 4 + 4 + 4 + this._content.byteLength)

    const view = new DataView(buffer)
    let offset = 0

    view.setUint32(offset, 3) // Picture type (3 for front cover)
    offset += 4

    view.setUint32(offset, formatBytes.length)
    offset += 4
    new Uint8Array(buffer, offset, formatBytes.length).set(formatBytes)
    offset += formatBytes.length

    view.setUint32(offset, descriptionBytes.length)
    offset += 4
    new Uint8Array(buffer, offset, descriptionBytes.length).set(descriptionBytes)
    offset += descriptionBytes.length

    view.setUint32(offset, this.width)
    offset += 4

    view.setUint32(offset, this.height)
    offset += 4

    view.setUint32(offset, this.colourDepth)
    offset += 4

    view.setUint32(offset, this.indexedColor)
    offset += 4

    view.setUint32(offset, this._content.byteLength)
    offset += 4
    new Uint8Array(buffer, offset, this._content.byteLength).set(new Uint8Array(this._content))

    return buffer
  }
}
