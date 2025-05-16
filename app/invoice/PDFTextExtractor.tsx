'use client'

import { useRequest } from 'ahooks'
import { useState, useEffect, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import Decimal from 'decimal.js'
import { openDirectoryPicker } from '@/services/file/common'
import Alert, { type AlertImperativeHandler } from '@/components/Alert'
import ResourcePicker, { useResourcePicker } from '@/components/ResourcePicker'
import PageLoading from '@/components/PageLoading'
import { extractInvoice } from './extractInvoice'
import { InvoiceItem, type InvoiceItemColor } from './InvoiceItem'
import type { Invoice as PureInvoice } from './type'

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.mjs`
}

export interface Invoice extends PureInvoice {
  file: string
  loading?: boolean
}

export default function PDFTextExtractor() {
  const [ready, setReady] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [targetAmountValue, setTargetAmountValue] = useState<string>()
  const [isExtracting, setIsExtracting] = useState(false)
  const [isExtracted, setIsExtracted] = useState(false)
  const workspaceContext = useResourcePicker({ fileTypes: ['pdf'], only: 'file' })
  const alertRef = useRef<AlertImperativeHandler>(null)
  const { selectedHandle: workspaceHandle, selected: isWorkspaceSelected, selectableItems: availableItems, selects: selectedFiles } = workspaceContext
  const targetAmount = parseFloat(targetAmountValue || '0')

  useEffect(() => {
    setReady(true)
  }, [])

  const extractTextFromPDF = async (file: FileSystemFileHandle) => {
    try {
      const fileData = await file.getFile()
      const arrayBuffer = await fileData.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

      let textContent = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const text = await page.getTextContent()
        textContent += text.items
          .map((item) => ('str' in item ? item.str : ''))
          .filter(Boolean)
          .join(' ')
      }

      return textContent
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to extract text from PDF: ${file.name}`, error)
      return null
    }
  }

  const handleExtractText = async () => {
    setIsExtracting(true)

    for await (const fileEntry of availableItems) {
      if (fileEntry.kind !== 'file') {
        continue
      }

      const file = fileEntry.name
      if (invoices.some((invoice) => invoice.file === file)) {
        continue
      }

      if (!selectedFiles.has(file)) {
        continue
      }

      setInvoices((prevInvoices) => [...prevInvoices, { file, loading: true }])

      const text = await extractTextFromPDF(fileEntry.handle)
      if (text) {
        const invoice = extractInvoice(text)
        setInvoices((prevInvoices) => prevInvoices.map((inv) => (inv.file === file ? { ...invoice, file, loading: false } : inv)))
      } else {
        setInvoices((prevInvoices) => prevInvoices.filter((inv) => inv.file !== file))
      }
    }

    setIsExtracted(true)
    setIsExtracting(false)
  }

  const findClosestInvoices = (invoices: Invoice[], target: number) => {
    const validInvoices = invoices.filter(({ amount }) => amount)
    const validSum = validInvoices.reduce((sum, invoice) => sum + (invoice.amount ?? 0), 0)
    if (validSum < target) {
      return { closestInvoices: validInvoices, closestSum: validSum }
    }

    const sortedInvoices = validInvoices.sort((a, b) => (a.amount ?? 0) - (b.amount ?? 0))

    let closestSum = 0
    let closestInvoices: Invoice[] = []

    const findCombination = (index: number, currentSum: number, currentInvoices: Invoice[]) => {
      if (currentSum >= target) {
        if (closestSum === 0 || currentSum < closestSum) {
          closestSum = currentSum
          closestInvoices = [...currentInvoices]
        }

        return
      }

      for (let i = index; i < sortedInvoices.length; i++) {
        const result = new Decimal(currentSum).plus(sortedInvoices[i].amount ?? 0).toNumber()
        findCombination(i + 1, result, [...currentInvoices, sortedInvoices[i]])
      }
    }

    findCombination(0, 0, [])

    return { closestInvoices, closestSum }
  }

  const { closestInvoices: usedInvoices, closestSum } = findClosestInvoices(invoices, targetAmount ?? 0)
  const unusedInvoices = invoices.filter((invoice) => !usedInvoices.includes(invoice) || invoice.amount === null || invoice.amount === 0)

  const { run: handleMoveFiles } = useRequest(
    async () => {
      const targetDirectory = await openDirectoryPicker()
      for (const invoice of usedInvoices) {
        const fileEntry = availableItems.find((item) => item.name === invoice.file)
        if (!(fileEntry && fileEntry.kind === 'file')) {
          continue
        }

        try {
          const file = await fileEntry.handle.getFile()
          const newFileHandle = await targetDirectory.getFileHandle(file.name, { create: true })
          const writable = await newFileHandle.createWritable()
          await writable.write(file)
          await writable.close()
          await workspaceHandle?.removeEntry(file.name)
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`Failed to move file ${invoice.file}`, error)
          alertRef.current?.show(`Failed to move file ${invoice.file}`, { type: 'error' })
        }
      }
    },
    {
      manual: true,
      onSuccess: () => {
        handleReset()
        alertRef.current?.show('Files moved successfully', { type: 'success' })
      },
      onError: (error) => {
        alertRef.current?.show(`Failed to move files: ${error.message}`, { type: 'error' })
      },
    }
  )

  const handleReset = () => {
    setInvoices([])
    setTargetAmountValue(undefined)
    setIsExtracted(false)
    setIsExtracting(false)
  }

  if (!ready) {
    return <PageLoading />
  }

  const renderInvoice = (invoices: Invoice[], color: InvoiceItemColor = 'normal') => {
    return invoices.map((invoice, index) => {
      const { amount, loading } = invoice
      return <InvoiceItem {...invoice} color={!amount && !loading ? 'error' : color} key={index} />
    })
  }

  return (
    <div className="w-full flex flex-col gap-2">
      {!isExtracted && !isExtracting ? (
        <>
          <ResourcePicker {...workspaceContext} disabled={isExtracting} />

          {isWorkspaceSelected && (
            <button onClick={handleExtractText} className="w-full bg-indigo-600 text-white p-2 rounded disabled:opacity-50" disabled={selectedFiles.size === 0 || isExtracting}>
              Parse Invoice Information
            </button>
          )}
        </>
      ) : (
        <>
          <input
            type="number"
            placeholder="Enter target amount"
            className="w-full p-2 border rounded"
            value={targetAmountValue || ''}
            onChange={(event) => setTargetAmountValue(event.target.value)}
            disabled={isExtracting}
          />

          <div className="w-full flex flex-col gap-2">
            {usedInvoices.length ? (
              <>
                <div className="w-full flex flex-col gap-2 pb-1 max-h-[40vh] overflow-y-auto">{renderInvoice(usedInvoices, 'selected')}</div>

                <div className="flex items-center justify-between px-2">
                  <span>
                    Sum: <b>￥{closestSum}</b>
                  </span>
                  {closestSum < (targetAmount ?? 0) && (
                    <span>
                      Missing: <b className="text-red-400">￥{(targetAmount ?? 0) - closestSum}</b>
                    </span>
                  )}
                </div>

                <button disabled={isExtracting} onClick={handleMoveFiles} className="w-full bg-green-500 text-white p-2 rounded disabled:opacity-50">
                  Move Above PDFs
                </button>

                <Alert ref={alertRef} />
              </>
            ) : null}

            {!unusedInvoices.length ? null : <div className="w-full flex flex-col gap-2 pb-1 max-h-[40vh] overflow-y-auto">{renderInvoice(unusedInvoices)}</div>}
          </div>

          <button disabled={isExtracting} onClick={handleReset} className="w-full bg-red-500 text-white p-2 rounded disabled:opacity-50">
            Reset
          </button>
        </>
      )}
    </div>
  )
}
