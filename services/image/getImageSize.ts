export function getImageSize(data: ArrayBuffer, type: string) {
  return new Promise<{ width: number; height: number }>((resolve) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.width, height: image.height })
    image.src = URL.createObjectURL(new Blob([data], { type }))
  })
}
