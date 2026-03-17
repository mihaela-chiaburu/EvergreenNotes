import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "../../styles/components/garden/add-note-input.css"
import Button from "../ui/Button"
import Input from "../ui/Input"
import { useAuth } from "../../context/AuthContext"
import { createNote, replaceNoteTags } from "../../utils/notes"

function AddNoteInput() {
  const [noteTitle, setNoteTitle] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { authUser } = useAuth()

  const handleCreateNote = async () => {
    const normalizedTitle = noteTitle.trim()

    if (!normalizedTitle || !authUser?.token || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const createdNote = await createNote(authUser.token, {
        title: normalizedTitle,
        body: "",
        source: "",
      })

      await replaceNoteTags(authUser.token, createdNote.id, ["Garden"])

      navigate(`/note?noteId=${encodeURIComponent(createdNote.id)}&title=${encodeURIComponent(normalizedTitle)}&tag=Garden`, {
        state: {
          noteId: createdNote.id,
          noteTitle: normalizedTitle,
          tagName: "Garden",
          tags: ["Garden"],
        },
      })
      setNoteTitle("")
    } catch (createError) {
      setError(createError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="add-note-input">
      <Button type="button" className="add-note-input__icon" onClick={handleCreateNote}>
        {isSubmitting ? "..." : "+"}
      </Button>
      <Input
        type="text" 
        placeholder="New Seed..." 
        className="add-note-input__input"
        inputClassName="input--unstyled"
        value={noteTitle}
        onChange={(event) => setNoteTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            handleCreateNote()
          }
        }}
      />
      {error ? <p className="add-note-input__error">{error}</p> : null}
    </div>
  )
}

export default AddNoteInput