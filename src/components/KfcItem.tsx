'use client'
import { useRef, useState, useEffect } from 'react'
import clsx from 'clsx'
import Link from 'next/link'
import { FormattedDate } from './FormattedDate'
import { IKfcItem } from '@/app/lib/utils'

export function ContentWrapper({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div className="mx-auto max-w-7xl px-6 lg:flex lg:px-8">
      <div className="lg:ml-96 lg:flex lg:w-full lg:justify-end lg:pl-32">
        <div
          className={clsx(
            'mx-auto max-w-lg lg:mx-0 lg:w-0 lg:max-w-xl lg:flex-auto',
            className,
          )}
          {...props}
        />
      </div>
    </div>
  )
}

export function ArticleHeader({
  id,
  date,
}: {
  id: string
  date: string | Date
}) {
  return (
    <header className="relative mb-10 xl:mb-0">
      <div className="pointer-events-none absolute left-[max(-0.5rem,calc(50%-18.625rem))] top-0 z-50 flex h-4 items-center justify-end gap-x-2 lg:left-0 lg:right-[calc(max(2rem,50%-38rem)+40rem)] lg:min-w-[32rem] xl:h-8">
        <Link href={`#${id}`} className="inline-flex">
          <FormattedDate
            date={date}
            className="hidden xl:pointer-events-auto xl:block xl:text-2xs/4 xl:font-medium xl:text-white/50"
          />
        </Link>
        <div className="h-[0.0625rem] w-3.5 bg-gray-400 lg:-mr-3.5 xl:mr-0 xl:bg-gray-300" />
      </div>
      <ContentWrapper>
        <div className="flex">
          <Link href={`#${id}`} className="inline-flex">
            <FormattedDate
              date={date}
              className="text-2xs/4 font-medium text-gray-500 xl:hidden dark:text-white/50"
            />
          </Link>
        </div>
      </ContentWrapper>
    </header>
  )
}

export const KfcItem = function ({ item }: { item: IKfcItem }) {
  let heightRef = useRef<React.ElementRef<'div'>>(null)
  let [heightAdjustment, setHeightAdjustment] = useState(0)

  useEffect(() => {
    if (!heightRef.current) {
      return
    }

    let observer = new window.ResizeObserver(() => {
      if (!heightRef.current) {
        return
      }
      let { height } = heightRef.current.getBoundingClientRect()
      let nextMultipleOf8 = 8 * Math.ceil(height / 8)
      setHeightAdjustment(nextMultipleOf8 - height)
    })

    observer.observe(heightRef.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <article
      id={item.id}
      className="scroll-mt-16"
      style={{ paddingBottom: `${heightAdjustment}px` }}
    >
      <div ref={heightRef}>
        <ArticleHeader id={item.id} date={item.createdAt} />
        <ContentWrapper className="typography">
          <h3 className="truncate text-3xl font-bold">{item.title}</h3>
          <p className="overflow-auto whitespace-pre-wrap leading-5">{item.body}</p>
          <div className="flex items-center space-x-2">
            <a
              href={item.author.url}
              className="flex items-center space-x-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.author.avatarUrl}
                alt=""
                className="h-4 w-4 rounded-full"
              />
              <span>{item.author.username}</span>
            </a>
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              查看原文
            </a>
            <a
              className="cursor-pointer"
              onClick={() => {
                navigator.clipboard.writeText(item.body)
                alert('已复制文案')
              }}
            >
              复制文案
            </a>
          </div>
        </ContentWrapper>
      </div>
    </article>
  )
}
