import { useState } from "react"
import "../../styles/components/garden/filter-panel.css"
import arrow from "../../assets/images/arrow-down.png"
import { useTagInput } from "../../hooks/useTagInput"

function GraphSettingsPanel({ setView, isAnotherUserGarden = false }) {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(true)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isDisplayOpen, setIsDisplayOpen] = useState(false)

  const [selectedView, setSelectedView] = useState("graph")

  const [visibilityFilters, setVisibilityFilters] = useState([])
  const [noteStatusFilters, setNoteStatusFilters] = useState([])
  const [careStatusFilters, setCareStatusFilters] = useState([])
  const { tags, tagInput, setTagInput, handleTagKeyDown, removeTag } = useTagInput([])

  const [nodeSize, setNodeSize] = useState(50)
  const [labelFontSize, setLabelFontSize] = useState(16)
  const [showLabels, setShowLabels] = useState(true)

  const toggleCheckboxValue = (value, setter) => {
    setter((previousValues) => {
      if (previousValues.includes(value)) {
        return previousValues.filter((item) => item !== value)
      }

      return [...previousValues, value]
    })
  }

  const handleViewSelection = (viewValue) => {
    setSelectedView(viewValue)

    if (typeof setView === "function") {
      setView(viewValue)
    }
  }

  return (
    <aside
      className={`graph-settings floating-control-panel ${isPanelCollapsed ? "floating-control-panel--collapsed" : ""}`}
      aria-label="Graph settings panel"
    >
      <div className="floating-control-panel__toolbar">
        <span className="floating-control-panel__title">Graph settings</span>
        <button
          type="button"
          className="floating-control-panel__collapse-button"
          onClick={() => setIsPanelCollapsed((isCollapsed) => !isCollapsed)}
          aria-expanded={!isPanelCollapsed}
          aria-label={isPanelCollapsed ? "Expand graph settings panel" : "Minimize graph settings panel"}
        >
          {isPanelCollapsed ? "Expand" : "Minimize"}
        </button>
      </div>

      {!isPanelCollapsed && (
        <>
          <section className="floating-control-panel__section">
        <button
          className="floating-control-panel__header"
          type="button"
          onClick={() => setIsViewOpen((isOpen) => !isOpen)}
          aria-expanded={isViewOpen}
        >
          <span>View</span>
          <img
            src={arrow}
            alt=""
            aria-hidden="true"
            className={`floating-control-panel__arrow ${isViewOpen ? "floating-control-panel__arrow--open" : ""}`}
          />
        </button>

        {isViewOpen && (
          <div className="floating-control-panel__content">
            <div className="floating-control-panel__option-group" role="radiogroup" aria-label="View options">
              <button
                type="button"
                role="radio"
                aria-checked={selectedView === "graph"}
                className={`floating-control-panel__option ${selectedView === "graph" ? "floating-control-panel__option--active" : ""}`}
                onClick={() => handleViewSelection("graph")}
              >
                Graph
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={selectedView === "list"}
                className={`floating-control-panel__option ${selectedView === "list" ? "floating-control-panel__option--active" : ""}`}
                onClick={() => handleViewSelection("list")}
              >
                List
              </button>
            </div>
          </div>
        )}
          </section>

          <section className="floating-control-panel__section">
        <button
          className="floating-control-panel__header"
          type="button"
          onClick={() => setIsFilterOpen((isOpen) => !isOpen)}
          aria-expanded={isFilterOpen}
        >
          <span>Filter</span>
          <img
            src={arrow}
            alt=""
            aria-hidden="true"
            className={`floating-control-panel__arrow ${isFilterOpen ? "floating-control-panel__arrow--open" : ""}`}
          />
        </button>

        {isFilterOpen && (
          <div className="floating-control-panel__content">
            {!isAnotherUserGarden && (
              <div className="floating-control-panel__filter-group floating-control-panel__filter-group--visibility">
                <p className="floating-control-panel__group-title">By visibility</p>
                <label className="floating-control-panel__check-item">
                  <input
                    type="checkbox"
                    checked={visibilityFilters.includes("public")}
                    onChange={() => toggleCheckboxValue("public", setVisibilityFilters)}
                  />
                  <span>Public</span>
                </label>
                <label className="floating-control-panel__check-item">
                  <input
                    type="checkbox"
                    checked={visibilityFilters.includes("private")}
                    onChange={() => toggleCheckboxValue("private", setVisibilityFilters)}
                  />
                  <span>Private</span>
                </label>
              </div>
            )}

            {!isAnotherUserGarden && (
              <div className="floating-control-panel__filter-group">
                <p className="floating-control-panel__group-title">By note status</p>
                <label className="floating-control-panel__check-item">
                  <input
                    type="checkbox"
                    checked={noteStatusFilters.includes("rough")}
                    onChange={() => toggleCheckboxValue("rough", setNoteStatusFilters)}
                  />
                  <span>Rough</span>
                </label>
                <label className="floating-control-panel__check-item">
                  <input
                    type="checkbox"
                    checked={noteStatusFilters.includes("polished")}
                    onChange={() => toggleCheckboxValue("polished", setNoteStatusFilters)}
                  />
                  <span>Polished</span>
                </label>
                <label className="floating-control-panel__check-item">
                  <input
                    type="checkbox"
                    checked={noteStatusFilters.includes("needs-care")}
                    onChange={() => toggleCheckboxValue("needs-care", setNoteStatusFilters)}
                  />
                  <span>Needs care</span>
                </label>
              </div>
            )}

            <div className="floating-control-panel__filter-group">
              <p className="floating-control-panel__group-title">By Care State</p>
              <label className="floating-control-panel__check-item">
                <input
                  type="checkbox"
                  checked={careStatusFilters.includes("fresh")}
                  onChange={() => toggleCheckboxValue("fresh", setCareStatusFilters)}
                />
                <span>Fresh</span>
              </label>
              <label className="floating-control-panel__check-item">
                <input
                  type="checkbox"
                  checked={careStatusFilters.includes("healthy")}
                  onChange={() => toggleCheckboxValue("healthy", setCareStatusFilters)}
                />
                <span>Healthy</span>
              </label>
              <label className="floating-control-panel__check-item">
                <input
                  type="checkbox"
                  checked={careStatusFilters.includes("dry")}
                  onChange={() => toggleCheckboxValue("dry", setCareStatusFilters)}
                />
                <span>Dry</span>
              </label>
            </div>

            <div className="floating-control-panel__filter-group">
              <p className="floating-control-panel__group-title">By Tags</p>
              <div className="floating-control-panel__tags" aria-live="polite">
                {tags.map((tag) => (
                  <span key={tag} className="floating-control-panel__tag">
                    {tag}
                    <button
                      type="button"
                      className="floating-control-panel__tag-remove"
                      onClick={() => removeTag(tag)}
                      aria-label={`Remove tag ${tag}`}
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                className="floating-control-panel__tag-input"
                placeholder="Type a tag and press Enter"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={handleTagKeyDown}
              />
            </div>
          </div>
        )}
          </section>

          <section className="floating-control-panel__section">
        <button
          className="floating-control-panel__header"
          type="button"
          onClick={() => setIsDisplayOpen((isOpen) => !isOpen)}
          aria-expanded={isDisplayOpen}
        >
          <span>Display</span>
          <img
            src={arrow}
            alt=""
            aria-hidden="true"
            className={`floating-control-panel__arrow ${isDisplayOpen ? "floating-control-panel__arrow--open" : ""}`}
          />
        </button>

        {isDisplayOpen && (
          <div className="floating-control-panel__content">
            <label className="floating-control-panel__slider-control">
              <span className="floating-control-panel__slider-title">Node Size: {nodeSize}</span>
              <input
                className="floating-control-panel__slider"
                type="range"
                min="1"
                max="100"
                value={nodeSize}
                onChange={(event) => setNodeSize(Number(event.target.value))}
              />
            </label>

            <label className="floating-control-panel__slider-control">
              <span className="floating-control-panel__slider-title">Label Font Size: {labelFontSize}</span>
              <input
                className="floating-control-panel__slider"
                type="range"
                min="8"
                max="40"
                value={labelFontSize}
                onChange={(event) => setLabelFontSize(Number(event.target.value))}
              />
            </label>

            <div className="floating-control-panel__switch-row">
              <span>Show / Hide Labels</span>
              <label className="floating-control-panel__switch" aria-label="Toggle labels">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={() => setShowLabels((currentValue) => !currentValue)}
                />
                <span className="floating-control-panel__switch-track" />
              </label>
            </div>
          </div>
        )}
          </section>
        </>
      )}
    </aside>
  )
}

export default GraphSettingsPanel