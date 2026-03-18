import { useEffect, useMemo, useRef, useState } from "react"
import Layout from "../components/Layout"
import EmptyTrash from "../components/trash/EmptyTrash"
import TrashList from "../components/trash/TrashList"
import "../styles/pages/trash.css"
import arrowIcon from "../assets/images/arrow-down.png"
import { useDismiss } from "../hooks/useDismiss"
import { useAuth } from "../context/AuthContext"
import { emptyTrash, fetchDeletedNotes, permanentlyDeleteNote, restoreDeletedNote } from "../utils/notes"

function TrashPage() {
	const { authUser } = useAuth()
	const [sortOrder, setSortOrder] = useState("descending")
	const [isSortMenuOpen, setIsSortMenuOpen] = useState(false)
	const [deletedNotes, setDeletedNotes] = useState([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState("")
	const [activeNoteActionId, setActiveNoteActionId] = useState("")
	const [isEmptyingTrash, setIsEmptyingTrash] = useState(false)
	const sortDropdownRef = useRef(null)

	useDismiss({ refs: [sortDropdownRef], isOpen: isSortMenuOpen, onDismiss: () => setIsSortMenuOpen(false) })

	useEffect(() => {
		let isMounted = true

		const loadDeletedNotes = async () => {
			if (!authUser?.token) {
				if (isMounted) {
					setDeletedNotes([])
					setIsLoading(false)
				}
				return
			}

			setIsLoading(true)
			setError("")

			try {
				const notes = await fetchDeletedNotes(authUser.token)
				if (isMounted) {
					setDeletedNotes(notes)
				}
			} catch (loadError) {
				if (isMounted) {
					setError(loadError instanceof Error ? loadError.message : "Could not load trash.")
					setDeletedNotes([])
				}
			} finally {
				if (isMounted) {
					setIsLoading(false)
				}
			}
		}

		loadDeletedNotes()

		return () => {
			isMounted = false
		}
	}, [authUser?.token])

	const handleRestoreNote = async (noteId) => {
		if (!authUser?.token || activeNoteActionId) {
			return
		}

		setError("")
		setActiveNoteActionId(noteId)

		try {
			await restoreDeletedNote(authUser.token, noteId)
			setDeletedNotes((previousNotes) => previousNotes.filter((note) => note.id !== noteId))
		} catch (restoreError) {
			setError(restoreError instanceof Error ? restoreError.message : "Could not restore note.")
		} finally {
			setActiveNoteActionId("")
		}
	}

	const handlePermanentDelete = async (noteId) => {
		if (!authUser?.token || activeNoteActionId) {
			return
		}

		setError("")
		setActiveNoteActionId(noteId)

		try {
			await permanentlyDeleteNote(authUser.token, noteId)
			setDeletedNotes((previousNotes) => previousNotes.filter((note) => note.id !== noteId))
		} catch (deleteError) {
			setError(deleteError instanceof Error ? deleteError.message : "Could not delete note permanently.")
		} finally {
			setActiveNoteActionId("")
		}
	}

	const handleEmptyTrash = async () => {
		if (!authUser?.token || deletedNotes.length === 0 || isEmptyingTrash) {
			return
		}

		setError("")
		setIsEmptyingTrash(true)

		try {
			await emptyTrash(authUser.token)
			setDeletedNotes([])
		} catch (emptyError) {
			setError(emptyError instanceof Error ? emptyError.message : "Could not empty trash.")
		} finally {
			setIsEmptyingTrash(false)
		}
	}

	const sortedDeletedNotes = useMemo(() => {
		const notesCopy = [...deletedNotes]

		notesCopy.sort((firstNote, secondNote) => {
			const firstDate = new Date(firstNote.deletedAt || firstNote.createdOn)
			const secondDate = new Date(secondNote.deletedAt || secondNote.createdOn)

			if (sortOrder === "ascending") {
				return firstDate - secondDate
			}

			return secondDate - firstDate
		})

		return notesCopy
	}, [deletedNotes, sortOrder])

	return (
		<Layout>
			<div className="trash-page">
				<div className="trash-page__header">
					<div className="trash-page__copy">
						<p className="trash-page__title">Trash</p>
						<p className="trash-page__subtitle">These notes will be deleted after 30 days.</p>
					</div>

					<div className="trash-page__controls">
						<div className="trash-sort" ref={sortDropdownRef}>
							<button
								type="button"
								className="trash-sort__toggle"
								onClick={() => setIsSortMenuOpen((previousState) => !previousState)}
								aria-haspopup="menu"
								aria-expanded={isSortMenuOpen}
							>
								Sort by deletion date
								<img
									src={arrowIcon}
									alt=""
									aria-hidden="true"
									className={`trash-sort__arrow ${isSortMenuOpen ? "trash-sort__arrow--open" : ""}`}
								/>
							</button>

							{isSortMenuOpen && (
								<div className="trash-sort__menu" role="menu" aria-label="Sort deleted notes">
									<button
										type="button"
										className="trash-sort__item"
										onClick={() => {
											setSortOrder("ascending")
											setIsSortMenuOpen(false)
										}}
										role="menuitem"
									>
										Ascending
									</button>
									<button
										type="button"
										className="trash-sort__item"
										onClick={() => {
											setSortOrder("descending")
											setIsSortMenuOpen(false)
										}}
										role="menuitem"
									>
										Descending
									</button>
								</div>
							)}
						</div>

						<EmptyTrash
							onClick={handleEmptyTrash}
							disabled={deletedNotes.length === 0}
							isLoading={isEmptyingTrash}
						/>
					</div>
				</div>

				{error && <p className="trash-page__error">{error}</p>}
				{isLoading && <p className="trash-page__status">Loading deleted notes...</p>}
				{!isLoading && sortedDeletedNotes.length === 0 && <p className="trash-page__status">Trash is empty.</p>}

				{!isLoading && sortedDeletedNotes.length > 0 && (
					<TrashList
						notes={sortedDeletedNotes}
						onDeletePermanent={handlePermanentDelete}
						onRestore={handleRestoreNote}
						activeNoteActionId={activeNoteActionId}
					/>
				)}
			</div>
		</Layout>
	)
}

export default TrashPage
