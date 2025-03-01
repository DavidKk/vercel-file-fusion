export function sanitizeFileName(fileName: string) {
  let sanitized = fileName.trim()
  sanitized = sanitized.replace(/[\\/:*?"<>|]/g, '')
  sanitized = sanitized.replace(/\.{2,}/g, '.')
  sanitized = sanitized.replace(/\.+$/, '')
  sanitized = sanitized.replace(/\s+/g, ' ')

  const maxLength = 255
  if (sanitized.length > maxLength) {
    const lastDotIndex = sanitized.lastIndexOf('.')
    if (lastDotIndex !== -1) {
      const firstDotIndex = sanitized.indexOf('.')
      const extPart = sanitized.slice(firstDotIndex)
      const namePart = sanitized.slice(0, maxLength - extPart.length)
      sanitized = namePart + extPart
    } else {
      sanitized = sanitized.slice(0, maxLength)
    }
  }

  return sanitized
}
