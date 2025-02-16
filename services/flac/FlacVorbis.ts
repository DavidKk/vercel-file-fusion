import { FlacMetadata } from './FlacMetadata'
import { bufferFromVorbisComments, parseVorbisComments } from './share'

export class FlacVorbis extends FlacMetadata {
  static TYPE = 4

  protected vendor = ''
  protected comments = new Map<string, string>()

  public get content() {
    return bufferFromVorbisComments(this.comments, this.vendor)
  }

  constructor(byte: number, data?: ArrayBuffer) {
    super(byte, new ArrayBuffer(0))

    if (data) {
      const { vendor, comments } = parseVorbisComments(data)
      this.vendor = vendor
      this.comments = comments
    }
  }

  public setComment(key: string, value: string) {
    this.comments.set(key, value)
  }

  public getComment(key: string) {
    return this.comments.get(key)
  }
}
