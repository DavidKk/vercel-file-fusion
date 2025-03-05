export function getImageType(buffer: ArrayBuffer) {
  const arr = new Uint8Array(buffer).subarray(0, 4)
  const header = Array.from(arr)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

  switch (header) {
    case '89504e47':
      return 'image/png'
    case '47494638':
      return 'image/gif'
    case 'ffd8ffe0':
    case 'ffd8ffe1':
    case 'ffd8ffe2':
    case 'ffd8ffe3':
    case 'ffd8ffe8':
      return 'image/jpeg'
    case '424d':
      return 'image/bmp'
    case '52494646':
      return 'image/webp'
    default:
      return ''
  }
}
