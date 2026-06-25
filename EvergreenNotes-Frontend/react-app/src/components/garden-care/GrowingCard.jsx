import "../../styles/components/garden-care/growing-card.css"
function GrowingCard({ title, nextReviewInDays, lastReviewed, onOpen }) {
  return (
    <button type="button" className="growing-card" onClick={onOpen}>
      <div className="growing-card__info">
        <p>{title}</p>
        <p className="growing-card__reviewed">Last reviewed: {lastReviewed}</p>
      </div>
      <div className="growing-card__status">
        <p>In {nextReviewInDays} days</p>
      </div>
    </button>
  )
}

export default GrowingCard