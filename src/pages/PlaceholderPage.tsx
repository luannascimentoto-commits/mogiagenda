/** Tela provisória das áreas que ainda serão construídas. */
export default function PlaceholderPage({ title, block }: { title: string; block: string }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-2 text-muted">Esta tela será construída no bloco {block}.</p>
    </div>
  )
}
