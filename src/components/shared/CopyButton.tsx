'use client'

import { useState } from 'react'

interface CopyButtonProps {
  text: string
  className?: string
}

/**
 * 复制按钮组件
 */
export default function CopyButton({ text, className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1 rounded-lg bg-transparent px-2 py-1 text-xs text-gray-500 transition-all duration-300 hover:bg-gray-100 hover:text-gray-700 ${className}`}
      title="复制文案"
    >
      {copied ? (
        <>
          <i className="fa fa-check text-green-600"></i>
          <span className="text-xs">已复制</span>
        </>
      ) : (
        <>
          <i className="fa fa-copy text-xs"></i>
          <span className="text-xs">复制</span>
        </>
      )}
    </button>
  )
}

