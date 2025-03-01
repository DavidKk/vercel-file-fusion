import { sanitizeFileName } from '../../utils/file'

describe('sanitizeFileName', () => {
  it('should trim whitespace', () => {
    expect(sanitizeFileName('  test.txt  ')).toBe('test.txt')
  })

  it('should remove invalid characters', () => {
    expect(sanitizeFileName('file\\/:*?"<>|.txt')).toBe('file.txt')
  })

  it('should replace multiple dots with single dot', () => {
    expect(sanitizeFileName('file...txt')).toBe('file.txt')
  })

  it('should remove trailing dots', () => {
    expect(sanitizeFileName('file.txt.')).toBe('file.txt')
  })

  it('should replace multiple spaces with single space', () => {
    expect(sanitizeFileName('my   file.txt')).toBe('my file.txt')
  })

  it('should handle empty string', () => {
    expect(sanitizeFileName('')).toBe('')
  })

  it('should handle string with only invalid characters', () => {
    expect(sanitizeFileName('\\/:*?"<>|')).toBe('')
  })

  describe('length limit handling', () => {
    it('should truncate long filename without extension', () => {
      const longName = 'a'.repeat(300)
      expect(sanitizeFileName(longName).length).toBe(255)
    })

    it('should preserve extension when truncating long filename', () => {
      const longName = 'a'.repeat(300) + '.txt'
      const result = sanitizeFileName(longName)
      expect(result.endsWith('.txt')).toBe(true)
      expect(result.length).toBe(255)
    })

    it('should handle long filename with multiple dots', () => {
      const longName = 'a'.repeat(300) + '.config.json'
      const result = sanitizeFileName(longName)
      expect(result.endsWith('.config.json')).toBe(true)
      expect(result.length).toBe(255)
    })
  })

  it('should handle filename with only dots', () => {
    expect(sanitizeFileName('....')).toBe('')
  })

  it('should handle filename with mixed invalid characters and spaces', () => {
    expect(sanitizeFileName('my ? file * name.txt')).toBe('my file name.txt')
  })

  it('should preserve valid special characters', () => {
    expect(sanitizeFileName('file-name_[1].txt')).toBe('file-name_[1].txt')
  })
})
