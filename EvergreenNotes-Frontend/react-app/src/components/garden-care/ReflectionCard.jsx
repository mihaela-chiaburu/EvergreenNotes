import "../../styles/components/garden-care/reflection-card.css"
import idea from "../../assets/images/idea.png"
import refreshIcon from "../../assets/images/reset (1).png"

function ReflectionCard({ title, prompt, lastReviewed, onOpen, onRefresh, isRefreshing }) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onOpen()
    }
  }

  return (
    <div
      className="reflection-card"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
    >
      <div className="reflection-card__content">
        <p className="reflection-card__title">{title}</p>
        <div className="reflection-card__idea">
          <img src={idea} alt="Idea" className="reflection-card__idea-icon"/>
          <p>{prompt}</p>
          <button
            type="button"
            className="reflection-card__refresh-button"
            onClick={(event) => {
              event.stopPropagation()
              onRefresh?.()
            }}
            aria-label="Refresh AI question"
            title="Refresh AI question"
            disabled={isRefreshing}
          >
            <img src={refreshIcon} alt="" className="reflection-card__refresh-icon" />
          </button>
        </div>
        <p className="reflection-card__last-review">Last reviewed: {lastReviewed}</p>
      </div>
    </div>
  )
}

export default ReflectionCard