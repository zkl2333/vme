'use client'

import { createRoot } from 'react-dom/client'
import { useEffect } from 'react'

interface ModalConfig {
  content: React.ReactNode
  onClose?: () => void
  closeOnBackdrop?: boolean
  closeOnEsc?: boolean
  zIndex?: number
}

interface ModalInstance {
  close: () => void
  update: (content: React.ReactNode) => void
}

class ModalManager {
  private container: HTMLDivElement | null = null
  private root: any = null
  private modals: Map<string, ModalConfig> = new Map()
  private baseZIndex = 9999

  private ensureContainer() {
    if (!this.container) {
      this.container = document.createElement('div')
      this.container.id = 'modal-container'
      document.body.appendChild(this.container)
    }
    return this.container
  }

  private render() {
    const container = this.ensureContainer()

    if (!this.root) {
      this.root = createRoot(container)
    }

    const modalArray = Array.from(this.modals.entries())

    // 更新 body 滚动状态
    if (modalArray.length > 0) {
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = '0px' // 防止滚动条消失导致的跳动
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }

    this.root.render(
      <>
        {modalArray.map(([id, config], index) => (
          <ModalPortal
            key={id}
            id={id}
            config={config}
            zIndex={config.zIndex || this.baseZIndex + index * 10}
            onClose={() => this.close(id)}
          />
        ))}
      </>
    )
  }

  open(config: ModalConfig): ModalInstance {
    const id = `modal-${Date.now()}-${Math.random()}`
    this.modals.set(id, config)
    this.render()

    return {
      close: () => this.close(id),
      update: (content: React.ReactNode) => this.update(id, content),
    }
  }

  close(id: string) {
    const config = this.modals.get(id)
    if (config?.onClose) {
      config.onClose()
    }
    this.modals.delete(id)
    this.render()
  }

  update(id: string, content: React.ReactNode) {
    const config = this.modals.get(id)
    if (config) {
      this.modals.set(id, { ...config, content })
      this.render()
    }
  }

  closeAll() {
    this.modals.clear()
    this.render()
  }
}

// 单例模式
export const modal = new ModalManager()

// Portal 组件
function ModalPortal({
  id,
  config,
  zIndex,
  onClose,
}: {
  id: string
  config: ModalConfig
  zIndex: number
  onClose: () => void
}) {
  const { content, closeOnBackdrop = true, closeOnEsc = true } = config

  // ESC 键关闭
  useEffect(() => {
    if (!closeOnEsc) return

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [closeOnEsc, onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      data-modal="true"
      data-modal-id={id}
      className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200"
      style={{ zIndex }}
      onClick={handleBackdropClick}
    >
      {content}
    </div>
  )
}
