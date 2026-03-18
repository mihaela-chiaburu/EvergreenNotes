import { useState } from "react"
import "../../styles/components/explore/explore-filter.css"

function FilterPanel({ filters, onFiltersChange }) {
  const [tagInput, setTagInput] = useState("")
  const [stateFilters, setStateFilters] = useState([])
  const tags = Array.isArray(filters?.tags) ? filters.tags : []
  const minNotes = filters?.minNotes ?? ""
  const maxNotes = filters?.maxNotes ?? ""

  const toggleCheckboxValue = (value) => {
    setStateFilters((previousValues) => {
      if (previousValues.includes(value)) {
        return previousValues.filter((item) => item !== value)
      }

      return [...previousValues, value]
    })
  }

  const addTag = (rawValue) => {
    const normalizedTag = rawValue.trim()

    if (!normalizedTag) {
      return
    }

    const alreadyExists = tags.some((tag) => tag.toLowerCase() === normalizedTag.toLowerCase())

    if (alreadyExists) {
      setTagInput("")
      return
    }

    onFiltersChange({ tags: [...tags, normalizedTag] })
    setTagInput("")
  }

  const handleTagKeyDown = (event) => {
    if (event.key !== "Enter") {
      return
    }

    event.preventDefault()
    addTag(tagInput)
  }

  const removeTag = (tagToRemove) => {
    onFiltersChange({
      tags: tags.filter((tag) => tag !== tagToRemove),
    })
  }

  const handleMinNotesChange = (event) => {
    onFiltersChange({ minNotes: event.target.value })
  }

  const handleMaxNotesChange = (event) => {
    onFiltersChange({ maxNotes: event.target.value })
  }

  return (
    <aside className="explore-filter-panel" aria-label="Explore filters">
      <div className="explore-filter-panel__header">
        <h3 className="explore-filter-panel__title">Filter</h3>
      </div>

      <section className="explore-filter-panel__section">
        <p className="explore-filter-panel__section-title">Number of notes</p>
        <div className="explore-filter-panel__range">
          <input
            type="number"
            min="0"
            className="explore-filter-panel__range-input"
            placeholder="Min"
            value={minNotes}
            onChange={handleMinNotesChange}
          />
          <span className="explore-filter-panel__range-dash" aria-hidden="true">
            -
          </span>
          <input
            type="number"
            min="0"
            className="explore-filter-panel__range-input"
            placeholder="Max"
            value={maxNotes}
            onChange={handleMaxNotesChange}
          />
        </div>
      </section>

      <section className="explore-filter-panel__section">
        <p className="explore-filter-panel__section-title">Tags</p>
        {tags.length > 0 && (
          <div className="explore-filter-panel__tags" aria-live="polite">
            {tags.map((tag) => (
              <span key={tag} className="explore-filter-panel__tag">
                {tag}
                <button
                  type="button"
                  className="explore-filter-panel__tag-remove"
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove tag ${tag}`}
                >
                  x
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          type="text"
          className="explore-filter-panel__tag-input"
          placeholder="Type a tag and press Enter"
          value={tagInput}
          onChange={(event) => setTagInput(event.target.value)}
          onKeyDown={handleTagKeyDown}
        />
      </section>

      <section className="explore-filter-panel__section">
        <p className="explore-filter-panel__section-title">State</p>
        <div className="explore-filter-panel__checkbox-group">
          <label className="explore-filter-panel__check-item">
            <input
              type="checkbox"
              checked={stateFilters.includes("new")}
              onChange={() => toggleCheckboxValue("new")}
            />
            <span>New</span>
          </label>
          <label className="explore-filter-panel__check-item">
            <input
              type="checkbox"
              checked={stateFilters.includes("growing")}
              onChange={() => toggleCheckboxValue("growing")}
            />
            <span>Growing</span>
          </label>
          <label className="explore-filter-panel__check-item">
            <input
              type="checkbox"
              checked={stateFilters.includes("big")}
              onChange={() => toggleCheckboxValue("big")}
            />
            <span>Big</span>
          </label>
        </div>
      </section>
    </aside>
  )
}

export default FilterPanel