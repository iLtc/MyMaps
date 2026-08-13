import MapPage from '@/components/MapPage'

export const metadata = { title: 'United States — My Maps' }

export default function Page() {
  return <MapPage locale="en" mapKey="us" />
}
