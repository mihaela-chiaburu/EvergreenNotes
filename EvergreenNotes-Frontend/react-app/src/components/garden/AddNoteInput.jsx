import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "/src/styles/components/garden/add-note-input.css"

function AddNoteInput() {
  const [noteTitle, setNoteTitle] = useState("")
  const navigate = useNavigate()

  const handleCreateNote = () => {
    const normalizedTitle = noteTitle.trim()

    if (!normalizedTitle) {
      return
    }

    navigate(`/note?title=${encodeURIComponent(normalizedTitle)}&tag=Garden`, {
      state: {
        noteTitle: normalizedTitle,
        tagName: "Garden",
        tags: ["Garden"]
      }
    })
    setNoteTitle("")
  }

  return (
    <div className="add-note-input">
      <button type="button" className="add-note-input__icon" onClick={handleCreateNote}>
        +
      </button>
      <input 
        type="text" 
        placeholder="New Seed..." 
        className="add-note-input__input"
        value={noteTitle}
        onChange={(event) => setNoteTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            handleCreateNote()
          }
        }}
      />
    </div>
  )
}

export default AddNoteInput