import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
}

/**
 * Painel lateral. Usa o elemento nativo <dialog>, que já cuida de
 * foco, tecla Esc e bloqueio do fundo (bom para acessibilidade).
 */
export function Drawer({ title, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby="drawer-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) ref.current?.close()
      }}
      className="m-0 ml-auto h-dvh max-h-none w-full max-w-md bg-white p-0 text-ink backdrop:bg-ink/40"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-line px-6 py-3">
          <h2 id="drawer-title" className="font-display text-lg font-bold">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => ref.current?.close()}
            className="flex h-11 w-11 items-center justify-center rounded-[10px] text-muted hover:bg-surface"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </dialog>
  )
}
