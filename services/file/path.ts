export function basename(filename: string) {
  return filename.split('/').pop()!
}

export function extname(filename: string) {
  return filename.split('.').pop()!
}
