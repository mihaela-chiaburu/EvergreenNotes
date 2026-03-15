// src/components/garden/GardenListView.jsx
import { useNavigate } from "react-router-dom"
import leafSvg from "../../assets/images/leaf.svg"
import "../../styles/components/garden/list-view.css"

function GardenListView() {
  const navigate = useNavigate()

  const demoNotes = [
    {
      id: 1,
      title: "Map the project direction",
      date: "2026-12-03",
      status: "Polished",
      tags: ["Planning", "Research", "Roadmap"],
      text: "Drafted the main milestones and linked each idea to one concrete next action.",
      source: "Project Planning Sync",
      createdOn: "2026-12-03",
      lastWatered: "2026-12-09"
    },
    {
      id: 2,
      title: "Refactor auth notes",
      date: "2026-11-27",
      status: "Needs care",
      tags: ["React", "Auth"],
      text: "The login flow works, but error handling and reset states still need cleanup.",
      source: "Auth cleanup board",
      createdOn: "2026-11-27",
      lastWatered: "2026-12-02"
    },
    {
      id: 3,
      title: "Garden graph observations",
      date: "2026-11-16",
      status: "Rough",
      tags: ["UX", "Graph", "Nodes"],
      text: "Users understand connections quickly when labels are short and high-contrast.",
      source: "UX experiment notes",
      createdOn: "2026-11-16",
      lastWatered: "2026-11-19"
    },
    {
      id: 4,
      title: "Content pattern ideas",
      date: "2026-11-08",
      status: "Polished",
      tags: ["Writing", "Templates"],
      text: "Created a reusable note structure with context, insight, and action sections.",
      source: "Writing session",
      createdOn: "2026-11-08",
      lastWatered: "2026-11-14"
    },
    {
      id: 5,
      title: "Tag strategy",
      date: "2026-10-28",
      status: "Healthy",
      tags: ["Taxonomy", "Tags"],
      text: "Reduced redundant tags and grouped similar concepts under a shared parent label.",
      source: "Taxonomy workshop",
      createdOn: "2026-10-28",
      lastWatered: "2026-11-01"
    },
    {
      id: 6,
      title: "Review backlog",
      date: "2026-10-15",
      status: "Needs care",
      tags: ["Backlog", "Priority"],
      text: "Several old notes are still valuable, but they need updated links and examples.",
      source: "Weekly review",
      createdOn: "2026-10-15",
      lastWatered: "2026-10-20"
    },
  ]

  const handleOpenNote = (note) => {
    const primaryTag = note.tags[0] || "Garden"

    navigate(
      `/note?title=${encodeURIComponent(note.title)}&tag=${encodeURIComponent(primaryTag)}`,
      {
        state: {
          noteTitle: note.title,
          tagName: primaryTag,
          tags: note.tags,
          status: note.status === "Polished" ? "Polished" : "Rough",
          source: note.source,
          body: note.text,
          createdOn: note.createdOn,
          lastWatered: note.lastWatered
        }
      }
    )
  }

  return (
    <div className="garden-view garden-list-view">
      <div className="garden-list-view__options">
        <div className="garden-list-view__chip">
          <p>All Notes</p>
        </div>
        <div className="garden-list-view__chip">
          <p>Sort by: Date</p>
        </div>
        <div className="garden-list-view__chip garden-list-view__chip--count">
          <p>{demoNotes.length} notes</p>
        </div>
      </div>

      <div className="garden-list-view__list garden-list-view__canvas">
        {demoNotes.map((note) => (
          <article
            key={note.id}
            className="garden-list-view__item"
            onClick={() => handleOpenNote(note)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                handleOpenNote(note)
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Open note ${note.title}`}
          >
            <div className="garden-list-view__item-media" aria-hidden="true">
              <img src={leafSvg} alt="" className="garden-list-view__item-image" />
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
        ))}
      </div>
    </div>
  )
}

export default GardenListView