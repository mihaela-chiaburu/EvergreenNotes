import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "../../styles/components/garden/add-note-input.css"
import Button from "../ui/Button"
import Input from "../ui/Input"

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
      <Button type="button" className="add-note-input__icon" onClick={handleCreateNote}>
        +
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
    </div>
  )
}

export default AddNoteInput