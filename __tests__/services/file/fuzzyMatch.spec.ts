import { fuzzyMatchFileName } from '@/services/file/fuzzyMatch'

describe('fuzzyMatchFileName', () => {
  it('should match files with same extension', () => {
    expect(fuzzyMatchFileName('test.txt', 'test.txt')).toBe(true)
    expect(fuzzyMatchFileName('test.txt', 'my_test.txt')).toBe(true)
    expect(fuzzyMatchFileName('test.txt', 'test_file.txt')).toBe(true)
  })

  it('should not match files with different extensions', () => {
    expect(fuzzyMatchFileName('test.txt', 'test.doc')).toBe(false)
    expect(fuzzyMatchFileName('test.txt', 'test.txt.doc')).toBe(false)
  })

  it('should handle multiple dots in extension', () => {
    expect(fuzzyMatchFileName('config.meta.json', 'my.config.meta.json')).toBe(true)
    expect(fuzzyMatchFileName('config.meta.json', 'config.meta.json.bak')).toBe(false)
  })

  it('should handle consecutive dots', () => {
    expect(fuzzyMatchFileName('test..txt', 'test..txt')).toBe(true)
    expect(fuzzyMatchFileName('test..txt', 'my..test..txt')).toBe(true)
  })

  it('should be case insensitive', () => {
    expect(fuzzyMatchFileName('Test.TXT', 'test.txt')).toBe(true)
    expect(fuzzyMatchFileName('test.txt', 'TEST.TXT')).toBe(true)
  })

  it('should handle special characters in filename', () => {
    expect(fuzzyMatchFileName('test-file.txt', 'my-test-file.txt')).toBe(true)
    expect(fuzzyMatchFileName('test_file.txt', 'test_file_v2.txt')).toBe(true)
  })

  it('should handle empty filenames', () => {
    expect(fuzzyMatchFileName('', '')).toBe(true)
    expect(fuzzyMatchFileName('.txt', '.txt')).toBe(true)
    expect(fuzzyMatchFileName('', 'test.txt')).toBe(false)
  })

  it('should handle filenames with path separators', () => {
    expect(fuzzyMatchFileName('path/to/test.txt', 'test.txt')).toBe(true)
    expect(fuzzyMatchFileName('test.txt', 'path/to/test.txt')).toBe(true)
  })

  it('should handle filenames with invalid characters', () => {
    expect(fuzzyMatchFileName('test?.txt', 'test.txt')).toBe(true)
    expect(fuzzyMatchFileName('test*.txt', 'test.txt')).toBe(true)
    expect(fuzzyMatchFileName('test<>.txt', 'test.txt')).toBe(true)
  })

  it('should handle CJK characters and special formatting', () => {
    const a1FileName = '21 Guns (feat. Rebecca Naomi Jones, Christina Sajous, Mary Faber, Stark Sands, John Gallagher Jr., Michael Esper, The American Idiot Broadway Company).json'
    const a2FileName = '21 Guns (feat. Rebecca Naomi Jones, Christina Sajous, Mary Faber, Stark Sands, John Gallagher Jr., Michael Esper, The American Idiot Broadway Company).json'

    const b1FileName = '美しきもの - (美丽之物).json'
    const b2FileName = '美しきもの(美丽之物).json'

    expect(fuzzyMatchFileName(a1FileName, a2FileName)).toBeTruthy()
    expect(fuzzyMatchFileName(b1FileName, b2FileName)).toBeTruthy()
  })
})
