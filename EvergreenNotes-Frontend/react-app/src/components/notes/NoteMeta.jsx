import Input from "../ui/Input"

function NoteMeta({
  source,
  onSourceChange,
  createdOn,
  onCreatedOnChange,
  lastWatered,
  onLastWateredChange,
  tags,
  tagInput,
  onTagInputChange,
  onTagInputKeyDown,
  onRemoveTag,
  tagSuggestions = [],
  onSelectTagSuggestion,
}) {
  return (
    <>
      <div className="note-page__line-field note-page__line-field--source">
        <span className="note-page__line-label">Source:</span>
        <Input
          type="text"
          className="note-page__line-input"
          value={source}
          onChange={onSourceChange}
          aria-label="Source"
          inputClassName="input--unstyled"
        />
      </div>

      <div className="note-page__line-field note-page__line-field--meta">
        <label className="note-page__meta-group" htmlFor="note-page-created-on">
          <span>Created on:</span>
          <Input
            id="note-page-created-on"
            type="date"
            className="note-page__meta-input"
            value={createdOn}
            onChange={onCreatedOnChange}
            inputClassName="input--unstyled"
          />
        </label>
        <span className="note-page__meta-divider" aria-hidden="true">|</span>
        <label className="note-page__meta-group" htmlFor="note-page-last-watered">
          <span>Last watered:</span>
          <Input
            id="note-page-last-watered"
            type="date"
            className="note-page__meta-input"
            value={lastWatered}
            onChange={onLastWateredChange}
            inputClassName="input--unstyled"
          />
        </label>
      </div>

      <div className="note-page__tags-row" aria-label="Note tags">
        <span className="note-page__line-label">Tags:</span>
        <div className="note-page__tags-list">
          {tags.map((tag) => (
            <span key={tag} className="note-page__tag-pill">
              {tag}
              <button
                type="button"
                className="note-page__tag-remove"
                onClick={() => onRemoveTag(tag)}
                aria-label={`Remove tag ${tag}`}
              >
                x
              </button>
            </span>
          ))}
          <Input
            type="text"
            className="note-page__tag-input"
            wrapperClassName="note-page__tag-input-wrap"
            placeholder="Add tag"
            value={tagInput}
            onChange={onTagInputChange}
            onKeyDown={onTagInputKeyDown}
            size={Math.max(8, tagInput.length + 1)}
            inputClassName="input--unstyled"
          />

          {tagSuggestions.length > 0 ? (
            <div className="note-page__tag-suggestions" role="listbox" aria-label="Tag suggestions">
              {tagSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  className="note-page__tag-suggestion-item"
                  onClick={() => onSelectTagSuggestion?.(suggestion.name)}
                >
                  {suggestion.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}

export default NoteMeta
