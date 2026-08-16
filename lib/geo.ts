/* Vector map engine (d3-geo + TopoJSON), ported from the Claude Design
   prototype. Draws into a plain element; React stays outside. */
import { geoAlbersUsa, geoMercator, geoNaturalEarth1, geoPath, type GeoProjection } from 'd3-geo'
import { select } from 'd3-selection'
import { zoom, zoomIdentity, type D3ZoomEvent } from 'd3-zoom'
import 'd3-transition'
import { feature } from 'topojson-client'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import { DATA } from './data'
import { I18N, YEAR_ZH, type Locale, type MapKey } from './i18n'
import { NAMES } from './names'

type Region = Feature<Geometry, Record<string, unknown>>

/* All three committed atlases carry the region's name at properties.name.
   Everything downstream — DATA's keys, NAMES' keys, HIDE, the drill targets
   — is written to match that string exactly, so there is no normalisation
   step to disagree about. */
function featureName(props: Record<string, unknown>): string {
  return typeof props?.name === 'string' ? props.name : ''
}

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

/* Atlas features that exist in the data but should not be drawn. They are
   excluded before projection.fitSize(), so they also don't get a vote in
   how the map is framed — which is the point: Antarctica would squash every
   populated continent, and the 南海诸岛 inset would force China to zoom out. */
const HIDE: Record<MapKey, string[]> = {
  world: ['Antarctica'],
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

/* The tooltip is a body-level singleton, not a child of the map's element,
   so a caller unmounting/redrawing that element must hide it explicitly —
   mouseleave does not fire for a node removed/replaced while the pointer
   is over it. */
export function hideTooltip(): void {
  if (tip) tip.style.opacity = '0'
}

/* Which regions drill into another map. Drives both the click handler and
   the data-drill attribute the CSS uses for the pointer cursor, so the two
   can never disagree about what looks clickable. */
function drillTarget(key: MapKey, d: Region): 'china' | 'us' | null {
  if (key !== 'world') return null
  const n = featureName(d.properties)
  if (n === 'China') return 'china'
  if (n === 'United States of America') return 'us'
  return null
}

export async function drawMap(key: MapKey, el: HTMLElement, opts: DrawOptions): Promise<void> {
  const { locale, onDrill, isStale } = opts
  const features = await loadFeatures(key)
  if (isStale?.()) return

  const visited: Record<string, string> = DATA[key]
  /* Visit years, keyed by atlas name. The displayed name comes from NAMES,
     which covers every feature, so visited and unvisited regions read the
     same language. */
  const lookup = new Map<string, string>()
  for (const place of Object.keys(visited)) {
    const raw = visited[place]
    lookup.set(place, locale === 'zh' ? (YEAR_ZH[raw] ?? raw) : raw)
  }

  const labelFor = (atlasName: string) => NAMES[key][atlasName]?.[locale] ?? atlasName

  const w = el.clientWidth || 900
  const h = Math.round(w * ASPECT[key])

  el.innerHTML = ''
  const svg = select(el)
    .append('svg')
    .attr('viewBox', `0 0 ${w} ${h}`)
    .attr('width', '100%')
    .attr('height', h)
    .style('display', 'block')

  const shown = features.filter(f => !HIDE[key].includes(featureName(f.properties)))

  const projection = PROJ[key]()
  projection.fitSize([w, h], { type: 'FeatureCollection', features: shown })
  const path = geoPath(projection)

  const t = tooltip()
  const g = svg.append('g').attr('stroke-width', 0.6)

  g.selectAll<SVGPathElement, Region>('path')
    .data(shown)
    .join('path')
    .attr('d', d => path(d))
    .attr('class', 'region')
    .attr('data-visited', d => (lookup.has(featureName(d.properties)) ? 'yes' : 'no'))
    .attr('data-drill', d => (drillTarget(key, d) ? 'yes' : null))
    .on('mousemove', (ev: MouseEvent, d: Region) => {
      const name = featureName(d.properties)
      const label = labelFor(name)
      const year = lookup.get(name)
      /* Content comes from our own data files and atlas — no user input. */
      t.innerHTML = year
        ? `<span class="tip-name">${label}</span><span class="tip-year">${year}</span>`
        : `<span class="tip-name tip-dim">${label}</span>`
      t.style.opacity = '1'
      t.style.left = `${ev.clientX + 14}px`
      t.style.top = `${ev.clientY + 14}px`
    })
    .on('mouseleave', () => {
      t.style.opacity = '0'
    })
    .on('click', (_ev: MouseEvent, d: Region) => {
      const target = drillTarget(key, d)
      if (target && onDrill) onDrill(target)
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
