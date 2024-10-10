'use client'

import Image, { type ImageProps } from 'next/image'
import Link from 'next/link'

export const a = Link

type ImagePropsWithOptionalAlt = Omit<ImageProps, 'alt'> & { alt?: string }

export const img = function Img(props: ImagePropsWithOptionalAlt) {
  return (
    <div className="relative mt-8 overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-900 [&+*]:mt-8">
      <Image
        alt=""
        sizes="(min-width: 1280px) 36rem, (min-width: 1024px) 45vw, (min-width: 640px) 32rem, 95vw"
        {...props}
      />
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10 dark:ring-white/10" />
    </div>
  )
}

export const code = function Code({
  highlightedCode,
  ...props
}: React.ComponentPropsWithoutRef<'code'> & { highlightedCode?: string }) {
  if (highlightedCode) {
    return (
      <code {...props} dangerouslySetInnerHTML={{ __html: highlightedCode }} />
    )
  }

  return <code {...props} />
}
