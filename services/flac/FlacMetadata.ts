/**
 * @see https://www.rfc-editor.org/rfc/rfc9639.html#appendix-D.1.3
 */
export class FlacMetadata {
  static MAX_BLOCK_SIZE = (1 << 24) - 1

  protected byte: number
  protected _content: ArrayBuffer

  public set content(data: ArrayBuffer) {
    this._content = data
  }

  public get content() {
    return this._content
  }

  public get size() {
    return this.content.byteLength
  }

  public get isLast() {
    return this.byte & 0x80
  }

  constructor(byte: number, data: ArrayBuffer) {
    this.byte = byte
    this._content = data
  }

  public setContent(data: ArrayBuffer) {
    if (data.byteLength > FlacMetadata.MAX_BLOCK_SIZE) {
      throw new Error('Cover image too large')
    }

    this._content = data
  }

  public getContent() {
    return this.content
  }

  public toBuffer(content = this.content) {
    const data = new Uint8Array(content)
    const header = new Uint8Array(4)

    header[0] = this.byte
    header[1] = (this.size >> 16) & 0xff
    header[2] = (this.size >> 8) & 0xff
    header[3] = this.size & 0xff

    return new Uint8Array([...header, ...data]).buffer
  }
}
