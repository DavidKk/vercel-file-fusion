export interface PictureMetadata {
  pictureType: number
  mimeType: string
  description: string
  width: number
  height: number
  colourDepth: number
  indexedColor: number
  pictureData: ArrayBuffer
}

export function decodePictureMetadata(data: ArrayBuffer): PictureMetadata {
  const view = new DataView(data)
  let offset = 0

  const pictureType = view.getUint32(offset, false)
  offset += 4

  const mimeLength = view.getUint32(offset, false)
  offset += 4

  const mimeType = new TextDecoder().decode(data.slice(offset, offset + mimeLength))
  offset += mimeLength

  const descLength = view.getUint32(offset, false)
  offset += 4

  const description = new TextDecoder().decode(data.slice(offset, offset + descLength))
  offset += descLength

  const width = view.getUint32(offset, false)
  offset += 4

  const height = view.getUint32(offset, false)
  offset += 4

  const colourDepth = view.getUint32(offset, false)
  offset += 4

  const indexedColor = view.getUint32(offset, false)
  offset += 4

  const dataLength = view.getUint32(offset, false)
  offset += 4

  const pictureData = data.slice(offset, offset + dataLength)

  return { pictureType, mimeType, description, width, height, colourDepth, indexedColor, pictureData }
}

export function encodePictureMetadata(picture: PictureMetadata): ArrayBuffer {
  const encoder = new TextEncoder()
  const mimeBytes = encoder.encode(picture.mimeType)
  const descBytes = encoder.encode(picture.description)

  const buffer = new ArrayBuffer(32 + mimeBytes.length + descBytes.length + picture.pictureData.byteLength)
  const view = new DataView(buffer)
  let offset = 0

  view.setUint32(offset, picture.pictureType, false)
  offset += 4

  view.setUint32(offset, mimeBytes.length, false)
  offset += 4
  new Uint8Array(buffer, offset, mimeBytes.length).set(mimeBytes)
  offset += mimeBytes.length

  view.setUint32(offset, descBytes.length, false)
  offset += 4
  new Uint8Array(buffer, offset, descBytes.length).set(descBytes)
  offset += descBytes.length

  view.setUint32(offset, picture.width, false)
  offset += 4

  view.setUint32(offset, picture.height, false)
  offset += 4

  view.setUint32(offset, picture.colourDepth, false)
  offset += 4

  view.setUint32(offset, picture.indexedColor, false)
  offset += 4

  view.setUint32(offset, picture.pictureData.byteLength, false)
  offset += 4

  new Uint8Array(buffer, offset, picture.pictureData.byteLength).set(new Uint8Array(picture.pictureData))

  return buffer
}
