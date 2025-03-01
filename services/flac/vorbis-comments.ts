/**
 * Decodes Vorbis comment metadata from binary data, extracting vendor information and comment key-value pairs.
 *
 * Binary Format:
 * - All integer values are stored in little-endian byte order
 * - Structure:
 *   1. Vendor Length (4 bytes): Length of the vendor string
 *   2. Vendor String (variable): UTF-8 encoded vendor string
 *   3. Comment List Length (4 bytes): Number of comments
 *   4. Comments (variable): Array of comment entries, each containing:
 *      - Length (4 bytes): Length of the comment string
 *      - Data (variable): UTF-8 encoded string in "KEY=value" format
 *
 * Comment Format:
 * - Keys are case-insensitive and stored in uppercase
 * - Values can contain any UTF-8 character including newlines
 * - Multiple values for the same key are allowed
 */
export function decodeVorbisComments(data: ArrayBuffer) {
  // Vorbis Comments use little-endian byte order
  const dataView = new DataView(data)
  let offset = 0

  // Read vendor string length and value
  const vendorLength = dataView.getUint32(offset, true)
  offset += 4

  if (offset + vendorLength > data.byteLength) {
    throw new Error('Invalid vendor length')
  }

  const vendorString = new TextDecoder().decode(new Uint8Array(data, offset, vendorLength))
  offset += vendorLength

  // Read the number of comments
  if (offset + 4 > data.byteLength) {
    throw new Error('Invalid comment list length')
  }

  const commentListLength = dataView.getUint32(offset, true)
  offset += 4

  const comments = new Map<string, string>()
  for (let i = 0; i < commentListLength; i++) {
    if (offset + 4 > data.byteLength) {
      throw new Error('Invalid comment length')
    }

    const commentLength = dataView.getUint32(offset, true)
    offset += 4

    if (offset + commentLength > data.byteLength) {
      throw new Error('Invalid comment data')
    }

    const commentBytes = new Uint8Array(data, offset, commentLength)
    const commentString = new TextDecoder().decode(commentBytes)
    offset += commentLength

    // Extract key-value pair (split only at the first '=')
    const separatorIndex = commentString.indexOf('=')
    if (separatorIndex > 0) {
      const key = commentString.slice(0, separatorIndex).toUpperCase()
      const value = commentString.slice(separatorIndex + 1)
      comments.set(key, value)
    }
  }

  return { vendor: vendorString, comments }
}

/**
 * Encodes vendor information and comment key-value pairs into Vorbis comment binary data.
 *
 * Binary Format:
 * - All integer values are stored in little-endian byte order
 * - Structure:
 *   1. Vendor Length (4 bytes): Length of the vendor string
 *   2. Vendor String (variable): UTF-8 encoded vendor string
 *   3. Comment List Length (4 bytes): Number of comments
 *   4. Comments (variable): Array of comment entries, each containing:
 *      - Length (4 bytes): Length of the comment string
 *      - Data (variable): UTF-8 encoded string in "KEY=value" format
 *
 * Encoding Process:
 * 1. Encodes vendor string using UTF-8
 * 2. Converts each comment key-value pair to "KEY=value" format
 * 3. Encodes each comment string using UTF-8
 * 4. Assembles all components into a single binary buffer
 */
export function encodeVorbisComments(vendor: string, comments: Map<string, string>): ArrayBuffer {
  // Vorbis Comments use little-endian byte order
  const encoder = new TextEncoder()

  // Encode vendor string
  const vendorBytes = encoder.encode(vendor)
  const vendorLength = vendorBytes.length

  // Encode comments
  const commentListLength = comments.size
  const commentEntries: Uint8Array[] = []

  for (const [key, value] of comments) {
    const commentString = `${key}=${value}`
    const commentBytes = encoder.encode(commentString)
    const commentLength = commentBytes.length

    const entryBuffer = new ArrayBuffer(4 + commentLength)
    const entryView = new DataView(entryBuffer)
    entryView.setUint32(0, commentLength, true) // Little-endian

    new Uint8Array(entryBuffer, 4).set(commentBytes)
    commentEntries.push(new Uint8Array(entryBuffer))
  }

  // Calculate total buffer size
  const totalSize = 4 + vendorLength + 4 + commentEntries.reduce((sum, entry) => sum + entry.length, 0)
  const buffer = new ArrayBuffer(totalSize)
  const view = new DataView(buffer)
  let offset = 0

  // Write vendor string length and content
  view.setUint32(offset, vendorLength, true)
  offset += 4
  new Uint8Array(buffer, offset).set(vendorBytes)
  offset += vendorLength

  // Write comment list length
  view.setUint32(offset, commentListLength, true)
  offset += 4

  // Write comments
  for (const entry of commentEntries) {
    new Uint8Array(buffer, offset).set(entry)
    offset += entry.length
  }

  return buffer
}
