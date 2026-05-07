import { useEffect, useState } from "react"
import "../../styles/components/search/debounced-search-input.css"

function DebouncedSearchInput({
  value = "",
  placeholder = "Search...",
  debounceMs = 300,
  onDebouncedChange,
  iconSrc,
  iconAlt = "search",
  inputClassName = "",
}) {
  const [draftValue, setDraftValue] = useState(value)

  useEffect(() => {
    setDraftValue(value)
  }, [value])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onDebouncedChange?.(draftValue)
    }, debounceMs)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [debounceMs, draftValue, onDebouncedChange])

  const handleClear = () => {
    setDraftValue("")
    onDebouncedChange?.("")
  }

  return (
    <div className={`debounced-search ${inputClassName}`.trim()}>
      {iconSrc ? <img src={iconSrc} alt={iconAlt} className="debounced-search__icon" /> : null}
      <input
        type="text"
        value={draftValue}
        placeholder={placeholder}
        className="debounced-search__input"
        onChange={(event) => setDraftValue(event.target.value)}
      />
      {draftValue ? (
        <button
          type="button"
          className="debounced-search__clear"
          onClick={handleClear}
          aria-label="Clear search"
        >
          x
        </button>
      ) : null}
    </div>
  )
}

export default DebouncedSearchInput