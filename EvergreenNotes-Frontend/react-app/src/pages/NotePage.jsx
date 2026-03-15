import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import Layout from "../components/Layout"
import "../styles/pages/note.css"

function getIsoDate(value) {
	if (!value) {
		return ""
	}

	const parsedDate = new Date(value)
	if (Number.isNaN(parsedDate.getTime())) {
		return ""
	}

	return parsedDate.toISOString().slice(0, 10)
}

function getRandomRecentDateIso() {
	const now = new Date()
	const randomDaysAgo = Math.floor(Math.random() * 30)
	now.setDate(now.getDate() - randomDaysAgo)
	return now.toISOString().slice(0, 10)
}

function NotePage() {
	const location = useLocation()
	const navigate = useNavigate()

	const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search])
	const statePayload = location.state ?? {}

	const initialTitle =
		statePayload.noteTitle?.trim() ||
		queryParams.get("title")?.trim() ||
		"Untitled note"

	const initialTagName =
		statePayload.tagName?.trim() ||
		queryParams.get("tag")?.trim() ||
		"Garden"

	const initialSource =
		statePayload.source?.trim() ||
		""

	const fallbackDateIso = getRandomRecentDateIso()
	const initialCreatedOn = getIsoDate(statePayload.createdOn || queryParams.get("createdOn")) || fallbackDateIso
	const initialLastWatered = getIsoDate(statePayload.lastWatered || queryParams.get("lastWatered")) || initialCreatedOn

	const initialTags =
		Array.isArray(statePayload.tags) && statePayload.tags.length > 0
			? statePayload.tags
			: [initialTagName]

	const [title, setTitle] = useState(initialTitle)
	const [source, setSource] = useState(initialSource)
	const [body, setBody] = useState(statePayload.body ?? "")
	const [createdOn, setCreatedOn] = useState(initialCreatedOn)
	const [lastWatered, setLastWatered] = useState(initialLastWatered)
	const [tags, setTags] = useState(initialTags)
	const [tagInput, setTagInput] = useState("")
	const [status, setStatus] = useState("Rough")
	const [visibility, setVisibility] = useState("Private")
	const [isOptionsOpen, setIsOptionsOpen] = useState(false)
	const [isVisibilityMenuOpen, setIsVisibilityMenuOpen] = useState(false)
	const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false)
	const bodyTextareaRef = useRef(null)

	const handleTagNavigation = () => {
		navigate("/garden")
	}

	const handleAddTag = () => {
		const normalizedTag = tagInput.trim()

		if (!normalizedTag) {
			return
		}

		setTags((previousTags) => {
			if (previousTags.some((tag) => tag.toLowerCase() === normalizedTag.toLowerCase())) {
				return previousTags
			}

			return [...previousTags, normalizedTag]
		})
		setTagInput("")
	}

	const handleRemoveTag = (tagToRemove) => {
		setTags((previousTags) => previousTags.filter((tag) => tag !== tagToRemove))
	}

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
				<header className="note-page__top-nav" aria-label="Note navigation">
					<div className="note-page__breadcrumb" role="navigation" aria-label="Note path">
						<button
							type="button"
							className="note-page__tag-link"
							onClick={handleTagNavigation}
						>
							{initialTagName}
						</button>
						<span className="note-page__breadcrumb-separator" aria-hidden="true">/</span>
						<span className="note-page__note-name">{title || "Untitled note"}</span>
					</div>

					<div className="note-page__options-wrap">
						<button
							type="button"
							className="note-page__options-button"
							aria-label="Open note options"
							aria-expanded={isOptionsOpen}
							onClick={() => setIsOptionsOpen((isOpen) => !isOpen)}
						>
							<span className="note-page__options-dot" />
							<span className="note-page__options-dot" />
							<span className="note-page__options-dot" />
						</button>

						{isOptionsOpen && (
							<div className="note-page__options-menu" role="menu">
								<button type="button" className="note-page__options-item" role="menuitem">Duplicate note</button>
								<button type="button" className="note-page__options-item" role="menuitem">Move to another tag</button>
								<button type="button" className="note-page__options-item" role="menuitem">View note history</button>
							</div>
						)}
					</div>
				</header>

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

					<div className="note-page__line-field note-page__line-field--source">
						<span className="note-page__line-label">Source:</span>
						<input
							type="text"
							className="note-page__line-input"
							value={source}
							onChange={(event) => setSource(event.target.value)}
							aria-label="Source"
						/>
					</div>

					<div className="note-page__line-field note-page__line-field--meta">
						<label className="note-page__meta-group" htmlFor="note-page-created-on">
							<span>Created on:</span>
							<input
								id="note-page-created-on"
								type="date"
								className="note-page__meta-input"
								value={createdOn}
								onChange={(event) => setCreatedOn(event.target.value)}
							/>
						</label>
						<span className="note-page__meta-divider" aria-hidden="true">|</span>
						<label className="note-page__meta-group" htmlFor="note-page-last-watered">
							<span>Last watered:</span>
							<input
								id="note-page-last-watered"
								type="date"
								className="note-page__meta-input"
								value={lastWatered}
								onChange={(event) => setLastWatered(event.target.value)}
							/>
						</label>
					</div>

					<div className="note-page__tags-row" aria-label="Note tags">
						<span className="note-page__line-label">Tags:</span>
						<div className="note-page__tags-list">
							{tags.map((tag) => (
								<span key={tag} className="note-page__tag-pill">
									{tag}
									<button
										type="button"
										className="note-page__tag-remove"
										onClick={() => handleRemoveTag(tag)}
										aria-label={`Remove tag ${tag}`}
									>
										x
									</button>
								</span>
							))}
							<input
								type="text"
								className="note-page__tag-input"
								placeholder="Add tag"
								value={tagInput}
								onChange={(event) => setTagInput(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === "Enter") {
										event.preventDefault()
										handleAddTag()
									}
								}}
							/>
						</div>
					</div>

					<textarea
						id="note-page-body"
						ref={bodyTextareaRef}
						className="note-page__body-input"
						value={body}
						onChange={(event) => setBody(event.target.value)}
						placeholder="Start writing your note..."
					/>
				</section>

				<footer className="note-page__actions" aria-label="Note actions">
					<button type="button" className="note-page__action-btn note-page__action-btn--danger">Delete note</button>

					<div className="note-page__dropdown-wrap">
						<button
							type="button"
							className="note-page__action-btn"
							onClick={() => {
								setIsVisibilityMenuOpen((isOpen) => !isOpen)
								setIsStatusMenuOpen(false)
							}}
						>
							Visibility: {visibility.toLowerCase()}
						</button>
						{isVisibilityMenuOpen && (
							<div className="note-page__action-menu" role="menu">
								<button
									type="button"
									className="note-page__action-menu-item"
									onClick={() => {
										setVisibility("Public")
										setIsVisibilityMenuOpen(false)
									}}
								>
									Public
								</button>
								<button
									type="button"
									className="note-page__action-menu-item"
									onClick={() => {
										setVisibility("Private")
										setIsVisibilityMenuOpen(false)
									}}
								>
									Private
								</button>
							</div>
						)}
					</div>

					<div className="note-page__dropdown-wrap">
						<button
							type="button"
							className="note-page__action-btn"
							onClick={() => {
								setIsStatusMenuOpen((isOpen) => !isOpen)
								setIsVisibilityMenuOpen(false)
							}}
						>
							Status: {status.toLowerCase()}
						</button>
						{isStatusMenuOpen && (
							<div className="note-page__action-menu" role="menu">
								<button
									type="button"
									className="note-page__action-menu-item"
									onClick={() => {
										setStatus("Rough")
										setIsStatusMenuOpen(false)
									}}
								>
									Rough
								</button>
								<button
									type="button"
									className="note-page__action-menu-item"
									onClick={() => {
										setStatus("Polished")
										setIsStatusMenuOpen(false)
									}}
								>
									Polished
								</button>
							</div>
						)}
					</div>
				</footer>
			</div>
		</Layout>
	)
}

export default NotePage
