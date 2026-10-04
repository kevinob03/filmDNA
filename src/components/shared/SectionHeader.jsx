function SectionHeader({ eyebrow, title, description, align = 'start' }) {
  return (
    <header className={`section-header section-header--${align}`}>
      {eyebrow && <p className="section-header__eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {description && <p className="section-header__description">{description}</p>}
    </header>
  )
}

export default SectionHeader
