import { useRef, useState } from "react"
import "../../styles/components/garden/add-note-input.css"
import Button from "../ui/Button"
import Input from "../ui/Input"
import { useDismiss } from "../../hooks/useDismiss"
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
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const { authUser } = useAuth()
  const typeDropdownRef = useRef(null)

  const normalizedPathTags = contextPathTags.map((tag) => tag?.trim()).filter(Boolean)
  const focusedTagLabel = normalizedPathTags[normalizedPathTags.length - 1] || "My Garden"
  const pathLabel = normalizedPathTags.length ? focusedTagLabel : "My Garden (unfocused)"

  useDismiss({ refs: [typeDropdownRef], isOpen: isTypeMenuOpen, onDismiss: () => setIsTypeMenuOpen(false) })

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
        setInputValue("")
        setIsConfirmOpen(false)
        if (typeof onCreated === "function") {
          onCreated()
        }
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
  const typeLabel = creationType === CREATION_TYPE.SEED ? "Seed" : "Thought"

  const handleSelectType = (nextType) => {
    setCreationType(nextType)
    setIsTypeMenuOpen(false)
  }

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
        <div className="dropdown dropdown--note-type" ref={typeDropdownRef}>
          <button
            type="button"
            className="add-note-input__type-toggle"
            onClick={() => setIsTypeMenuOpen((prev) => !prev)}
            aria-expanded={isTypeMenuOpen}
            aria-haspopup="menu"
            disabled={isSubmitting}
          >
            <span className="add-note-input__type-label">{typeLabel}</span>
            <span
              className={`add-note-input__type-arrow${isTypeMenuOpen ? " add-note-input__type-arrow--open" : ""}`}
              aria-hidden="true"
            />
          </button>
          {isTypeMenuOpen ? (
            <div className="dropdown-menu dropdown-menu--note-type" role="menu">
              <button
                type="button"
                className="dropdown-menu__item"
                role="menuitem"
                onClick={() => handleSelectType(CREATION_TYPE.SEED)}
              >
                Seed
              </button>
              <button
                type="button"
                className="dropdown-menu__item"
                role="menuitem"
                onClick={() => handleSelectType(CREATION_TYPE.THOUGHT)}
              >
                Thought
              </button>
            </div>
          ) : null}
        </div>
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