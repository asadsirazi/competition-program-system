function SectionCard({ title, subtitle, children }) {
  return (
    <section className="border border-line bg-white">
      <div className="border-b border-line bg-[var(--surface-alt)] px-4 py-3 sm:px-6">
        <h2 className="text-xs uppercase text-ink">
          {title}
        </h2>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      <div className="px-4 py-5 sm:px-6">{children}</div>
    </section>
  )
}

export default SectionCard
