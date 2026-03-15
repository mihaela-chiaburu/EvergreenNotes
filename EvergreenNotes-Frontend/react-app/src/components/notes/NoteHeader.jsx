function NoteHeader({
  initialTagName,
  title,
  isOptionsOpen,
  onToggleOptions,
  onNavigateToTag,
}) {
  return (
    <header className="note-page__top-nav" aria-label="Note navigation">
      <div className="note-page__breadcrumb" role="navigation" aria-label="Note path">
        <button type="button" className="note-page__tag-link" onClick={onNavigateToTag}>
          {initialTagName}
        </button>
        <span className="note-page__breadcrumb-separator" aria-hidden="true">/</span>
        <span className="note-page__note-name">{title || "Untitled note"}</span>
      </div>

      <div className="note-page__options-wrap">
        <button
          type="button"
          className="note-page__options-button"
          aria-label="Open note options"
          aria-expanded={isOptionsOpen}
          onClick={onToggleOptions}
        >
          <span className="note-page__options-dot" />
          <span className="note-page__options-dot" />
          <span className="note-page__options-dot" />
        </button>

        {isOptionsOpen && (
          <div className="note-page__options-menu" role="menu">
            <button type="button" className="note-page__options-item" role="menuitem">Duplicate note</button>
            <button type="button" className="note-page__options-item" role="menuitem">Move to another tag</button>
            <button type="button" className="note-page__options-item" role="menuitem">View note history</button>
          </div>
        )}
      </div>
    </header>
  )
}

export default NoteHeader
