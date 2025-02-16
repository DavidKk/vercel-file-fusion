import { FlacMetadata } from './FlacMetadata'
import { parseCoverImage } from './share'

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

  constructor(byte: number, data?: ArrayBuffer) {
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
}
