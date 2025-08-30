export function basename(filename: string) {
  return filename.split('/').pop()!
}

export function extname(filename: string) {
  return filename.split('.').pop()!
}

export function dirname(filename: string) {
  return filename.split('/').slice(0, -1).join('/')
}

export function join(...paths: string[]) {
  return paths.filter(Boolean).join('/').trim()
}
