import "../../styles/components/notes/note-card.css"

function toPlainText(value) {
  if (!value) {
    return ""
  }

  if (typeof DOMParser === "undefined") {
    return String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(String(value), "text/html")
  return doc.body.textContent?.replace(/\s+/g, " ").trim() || ""
}

function NoteCard({ note, onOpen, icon }) {
  const previewText = toPlainText(note.text)

  return (
    <article
      className="garden-list-view__item note-card"
      onClick={() => onOpen(note)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onOpen(note)
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open note ${note.title}`}
    >
      <div className="garden-list-view__item-media" aria-hidden="true">
        <img src={icon} alt="" className="garden-list-view__item-image" />
      </div>
      <div className="garden-list-view__item-content">
        <div className="garden-list-view__item-content-header">
          <h3 className="garden-list-view__item-title">{note.title}</h3>
          <div className="garden-list-view__item-meta">
            <p className="garden-list-view__item-date">{note.date}</p>
            <span className="garden-list-view__item-status">{note.status}</span>
          </div>
        </div>
        <div className="garden-list-view__item-content-tags">
          {note.tags.map((tag) => (
            <span key={`${note.id}-${tag}`} className="garden-list-view__item-tag">
              {tag}
            </span>
          ))}
        </div>
        <p className="garden-list-view__item-content-text">{previewText}</p>
      </div>
    </article>
  )
}

export default NoteCard
