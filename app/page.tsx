import MapPage from '@/components/MapPage'
import { titleFor } from '@/lib/i18n'

export const metadata = { title: titleFor('en', 'world') }

export default function Page() {
  return <MapPage locale="en" mapKey="world" />
}
