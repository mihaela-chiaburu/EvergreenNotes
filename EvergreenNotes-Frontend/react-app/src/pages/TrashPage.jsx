import { useEffect, useMemo, useRef, useState } from "react"
import Layout from "../components/Layout"
import EmptyTrash from "../components/trash/EmptyTrash"
import TrashList from "../components/trash/TrashList"
import "../styles/pages/trash.css"
import arrowIcon from "../assets/images/arrow-down.png"

const deletedNotes = [
	{
		id: "deleted-note-1",
		title: "Dante Alighieri Divina comedie personaje",
		deletedOn: "04.02.2026"
	},
	{
		id: "deleted-note-2",
		title: "Ecosystem interactions in evergreen forests",
		deletedOn: "12.01.2026"
	},
	{
		id: "deleted-note-3",
		title: "Metaphors in modern poetry",
		deletedOn: "25.02.2026"
	}
]

function TrashPage() {
	const [sortOrder, setSortOrder] = useState("descending")
	const [isSortMenuOpen, setIsSortMenuOpen] = useState(false)
	const sortDropdownRef = useRef(null)

	useEffect(() => {
		function handleClickOutside(event) {
			if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
				setIsSortMenuOpen(false)
			}
		}

		function handleEscapeKey(event) {
			if (event.key === "Escape") {
				setIsSortMenuOpen(false)
			}
		}

		document.addEventListener("mousedown", handleClickOutside)
		document.addEventListener("keydown", handleEscapeKey)

		return () => {
			document.removeEventListener("mousedown", handleClickOutside)
			document.removeEventListener("keydown", handleEscapeKey)
		}
	}, [])

	const sortedDeletedNotes = useMemo(() => {
		const notesCopy = [...deletedNotes]

		notesCopy.sort((firstNote, secondNote) => {
			const [firstDay, firstMonth, firstYear] = firstNote.deletedOn.split(".")
			const [secondDay, secondMonth, secondYear] = secondNote.deletedOn.split(".")

			const firstDate = new Date(Number(firstYear), Number(firstMonth) - 1, Number(firstDay))
			const secondDate = new Date(Number(secondYear), Number(secondMonth) - 1, Number(secondDay))

			if (sortOrder === "ascending") {
				return firstDate - secondDate
			}

			return secondDate - firstDate
		})

		return notesCopy
	}, [sortOrder])

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

						<EmptyTrash />
					</div>
				</div>

				<TrashList notes={sortedDeletedNotes} />
			</div>
		</Layout>
	)
}

export default TrashPage
