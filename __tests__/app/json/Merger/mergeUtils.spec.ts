import { deepMerge, mergeJSONObjects } from '@/app/json/Merger/mergeUtils'

describe('JSON Merge Utilities', () => {
  describe('deepMerge', () => {
    it('should merge two simple objects', () => {
      const target = { a: 1, b: 2 }
      const source = { c: 3, d: 4 }
      const result = deepMerge(target, source)
      expect(result).toEqual({ a: 1, b: 2, c: 3, d: 4 })
    })

    it('should merge nested objects', () => {
      const target = { a: { x: 1 }, b: { y: 2 } }
      const source = { a: { z: 3 }, b: { w: 4 } }
      const result = deepMerge(target, source)
      expect(result).toEqual({ a: { x: 1, z: 3 }, b: { y: 2, w: 4 } })
    })

    it('should override non-object values', () => {
      const target = { a: 1, b: { x: 1 } }
      const source = { a: 2, b: { y: 2 } }
      const result = deepMerge(target, source)
      expect(result).toEqual({ a: 2, b: { x: 1, y: 2 } })
    })

    it('should handle arrays by replacing them', () => {
      const target = { items: [1, 2, 3] }
      const source = { items: [4, 5] }
      const result = deepMerge(target, source)
      expect(result).toEqual({ items: [4, 5] })
    })

    it('should handle null values', () => {
      const target = { a: { x: 1 }, b: { y: 2 } }
      const source = { a: null, c: { z: 3 } }
      const result = deepMerge(target, source)
      expect(result).toEqual({ a: null, b: { y: 2 }, c: { z: 3 } })
    })
  })

  describe('mergeJSONObjects', () => {
    it('should merge multiple objects in order', () => {
      const objects = [
        { a: 1, b: { x: 1 } },
        { b: { y: 2 }, c: 3 },
        { a: 4, c: { z: 3 } },
      ]
      const result = mergeJSONObjects(objects)
      expect(result).toEqual({ a: 4, b: { x: 1, y: 2 }, c: { z: 3 } })
    })

    it('should handle empty array', () => {
      const objects: any[] = []
      const result = mergeJSONObjects(objects)
      expect(result).toEqual({})
    })

    it('should handle single object', () => {
      const objects = [{ a: 1, b: 2 }]
      const result = mergeJSONObjects(objects)
      expect(result).toEqual({ a: 1, b: 2 })
    })
  })
})
