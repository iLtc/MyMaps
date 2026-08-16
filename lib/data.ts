import type { MapKey } from './i18n'

/* Visit records — the only file to edit when adding a visit.

   Keys are the atlas's OWN name for the region, character for character, so
   matching is a plain object lookup with no normalisation in between. The
   world and us atlases name features in English; the china atlas names them
   in bare Chinese, so china's keys are Chinese (the English name is in the
   trailing comment, and in lib/names.ts).

   Values are a year ('2015') or a sentinel ('Childhood' | 'Home') that the
   UI translates. Counts derive from these objects — never hardcode them.

   Display names live in lib/names.ts, so a key never has to be pretty; it
   only has to match the atlas. scripts/check-data.mjs fails the build on
   any key that matches no feature. */
export const DATA = {
  world: {
    China: '1994',
    'United States of America': '2015',
    France: '2013',
    Italy: '2013',
    Switzerland: '2013',
    Canada: '2024'
  },
  china: {
    安徽: 'Home', // Anhui
    黑龙江: '2019', // Heilongjiang
    吉林: '2019', // Jilin
    浙江: '2015', // Zhejiang
    北京: '2015', // Beijing
    上海: '2015', // Shanghai
    广东: '2012', // Guangdong
    香港: '2012', // Hong Kong
    澳门: '2012', // Macau
    辽宁: '2012', // Liaoning
    四川: '2010', // Sichuan
    江苏: '2010', // Jiangsu
    山西: 'Childhood', // Shanxi (not 陕西 Shaanxi)
    云南: 'Childhood', // Yunnan
    江西: 'Childhood', // Jiangxi
    湖南: 'Childhood', // Hunan
    湖北: 'Childhood', // Hubei
    重庆: 'Childhood' // Chongqing
  },
  us: {
    Iowa: '2015',
    California: '2015',
    Illinois: '2016',
    Connecticut: '2017',
    Delaware: '2017',
    Massachusetts: '2017',
    'New Jersey': '2017',
    'New York': '2017',
    Pennsylvania: '2017',
    'Rhode Island': '2017',
    Nevada: '2017',
    Arizona: '2023',
    Oregon: '2023',
    Washington: '2023',
    Alaska: '2025',
    Hawaii: '2026',
    Utah: '2026',
    Montana: '2026',
    Wyoming: '2026'
  }
} as const satisfies Record<MapKey, Record<string, string>>

export function countFor(key: MapKey): number {
  return Object.keys(DATA[key]).length
}
