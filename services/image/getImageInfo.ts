import { getImageType } from './getImageType'

export interface ImageInfo {
  width: number
  height: number
  mimeType: string
}

export function getImageInfo(data: ArrayBuffer) {
  const mimeType = getImageType(data)
  return new Promise<ImageInfo>((resolve) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.width, height: image.height, mimeType })
    image.src = URL.createObjectURL(new Blob([data], { type: mimeType }))
  })
}
