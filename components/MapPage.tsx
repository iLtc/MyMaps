import Link from 'next/link'
import GeoMap from '@/components/GeoMap'
import { countFor } from '@/lib/data'
import { I18N, MAP_KEYS, type Locale, type MapKey } from '@/lib/i18n'
import { pathFor } from '@/lib/paths'

export default function MapPage({ locale, mapKey }: { locale: Locale; mapKey: MapKey }) {
  const t = I18N[locale]
  return (
    <div className="sheet">
      <header className="masthead">
        <h1>{t.title}</h1>
        <div className="dateline">
          <span>{t.tagline}</span>
          <span className="spacer" />
          <span>{t.updated}</span>
          <span className="lang">
            <Link href={pathFor('en', mapKey)} aria-current={locale === 'en' ? 'true' : undefined}>
              En
            </Link>
            <span className="sep">/</span>
            <Link href={pathFor('zh', mapKey)} aria-current={locale === 'zh' ? 'true' : undefined}>
              中
            </Link>
          </span>
        </div>
      </header>

      <nav className="tabs">
        {MAP_KEYS.map(k => (
          <Link
            key={k}
            className="tab"
            href={pathFor(locale, k)}
            aria-current={k === mapKey ? 'page' : undefined}
          >
            {t.tabs[k]}
          </Link>
        ))}
      </nav>

      <section>
        <div className="panel-head">
          <div>
            <div className="count">
              <span className="fig">{countFor(mapKey)}</span>
              <span className="unit">{t.unit[mapKey]}</span>
            </div>
          </div>
          <div className="legend">
            <span>
              <i className="sw-visited" /> {t.visited}
            </span>
            <span>
              <i className="sw-not" /> {t.notYet}
            </span>
          </div>
        </div>
        <GeoMap mapKey={mapKey} locale={locale} />
      </section>
    </div>
  )
}
