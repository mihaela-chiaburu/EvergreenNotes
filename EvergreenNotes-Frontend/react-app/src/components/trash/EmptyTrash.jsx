import trashIcon from "../../assets/images/trash.png"
import "../../styles/components/trash/empty-trash.css"

function EmptyTrash() {
	return (
		<button type="button" className="trash-empty-button">
			<img src={trashIcon} alt="trash icon" className="trash-empty-button__icon" />
			Empty Trash
		</button>
	)
}

export default EmptyTrash
