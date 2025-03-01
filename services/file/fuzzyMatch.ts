export function fuzzyMatchFileName(fileA: string, fileB: string): boolean {
  // Convert to lowercase for case-insensitive matching
  fileA = fileA.toLowerCase()
  fileB = fileB.toLowerCase()

  // Extract filename (remove path)
  const nameA = fileA.split(/[/\\]/).pop() || ''
  const nameB = fileB.split(/[/\\]/).pop() || ''

  // Sanitize filenames: normalize spaces, remove illegal characters, and trim
  const sanitize = (name: string) =>
    name
      .normalize('NFKC') // Normalize Unicode characters
      .replace(/[?*<>|]/g, '') // Remove illegal filename characters
      .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
      .replace(/\s*([\(\)\[\]])\s*/g, '$1') // Remove spaces around parentheses/brackets
      .trim() // Trim leading and trailing spaces

  const cleanA = sanitize(nameA)
  const cleanB = sanitize(nameB)

  // Extract file extensions
  const getExt = (name: string) => {
    const parts = name.split('.')
    return parts.length > 1 ? parts.pop() : ''
  }

  const extA = getExt(cleanA)
  const extB = getExt(cleanB)

  // Extensions must match
  if (extA !== extB) {
    return false
  }

  // Process filename without extension
  const processBaseName = (name: string) =>
    name
      .replace(/\.[^.]+$/, '') // Remove extension
      .replace(/[_\-.]+/g, ' ') // Normalize separators
      .replace(/\s*\([^)]*\)\s*/g, '') // Remove content inside ()
      .replace(/\s*\[[^\]]*\]\s*/g, '') // Remove content inside []
      .replace(/\s*-\s*[^-]*$/, '') // Remove trailing part after last hyphen
      .trim()

  const baseA = processBaseName(cleanA)
  const baseB = processBaseName(cleanB)

  // Check if one filename contains the other
  return baseA.includes(baseB) || baseB.includes(baseA)
}
