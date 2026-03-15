import { useMemo, useRef, useState } from "react"
import Layout from "../components/Layout"
import EmptyTrash from "../components/trash/EmptyTrash"
import TrashList from "../components/trash/TrashList"
import "../styles/pages/trash.css"
import arrowIcon from "../assets/images/arrow-down.png"
import { useDismiss } from "../hooks/useDismiss"
import { mockTrashNotes } from "../data/mockTrashNotes"

function TrashPage() {
	const [sortOrder, setSortOrder] = useState("descending")
	const [isSortMenuOpen, setIsSortMenuOpen] = useState(false)
	const sortDropdownRef = useRef(null)

	useDismiss({ refs: [sortDropdownRef], isOpen: isSortMenuOpen, onDismiss: () => setIsSortMenuOpen(false) })

	const sortedDeletedNotes = useMemo(() => {
		const notesCopy = [...mockTrashNotes]

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
