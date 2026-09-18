const COLUMNS = [
  ['state_code', 'State'],
  ['state_name', 'State name'],
  ['title', 'Title'],
  ['bill_number', 'Bill number'],
  ['policy_type', 'Type'],
  ['status', 'Status'],
  ['level', 'Level'],
  ['date_introduced', 'Introduced'],
  ['date_enacted', 'Enacted'],
  ['sponsor', 'Sponsor'],
  ['summary_text', 'Summary'],
  ['source_url', 'Source URL'],
]

/** RFC 4180: quote everything, double any embedded quotes. */
function cell(value) {
  if (value == null) return '""'
  return `"${String(value).replace(/"/g, '""')}"`
}

export function policiesToCSV(policies) {
  const header = COLUMNS.map(([, label]) => cell(label)).join(',')
  const rows = policies.map(p => COLUMNS.map(([key]) => cell(p[key])).join(','))
  return [header, ...rows].join('\r\n')
}

export function downloadCSV(policies, filename = 'statescope-policies.csv') {
  // The BOM keeps Excel from mangling non-ASCII in policy titles.
  const blob = new Blob(['﻿', policiesToCSV(policies)], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
