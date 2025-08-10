'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface JokesPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
}

export default function JokesPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
}: JokesPaginationProps) {
  const searchParams = useSearchParams()

  if (totalPages <= 1) return null

  const generatePageNumbers = () => {
    const pages = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, 5)
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i)
        }
      }
    }

    return pages
  }

  const pageNumbers = generatePageNumbers()

  // 构建URL参数
  const buildUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    return `?${params.toString()}`
  }

  return (
    <div className="mt-8">
      {/* 分页信息 */}
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

      {/* 分页控件 */}
      <nav className="flex justify-center">
        <div className="flex items-center gap-1">
          {/* 上一页 */}
          {currentPage > 1 ? (
            <Link
              scroll={false}
              href={buildUrl(currentPage - 1)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-kfc-red hover:bg-kfc-red hover:text-white"
            >
              <i className="fa fa-chevron-left text-sm"></i>
            </Link>
          ) : (
            <div className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-300">
              <i className="fa fa-chevron-left text-sm"></i>
            </div>
          )}

          {/* 第一页 */}
          {pageNumbers[0] > 1 && (
            <>
              <Link
                scroll={false}
                href={buildUrl(1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-kfc-red hover:bg-kfc-red hover:text-white"
              >
                1
              </Link>
              {pageNumbers[0] > 2 && (
                <span className="flex h-10 w-10 items-center justify-center text-gray-400">
                  ...
                </span>
              )}
            </>
          )}

          {/* 页码 */}
          {pageNumbers.map((page) => (
            <Link
              scroll={false}
              key={page}
              href={buildUrl(page)}
              className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                currentPage === page
                  ? 'border-kfc-red bg-kfc-red text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-kfc-red hover:bg-kfc-red hover:text-white'
              }`}
            >
              {page}
            </Link>
          ))}

          {/* 最后一页 */}
          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                <span className="flex h-10 w-10 items-center justify-center bg-white text-gray-400">
                  ...
                </span>
              )}
              <Link
                scroll={false}
                href={buildUrl(totalPages)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-kfc-red hover:bg-kfc-red hover:text-white"
              >
                {totalPages}
              </Link>
            </>
          )}

          {/* 下一页 */}
          {currentPage < totalPages ? (
            <Link
              scroll={false}
              href={buildUrl(currentPage + 1)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-kfc-red hover:bg-kfc-red hover:text-white"
            >
              <i className="fa fa-chevron-right text-sm"></i>
            </Link>
          ) : (
            <div className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-lg border border-gray-200 text-gray-300">
              <i className="fa fa-chevron-right text-sm"></i>
            </div>
          )}
        </div>
      </nav>
    </div>
  )
}
