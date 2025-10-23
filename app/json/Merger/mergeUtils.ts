/**
 * Deep merge multiple JSON objects
 * Later objects override earlier ones when keys conflict
 * For nested objects, properties are merged recursively
 * @param target - The target object to merge into
 * @param source - The source object to merge from
 * @returns Merged object
 */
export function deepMerge(target: any, source: any): any {
  const result = { ...target }

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof result[key] === 'object' &&
        result[key] !== null &&
        !Array.isArray(result[key])
      ) {
        // If both values are objects, merge them recursively
        result[key] = deepMerge(result[key], source[key])
      } else {
        // Otherwise, override with the source value
        result[key] = source[key]
      }
    }
  }

  return result
}

/**
 * Merge multiple JSON objects in order
 * Objects are merged in the order they appear in the array
 * Later objects override properties of earlier ones
 * @param objects - Array of objects to merge
 * @returns Merged object
 */
export function mergeJSONObjects(objects: any[]): any {
  let merged = {}
  for (const obj of objects) {
    merged = deepMerge(merged, obj)
  }
  return merged
}
