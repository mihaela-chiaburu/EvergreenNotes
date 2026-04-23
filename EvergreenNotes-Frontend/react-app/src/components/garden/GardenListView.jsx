// src/components/garden/GardenListView.jsx
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import leafSvg from "../../assets/images/leaf.svg"
import "../../styles/components/garden/list-view.css"
import NoteCard from "../notes/NoteCard"
import { useAuth } from "../../context/AuthContext"
import { fetchNotes, fetchPublicUserNotes } from "../../utils/notes"

const DEFAULT_GRAPH_SETTINGS = {
  filters: {
    visibility: [],
    noteStatus: [],
    careStatus: [],
    tags: [],
  },
}

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "-")
}

function normalizeVisibility(value) {
  return String(value || "").trim().toLowerCase()
}

function normalizeCare(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "-")
}

function GardenListView({ userId = null, isReadOnly = false, graphSettings = DEFAULT_GRAPH_SETTINGS }) {
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

  const filteredNotes = useMemo(() => {
    const filters = graphSettings?.filters || {}
    const visibilityFilters = Array.isArray(filters.visibility)
      ? filters.visibility.map((value) => normalizeVisibility(value)).filter(Boolean)
      : []
    const noteStatusFilters = Array.isArray(filters.noteStatus)
      ? filters.noteStatus.map((value) => normalizeStatus(value)).filter(Boolean)
      : []
    const careStatusFilters = Array.isArray(filters.careStatus)
      ? filters.careStatus.map((value) => normalizeCare(value)).filter(Boolean)
      : []
    const selectedTags = Array.isArray(filters.tags)
      ? filters.tags.map((tag) => String(tag || "").trim().toLowerCase()).filter(Boolean)
      : []

    return notes.filter((note) => {
      const noteVisibility = normalizeVisibility(note.visibility)
      const noteStatus = normalizeStatus(note.status)
      const noteCare = normalizeCare(note.plantState)
      const noteTags = Array.isArray(note.tags)
        ? note.tags.map((tag) => String(tag || "").trim().toLowerCase()).filter(Boolean)
        : []

      if (visibilityFilters.length > 0 && !visibilityFilters.includes(noteVisibility)) {
        return false
      }

      if (noteStatusFilters.length > 0 && !noteStatusFilters.includes(noteStatus)) {
        const needsCareMatch = noteStatusFilters.includes("needs-care")
          && (noteStatus === "rough" || noteCare === "pale" || noteCare === "dry")

        if (!needsCareMatch) {
          return false
        }
      }

      if (careStatusFilters.length > 0 && !careStatusFilters.includes(noteCare)) {
        return false
      }

      if (selectedTags.length > 0) {
        const hasTagMatch = selectedTags.some((tag) => noteTags.includes(tag))
        if (!hasTagMatch) {
          return false
        }
      }

      return true
    })
  }, [graphSettings?.filters, notes])

  const notesCountLabel = useMemo(() => {
    if (isLoading) {
      return "Loading..."
    }

    return `${filteredNotes.length} notes`
  }, [filteredNotes.length, isLoading])

  const handleOpenNote = (note) => {
    const primaryTag = note.tags[0] || "Garden"
    const encodedGardenUserId = userId ? `&gardenUserId=${encodeURIComponent(userId)}` : ""

    navigate(
      `/note?noteId=${encodeURIComponent(note.id)}&title=${encodeURIComponent(note.title)}&tag=${encodeURIComponent(primaryTag)}${isReadOnly ? "&readOnly=1" : ""}${encodedGardenUserId}`,
      {
        state: {
          noteId: note.id,
          noteTitle: note.title,
          readOnly: isReadOnly,
          gardenUserId: userId || null,
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
        {filteredNotes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            icon={leafSvg}
            onOpen={handleOpenNote}
          />
        ))}
        {!isLoading && !error && filteredNotes.length === 0 ? (
          <p className="garden-list-view__error">No notes match the selected filters.</p>
        ) : null}
      </div>
    </div>
  )
}

export default GardenListView