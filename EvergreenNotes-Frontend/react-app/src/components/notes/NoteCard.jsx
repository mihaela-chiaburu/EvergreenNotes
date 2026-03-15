import "../../styles/components/notes/note-card.css"

function NoteCard({ note, onOpen, icon }) {
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
        <p className="garden-list-view__item-content-text">{note.text}</p>
      </div>
    </article>
  )
}

export default NoteCard
