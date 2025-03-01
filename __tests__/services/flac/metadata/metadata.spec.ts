import { decodeMetadata } from '@/services/flac/metadata/metadata'

describe('decodeMetadata', () => {
  it('should correctly decode metadata block header', () => {
    // Create a sample metadata block header
    // [1 byte header][3 bytes size]
    const data = new ArrayBuffer(4)
    const view = new DataView(data)

    // Set header byte: type = 1, isLast = false
    view.setUint8(0, 0x01)

    // Set size bytes (24-bit BE integer): 1024
    view.setUint8(1, 0x00) // 0x000400 = 1024
    view.setUint8(2, 0x04)
    view.setUint8(3, 0x00)

    const result = decodeMetadata(data, 0)

    expect(result.type).toBe(1)
    expect(result.isLast).toBe(false)
    expect(result.size).toBe(1024)
  })

  it('should correctly identify last metadata block', () => {
    const data = new ArrayBuffer(4)
    const view = new DataView(data)

    // Set header byte: type = 2, isLast = true (0x80 | 0x02)
    view.setUint8(0, 0x82)

    // Set size bytes: 512
    view.setUint8(1, 0x00)
    view.setUint8(2, 0x02)
    view.setUint8(3, 0x00)

    const result = decodeMetadata(data, 0)

    expect(result.type).toBe(2)
    expect(result.isLast).toBe(true)
    expect(result.size).toBe(512)
  })

  it('should handle different metadata block types', () => {
    const data = new ArrayBuffer(4)
    const view = new DataView(data)

    // Test different metadata block types (0-127)
    const testTypes = [0, 1, 3, 4, 6, 127]

    testTypes.forEach((type) => {
      view.setUint8(0, type)
      view.setUint8(1, 0x00)
      view.setUint8(2, 0x00)
      view.setUint8(3, 0x10) // size = 16 (0x000010)

      const result = decodeMetadata(data, 0)
      expect(result.type).toBe(type)
      expect(result.size).toBe(16)
    })
  })

  it('should handle zero size metadata block', () => {
    const data = new ArrayBuffer(4)
    const view = new DataView(data)

    view.setUint8(0, 0x01)
    view.setUint8(1, 0x00)
    view.setUint8(2, 0x00)
    view.setUint8(3, 0x00)

    const result = decodeMetadata(data, 0)

    expect(result.size).toBe(0)
  })

  it('should handle maximum size metadata block', () => {
    const data = new ArrayBuffer(4)
    const view = new DataView(data)

    view.setUint8(0, 0x01)
    view.setUint8(1, 0xff)
    view.setUint8(2, 0xff)
    view.setUint8(3, 0xff)

    const result = decodeMetadata(data, 0)

    // Maximum 24-bit integer
    expect(result.size).toBe(16777215)
  })

  it('should handle non-zero offset', () => {
    const data = new ArrayBuffer(8)
    const view = new DataView(data)

    // Add some padding before the metadata block
    view.setUint32(0, 0xffffffff)

    // Set metadata block at offset 4
    view.setUint8(4, 0x03)
    view.setUint8(5, 0x00)
    view.setUint8(6, 0x01)
    view.setUint8(7, 0x00)

    const result = decodeMetadata(data, 4)

    expect(result.type).toBe(3)
    expect(result.size).toBe(256)
  })
})
