import "/src/styles/add-note-input.css"

function AddNoteInput() {
  return (
    <div className="add-note-input">
      <div className="add-note-input__icon" aria-hidden="true">+</div>
      <input 
        type="text" 
        placeholder="New Seed..." 
        className="add-note-input__input" 
      />
    </div>
  )
}

export default AddNoteInput