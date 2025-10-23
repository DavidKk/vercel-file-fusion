import { mergeJSONObjects } from '@/app/json/Merger/mergeUtils'

describe('JSON Merge Functionality', () => {
  it('should merge JSON files correctly - basic case', () => {
    const objects = [
      { a: 1, b: 2 },
      { c: 3, d: 4 },
    ]
    const result = mergeJSONObjects(objects)
    expect(result).toEqual({ a: 1, b: 2, c: 3, d: 4 })
  })

  it('should handle edge case: a has b does not', () => {
    const objects = [
      { a: { x: 1 }, b: { y: 2 } },
      { a: { z: 3 } }, // b is missing
    ]
    const result = mergeJSONObjects(objects)
    expect(result).toEqual({ a: { x: 1, z: 3 }, b: { y: 2 } })
  })

  it('should handle edge case: a has b has', () => {
    const objects = [
      { a: { x: 1 }, b: { y: 2 } },
      { a: { z: 3 }, b: { w: 4 } },
    ]
    const result = mergeJSONObjects(objects)
    expect(result).toEqual({ a: { x: 1, z: 3 }, b: { y: 2, w: 4 } })
  })

  it('should handle multiple files with overlapping keys', () => {
    const objects = [
      { a: 1, b: { x: 1 } },
      { b: { y: 2 }, c: 3 },
      { a: 4, c: { z: 3 } },
    ]
    const result = mergeJSONObjects(objects)
    expect(result).toEqual({ a: 4, b: { x: 1, y: 2 }, c: { z: 3 } })
  })

  it('should preserve array values correctly', () => {
    const objects = [{ items: [1, 2, 3] }, { items: [4, 5] }]
    const result = mergeJSONObjects(objects)
    expect(result).toEqual({ items: [4, 5] })
  })

  it('should handle deeply nested objects', () => {
    const objects = [{ a: { b: { c: 1, d: 2 } } }, { a: { b: { e: 3 }, f: 4 } }]
    const result = mergeJSONObjects(objects)
    expect(result).toEqual({ a: { b: { c: 1, d: 2, e: 3 }, f: 4 } })
  })
})
