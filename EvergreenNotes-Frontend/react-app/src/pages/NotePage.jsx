import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import Layout from "../components/Layout"
import Button from "../components/ui/Button"
import NoteHeader from "../components/notes/NoteHeader"
import NoteMeta from "../components/notes/NoteMeta"
import NoteEditor from "../components/notes/NoteEditor"
import { useDismiss } from "../hooks/useDismiss"
import { useNotePageState } from "../hooks/useNotePageState"
import { useAuth } from "../context/AuthContext"
import {
	createNote,
	deleteNote,
	fetchNoteById,
	replaceNoteTags,
	updateNote,
	updateNoteStatus,
	updateNoteVisibility,
	waterNote,
} from "../utils/notes"
import { searchTaxonomyTags } from "../utils/taxonomy"
import "../styles/pages/note.css"

function NotePage() {
	const {
		noteId,
		initialTagName,
		title,
		setTitle,
		source,
		setSource,
		body,
		setBody,
		createdOn,
		setCreatedOn,
		lastWatered,
		setLastWatered,
		status,
		setStatus,
		visibility,
		setVisibility,
		handleTagNavigation,
		tags,
		tagInput,
		setTagInput,
		handleTagKeyDown,
		addTag,
		setTags,
		removeTag,
	} = useNotePageState()
	const navigate = useNavigate()
	const { authUser } = useAuth()

	const [isOptionsOpen, setIsOptionsOpen] = useState(false)
	const [isVisibilityMenuOpen, setIsVisibilityMenuOpen] = useState(false)
	const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false)
	const [activeNoteId, setActiveNoteId] = useState(noteId)
	const [isLoading, setIsLoading] = useState(Boolean(noteId))
	const [isSaving, setIsSaving] = useState(false)
	const [error, setError] = useState("")
	const [tagSuggestions, setTagSuggestions] = useState([])

	const optionsMenuRef = useRef(null)
	const visibilityMenuRef = useRef(null)
	const statusMenuRef = useRef(null)
	const bodyTextareaRef = useRef(null)

	useDismiss({ refs: [optionsMenuRef], isOpen: isOptionsOpen, onDismiss: () => setIsOptionsOpen(false) })
	useDismiss({ refs: [visibilityMenuRef], isOpen: isVisibilityMenuOpen, onDismiss: () => setIsVisibilityMenuOpen(false) })
	useDismiss({ refs: [statusMenuRef], isOpen: isStatusMenuOpen, onDismiss: () => setIsStatusMenuOpen(false) })

	useEffect(() => {
		if (!bodyTextareaRef.current) {
			return
		}

		bodyTextareaRef.current.style.height = "auto"
		bodyTextareaRef.current.style.height = `${bodyTextareaRef.current.scrollHeight}px`
	}, [body])

	useEffect(() => {
		let isMounted = true

		const loadNote = async () => {
			if (!noteId || !authUser?.token) {
				setIsLoading(false)
				return
			}

			setIsLoading(true)
			setError("")

			try {
				const note = await fetchNoteById(authUser.token, noteId)
				if (!isMounted) {
					return
				}

				setActiveNoteId(note.id)
				setTitle(note.title)
				setBody(note.body)
				setSource(note.source)
				setCreatedOn(note.createdOn)
				setLastWatered(note.lastWatered)
				setStatus(note.status)
				setVisibility(note.visibility)
				setTags(note.tags)
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

		loadNote()

		return () => {
			isMounted = false
		}
	}, [
		authUser?.token,
		noteId,
		setBody,
		setCreatedOn,
		setLastWatered,
		setSource,
		setStatus,
		setTags,
		setTitle,
		setVisibility,
	])

	const handleSave = async () => {
		if (!authUser?.token || isSaving) {
			return
		}

		setIsSaving(true)
		setError("")

		try {
			const normalizedTitle = title.trim() || "Untitled note"
			const normalizedBody = body.trim()
			const normalizedSource = source.trim()

			const currentNote = activeNoteId
				? await updateNote(authUser.token, activeNoteId, {
					title: normalizedTitle,
					body: normalizedBody,
				  })
				: await createNote(authUser.token, {
					title: normalizedTitle,
					body: normalizedBody,
					source: normalizedSource,
				  })

			await replaceNoteTags(authUser.token, currentNote.id, tags)

			setActiveNoteId(currentNote.id)
			navigate(`/note?noteId=${encodeURIComponent(currentNote.id)}`, {
				replace: true,
				state: {
					noteId: currentNote.id,
					noteTitle: normalizedTitle,
					tagName: tags[0] || "Garden",
					tags,
				},
			})
		} catch (saveError) {
			setError(saveError.message)
		} finally {
			setIsSaving(false)
		}
	}

	const handleTagInputChange = async (event) => {
		const nextValue = event.target.value
		setTagInput(nextValue)

		if (!authUser?.token || nextValue.trim().length < 2) {
			setTagSuggestions([])
			return
		}

		try {
			const suggestions = await searchTaxonomyTags(authUser.token, nextValue)
			setTagSuggestions(suggestions)
		} catch {
			setTagSuggestions([])
		}
	}

	const handleTagSuggestionSelect = (path) => {
		addTag(path)
		setTagSuggestions([])
	}

	const handleDelete = async () => {
		if (!authUser?.token || !activeNoteId) {
			return
		}

		try {
			await deleteNote(authUser.token, activeNoteId)
			navigate("/garden", { state: { view: "list" } })
		} catch (deleteError) {
			setError(deleteError.message)
		}
	}

	const handleWater = async () => {
		if (!authUser?.token || !activeNoteId) {
			return
		}

		try {
			const watered = await waterNote(authUser.token, activeNoteId)
			setLastWatered(watered.lastWatered)
			setStatus(watered.status)
			setVisibility(watered.visibility)
		} catch (waterError) {
			setError(waterError.message)
		}
	}

	const handleStatusChange = async (nextStatus) => {
		setStatus(nextStatus)
		setIsStatusMenuOpen(false)

		if (!authUser?.token || !activeNoteId) {
			return
		}

		try {
			const updated = await updateNoteStatus(authUser.token, activeNoteId, nextStatus)
			setStatus(updated.status)
		} catch (statusError) {
			setError(statusError.message)
		}
	}

	const handleVisibilityChange = async (nextVisibility) => {
		setVisibility(nextVisibility)
		setIsVisibilityMenuOpen(false)

		if (!authUser?.token || !activeNoteId) {
			return
		}

		try {
			const updated = await updateNoteVisibility(authUser.token, activeNoteId, nextVisibility)
			setVisibility(updated.visibility)
		} catch (visibilityError) {
			setError(visibilityError.message)
		}
	}

	return (
		<Layout>
			<div className="note-page">
				{isLoading ? <p className="note-page__status-message">Loading note...</p> : null}
				{error ? <p className="note-page__status-message note-page__status-message--error">{error}</p> : null}

				<div ref={optionsMenuRef}>
					<NoteHeader
						initialTagName={initialTagName}
						title={title}
						isOptionsOpen={isOptionsOpen}
						onToggleOptions={() => setIsOptionsOpen((isOpen) => !isOpen)}
						onNavigateToTag={handleTagNavigation}
					/>
				</div>

				<section className="note-page__content" aria-label="Note content">
					<div className="note-page__line-field">
						<input
							type="text"
							className="note-page__line-input note-page__line-input--title"
							value={title}
							onChange={(event) => setTitle(event.target.value)}
							placeholder="Note title"
							aria-label="Note title"
						/>
					</div>
					<NoteMeta
						source={source}
						onSourceChange={(event) => setSource(event.target.value)}
						createdOn={createdOn}
						onCreatedOnChange={(event) => setCreatedOn(event.target.value)}
						lastWatered={lastWatered}
						onLastWateredChange={(event) => setLastWatered(event.target.value)}
						tags={tags}
						tagInput={tagInput}
						onTagInputChange={handleTagInputChange}
						onTagInputKeyDown={handleTagKeyDown}
						onRemoveTag={removeTag}
						tagSuggestions={tagSuggestions}
						onSelectTagSuggestion={handleTagSuggestionSelect}
					/>
					<NoteEditor
						body={body}
						onBodyChange={(event) => setBody(event.target.value)}
						bodyRef={bodyTextareaRef}
					/>
				</section>

				<footer className="note-page__actions" aria-label="Note actions">
					<Button type="button" className="note-page__action-btn" onClick={handleSave} disabled={isSaving}>
						{isSaving ? "Saving..." : "Save note"}
					</Button>
					<Button type="button" variant="secondary" className="note-page__action-btn" onClick={handleWater}>
						Water
					</Button>
					<Button type="button" variant="danger" className="note-page__action-btn note-page__action-btn--danger" onClick={handleDelete}>Delete note</Button>

					<div className="note-page__dropdown-wrap" ref={visibilityMenuRef}>
						<Button
							type="button"
							variant="secondary"
							className="note-page__action-btn"
							onClick={() => {
								setIsVisibilityMenuOpen((isOpen) => !isOpen)
								setIsStatusMenuOpen(false)
							}}
						>
							Visibility: {visibility.toLowerCase()}
						</Button>
						{isVisibilityMenuOpen && (
							<div className="note-page__action-menu" role="menu">
								<Button
									type="button"
									variant="secondary"
									className="note-page__action-menu-item"
									onClick={() => handleVisibilityChange("Public")}
								>
									Public
								</Button>
								<Button
									type="button"
									variant="secondary"
									className="note-page__action-menu-item"
									onClick={() => handleVisibilityChange("Private")}
								>
									Private
								</Button>
							</div>
						)}
					</div>

					<div className="note-page__dropdown-wrap" ref={statusMenuRef}>
						<Button
							type="button"
							variant="secondary"
							className="note-page__action-btn"
							onClick={() => {
								setIsStatusMenuOpen((isOpen) => !isOpen)
								setIsVisibilityMenuOpen(false)
							}}
						>
							Status: {status.toLowerCase()}
						</Button>
						{isStatusMenuOpen && (
							<div className="note-page__action-menu" role="menu">
								<Button
									type="button"
									variant="secondary"
									className="note-page__action-menu-item"
									onClick={() => handleStatusChange("Rough")}
								>
									Rough
								</Button>
								<Button
									type="button"
									variant="secondary"
									className="note-page__action-menu-item"
									onClick={() => handleStatusChange("Polished")}
								>
									Polished
								</Button>
							</div>
						)}
					</div>
				</footer>
			</div>
		</Layout>
	)
}

export default NotePage
