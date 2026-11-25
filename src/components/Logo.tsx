export function Logo({ size = 40 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="text-brand-600">
        <rect width="32" height="32" rx="9" fill="currentColor" />
        <rect x="7" y="9" width="18" height="16" rx="3" fill="none" stroke="#fff" strokeWidth="2" />
        <path d="M7 14h18M12 6v4M20 6v4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 19.5l2.8 2.8L20 17" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-display text-2xl font-extrabold tracking-tight text-ink">
        Agenda<span className="text-brand-600">Mogi</span>
      </span>
    </span>
  )
}
