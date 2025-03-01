import { decodeVorbisComments, encodeVorbisComments } from '@/services/flac/vorbis-comments'

describe('vorbis-comments', () => {
  describe('decodeVorbisComments', () => {
    it('should decode empty comments', () => {
      // Create a buffer with only vendor string and no comments
      const vendorString = 'test vendor'
      const encoder = new TextEncoder()
      const vendorBytes = encoder.encode(vendorString)

      const buffer = new ArrayBuffer(8 + vendorBytes.length)
      const view = new DataView(buffer)

      // Write vendor length
      view.setUint32(0, vendorBytes.length, true)
      // Write vendor string
      new Uint8Array(buffer, 4).set(vendorBytes)
      // Write comment count (0)
      view.setUint32(4 + vendorBytes.length, 0, true)

      const result = decodeVorbisComments(buffer)
      expect(result.vendor).toBe(vendorString)
      expect(result.comments.size).toBe(0)
    })

    it('should decode comments with multiple entries', () => {
      const vendorString = 'test vendor'
      const comments = new Map([
        ['TITLE', 'Test Song'],
        ['ARTIST', 'Test Artist'],
        ['ALBUM', 'Test Album'],
      ])

      // Encode the comments first
      const buffer = encodeVorbisComments(vendorString, comments)

      // Then decode and verify
      const result = decodeVorbisComments(buffer)

      expect(result.vendor).toBe(vendorString)
      expect(result.comments.size).toBe(comments.size)
      expect(result.comments.get('TITLE')).toBe('Test Song')
      expect(result.comments.get('ARTIST')).toBe('Test Artist')
      expect(result.comments.get('ALBUM')).toBe('Test Album')
    })

    it('should handle malformed comment entries', () => {
      const vendorString = 'test vendor'
      const encoder = new TextEncoder()
      const vendorBytes = encoder.encode(vendorString)

      // Create a buffer with one malformed comment (no '=' separator)
      const malformedComment = 'malformed comment'
      const commentBytes = encoder.encode(malformedComment)

      const buffer = new ArrayBuffer(12 + vendorBytes.length + 4 + commentBytes.length)
      const view = new DataView(buffer)
      let offset = 0

      // Write vendor length and string
      view.setUint32(offset, vendorBytes.length, true)
      offset += 4
      new Uint8Array(buffer, offset).set(vendorBytes)
      offset += vendorBytes.length

      // Write comment count (1)
      view.setUint32(offset, 1, true)
      offset += 4

      // Write malformed comment length and content
      view.setUint32(offset, commentBytes.length, true)
      offset += 4
      new Uint8Array(buffer, offset).set(commentBytes)

      const result = decodeVorbisComments(buffer)
      expect(result.vendor).toBe(vendorString)
      expect(result.comments.size).toBe(0) // Malformed comment should be skipped
    })

    it('should handle truncated data', () => {
      const buffer = new ArrayBuffer(4) // Only vendor length, no actual vendor data
      const view = new DataView(buffer)
      view.setUint32(0, 100, true) // Set vendor length larger than actual buffer

      expect(() => decodeVorbisComments(buffer)).toThrow('Invalid vendor length')
    })
  })

  describe('encodeVorbisComments', () => {
    it('should encode empty comments', () => {
      const vendorString = 'test vendor'
      const comments = new Map()

      const buffer = encodeVorbisComments(vendorString, comments)
      const result = decodeVorbisComments(buffer)

      expect(result.vendor).toBe(vendorString)
      expect(result.comments.size).toBe(0)
    })

    it('should encode and decode comments correctly', () => {
      const vendorString = 'test vendor'
      const comments = new Map([
        ['TITLE', 'Test Song'],
        ['ARTIST', 'Test Artist'],
        ['ALBUM', 'Test Album'],
      ])

      const buffer = encodeVorbisComments(vendorString, comments)
      const result = decodeVorbisComments(buffer)

      expect(result.vendor).toBe(vendorString)
      expect(result.comments.size).toBe(comments.size)

      for (const [key, value] of comments) {
        expect(result.comments.get(key)).toBe(value)
      }
    })

    it('should handle empty vendor string', () => {
      const vendorString = ''
      const comments = new Map([['TITLE', 'Test Song']])

      const buffer = encodeVorbisComments(vendorString, comments)
      const result = decodeVorbisComments(buffer)

      expect(result.vendor).toBe('')
      expect(result.comments.size).toBe(1)
      expect(result.comments.get('TITLE')).toBe('Test Song')
    })

    it('should handle special characters in comments', () => {
      const vendorString = 'test vendor'
      const comments = new Map([
        ['TITLE', '测试歌曲'],
        ['ARTIST', 'Test Artist 👨‍🎤'],
        ['COMMENT', 'Line 1\nLine 2'],
      ])

      const buffer = encodeVorbisComments(vendorString, comments)
      const result = decodeVorbisComments(buffer)

      expect(result.vendor).toBe(vendorString)
      expect(result.comments.size).toBe(comments.size)
      expect(result.comments.get('TITLE')).toBe('测试歌曲')
      expect(result.comments.get('ARTIST')).toBe('Test Artist 👨‍🎤')
      expect(result.comments.get('COMMENT')).toBe('Line 1\nLine 2')
    })
  })

  describe('encode-decode conversion', () => {
    it('should maintain data integrity through encode-decode cycle', () => {
      const originalVendor = 'Test Vendor String'
      const originalComments = new Map([
        ['TITLE', 'Test Title'],
        ['ARTIST', 'Test Artist'],
        ['ALBUM', 'Test Album'],
        ['YEAR', '2024'],
        ['COMMENT', 'Multi\nLine\nComment'],
        ['GENRE', 'Electronic 🎵'],
        ['COMPOSER', '作曲家'],
      ])

      // First encode the original data
      const encoded = encodeVorbisComments(originalVendor, originalComments)

      // Then decode it back
      const decoded = decodeVorbisComments(encoded)

      // Verify vendor string
      expect(decoded.vendor).toBe(originalVendor)

      // Verify comments size
      expect(decoded.comments.size).toBe(originalComments.size)

      // Verify each comment
      for (const [key, value] of originalComments) {
        expect(decoded.comments.get(key)).toBe(value)
      }
    })

    it('should handle empty data correctly in encode-decode cycle', () => {
      const emptyVendor = ''
      const emptyComments = new Map()

      const encoded = encodeVorbisComments(emptyVendor, emptyComments)
      const decoded = decodeVorbisComments(encoded)

      expect(decoded.vendor).toBe(emptyVendor)
      expect(decoded.comments.size).toBe(0)
    })

    it('should preserve special characters and formatting in encode-decode cycle', () => {
      const vendor = '🎵 Special Vendor 测试'
      const comments = new Map([
        ['TITLE', '🎵 Special Title'],
        ['ARTIST', '测试艺术家'],
        ['DESCRIPTION', 'Line 1\nLine 2\nLine 3'],
        ['EMOJI', '👨‍👩‍👧‍👦 Family Emoji'],
        ['MIXED', '混合 Mixed Content 123 !@#$%'],
      ])

      const encoded = encodeVorbisComments(vendor, comments)
      const decoded = decodeVorbisComments(encoded)

      expect(decoded.vendor).toBe(vendor)
      expect(decoded.comments.size).toBe(comments.size)

      for (const [key, value] of comments) {
        expect(decoded.comments.get(key)).toBe(value)
      }
    })
  })
})
