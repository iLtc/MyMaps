'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { drawMap, hideTooltip } from '@/lib/geo'
import { I18N, type Locale, type MapKey } from '@/lib/i18n'
import { pathFor } from '@/lib/paths'

export default function GeoMap({ mapKey, locale }: { mapKey: MapKey; locale: Locale }) {
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const t = I18N[locale]
    let epoch = 0

    const draw = () => {
      const mine = ++epoch
      const isStale = () => mine !== epoch
      hideTooltip()
      el.innerHTML = `<div class="map-loading">${t.loading}</div>`
      drawMap(mapKey, el, {
        locale,
        isStale,
        onDrill: target => router.push(pathFor(locale, target))
      }).catch(err => {
        if (!isStale()) {
          el.innerHTML = `<div class="map-loading">${t.failed}</div>`
          console.error(err)
        }
      })
    }

    draw()

    /* GeoChart-era lesson kept from the old site: only redraw on real width
       changes (24px threshold), or resize events cause redraw storms. */
    let lastWidth = el.clientWidth
    const ro = new ResizeObserver(() => {
      if (Math.abs(el.clientWidth - lastWidth) < 24) return
      lastWidth = el.clientWidth
      draw()
    })
    ro.observe(el)

    return () => {
      epoch = Number.MAX_SAFE_INTEGER // stale-out any in-flight draw
      ro.disconnect()
      el.innerHTML = ''
      hideTooltip()
    }
  }, [mapKey, locale, router])

  return <div ref={ref} className="map" />
}
