import { Layout } from '@/components/Layout'
import { getKfcItems } from './lib/utils'
import { KfcItem } from '@/components/KfcItem'

export default async function Page() {
  const kfcItems = await getKfcItems()

  return (
    <Layout>
      {kfcItems.map((kfcItem) => (
        <KfcItem key={kfcItem.id} item={kfcItem}></KfcItem>
      ))}
    </Layout>
  )
}
