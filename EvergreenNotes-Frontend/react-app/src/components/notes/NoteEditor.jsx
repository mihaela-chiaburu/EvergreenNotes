import { useEffect, useRef, useState } from "react"

const SIZE_OPTIONS = [
  { label: "Small", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Large", value: "4" },
  { label: "Huge", value: "5" },
]

const ALIGNMENT_ACTIONS = [
  { label: "Left", value: "justifyLeft" },
  { label: "Center", value: "justifyCenter" },
  { label: "Right", value: "justifyRight" },
  { label: "Justify", value: "justifyFull" },
]

function NoteEditor({ body, onBodyChange, bodyRef, readOnly = false }) {
  const localRef = useRef(null)
  const fileInputRef = useRef(null)
  const editorRef = bodyRef || localRef
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => {
    if (!editorRef.current) {
      return
    }

    const nextValue = body || ""
    if (editorRef.current.innerHTML !== nextValue) {
      editorRef.current.innerHTML = nextValue
    }
  }, [body, editorRef])

  const applyCommand = (command, value = null) => {
    if (!editorRef.current || readOnly) {
      return
    }

    editorRef.current.focus()
    document.execCommand(command, false, value)
    onBodyChange(editorRef.current.innerHTML)
  }

  const updateBody = () => {
    if (!editorRef.current) {
      return
    }

    onBodyChange(editorRef.current.innerHTML)
  }

  const insertImageAtCursor = (dataUrl) => {
    if (!editorRef.current) {
      return
    }

    const image = document.createElement("img")
    image.src = dataUrl
    image.alt = ""
    image.className = "note-page__image"
    image.style.width = "320px"

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      editorRef.current.appendChild(image)
      updateBody()
      return
    }

    const range = selection.getRangeAt(0)
    range.deleteContents()
    range.insertNode(image)
    range.setStartAfter(image)
    range.setEndAfter(image)
    selection.removeAllRanges()
    selection.addRange(range)
    updateBody()
  }

  const handleImageFiles = (files) => {
    if (!files || files.length === 0) {
      return
    }

    Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .forEach((file) => {
        const reader = new FileReader()
        reader.onload = () => {
          if (typeof reader.result === "string") {
            insertImageAtCursor(reader.result)
          }
        }
        reader.readAsDataURL(file)
      })
  }

  const handleImageUpload = (event) => {
    if (readOnly) {
      return
    }

    handleImageFiles(event.target.files)
    event.target.value = ""
  }

  const handlePaste = (event) => {
    if (readOnly) {
      return
    }

    const items = event.clipboardData?.items
    if (!items || items.length === 0) {
      return
    }

    const imageItems = Array.from(items).filter((item) => item.type.startsWith("image/"))
    if (imageItems.length === 0) {
      return
    }

    event.preventDefault()
    imageItems.forEach((item) => {
      const file = item.getAsFile()
      if (file) {
        handleImageFiles([file])
      }
    })
  }

  const selectImage = (image) => {
    if (selectedImage && selectedImage !== image) {
      selectedImage.classList.remove("note-page__image--selected")
    }

    if (image) {
      image.classList.add("note-page__image--selected")
    }

    setSelectedImage(image)
  }

  const handleSelectionChange = () => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      return
    }

    const node = selection.anchorNode
    if (!node) {
      return
    }

    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement
    if (!element || !editorRef.current?.contains(element)) {
      return
    }

    if (element.tagName === "IMG") {
      selectImage(element)
    } else {
      selectImage(null)
    }
  }

  const handleEditorClick = (event) => {
    if (event.target.tagName === "IMG") {
      selectImage(event.target)
      return
    }

    selectImage(null)
  }

  const handleRemoveImage = () => {
    if (!selectedImage || readOnly) {
      return
    }

    selectedImage.remove()
    selectImage(null)
    updateBody()
  }

  const handleImageResize = (widthValue) => {
    if (!selectedImage || readOnly) {
      return
    }

    selectedImage.style.width = widthValue
    updateBody()
  }

  const handleInput = (event) => {
    if (readOnly) {
      return
    }

    onBodyChange(event.currentTarget.innerHTML)
  }

  const handleKeyDown = (event) => {
    if (!event.ctrlKey && !event.metaKey) {
      if ((event.key === "Backspace" || event.key === "Delete") && selectedImage) {
        event.preventDefault()
        handleRemoveImage()
      }
      return
    }

    const key = event.key.toLowerCase()

    if (key === "b") {
      event.preventDefault()
      applyCommand("bold")
    }

    if (key === "i") {
      event.preventDefault()
      applyCommand("italic")
    }
  }

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange)
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange)
    }
  })

  return (
    <div className="note-page__body-wrap">
      <div className="note-page__toolbar" role="toolbar" aria-label="Text formatting">
        <div className="note-page__toolbar-group">
          <button
            type="button"
            className="note-page__toolbar-button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyCommand("bold")}
            aria-label="Bold"
            disabled={readOnly}
          >
            B
          </button>
          <button
            type="button"
            className="note-page__toolbar-button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyCommand("italic")}
            aria-label="Italic"
            disabled={readOnly}
          >
            I
          </button>
          <button
            type="button"
            className="note-page__toolbar-button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyCommand("underline")}
            aria-label="Underline"
            disabled={readOnly}
          >
            U
          </button>
        </div>

        <div className="note-page__toolbar-group">
          <button
            type="button"
            className="note-page__toolbar-button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyCommand("formatBlock", "blockquote")}
            aria-label="Blockquote"
            disabled={readOnly}
          >
            ""
          </button>
          <button
            type="button"
            className="note-page__toolbar-button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyCommand("insertUnorderedList")}
            aria-label="Bullet list"
            disabled={readOnly}
          >
            UL
          </button>
          <button
            type="button"
            className="note-page__toolbar-button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyCommand("insertOrderedList")}
            aria-label="Numbered list"
            disabled={readOnly}
          >
            1.
          </button>
        </div>

        <div className="note-page__toolbar-group">
          {ALIGNMENT_ACTIONS.map((action) => (
            <button
              key={action.value}
              type="button"
              className="note-page__toolbar-button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyCommand(action.value)}
              aria-label={`${action.label} align`}
              disabled={readOnly}
            >
              {action.label.slice(0, 1)}
            </button>
          ))}
        </div>

        <div className="note-page__toolbar-group">
          <button
            type="button"
            className="note-page__toolbar-button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Insert image"
            disabled={readOnly}
          >
            Img
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="note-page__toolbar-file"
            onChange={handleImageUpload}
            disabled={readOnly}
          />
          <button
            type="button"
            className="note-page__toolbar-button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleRemoveImage}
            aria-label="Remove image"
            disabled={!selectedImage || readOnly}
          >
            Del
          </button>
          <select
            className="note-page__toolbar-select"
            defaultValue="320px"
            onChange={(event) => handleImageResize(event.target.value)}
            disabled={!selectedImage || readOnly}
          >
            <option value="220px">Image: S</option>
            <option value="320px">Image: M</option>
            <option value="480px">Image: L</option>
            <option value="100%">Image: Full</option>
          </select>
          <label className="note-page__toolbar-label" htmlFor="note-editor-color">
            Color
          </label>
          <input
            id="note-editor-color"
            type="color"
            className="note-page__toolbar-color"
            defaultValue="#ffffff"
            onChange={(event) => applyCommand("foreColor", event.target.value)}
            disabled={readOnly}
          />
          <label className="note-page__toolbar-label" htmlFor="note-editor-size">
            Size
          </label>
          <select
            id="note-editor-size"
            className="note-page__toolbar-select"
            defaultValue="3"
            onChange={(event) => applyCommand("fontSize", event.target.value)}
            disabled={readOnly}
          >
            {SIZE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        id="note-page-body"
        ref={editorRef}
        className="note-page__body-input note-page__body-editor"
        contentEditable={!readOnly}
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onClick={handleEditorClick}
        role="textbox"
        aria-multiline="true"
        data-placeholder="Start writing your note..."
        suppressContentEditableWarning
      />
    </div>
  )
}

export default NoteEditor
