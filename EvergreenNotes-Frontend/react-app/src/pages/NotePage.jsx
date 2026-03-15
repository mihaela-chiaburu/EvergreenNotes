import { useEffect, useRef, useState } from "react"
import Layout from "../components/Layout"
import Button from "../components/ui/Button"
import NoteHeader from "../components/notes/NoteHeader"
import NoteMeta from "../components/notes/NoteMeta"
import NoteEditor from "../components/notes/NoteEditor"
import { useDismiss } from "../hooks/useDismiss"
import { useNotePageState } from "../hooks/useNotePageState"
import "../styles/pages/note.css"

function NotePage() {
	const {
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
		removeTag,
	} = useNotePageState()

	const [isOptionsOpen, setIsOptionsOpen] = useState(false)
	const [isVisibilityMenuOpen, setIsVisibilityMenuOpen] = useState(false)
	const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false)

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

	return (
		<Layout>
			<div className="note-page">
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
						onTagInputChange={(event) => setTagInput(event.target.value)}
						onTagInputKeyDown={handleTagKeyDown}
						onRemoveTag={removeTag}
					/>
					<NoteEditor
						body={body}
						onBodyChange={(event) => setBody(event.target.value)}
						bodyRef={bodyTextareaRef}
					/>
				</section>

				<footer className="note-page__actions" aria-label="Note actions">
					<Button type="button" variant="danger" className="note-page__action-btn note-page__action-btn--danger">Delete note</Button>

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
									onClick={() => {
										setVisibility("Public")
										setIsVisibilityMenuOpen(false)
									}}
								>
									Public
								</Button>
								<Button
									type="button"
									variant="secondary"
									className="note-page__action-menu-item"
									onClick={() => {
										setVisibility("Private")
										setIsVisibilityMenuOpen(false)
									}}
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
									onClick={() => {
										setStatus("Rough")
										setIsStatusMenuOpen(false)
									}}
								>
									Rough
								</Button>
								<Button
									type="button"
									variant="secondary"
									className="note-page__action-menu-item"
									onClick={() => {
										setStatus("Polished")
										setIsStatusMenuOpen(false)
									}}
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
