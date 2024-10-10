import { Layout } from '@/components/Layout'
import { getKfcItems } from './lib/utils'
import { Article } from '@/components/Article'

export default async function Page() {
  const kfcItems = await getKfcItems()

  return (
    <Layout>
      {kfcItems.map((kfcItem) => (
        <Article key={kfcItem.id} id={kfcItem.id} date={kfcItem.createdAt}>
          <h3 className="truncate text-3xl font-bold">{kfcItem.title}</h3>
          <p className="overflow-auto whitespace-pre-wrap">{kfcItem.body}</p>
          <div className="flex items-center space-x-2">
            <a
              href={kfcItem.author.url}
              className="flex items-center space-x-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={kfcItem.author.avatarUrl}
                alt=""
                className="h-4 w-4 rounded-full"
              />
              <span>{kfcItem.author.username}</span>
            </a>
            <a href={kfcItem.url} target="_blank" rel="noopener noreferrer">
              查看原文
            </a>
          </div>
        </Article>
      ))}
    </Layout>
  )
}
