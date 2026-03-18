import trashIcon from "../../assets/images/trash.png"
import restoreIcon from "../../assets/images/reset (1).png"
import "../../styles/components/trash/trash-list.css"

function TrashList({ notes, onDeletePermanent, onRestore, activeNoteActionId = "" }) {
	return (
		<ul className="trash-list" aria-label="Deleted notes">
			{notes.map((note) => {
				const isNoteActionPending = activeNoteActionId === note.id

				return (
				<li key={note.id} className="trash-list__card">
					<div className="trash-list__content">
						<p className="trash-list__title">{note.title}</p>
						<p className="trash-list__subtitle">Deleted on: {note.deletedOn}</p>
					</div>

					<div className="trash-list__actions">
						<button
							type="button"
							className={`trash-list__icon-button ${isNoteActionPending ? "trash-list__icon-button--disabled" : ""}`}
							aria-label="Delete permanently"
							onClick={() => onDeletePermanent(note.id)}
							disabled={isNoteActionPending}
						>
							<img src={trashIcon} alt="" aria-hidden="true" className="trash-list__icon" />
						</button>
						<button
							type="button"
							className={`trash-list__icon-button ${isNoteActionPending ? "trash-list__icon-button--disabled" : ""}`}
							aria-label="Restore note"
							onClick={() => onRestore(note.id)}
							disabled={isNoteActionPending}
						>
							<img src={restoreIcon} alt="" aria-hidden="true" className="trash-list__icon" />
						</button>
					</div>
				</li>
				)
			})}
		</ul>
	)
}

export default TrashList
