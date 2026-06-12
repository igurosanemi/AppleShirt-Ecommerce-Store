'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle, Warning } from '@phosphor-icons/react'

type ToastType = 'success' | 'error'
type ToastItem = { id: string; message: string; type: ToastType }
type AddToast = (message: string, type?: ToastType) => void

const ToastCtx = createContext<AddToast>(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const add: AddToast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2800)
  }, [])

  return (
    <ToastCtx.Provider value={add}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none"
      >
        <AnimatePresence mode="sync">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="pointer-events-auto flex items-center gap-2.5 px-4 h-11 bg-[var(--color-fg)] text-[var(--color-bg)] text-[13px] shadow-lg max-w-[300px]"
            >
              {t.type === 'error' ? (
                <Warning size={14} weight="fill" className="shrink-0 opacity-70" />
              ) : (
                <CheckCircle size={14} weight="fill" className="shrink-0 opacity-70" />
              )}
              <span className="truncate">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  )
}
