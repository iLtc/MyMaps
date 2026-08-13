/* Vector map engine (d3-geo + TopoJSON), ported from the Claude Design
   prototype. Draws into a plain element; React stays outside. */
import { geoAlbersUsa, geoMercator, geoNaturalEarth1, geoPath, type GeoProjection } from 'd3-geo'
import { select } from 'd3-selection'
import { zoom, zoomIdentity, type D3ZoomEvent } from 'd3-zoom'
import 'd3-transition'
import { feature } from 'topojson-client'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import { DATA, ZH_LABELS } from './data'
import { I18N, YEAR_ZH, type Locale, type MapKey } from './i18n'
import { featureName, norm } from './normalize'

type Region = Feature<Geometry, Record<string, unknown>>
type Entry = { label: string; year: string }

export interface DrawOptions {
  locale: Locale
  /* World-map clicks on China / the US drill into that map's route. */
  onDrill?: (target: 'china' | 'us') => void
  /* Lets the caller abandon a draw that lost a race (map switched mid-fetch). */
  isStale?: () => boolean
}

const ATLAS_PATH: Record<MapKey, string> = {
  world: '/atlas/world.json',
  china: '/atlas/china.json',
  us: '/atlas/us.json'
}

const HIDE: Record<MapKey, string[]> = {
  world: ['antarctica'],
  china: ['南海诸岛'],
  us: []
}

const ASPECT: Record<MapKey, number> = { world: 0.52, china: 0.72, us: 0.58 }

const PROJ: Record<MapKey, () => GeoProjection> = {
  world: geoNaturalEarth1,
  china: geoMercator,
  us: geoAlbersUsa
}

const cache: Partial<Record<MapKey, Region[]>> = {}

async function loadFeatures(key: MapKey): Promise<Region[]> {
  const hit = cache[key]
  if (hit) return hit
  const res = await fetch(ATLAS_PATH[key])
  if (!res.ok) throw new Error(`atlas ${key}: HTTP ${res.status}`)
  const raw = await res.json()
  const fc = (
    raw.type === 'Topology'
      ? feature(raw, raw.objects[Object.keys(raw.objects)[0]])
      : raw
  ) as FeatureCollection<Geometry, Record<string, unknown>>
  cache[key] = fc.features
  return fc.features
}

let tip: HTMLDivElement | null = null
function tooltip(): HTMLDivElement {
  if (!tip) {
    tip = document.createElement('div')
    tip.className = 'tip'
    document.body.appendChild(tip)
  }
  return tip
}

export async function drawMap(key: MapKey, el: HTMLElement, opts: DrawOptions): Promise<void> {
  const { locale, onDrill, isStale } = opts
  const features = await loadFeatures(key)
  if (isStale?.()) return

  const visited: Record<string, string> = DATA[key]
  const zhLabels: Record<string, string> = ZH_LABELS[key]
  const lookup = new Map<string, Entry>()
  for (const place of Object.keys(visited)) {
    const raw = visited[place]
    const entry: Entry = {
      label: locale === 'zh' ? (zhLabels[place] ?? place) : place,
      year: locale === 'zh' ? (YEAR_ZH[raw] ?? raw) : raw
    }
    lookup.set(norm(place), entry)
    /* The china atlas names features in Chinese — index by label too. */
    if (key === 'china') lookup.set(zhLabels[place], entry)
  }

  const w = el.clientWidth || 900
  const h = Math.round(w * ASPECT[key])

  el.innerHTML = ''
  const svg = select(el)
    .append('svg')
    .attr('viewBox', `0 0 ${w} ${h}`)
    .attr('width', '100%')
    .attr('height', h)
    .style('display', 'block')

  const shown = features.filter(f => {
    const n = featureName(f.properties)
    return !HIDE[key].includes(n) && !HIDE[key].includes(norm(n))
  })

  const projection = PROJ[key]()
  projection.fitSize([w, h], { type: 'FeatureCollection', features: shown })
  const path = geoPath(projection)

  const t = tooltip()
  const g = svg.append('g')

  g.selectAll<SVGPathElement, Region>('path')
    .data(shown)
    .join('path')
    .attr('d', d => path(d))
    .attr('class', 'region')
    .attr('data-visited', d => {
      const nm = featureName(d.properties)
      return lookup.has(nm) || lookup.has(norm(nm)) ? 'yes' : 'no'
    })
    .on('mousemove', (ev: MouseEvent, d: Region) => {
      const name = featureName(d.properties)
      const hit = lookup.get(name) ?? lookup.get(norm(name))
      /* Content comes from our own data files and atlas — no user input. */
      t.innerHTML = hit
        ? `<span class="tip-name">${hit.label}</span><span class="tip-year">${hit.year}</span>`
        : `<span class="tip-name tip-dim">${name}</span>`
      t.style.opacity = '1'
      t.style.left = `${ev.clientX + 14}px`
      t.style.top = `${ev.clientY + 14}px`
    })
    .on('mouseleave', () => {
      t.style.opacity = '0'
    })
    .on('click', (_ev: MouseEvent, d: Region) => {
      if (key !== 'world' || !onDrill) return
      const n = norm(featureName(d.properties))
      if (n === 'china') onDrill('china')
      else if (n === 'united states') onDrill('us')
    })

  const reset = document.createElement('button')
  reset.type = 'button'
  reset.className = 'map-reset'
  reset.textContent = I18N[locale].reset
  reset.hidden = true
  el.appendChild(reset)

  const zoomBehavior = zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 12])
    .translateExtent([[0, 0], [w, h]])
    .extent([[0, 0], [w, h]])
    .on('zoom', (ev: D3ZoomEvent<SVGSVGElement, unknown>) => {
      g.attr('transform', ev.transform.toString())
      g.attr('stroke-width', 0.6 / ev.transform.k)
      reset.hidden = ev.transform.k === 1 && ev.transform.x === 0 && ev.transform.y === 0
      if (ev.sourceEvent) t.style.opacity = '0'
    })

  svg.call(zoomBehavior).on('dblclick.zoom', null)
  reset.addEventListener('click', () => {
    svg.transition().duration(400).call(zoomBehavior.transform, zoomIdentity)
  })
}
