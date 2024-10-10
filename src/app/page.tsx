import { Layout } from '@/components/Layout'
import { getKfcItems } from './lib/utils'
import { KfcItem } from '@/components/KfcItem'
import Random from '@/components/Random'

export default async function Page() {
  const kfcItems = await getKfcItems()
  const ids = kfcItems.map((item) => item.id)

  return (
    <Layout>
      {kfcItems.map((kfcItem) => (
        <KfcItem key={kfcItem.id} item={kfcItem}></KfcItem>
      ))}
      <Random ids={ids} />
    </Layout>
  )
}
