import iconv from 'iconv-lite'
import type { Entry } from '@zip.js/zip.js'

export function transcodeEntryFileName(entry: Entry) {
  if (entry.filenameUTF8) {
    return entry.filename
  }

  const buffer = new Uint8Array(entry.rawFilename).buffer
  return iconv.decode(Buffer.from(buffer), 'utf-8')
}
