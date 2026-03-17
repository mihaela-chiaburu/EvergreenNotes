import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "../../styles/components/garden/add-note-input.css"
import Button from "../ui/Button"
import Input from "../ui/Input"
import { useAuth } from "../../context/AuthContext"
import { createNote, deleteNote, replaceNoteTags } from "../../utils/notes"
import { createTaxonomyTag } from "../../utils/taxonomy"

const CREATION_TYPE = {
  SEED: "seed",
  THOUGHT: "thought",
}

function AddNoteInput({ contextPathTags = [], onCreated }) {
  const [inputValue, setInputValue] = useState("")
  const [creationType, setCreationType] = useState(CREATION_TYPE.SEED)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { authUser } = useAuth()

  const normalizedPathTags = contextPathTags.map((tag) => tag?.trim()).filter(Boolean)
  const focusedTagLabel = normalizedPathTags[normalizedPathTags.length - 1] || "My Garden"
  const pathLabel = normalizedPathTags.length ? focusedTagLabel : "My Garden (unfocused)"

  const handleOpenConfirm = () => {
    const normalizedInput = inputValue.trim()
    if (!normalizedInput || !authUser?.token || isSubmitting) {
      return
    }

    setError("")
    setIsConfirmOpen(true)
  }

  const handleCloseConfirm = () => {
    if (isSubmitting) {
      return
    }

    setIsConfirmOpen(false)
  }

  const handleConfirmCreate = async () => {
    const normalizedInput = inputValue.trim()
    const primaryTag = focusedTagLabel

    if (!normalizedInput || !authUser?.token || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      if (creationType === CREATION_TYPE.SEED) {
        await createTaxonomyTag(authUser.token, {
          name: normalizedInput,
          parentTagId: null,
        })

        setInputValue("")
        setIsConfirmOpen(false)
        if (typeof onCreated === "function") {
          onCreated()
        }
        navigate("/garden", {
          state: {
            view: "graph",
            focusPathLabels: [normalizedInput],
          },
          replace: true,
        })
        return
      }

      let createdNoteId = null

      try {
        const createdNote = await createNote(authUser.token, {
          title: normalizedInput,
          body: "",
          source: "",
        })
        createdNoteId = createdNote.id

        await replaceNoteTags(authUser.token, createdNote.id, normalizedPathTags.length ? [primaryTag] : [])

        navigate(`/note?noteId=${encodeURIComponent(createdNote.id)}&title=${encodeURIComponent(normalizedInput)}&tag=${encodeURIComponent(primaryTag)}`, {
          state: {
            noteId: createdNote.id,
            noteTitle: normalizedInput,
            tagName: primaryTag,
            tags: normalizedPathTags.length ? [primaryTag] : [],
            contextPathTags: normalizedPathTags.length ? [primaryTag] : [],
          },
        })
        setInputValue("")
        setIsConfirmOpen(false)
      } catch (createError) {
        if (createdNoteId) {
          await deleteNote(authUser.token, createdNoteId).catch(() => {})
        }
        throw createError
      }
    } catch (createError) {
      setError(createError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputPlaceholder = creationType === CREATION_TYPE.SEED ? "New Seed..." : "New Thought..."
  const actionLabel = creationType === CREATION_TYPE.SEED ? "Seed" : "Thought"

  return (
    <>
      <div className="add-note-input">
        <Button type="button" className="add-note-input__icon" onClick={handleOpenConfirm}>
          {isSubmitting ? "..." : "+"}
        </Button>
        <Input
          type="text"
          placeholder={inputPlaceholder}
          className="add-note-input__input"
          inputClassName="input--unstyled"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              handleOpenConfirm()
            }
          }}
        />
        <label className="add-note-input__type-wrapper" htmlFor="add-note-input-type">
          <select
            id="add-note-input-type"
            className="add-note-input__type-select"
            value={creationType}
            onChange={(event) => setCreationType(event.target.value)}
            disabled={isSubmitting}
          >
            <option value={CREATION_TYPE.SEED}>Seed</option>
            <option value={CREATION_TYPE.THOUGHT}>Thought</option>
          </select>
        </label>
        {error ? <p className="add-note-input__error">{error}</p> : null}
      </div>

      {isConfirmOpen ? (
        <div className="add-note-input__confirm-overlay" role="presentation" onClick={handleCloseConfirm}>
          <div
            className="add-note-input__confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-note-input-confirm-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p id="add-note-input-confirm-title" className="add-note-input__confirm-title">
              Place new {actionLabel.toLowerCase()} here?
            </p>
            <p className="add-note-input__confirm-path">{pathLabel}</p>
            <div className="add-note-input__confirm-actions">
              <Button type="button" variant="secondary" onClick={handleCloseConfirm} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="button" onClick={handleConfirmCreate} disabled={isSubmitting}>
                Yes, place here
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default AddNoteInput