import MapPage from '@/components/MapPage'
import { titleFor } from '@/lib/i18n'

export const metadata = { title: titleFor('zh', 'china') }

export default function Page() {
  return <MapPage locale="zh" mapKey="china" />
}
