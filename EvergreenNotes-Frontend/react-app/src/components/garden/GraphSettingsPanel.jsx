import { useState } from "react"
import "../../styles/components/garden/filter-panel.css"
import arrow from "../../assets/images/arrow-down.png"

const DEFAULT_GRAPH_SETTINGS = {
  filters: {
    visibility: [],
    noteStatus: [],
    careStatus: [],
    tags: [],
  },
  display: {
    nodeSize: 50,
    labelFontSize: 16,
    showLabels: true,
  },
}

function GraphSettingsPanel({
  setView,
  isAnotherUserGarden = false,
  graphSettings = DEFAULT_GRAPH_SETTINGS,
  onGraphSettingsChange,
}) {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(true)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isDisplayOpen, setIsDisplayOpen] = useState(false)

  const [selectedView, setSelectedView] = useState("graph")
  const [tagInput, setTagInput] = useState("")

  const visibilityFilters = graphSettings?.filters?.visibility || []
  const noteStatusFilters = graphSettings?.filters?.noteStatus || []
  const careStatusFilters = graphSettings?.filters?.careStatus || []
  const tags = graphSettings?.filters?.tags || []
  const nodeSize = graphSettings?.display?.nodeSize ?? DEFAULT_GRAPH_SETTINGS.display.nodeSize
  const labelFontSize = graphSettings?.display?.labelFontSize ?? DEFAULT_GRAPH_SETTINGS.display.labelFontSize
  const showLabels = graphSettings?.display?.showLabels ?? DEFAULT_GRAPH_SETTINGS.display.showLabels

  const updateGraphSettings = (updater) => {
    if (typeof onGraphSettingsChange !== "function") {
      return
    }

    onGraphSettingsChange((previousSettings) => {
      const safePrevious = previousSettings || DEFAULT_GRAPH_SETTINGS
      return updater(safePrevious)
    })
  }

  const toggleFilterValue = (value, filterKey) => {
    updateGraphSettings((previousSettings) => {
      const previousValues = previousSettings?.filters?.[filterKey] || []
      if (previousValues.includes(value)) {
        return {
          ...previousSettings,
          filters: {
            ...previousSettings.filters,
            [filterKey]: previousValues.filter((item) => item !== value),
          },
        }
      }

      return {
        ...previousSettings,
        filters: {
          ...previousSettings.filters,
          [filterKey]: [...previousValues, value],
        },
      }
    })
  }

  const addTagFilter = () => {
    const normalizedTag = tagInput.trim()
    const normalizedTagSet = new Set(tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean))

    if (!normalizedTag || normalizedTagSet.has(normalizedTag.toLowerCase())) {
      return
    }

    updateGraphSettings((previousSettings) => ({
      ...previousSettings,
      filters: {
        ...previousSettings.filters,
        tags: [...(previousSettings.filters?.tags || []), normalizedTag],
      },
    }))
    setTagInput("")
  }

  const handleTagKeyDown = (event) => {
    if (event.key !== "Enter") {
      return
    }

    event.preventDefault()
    addTagFilter()
  }

  const removeTag = (tagToRemove) => {
    updateGraphSettings((previousSettings) => ({
      ...previousSettings,
      filters: {
        ...previousSettings.filters,
        tags: (previousSettings.filters?.tags || []).filter((tag) => tag !== tagToRemove),
      },
    }))
  }

  const updateDisplaySetting = (displayKey, value) => {
    updateGraphSettings((previousSettings) => ({
      ...previousSettings,
      display: {
        ...previousSettings.display,
        [displayKey]: value,
      },
    }))
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
        <div className="floating-control-panel__body">
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
                    onChange={() => toggleFilterValue("public", "visibility")}
                  />
                  <span>Public</span>
                </label>
                <label className="floating-control-panel__check-item">
                  <input
                    type="checkbox"
                    checked={visibilityFilters.includes("private")}
                    onChange={() => toggleFilterValue("private", "visibility")}
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
                    onChange={() => toggleFilterValue("rough", "noteStatus")}
                  />
                  <span>Rough</span>
                </label>
                <label className="floating-control-panel__check-item">
                  <input
                    type="checkbox"
                    checked={noteStatusFilters.includes("polished")}
                    onChange={() => toggleFilterValue("polished", "noteStatus")}
                  />
                  <span>Polished</span>
                </label>
                <label className="floating-control-panel__check-item">
                  <input
                    type="checkbox"
                    checked={noteStatusFilters.includes("needs-care")}
                    onChange={() => toggleFilterValue("needs-care", "noteStatus")}
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
                  onChange={() => toggleFilterValue("fresh", "careStatus")}
                />
                <span>Fresh</span>
              </label>
              <label className="floating-control-panel__check-item">
                <input
                  type="checkbox"
                  checked={careStatusFilters.includes("healthy")}
                  onChange={() => toggleFilterValue("healthy", "careStatus")}
                />
                <span>Healthy</span>
              </label>
              <label className="floating-control-panel__check-item">
                <input
                  type="checkbox"
                  checked={careStatusFilters.includes("pale")}
                  onChange={() => toggleFilterValue("pale", "careStatus")}
                />
                <span>Pale</span>
              </label>
              <label className="floating-control-panel__check-item">
                <input
                  type="checkbox"
                  checked={careStatusFilters.includes("dry")}
                  onChange={() => toggleFilterValue("dry", "careStatus")}
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
                onChange={(event) => updateDisplaySetting("nodeSize", Number(event.target.value))}
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
                onChange={(event) => updateDisplaySetting("labelFontSize", Number(event.target.value))}
              />
            </label>

            <div className="floating-control-panel__switch-row">
              <span>Show / Hide Labels</span>
              <label className="floating-control-panel__switch" aria-label="Toggle labels">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={() => updateDisplaySetting("showLabels", !showLabels)}
                />
                <span className="floating-control-panel__switch-track" />
              </label>
            </div>
          </div>
        )}
          </section>
        </div>
      )}
    </aside>
  )
}

export default GraphSettingsPanel