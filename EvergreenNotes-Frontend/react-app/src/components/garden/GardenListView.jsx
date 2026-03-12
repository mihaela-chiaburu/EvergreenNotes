// src/components/garden/GardenListView.jsx
import leafSvg from "../../assets/images/leaf.svg"
import "../../styles/components/garden/list-view.css"

function GardenListView() {
  const demoNotes = [
    {
      id: 1,
      title: "Map the project direction",
      date: "2026-12-03",
      status: "Polished",
      tags: ["Planning", "Research", "Roadmap"],
      text: "Drafted the main milestones and linked each idea to one concrete next action.",
    },
    {
      id: 2,
      title: "Refactor auth notes",
      date: "2026-11-27",
      status: "Needs care",
      tags: ["React", "Auth"],
      text: "The login flow works, but error handling and reset states still need cleanup.",
    },
    {
      id: 3,
      title: "Garden graph observations",
      date: "2026-11-16",
      status: "Rough",
      tags: ["UX", "Graph", "Nodes"],
      text: "Users understand connections quickly when labels are short and high-contrast.",
    },
    {
      id: 4,
      title: "Content pattern ideas",
      date: "2026-11-08",
      status: "Polished",
      tags: ["Writing", "Templates"],
      text: "Created a reusable note structure with context, insight, and action sections.",
    },
    {
      id: 5,
      title: "Tag strategy",
      date: "2026-10-28",
      status: "Healthy",
      tags: ["Taxonomy", "Tags"],
      text: "Reduced redundant tags and grouped similar concepts under a shared parent label.",
    },
    {
      id: 6,
      title: "Review backlog",
      date: "2026-10-15",
      status: "Needs care",
      tags: ["Backlog", "Priority"],
      text: "Several old notes are still valuable, but they need updated links and examples.",
    },
  ]

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
          <article key={note.id} className="garden-list-view__item">
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