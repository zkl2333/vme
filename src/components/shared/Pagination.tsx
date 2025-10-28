'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
}

/**
 * 分页组件
 */
export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
}: PaginationProps) {
  const searchParams = useSearchParams()

  if (totalPages <= 1) return null

  const generatePageNumbers = () => {
    const pages = []
    // 使用较小的页码数量，适配移动端
    const maxVisible = 3

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      const halfVisible = Math.floor(maxVisible / 2)
      if (currentPage <= halfVisible + 1) {
        for (let i = 1; i <= maxVisible; i++) {
          pages.push(i)
        }
      } else if (currentPage >= totalPages - halfVisible) {
        for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        for (let i = currentPage - halfVisible; i <= currentPage + halfVisible; i++) {
          pages.push(i)
        }
      }
    }

    return pages
  }

  const pageNumbers = generatePageNumbers()

  const buildUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    return `?${params.toString()}`
  }

  return (
    <div className="mt-8">
      <div className="mb-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="text-sm text-gray-600">
          显示第{' '}
          <span className="font-semibold">
            {(currentPage - 1) * pageSize + 1}
          </span>{' '}
          -
          <span className="font-semibold">
            {Math.min(currentPage * pageSize, totalItems)}
          </span>{' '}
          个段子， 共{' '}
          <span className="font-semibold text-kfc-red">{totalItems}</span>{' '}
          个段子
        </div>

        <div className="text-sm text-gray-500">
          第 {currentPage} 页 / 共 {totalPages} 页
        </div>
      </div>

      <nav className="flex justify-center">
        <div className="flex items-center gap-2">
          {currentPage > 1 ? (
            <Link
              scroll={false}
              href={buildUrl(currentPage - 1)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-kfc-red hover:bg-kfc-red hover:text-white"
            >
              <i className="fa fa-chevron-left text-sm"></i>
            </Link>
          ) : (
            <div className="flex min-h-[44px] min-w-[44px] cursor-not-allowed items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-300">
              <i className="fa fa-chevron-left text-sm"></i>
            </div>
          )}

          {pageNumbers[0] > 1 && (
            <>
              <Link
                scroll={false}
                href={buildUrl(1)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-kfc-red hover:bg-kfc-red hover:text-white"
              >
                1
              </Link>
              {pageNumbers[0] > 2 && (
                <span className="flex min-h-[44px] min-w-[44px] items-center justify-center text-gray-400">
                  ...
                </span>
              )}
            </>
          )}

          {pageNumbers.map((page) => (
            <Link
              scroll={false}
              key={page}
              href={buildUrl(page)}
              className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border transition-colors ${
                currentPage === page
                  ? 'border-kfc-red bg-kfc-red text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-kfc-red hover:bg-kfc-red hover:text-white'
              }`}
            >
              {page}
            </Link>
          ))}

          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                <span className="flex min-h-[44px] min-w-[44px] items-center justify-center bg-white text-gray-400">
                  ...
                </span>
              )}
              <Link
                scroll={false}
                href={buildUrl(totalPages)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-kfc-red hover:bg-kfc-red hover:text-white"
              >
                {totalPages}
              </Link>
            </>
          )}

          {currentPage < totalPages ? (
            <Link
              scroll={false}
              href={buildUrl(currentPage + 1)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-kfc-red hover:bg-kfc-red hover:text-white"
            >
              <i className="fa fa-chevron-right text-sm"></i>
            </Link>
          ) : (
            <div className="flex min-h-[44px] min-w-[44px] cursor-not-allowed items-center justify-center rounded-lg border border-gray-200 text-gray-300">
              <i className="fa fa-chevron-right text-sm"></i>
            </div>
          )}
        </div>
      </nav>
    </div>
  )
}

