import type { Locale, MapKey } from './i18n'

const MAP_SLUG: Record<MapKey, string> = {
  world: '',
  china: 'china',
  us: 'united-states'
}

/* World lives at the locale root; trailing slashes match trailingSlash: true
   so links never bounce through a redirect. */
export function pathFor(locale: Locale, map: MapKey): string {
  const segs: string[] = []
  if (locale === 'zh') segs.push('zh')
  if (MAP_SLUG[map]) segs.push(MAP_SLUG[map])
  return segs.length ? `/${segs.join('/')}/` : '/'
}
