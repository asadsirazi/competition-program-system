import { pdf } from '@react-pdf/renderer'
import React from 'react'
import { registerFonts } from './fontRegistration.js'
import { DetailedPdf } from './templates/DetailedPdf.jsx'
import { SummaryPdf } from './templates/SummaryPdf.jsx'
import { MarksheetPdf } from './templates/MarksheetPdf.jsx'

const downloadPdfBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const downloadDetailedPdf = async (props, filename) => {
  registerFonts()
  const doc = <DetailedPdf {...props} />
  const asPdf = pdf([])
  asPdf.updateContainer(doc)
  const blob = await asPdf.toBlob()
  downloadPdfBlob(blob, filename)
}

export const downloadSummaryPdf = async (props, filename) => {
  registerFonts()
  const doc = <SummaryPdf {...props} />
  const asPdf = pdf([])
  asPdf.updateContainer(doc)
  const blob = await asPdf.toBlob()
  downloadPdfBlob(blob, filename)
}

export const downloadMarksheetPdf = async (props, filename) => {
  registerFonts()
  const doc = <MarksheetPdf {...props} />
  const asPdf = pdf([])
  asPdf.updateContainer(doc)
  const blob = await asPdf.toBlob()
  downloadPdfBlob(blob, filename)
}
