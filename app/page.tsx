import MapPage from '@/components/MapPage'

export const metadata = { title: 'My Maps' }

export default function Page() {
  return <MapPage locale="en" mapKey="world" />
}
