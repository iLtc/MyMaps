import MapPage from '@/components/MapPage'
import { titleFor } from '@/lib/i18n'

export const metadata = { title: titleFor('en', 'china') }

export default function Page() {
  return <MapPage locale="en" mapKey="china" />
}
