'use client'

import { useState } from 'react'
import Image from 'next/image'
import LoginButton from '@/components/shared/LoginButton'

interface HeaderProps {
  contributorsCount: number
}

export default function Header({ contributorsCount }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-kfc-red via-red-600 to-kfc-red text-white shadow-lg backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3 md:py-4">
          {/* 左侧：移动端汉堡菜单 / 桌面端 Logo */}
          <div className="flex items-center gap-3">
            {/* 移动端汉堡菜单按钮 */}
            <button
              type="button"
              className="group flex flex-col items-center justify-center gap-1.5 rounded-lg bg-white/10 p-2.5 backdrop-blur-sm transition-all duration-300 hover:bg-white/20 lg:hidden"
              onClick={toggleMobileMenu}
              aria-label="切换菜单"
              aria-expanded={isMobileMenuOpen}
            >
              <span
                className={`block h-0.5 w-6 rounded-full bg-white transition-all duration-300 ${
                  isMobileMenuOpen ? 'translate-y-2 rotate-45' : ''
                }`}
              ></span>
              <span
                className={`block h-0.5 w-6 rounded-full bg-white transition-all duration-300 ${
                  isMobileMenuOpen ? 'opacity-0' : ''
                }`}
              ></span>
              <span
                className={`block h-0.5 w-6 rounded-full bg-white transition-all duration-300 ${
                  isMobileMenuOpen ? '-translate-y-2 -rotate-45' : ''
                }`}
              ></span>
            </button>

            {/* 桌面端 Logo 和标题 */}
            <a
              href="/"
              className="group hidden items-center gap-3 transition-transform duration-300 hover:scale-105 lg:flex"
            >
              <div className="relative">
                <Image
                  src="/images/logo.jpg"
                  alt="KFC"
                  width={50}
                  height={50}
                  className="h-12 w-12 animate-chicken-rotate rounded-full object-cover ring-2 ring-white/50 transition-all duration-300 group-hover:ring-4 group-hover:ring-kfc-yellow"
                />
                <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-kfc-yellow"></div>
              </div>
              <div>
                <h1 className="text-shadow-kfc text-2xl font-black leading-tight">
                  肯德基疯狂星期四
                </h1>
                <p className="text-xs font-medium text-kfc-yellow">
                  <span className="inline-block animate-bounce">🍗</span>{' '}
                  {contributorsCount} 位段子手在线
                </p>
              </div>
            </a>
          </div>

          {/* 桌面端导航 */}
          <nav className="hidden items-center gap-2 lg:flex">
            <a
              href="/jokes"
              className="nav-link group relative flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-lg"
            >
              <i className="fa fa-list transition-transform duration-300 group-hover:scale-110"></i>
              <span>段子列表</span>
            </a>
            <a
              href="/leaderboard"
              className="nav-link group relative flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-lg"
            >
              <i className="fa fa-trophy transition-transform duration-300 group-hover:scale-110"></i>
              <span>排行榜</span>
            </a>
            <a
              href="/submit"
              className="nav-link group relative flex items-center gap-2 rounded-xl border-2 border-kfc-yellow/50 bg-kfc-yellow/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-kfc-yellow hover:bg-kfc-yellow/30 hover:shadow-lg"
            >
              <i className="fa fa-plus transition-transform duration-300 group-hover:rotate-90"></i>
              <span>提交段子</span>
            </a>
            <a
              href="/status"
              className="nav-link group relative flex items-center gap-2 rounded-xl border border-blue-400/50 bg-blue-500/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-500/30 hover:shadow-lg"
            >
              <i className="fa fa-heartbeat animate-pulse transition-transform duration-300 group-hover:scale-110"></i>
              <span>状态</span>
            </a>
          </nav>

          {/* 右侧：登录按钮 */}
          <div className="flex items-center gap-3">
            <LoginButton />
          </div>
        </div>

        {/* 移动端导航菜单 */}
        <div
          className={`border-t border-white/20 lg:hidden ${
            isMobileMenuOpen ? 'block' : 'hidden'
          }`}
          style={{
            animation: isMobileMenuOpen ? 'slideDown 0.3s ease-out' : 'none',
          }}
        >
          <nav className="flex flex-col gap-2 pb-4 pt-3">
            <a
              href="/"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20"
            >
              <i className="fa fa-home w-5"></i>
              <span>首页</span>
            </a>
            <a
              href="/jokes"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20"
            >
              <i className="fa fa-list w-5"></i>
              <span>段子列表</span>
            </a>
            <a
              href="/leaderboard"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20"
            >
              <i className="fa fa-trophy w-5"></i>
              <span>排行榜</span>
            </a>
            <a
              href="/submit"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 rounded-lg border-2 border-kfc-yellow/50 bg-kfc-yellow/20 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-kfc-yellow hover:bg-kfc-yellow/30"
            >
              <i className="fa fa-plus w-5"></i>
              <span>提交我的段子</span>
            </a>
            <a
              href="/status"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 rounded-lg border border-blue-400/50 bg-blue-500/20 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-blue-400 hover:bg-blue-500/30"
            >
              <i className="fa fa-heartbeat w-5"></i>
              <span>系统状态</span>
            </a>
            <div className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-3 text-sm backdrop-blur-sm">
              <i className="fa fa-users text-kfc-yellow"></i>
              <span>
                <span className="font-semibold">{contributorsCount}</span>{' '}
                位段子手
              </span>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
