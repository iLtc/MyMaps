/* Region-name matching, ported from the design prototype. Both the map
   engine and scripts/check-data.mjs use exactly this logic, so what the
   build gate verifies is what the browser draws. */

const ALIAS: Record<string, string> = {
  'united states of america': 'united states',
  usa: 'united states',
  hongkong: 'hong kong',
  xianggang: 'hong kong',
  macao: 'macau',
  aomen: 'macau',
  'nei mongol': 'inner mongolia',
  'xinjiang uygur': 'xinjiang',
  'ningxia hui': 'ningxia',
  'guangxi zhuang': 'guangxi',
  xizang: 'tibet'
}

const STRIP =
  /\b(sheng|shi|province|municipality|zizhiqu|autonomous region|special administrative region|sar|zhuang|hui|uygur|uyghur)\b/g

export function norm(s: unknown): string {
  if (!s) return ''
  const v = String(s)
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(STRIP, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return ALIAS[v] ?? v
}

export function featureName(props: Record<string, unknown> | null | undefined): string {
  if (!props) return ''
  for (const k of ['name', 'NAME_1', 'NAME', 'name_1', 'NAME_ENG', 'admin', 'full_name', 'state']) {
    const v = props[k]
    if (typeof v === 'string' && v) return v
  }
  return ''
}
