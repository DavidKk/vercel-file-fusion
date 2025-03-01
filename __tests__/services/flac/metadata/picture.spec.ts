import { decodePictureMetadata, encodePictureMetadata } from '@/services/flac/metadata/picture'

describe('picture-metadata', () => {
  describe('decodePictureMetadata', () => {
    it('should correctly decode cover image metadata', () => {
      // Create sample cover image data
      const data = new ArrayBuffer(100)
      const view = new DataView(data)
      let offset = 0

      // Set picture type (3 = front cover)
      view.setUint32(offset, 3)
      offset += 4

      // Set MIME type length and content
      const mimeType = 'image/jpeg'
      const mimeBytes = new TextEncoder().encode(mimeType)
      view.setUint32(offset, mimeBytes.length)
      offset += 4
      new Uint8Array(data, offset, mimeBytes.length).set(mimeBytes)
      offset += mimeBytes.length

      // Set description length and content
      const description = 'Album cover'
      const descBytes = new TextEncoder().encode(description)
      view.setUint32(offset, descBytes.length)
      offset += 4
      new Uint8Array(data, offset, descBytes.length).set(descBytes)
      offset += descBytes.length

      // Set image dimensions
      view.setUint32(offset, 800) // width
      offset += 4
      view.setUint32(offset, 600) // height
      offset += 4

      // Set color information
      view.setUint32(offset, 24) // colourDepth
      offset += 4
      view.setUint32(offset, 0) // indexedColor
      offset += 4

      // Set picture data length and content
      const pictureData = new Uint8Array([1, 2, 3, 4, 5]) // sample picture data
      view.setUint32(offset, pictureData.length)
      offset += 4
      new Uint8Array(data, offset, pictureData.length).set(pictureData)

      const result = decodePictureMetadata(data)

      expect(result.pictureType).toBe(3)
      expect(result.mimeType).toBe(mimeType)
      expect(result.description).toBe(description)
      expect(result.width).toBe(800)
      expect(result.height).toBe(600)
      expect(result.colourDepth).toBe(24)
      expect(result.indexedColor).toBe(0)
      expect(new Uint8Array(result.pictureData)).toEqual(pictureData)
    })

    it('should handle empty description', () => {
      const data = new ArrayBuffer(50)
      const view = new DataView(data)
      let offset = 0

      view.setUint32(offset, 3)
      offset += 4

      const mimeType = 'image/png'
      const mimeBytes = new TextEncoder().encode(mimeType)
      view.setUint32(offset, mimeBytes.length)
      offset += 4
      new Uint8Array(data, offset, mimeBytes.length).set(mimeBytes)
      offset += mimeBytes.length

      // Set empty description
      view.setUint32(offset, 0)
      offset += 4

      // Set other required fields
      view.setUint32(offset, 100) // width
      offset += 4
      view.setUint32(offset, 100) // height
      offset += 4
      view.setUint32(offset, 24) // colourDepth
      offset += 4
      view.setUint32(offset, 0) // indexedColor
      offset += 4

      // Set empty picture data
      view.setUint32(offset, 0)

      const result = decodePictureMetadata(data)

      expect(result.description).toBe('')
    })

    it('should handle different picture types', () => {
      const pictureTypes = [0, 1, 2, 3, 4] // Test different picture types

      pictureTypes.forEach((type) => {
        const data = new ArrayBuffer(50)
        const view = new DataView(data)
        let offset = 0

        view.setUint32(offset, type)
        offset += 4

        // Set minimum required data
        const mimeType = 'image/jpeg'
        const mimeBytes = new TextEncoder().encode(mimeType)
        view.setUint32(offset, mimeBytes.length)
        offset += 4
        new Uint8Array(data, offset, mimeBytes.length).set(mimeBytes)
        offset += mimeBytes.length

        view.setUint32(offset, 0) // empty description
        offset += 4

        // Set other required fields
        view.setUint32(offset, 1) // width
        offset += 4
        view.setUint32(offset, 1) // height
        offset += 4
        view.setUint32(offset, 24) // colourDepth
        offset += 4
        view.setUint32(offset, 0) // indexedColor
        offset += 4
        view.setUint32(offset, 0) // empty picture data

        const result = decodePictureMetadata(data)
        expect(result.pictureType).toBe(type)
      })
    })

    it('should handle different MIME types', () => {
      const mimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

      mimeTypes.forEach((mimeType) => {
        const data = new ArrayBuffer(100)
        const view = new DataView(data)
        let offset = 0

        view.setUint32(offset, 3)
        offset += 4

        const mimeBytes = new TextEncoder().encode(mimeType)
        view.setUint32(offset, mimeBytes.length)
        offset += 4
        new Uint8Array(data, offset, mimeBytes.length).set(mimeBytes)
        offset += mimeBytes.length

        // Set other required fields
        view.setUint32(offset, 0) // empty description
        offset += 4
        view.setUint32(offset, 1) // width
        offset += 4
        view.setUint32(offset, 1) // height
        offset += 4
        view.setUint32(offset, 24) // colourDepth
        offset += 4
        view.setUint32(offset, 0) // indexedColor
        offset += 4
        view.setUint32(offset, 0) // empty picture data

        const result = decodePictureMetadata(data)
        expect(result.mimeType).toBe(mimeType)
      })
    })
  })

  describe('encodePictureMetadata', () => {
    it('should correctly encode picture metadata', () => {
      const pictureData = {
        pictureType: 3,
        mimeType: 'image/jpeg',
        description: 'Album cover',
        width: 800,
        height: 600,
        colourDepth: 24,
        indexedColor: 0,
        pictureData: new Uint8Array([1, 2, 3, 4, 5]).buffer,
      }

      const result = encodePictureMetadata(pictureData)
      const decoded = decodePictureMetadata(result)

      expect(decoded.pictureType).toBe(pictureData.pictureType)
      expect(decoded.mimeType).toBe(pictureData.mimeType)
      expect(decoded.description).toBe(pictureData.description)
      expect(decoded.width).toBe(pictureData.width)
      expect(decoded.height).toBe(pictureData.height)
      expect(decoded.colourDepth).toBe(pictureData.colourDepth)
      expect(decoded.indexedColor).toBe(pictureData.indexedColor)
      expect(new Uint8Array(decoded.pictureData)).toEqual(new Uint8Array(pictureData.pictureData))
    })

    it('should handle empty description', () => {
      const pictureData = {
        pictureType: 3,
        mimeType: 'image/png',
        description: '',
        width: 100,
        height: 100,
        colourDepth: 24,
        indexedColor: 0,
        pictureData: new ArrayBuffer(0),
      }

      const result = encodePictureMetadata(pictureData)
      const decoded = decodePictureMetadata(result)

      expect(decoded.description).toBe('')
      expect(decoded.pictureData.byteLength).toBe(0)
    })

    it('should handle different picture types', () => {
      const pictureTypes = [0, 1, 2, 3, 4]

      pictureTypes.forEach((type) => {
        const pictureData = {
          pictureType: type,
          mimeType: 'image/jpeg',
          description: 'test',
          width: 1,
          height: 1,
          colourDepth: 24,
          indexedColor: 0,
          pictureData: new ArrayBuffer(0),
        }

        const result = encodePictureMetadata(pictureData)
        const decoded = decodePictureMetadata(result)

        expect(decoded.pictureType).toBe(type)
      })
    })

    it('should handle different MIME types', () => {
      const mimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

      mimeTypes.forEach((mimeType) => {
        const pictureData = {
          pictureType: 3,
          mimeType,
          description: 'test',
          width: 1,
          height: 1,
          colourDepth: 24,
          indexedColor: 0,
          pictureData: new ArrayBuffer(0),
        }

        const result = encodePictureMetadata(pictureData)
        const decoded = decodePictureMetadata(result)

        expect(decoded.mimeType).toBe(mimeType)
      })
    })

    it('should correctly handle encode-decode cycle with real data', () => {
      // Create a large sample image data
      const sampleImageData = new Uint8Array(1024)
      for (let i = 0; i < sampleImageData.length; i++) {
        sampleImageData[i] = i % 256
      }

      const originalData = {
        pictureType: 3,
        mimeType: 'image/jpeg',
        description: 'Test image with large data',
        width: 1920,
        height: 1080,
        colourDepth: 24,
        indexedColor: 0,
        pictureData: sampleImageData.buffer,
      }

      const encoded = encodePictureMetadata(originalData)
      const decoded = decodePictureMetadata(encoded)

      // Verify all fields are correctly preserved
      expect(decoded.pictureType).toBe(originalData.pictureType)
      expect(decoded.mimeType).toBe(originalData.mimeType)
      expect(decoded.description).toBe(originalData.description)
      expect(decoded.width).toBe(originalData.width)
      expect(decoded.height).toBe(originalData.height)
      expect(decoded.colourDepth).toBe(originalData.colourDepth)
      expect(decoded.indexedColor).toBe(originalData.indexedColor)
      expect(new Uint8Array(decoded.pictureData)).toEqual(sampleImageData)
    })
  })
})
