import MapPage from '@/components/MapPage'

export const metadata = { title: '中国 — 我的地图' }

export default function Page() {
  return <MapPage locale="zh" mapKey="china" />
}
