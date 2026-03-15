import Input from "../ui/Input"

function NoteEditor({ body, onBodyChange, bodyRef }) {
  return (
    <>
      <textarea
        id="note-page-body"
        ref={bodyRef}
        className="note-page__body-input"
        value={body}
        onChange={onBodyChange}
        placeholder="Start writing your note..."
      />
    </>
  )
}

export default NoteEditor
