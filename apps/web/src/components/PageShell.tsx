import Header from '@/components/Header'

export default function PageShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <Header />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        {title || description ? (
          <header className="mb-8 space-y-3">
            <h1 className="text-3xl font-semibold text-balance">{title}</h1>
            <p className="max-w-2xl text-base text-slate-600 text-pretty">
              {description}
            </p>
          </header>
        ) : null}
        {children}
      </main>
    </div>
  )
}
