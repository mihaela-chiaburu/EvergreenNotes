import "../../styles/components/garden-care/growing-card.css"
import greenleaf from "../../assets/images/green-leaf.png"

function GrowingCard({ title, nextReviewInDays, lastReviewed, onOpen }) {
  return (
    <button type="button" className="growing-card" onClick={onOpen}>
      <div className="growing-card__info">
        <p>{title}</p>
        <p className="growing-card__reviewed">Last reviewed: {lastReviewed}</p>
      </div>
      <div className="growing-card__status">
        <p>In {nextReviewInDays} days</p>
        <img src={greenleaf} alt="Green leaf" className="growing-card__leaf-icon"/>
      </div>
    </button>
  )
}

export default GrowingCard