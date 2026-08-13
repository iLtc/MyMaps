import MapPage from '@/components/MapPage'

export const metadata = { title: '我的地图' }

export default function Page() {
  return <MapPage locale="zh" mapKey="world" />
}
