// src/components/garden/GardenListView.jsx
import { useNavigate } from "react-router-dom"
import leafSvg from "../../assets/images/leaf.svg"
import "../../styles/components/garden/list-view.css"
import NoteCard from "../notes/NoteCard"
import { mockGardenListNotes } from "../../data/mockGardenListNotes"

function GardenListView() {
  const navigate = useNavigate()

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
          <p>{mockGardenListNotes.length} notes</p>
        </div>
      </div>

      <div className="garden-list-view__list garden-list-view__canvas">
        {mockGardenListNotes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            icon={leafSvg}
            onOpen={handleOpenNote}
          />
        ))}
      </div>
    </div>
  )
}

export default GardenListView