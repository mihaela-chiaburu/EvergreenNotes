import Layout from "../components/Layout"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import StatsBar from "../components/garden-care/StatsBar"
import GrowingCard from "../components/garden-care/GrowingCard"
import ReflectionCard from "../components/garden-care/ReflectionCard"
import { useAuth } from "../context/AuthContext"
import { fetchGardenCareQueue } from "../utils/notes"
import "../styles/pages/garden-care.css"

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return date.toLocaleDateString("en-GB")
}

function GardenCarePage() {
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const [queue, setQueue] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let isMounted = true

    const loadQueue = async () => {
      if (!authUser?.token) {
        if (isMounted) {
          setIsLoading(false)
        }

        return
      }

      setIsLoading(true)
      setError("")

      try {
        const payload = await fetchGardenCareQueue(authUser.token)
        if (isMounted) {
          setQueue(payload)
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

    loadQueue()

    return () => {
      isMounted = false
    }
  }, [authUser?.token])

  const stats = useMemo(() => {
    if (!queue) {
      return {
        totalIdeas: 0,
        dueToday: 0,
        growing: 0,
        streakDays: 0,
      }
    }

    return {
      totalIdeas: queue.totalNotes ?? 0,
      dueToday: queue.dueTodayCount ?? 0,
      growing: queue.growingCount ?? 0,
      streakDays: queue.reviewStreakDays ?? 0,
    }
  }, [queue])

  const handleOpenDueNote = (note) => {
    navigate(`/note?noteId=${encodeURIComponent(note.noteId)}&review=1`, {
      state: {
        noteId: note.noteId,
        noteTitle: note.title,
        tagName: "Garden Care",
        tags: Array.isArray(note.tags) && note.tags.length > 0 ? note.tags : ["Garden Care"],
        reviewQuestion: note.question,
        isGardenReview: true,
      },
    })
  }

  const handleOpenGrowingNote = (note) => {
    navigate(`/note?noteId=${encodeURIComponent(note.noteId)}`, {
      state: {
        noteId: note.noteId,
        noteTitle: note.title,
        tagName: "Garden Care",
        tags: Array.isArray(note.tags) && note.tags.length > 0 ? note.tags : ["Garden Care"],
      },
    })
  }

  return (
    <Layout>
      <div className="garden-care-page">
        <p className="garden-care-title">Take Care of your ideas</p>
        <StatsBar stats={stats} />

        {isLoading ? <p className="garden-care-status">Loading your review queue...</p> : null}
        {error ? <p className="garden-care-status garden-care-status--error">{error}</p> : null}

        <p className="garden-care-subtitle">Ready for reflection</p>
        {!isLoading && !error && (queue?.readyForReflection?.length ?? 0) === 0 ? (
          <p className="garden-care-empty">No notes are due right now. Your garden is in good shape.</p>
        ) : null}
        {(queue?.readyForReflection ?? []).map((card) => (
          <ReflectionCard
            key={card.noteId}
            title={card.title}
            prompt={card.question}
            lastReviewed={formatDate(card.lastReviewedAt)}
            onOpen={() => handleOpenDueNote(card)}
          />
        ))}

        <p className="garden-care-subtitle">Growing</p>
        {(queue?.growing ?? []).map((card) => (
          <GrowingCard
            key={card.noteId}
            title={card.title}
            nextReviewInDays={card.daysUntilReview}
            lastReviewed={formatDate(card.lastReviewedAt)}
            onOpen={() => handleOpenGrowingNote(card)}
          />
        ))}
      </div>
    </Layout>
  )
}

export default GardenCarePage