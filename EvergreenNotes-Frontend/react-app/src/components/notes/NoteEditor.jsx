import Input from "../ui/Input"

function NoteEditor({ body, onBodyChange, bodyRef, readOnly = false }) {
  return (
    <>
      <textarea
        id="note-page-body"
        ref={bodyRef}
        className="note-page__body-input"
        value={body}
        onChange={onBodyChange}
        placeholder="Start writing your note..."
        readOnly={readOnly}
      />
    </>
  )
}

export default NoteEditor
