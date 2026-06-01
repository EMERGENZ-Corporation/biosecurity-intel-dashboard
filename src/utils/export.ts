// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
/**
 * Lightweight CSV/JSON download helpers used by list pages.
 *
 * Triggers a browser download by creating a Blob, generating an object URL,
 * and synthesizing a hidden anchor click. Works for arbitrary serializable
 * data. No external dependency.
 */

export function downloadJson(filename: string, data: unknown): void {
  const json = JSON.stringify(data, null, 2)
  downloadBlob(filename, new Blob([json], { type: 'application/json' }))
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (rows.length === 0) {
    downloadBlob(filename, new Blob([''], { type: 'text/csv' }))
    return
  }
  // Collect a stable column set as the union of all row keys (preserving
  // first-seen order)
  const cols: string[] = []
  const seen = new Set<string>()
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key)
        cols.push(key)
      }
    }
  }
  const csv = [
    cols.join(','),
    ...rows.map((row) => cols.map((c) => csvCell(row[c])).join(',')),
  ].join('\n')
  downloadBlob(filename, new Blob([csv], { type: 'text/csv' }))
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  let s: string
  if (typeof value === 'object') s = JSON.stringify(value)
  else s = String(value)
  // Escape quotes by doubling; wrap in quotes if the cell contains comma,
  // newline, or quote
  if (/[",\n]/.test(s)) {
    s = '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

function downloadBlob(filename: string, blob: Blob): void {
  if (typeof window === 'undefined') return
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 100)
}
