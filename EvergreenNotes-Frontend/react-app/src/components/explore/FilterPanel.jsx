import { useState } from "react"
import "../../styles/components/explore/explore-filter.css"
import { useTagInput } from "../../hooks/useTagInput"

function FilterPanel() {
  const [minNotes, setMinNotes] = useState("")
  const [maxNotes, setMaxNotes] = useState("")
  const [stateFilters, setStateFilters] = useState([])
  const { tags, tagInput, setTagInput, handleTagKeyDown, removeTag } = useTagInput([])

  const toggleCheckboxValue = (value, setter) => {
    setter((previousValues) => {
      if (previousValues.includes(value)) {
        return previousValues.filter((item) => item !== value)
      }

      return [...previousValues, value]
    })
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
            onChange={(event) => setMinNotes(event.target.value)}
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
            onChange={(event) => setMaxNotes(event.target.value)}
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
              onChange={() => toggleCheckboxValue("new", setStateFilters)}
            />
            <span>New</span>
          </label>
          <label className="explore-filter-panel__check-item">
            <input
              type="checkbox"
              checked={stateFilters.includes("growing")}
              onChange={() => toggleCheckboxValue("growing", setStateFilters)}
            />
            <span>Growing</span>
          </label>
          <label className="explore-filter-panel__check-item">
            <input
              type="checkbox"
              checked={stateFilters.includes("big")}
              onChange={() => toggleCheckboxValue("big", setStateFilters)}
            />
            <span>Big</span>
          </label>
        </div>
      </section>
    </aside>
  )
}

export default FilterPanel