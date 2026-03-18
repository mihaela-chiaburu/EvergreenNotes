import trashIcon from "../../assets/images/trash.png"
import "../../styles/components/trash/empty-trash.css"

function EmptyTrash({ onClick, disabled = false, isLoading = false }) {
	return (
		<button type="button" className="trash-empty-button" onClick={onClick} disabled={disabled || isLoading}>
			<img src={trashIcon} alt="trash icon" className="trash-empty-button__icon" />
			{isLoading ? "Emptying..." : "Empty Trash"}
		</button>
	)
}

export default EmptyTrash
