import type { Invoice } from './type'

export function extractInvoice(text: string): Invoice {
  const noRegex = /[\u53d1][\u7968][\u53f7][\u7801][：:](?:\s+)(\d+)(?:\s+?)/
  const codeMath = text.match(noRegex)
  const code = codeMath ? codeMath[1] : undefined

  const dateRegex = /(\d+?)[\u5e74](\d+?)[\u2f49\u6708](\d+?)[\u2f47\u65e5]/
  const dateMatch = text.match(dateRegex)
  const date = dateMatch ? dateMatch[0] : undefined

  const amountRegex = /[\uff08](?:\s*?)[\u5c0f](?:\s*?)[\u5199](?:\s*?)[\uff09](?:\s*?)¥([\d\.]+?)(?:\s+?)/
  const amountMatch = text.match(amountRegex)
  const amountStr = amountMatch ? amountMatch[1] : undefined
  const amount = amountStr ? parseFloat(amountStr) : undefined

  return { code, date, amount }
}
