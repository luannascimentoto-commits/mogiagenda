import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/auth/useAuth'
import { roleLabels } from '@/auth/roles'
import { navItems } from '@/app/navigation'

/** Estrutura das telas internas: menu lateral (gaveta no celular) + conteúdo. */
export default function AppLayout() {
  const { profile, clinic, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  // Esc fecha o menu no celular
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const items = navItems.filter((item) => profile && item.roles.includes(profile.role))

  return (
    <div className="min-h-screen lg:flex">
      {/* Barra superior (só no celular e tablet) */}
      <header className="flex h-14 items-center justify-between border-b border-line bg-white px-4 lg:hidden">
        <Logo size={28} />
        <button
          aria-label="Abrir menu"
          aria-expanded={open}
          aria-controls="menu-lateral"
          onClick={() => setOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-[10px] hover:bg-surface"
        >
          <Menu size={22} aria-hidden="true" />
        </button>
      </header>

      {/* Fundo escurecido atrás da gaveta */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        id="menu-lateral"
        aria-label="Menu principal"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 ${
          open ? 'translate-x-0' : 'invisible -translate-x-full lg:visible'
        }`}
      >
        <div className="flex items-start justify-between gap-2 px-4 pb-4 pt-5">
          <div className="min-w-0">
            <Logo size={30} />
            <p className="mt-2 truncate text-sm text-muted">{clinic?.name}</p>
          </div>
          <button
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] hover:bg-surface lg:hidden"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] ${
                  isActive
                    ? 'bg-brand-50 font-semibold text-brand-700'
                    : 'font-medium text-[#33454e] hover:bg-surface'
                }`
              }
            >
              <item.icon size={20} aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-line p-4">
          <p className="truncate text-sm font-semibold">{profile?.full_name}</p>
          <p className="text-xs text-muted">{profile ? roleLabels[profile.role] : ''}</p>
          <button
            onClick={() => void signOut()}
            className="mt-3 flex h-11 w-full items-center gap-3 rounded-[10px] px-3 text-[15px] font-medium text-[#33454e] hover:bg-surface"
          >
            <LogOut size={20} aria-hidden="true" />
            Sair
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
