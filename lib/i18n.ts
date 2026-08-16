export type Locale = 'en' | 'zh'
export type MapKey = 'world' | 'china' | 'us'

export const MAP_KEYS: readonly MapKey[] = ['world', 'china', 'us']

export interface Strings {
  title: string
  tagline: string
  updated: string
  tabs: Record<MapKey, string>
  unit: Record<MapKey, string>
  visited: string
  notYet: string
  loading: string
  failed: string
  reset: string
}

export const I18N: Record<Locale, Strings> = {
  en: {
    title: 'My Maps',
    tagline: 'Places I have been',
    updated: 'Last updated August 2026',
    tabs: { world: 'World', china: 'China', us: 'United States' },
    unit: { world: 'countries', china: 'provinces', us: 'states' },
    visited: 'Visited',
    notYet: 'Not yet',
    loading: 'Drawing the map…',
    failed: 'Map data unavailable.',
    reset: 'Reset view'
  },
  zh: {
    title: '我的地图',
    tagline: '我去过的地方',
    updated: '更新于 2026 年 8 月',
    tabs: { world: '世界', china: '中国', us: '美国' },
    unit: { world: '个国家', china: '个省', us: '个州' },
    visited: '去过',
    notYet: '还没去',
    loading: '正在绘制地图…',
    failed: '地图数据加载失败。',
    reset: '重置视图'
  }
}

/* Page <title>: the map's own name, then the site's. Derived from the tab
   and title strings above so the two can never drift apart. */
export function titleFor(locale: Locale, map: MapKey): string {
  const t = I18N[locale]
  return `${t.tabs[map]} | ${t.title}`
}

/* Chinese renderings of the non-year sentinel values used in lib/data.ts. */
export const YEAR_ZH: Record<string, string> = {
  Childhood: '童年',
  Home: '故乡'
}
