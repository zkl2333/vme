import Link from 'next/link'

import { IconLink } from '@/components/IconLink'
import { Logo } from '@/components/Logo'

function GitHubIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor" {...props}>
      <path d="M8 .198a8 8 0 0 0-8 8 7.999 7.999 0 0 0 5.47 7.59c.4.076.547-.172.547-.384 0-.19-.007-.694-.01-1.36-2.226.482-2.695-1.074-2.695-1.074-.364-.923-.89-1.17-.89-1.17-.725-.496.056-.486.056-.486.803.056 1.225.824 1.225.824.714 1.224 1.873.87 2.33.666.072-.518.278-.87.507-1.07-1.777-.2-3.644-.888-3.644-3.954 0-.873.31-1.586.823-2.146-.09-.202-.36-1.016.07-2.118 0 0 .67-.214 2.2.82a7.67 7.67 0 0 1 2-.27 7.67 7.67 0 0 1 2 .27c1.52-1.034 2.19-.82 2.19-.82.43 1.102.16 1.916.08 2.118.51.56.82 1.273.82 2.146 0 3.074-1.87 3.75-3.65 3.947.28.24.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.14.46.55.38A7.972 7.972 0 0 0 16 8.199a8 8 0 0 0-8-8Z" />
    </svg>
  )
}

export function Intro() {
  return (
    <>
      <div>
        <Link href="/">
          <Logo />
        </Link>
      </div>
      <h1 className="mt-14 font-display text-4xl/tight font-light text-white">
        介绍
      </h1>
      <p className="mt-4 text-sm/6 text-gray-300">
        这是一个肯德基疯狂星期四文案库，用于收集、展示、分享各种疯狂星期四文案。
        创建的原因之一是朋友给了我一个{' '}
        <a href="https://vme.im" className="text-sky-300">
          vme.im
        </a>{' '}
        域名，我想用它整点儿有趣的东西。
      </p>

      <h2 className="mt-8 font-display text-2xl font-light text-white">致敬</h2>
      <p className="mt-4 text-sm/6 text-gray-300">
        项目创意来自{' '}
        <a
          href="https://github.com/whitescent/KFC-Crazy-Thursday"
          className="text-sky-300"
          target="_blank"
          rel="noopener noreferrer"
        >
          whitescent/KFC-Crazy-Thursday
        </a>
      </p>

      <h2 className="mt-8 font-display text-2xl font-light text-white">
        如何贡献文案？
      </h2>
      <p className="mt-4 text-sm/6 text-gray-300">
        新建一个新的{' '}
        <a
          href="https://github.com/zkl2333/vme/issues/new?labels=%E6%96%87%E6%A1%88"
          className="text-sky-300"
          target="_blank"
          rel="noopener noreferrer"
        >
          Issue
        </a>{' '}
        填写标题和文本即可。
      </p>
    </>
  )
}

export function IntroFooter() {
  return (
    <p className="flex items-baseline gap-x-2 text-[0.8125rem]/6 text-gray-500">
      提供方：{' '}
      <IconLink href="#" icon={GitHubIcon} compact>
        多吃点
      </IconLink>
    </p>
  )
}
