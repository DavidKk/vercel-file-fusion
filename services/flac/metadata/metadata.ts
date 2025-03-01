export function toIntBE(data: DataView): number {
  let value = 0
  for (let i = 0; i < data.byteLength; i++) {
    value = (value << 8) | data.getUint8(i)
  }

  return value
}

export function decodeMetadata(data: ArrayBuffer, offset: number) {
  const dataView = new DataView(data)
  const byte = dataView.getUint8(offset)
  const size = toIntBE(new DataView(data, offset + 1, 3)) // Corrected DataView usage
  const type = byte & 0x7f // Extracts metadata block type
  const isLast = Boolean(byte & 0x80) // Checks if it's the last metadata block
  return { type, byte, size, isLast }
}
