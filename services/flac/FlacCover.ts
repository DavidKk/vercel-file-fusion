import { FlacMetadata } from './FlacMetadata'
import { decodePictureMetadata, encodePictureMetadata } from './metadata/picture'

/**
 * @see https://www.rfc-editor.org/rfc/rfc9639.html#section-8.8
 */
export interface CoverImageMetadata {
  mimeType: string
  description: string
  width: number
  height: number
  colourDepth: number
  indexedColor: number
}

export class FlacCover extends FlacMetadata {
  static readonly TYPE = 6

  protected mimeType = ''
  protected description = 'front cover'
  protected width = 0
  protected height = 0
  protected colourDepth = 24
  protected indexedColor = 0
  protected pictureType = 3

  public get content() {
    return encodePictureMetadata({
      pictureType: this.pictureType,
      mimeType: this.mimeType,
      description: this.description,
      width: this.width,
      height: this.height,
      colourDepth: this.colourDepth,
      indexedColor: this.indexedColor,
      pictureData: this._content,
    })
  }

  constructor(byte: number = FlacCover.TYPE, data?: ArrayBuffer) {
    super(byte, new ArrayBuffer(0))

    if (data) {
      const { pictureType, mimeType, description, width, height, colourDepth, indexedColor, pictureData } = decodePictureMetadata(data)

      pictureType && (this.pictureType = pictureType)
      mimeType && (this.mimeType = mimeType)
      description && (this.description = description)
      width && (this.width = width)
      height && (this.height = height)
      colourDepth && (this.colourDepth = colourDepth)
      indexedColor && (this.indexedColor = indexedColor)
      pictureData && (this._content = pictureData)
    }
  }

  public updateImage(image: ArrayBuffer, metadta?: Partial<CoverImageMetadata>) {
    if (metadta) {
      this.mimeType = metadta.mimeType || this.mimeType
      this.description = metadta.description || this.description
      this.width = metadta.width || this.width
      this.height = metadta.height || this.height
      this.colourDepth = metadta.colourDepth || this.colourDepth
      this.indexedColor = metadta.indexedColor || this.indexedColor
    }

    this._content = image
  }
}
