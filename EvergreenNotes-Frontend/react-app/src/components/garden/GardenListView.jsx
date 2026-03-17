// src/components/garden/GardenListView.jsx
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import leafSvg from "../../assets/images/leaf.svg"
import "../../styles/components/garden/list-view.css"
import NoteCard from "../notes/NoteCard"
import { useAuth } from "../../context/AuthContext"
import { fetchNotes, fetchPublicUserNotes } from "../../utils/notes"

function GardenListView({ userId = null, isReadOnly = false }) {
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const [notes, setNotes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let isMounted = true

    const loadNotes = async () => {
      if (!authUser?.token) {
        return
      }

      setIsLoading(true)
      setError("")

      try {
        const fetchedNotes = userId
          ? await fetchPublicUserNotes(userId, authUser.token)
          : await fetchNotes(authUser.token)
        if (isMounted) {
          setNotes(fetchedNotes)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadNotes()

    return () => {
      isMounted = false
    }
  }, [authUser?.token, userId])

  const notesCountLabel = useMemo(() => {
    if (isLoading) {
      return "Loading..."
    }

    return `${notes.length} notes`
  }, [isLoading, notes.length])

  const handleOpenNote = (note) => {
    const primaryTag = note.tags[0] || "Garden"

    navigate(
      `/note?noteId=${encodeURIComponent(note.id)}&title=${encodeURIComponent(note.title)}&tag=${encodeURIComponent(primaryTag)}${isReadOnly ? "&readOnly=1" : ""}`,
      {
        state: {
          noteId: note.id,
          noteTitle: note.title,
          readOnly: isReadOnly,
          tagName: primaryTag,
          tags: note.tags,
          status: note.status === "Polished" ? "Polished" : "Rough",
          source: note.source,
          body: note.text,
          createdOn: note.createdOn,
          lastWatered: note.lastWatered,
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
          <p>{notesCountLabel}</p>
        </div>
      </div>

      {error ? <p className="garden-list-view__error">{error}</p> : null}

      <div className="garden-list-view__list garden-list-view__canvas">
        {notes.map((note) => (
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