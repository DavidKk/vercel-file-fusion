export function toIntBE(data: DataView): number {
  let value = 0
  for (let i = 0; i < data.byteLength; i++) {
    value = (value << 8) | data.getUint8(i)
  }

  return value
}

export function parseBlock(data: ArrayBuffer, offset: number) {
  const dataView = new DataView(data)
  const byte = dataView.getUint8(offset)
  const size = toIntBE(new DataView(data, offset + 1, 3))
  const type = byte & 0x7f
  const isLast = Boolean(byte & 0x80)
  return { type, byte, size, isLast }
}

export function parseVorbisComments(data: ArrayBuffer) {
  const dataView = new DataView(data)
  let offset = 0

  const vendorLength = dataView.getUint32(offset, true)
  offset += 4

  const vendorString = new TextDecoder().decode(data.slice(offset, offset + vendorLength))
  offset += vendorLength

  const commentListLength = dataView.getUint32(offset, true)
  offset += 4

  const comments = new Map<string, string>()
  for (let i = 0; i < commentListLength; i++) {
    const commentLength = dataView.getUint32(offset, true)
    offset += 4

    const commentString = new TextDecoder().decode(data.slice(offset, offset + commentLength))
    offset += commentLength

    const [key, value] = commentString.split('=')
    comments.set(key.toUpperCase(), value)
  }

  return { vendor: vendorString, comments }
}

export function bufferFromVorbisComments(comments: Map<string, string>, vendor = '') {
  const encoder = new TextEncoder()
  const vendorBuffer = encoder.encode(vendor)
  let totalLength = 4 + vendorBuffer.byteLength + 4

  const commentEntries = Array.from(comments.entries()).map(([key, value]) => `${key}=${value}`)
  const commentBuffers = commentEntries.map((entry) => encoder.encode(entry))

  totalLength += commentBuffers.reduce((sum, buffer) => sum + 4 + buffer.byteLength, 0)

  const buffer = new ArrayBuffer(totalLength)
  const dataView = new DataView(buffer)
  let offset = 0

  dataView.setUint32(offset, vendorBuffer.byteLength, true)
  offset += 4

  new Uint8Array(buffer, offset, vendorBuffer.byteLength).set(vendorBuffer)
  offset += vendorBuffer.length

  dataView.setUint32(offset, commentEntries.length, true)
  offset += 4

  commentBuffers.forEach((commentBuffer) => {
    dataView.setUint32(offset, commentBuffer.byteLength, true)
    offset += 4

    new Uint8Array(buffer, offset, commentBuffer.byteLength).set(commentBuffer)
    offset += commentBuffer.byteLength
  })

  return buffer
}

export function readString(dataView: DataView, offset: number): string {
  const length = dataView.getUint32(offset, true)
  offset += 4

  const data = dataView.buffer.slice(offset, offset + length)
  return new TextDecoder().decode(data as ArrayBuffer)
}

export function parseCoverImage(data: ArrayBuffer) {
  const dataView = new DataView(data)
  let offset = 0

  const format = readString(dataView, offset)
  offset += 4 + format.length

  const description = readString(dataView, offset)
  offset += 4 + description.length

  const width = dataView.getUint32(offset, true)
  offset += 4

  const height = dataView.getUint32(offset, true)
  offset += 4

  const colourDepth = dataView.getUint32(offset, true)
  offset += 4

  const indexedColor = dataView.getUint32(offset, true)
  offset += 4

  const dataLength = dataView.getUint32(offset, true)
  offset += 4

  const content = new Uint8Array(data.slice(offset, offset + dataLength)).buffer
  return { format, description, width, height, colourDepth, indexedColor, content }
}
