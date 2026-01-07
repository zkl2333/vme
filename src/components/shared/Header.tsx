'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LoginButton from '@/components/shared/LoginButton'

interface HeaderProps {
  contributorsCount: number
}

export default function Header({ contributorsCount }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const navLinks = [
    { label: '文案仓库', href: '/jokes' },
    { label: '英雄榜', href: '/leaderboard' },
    { label: '我要投稿', href: '/submit' },
    { label: '系统状态', href: '/status' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b-4 border-black bg-kfc-red text-white shadow-neo-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-2 md:py-3">
          {/* 左侧：Logo / 标题 */}
          <div className="flex items-center gap-3">
            {/* 移动端汉堡菜单按钮 */}
            <button
              type="button"
              className="flex h-10 w-10 flex-col items-center justify-center gap-1 border-2 border-black bg-white shadow-neo-sm transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none lg:hidden"
              onClick={toggleMobileMenu}
              aria-label="切换菜单"
            >
              <span className={`h-1 w-6 bg-black transition-all ${isMobileMenuOpen ? 'translate-y-2 rotate-45' : ''}`}></span>
              <span className={`h-1 w-6 bg-black transition-all ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`h-1 w-6 bg-black transition-all ${isMobileMenuOpen ? '-translate-y-2 -rotate-45' : ''}`}></span>
            </button>

            {/* Logo */}
            <Link href="/" className="group flex items-center gap-2">
              <div className="border-2 border-black bg-white p-0.5 shadow-neo-sm transition-transform group-hover:-rotate-3">
                <Image
                  src="/images/logo.jpg"
                  alt="KFC"
                  width={44}
                  height={44}
                  className="h-9 w-9 object-cover lg:h-11 lg:w-11"
                />
              </div>
              <div className="hidden flex-col leading-none sm:flex">
                <h1 className="text-xl font-black italic tracking-tighter text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] lg:text-2xl">
                  疯狂星期四<span className="text-kfc-yellow">VME50</span>
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/90">
                  Crazy Thursday News Portal
                </p>
              </div>
            </Link>
          </div>

          {/* 桌面端导航 */}
          <nav className="hidden items-center gap-3 lg:flex">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href))
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`border-2 border-black px-4 py-1.5 text-sm font-black transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${
                    isActive
                      ? 'bg-kfc-yellow text-black shadow-neo-sm'
                      : 'bg-white text-black shadow-neo-sm hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* 右侧：登录按钮 */}
          <div className="flex items-center gap-3">
            <LoginButton />
          </div>
        </div>

        {/* 移动端导航菜单 */}
        <div
          className={`border-t-4 border-black bg-kfc-cream lg:hidden ${
            isMobileMenuOpen ? 'block' : 'hidden'
          }`}
          style={{
            animation: isMobileMenuOpen ? 'slideDown 0.3s ease-out' : 'none',
          }}
        >
          <nav className="flex flex-col gap-2 p-4">
            <Link
              href="/"
              onClick={closeMobileMenu}
              className={`block border-2 border-black px-4 py-3 text-sm font-black text-black shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                pathname === '/' ? 'bg-kfc-yellow' : 'bg-white'
              }`}
            >
              首页
            </Link>
            {navLinks.map((link) => {
               const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href))
               return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className={`block border-2 border-black px-4 py-3 text-sm font-black text-black shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                    isActive ? 'bg-kfc-yellow' : 'bg-white'
                  }`}
                >
                  {link.label}
                </Link>
               )
            })}
            <div className="mt-2 border-2 border-black bg-kfc-red px-4 py-2 text-xs font-bold text-white shadow-neo-sm">
              <span className="text-kfc-yellow">{contributorsCount}</span>{' '}
              位 🍗 信徒在线
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}