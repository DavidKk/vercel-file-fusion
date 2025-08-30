import { Converter } from 'opencc-js'

type LanguageValue = 'zh-Hant' | 'zh-Hans'

// Create converter instances
const simplifiedToTraditional = Converter({ from: 'cn', to: 'tw' })
const traditionalToSimplified = Converter({ from: 'tw', to: 'cn' })

/** Convert Chinese text between simplified and traditional */
export function convertChinese(text: string, fromLang: LanguageValue, toLang: LanguageValue): string {
  if (!text || fromLang === toLang) return text

  try {
    if (fromLang === 'zh-Hans' && toLang === 'zh-Hant') {
      // Simplified to Traditional
      return simplifiedToTraditional(text)
    } else if (fromLang === 'zh-Hant' && toLang === 'zh-Hans') {
      // Traditional to Simplified
      return traditionalToSimplified(text)
    }
    return text
  } catch (error) {
    return text
  }
}

/** Synchronous Chinese text conversion for UI components */
export function convertChineseSync(text: string, fromLang: LanguageValue, toLang: LanguageValue): string {
  return convertChinese(text, fromLang, toLang)
}

/** Convert traditional Chinese to simplified Chinese (legacy API) */
export function convertTraditionalToSimplified(text: string): string {
  return convertChineseSync(text, 'zh-Hant', 'zh-Hans')
}

/** Convert simplified Chinese to traditional Chinese */
export function convertSimplifiedToTraditional(text: string): string {
  return convertChineseSync(text, 'zh-Hans', 'zh-Hant')
}

/** Check if text contains traditional Chinese characters */
export function containsTraditional(text: string): boolean {
  if (!text) return false

  try {
    // If converted text differs from original, it contains traditional characters
    const simplified = traditionalToSimplified(text)
    return simplified !== text
  } catch {
    return false
  }
}

/** Check if text contains simplified Chinese characters */
export function containsSimplified(text: string): boolean {
  if (!text) return false

  try {
    // If converted text differs from original, it contains simplified characters
    const traditional = simplifiedToTraditional(text)
    return traditional !== text
  } catch {
    return false
  }
}

/** Auto-detect Chinese text type (deprecated, kept for backward compatibility) */
export function detectChineseType(text: string): LanguageValue | null {
  if (!text) return null

  const hasTraditional = containsTraditional(text)
  const hasSimplified = containsSimplified(text)

  if (hasTraditional && !hasSimplified) {
    return 'zh-Hant'
  } else if (hasSimplified && !hasTraditional) {
    return 'zh-Hans'
  }

  return null
}
