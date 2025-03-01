import { FlacMetadata } from './FlacMetadata'
import { encodeVorbisComments, decodeVorbisComments } from './vorbis-comments'

export class FlacVorbisComments extends FlacMetadata {
  static readonly TYPE = 4

  protected vendor = ''
  protected comments = new Map<string, string>()

  public get content() {
    return encodeVorbisComments(this.vendor, this.comments)
  }

  constructor(byte: number = FlacVorbisComments.TYPE, data?: ArrayBuffer) {
    super(byte, new ArrayBuffer(0))

    if (data) {
      const { vendor, comments } = decodeVorbisComments(data)
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
