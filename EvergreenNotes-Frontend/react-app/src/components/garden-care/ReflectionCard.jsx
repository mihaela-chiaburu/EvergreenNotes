import "../../styles/components/garden-care/reflection-card.css"
import idea from "../../assets/images/idea.png"
import dryleaf from "../../assets/images/dry-leaf.png"

function ReflectionCard({ title, prompt, lastReviewed }) {
  return (
    <div className="reflection-card">
      <div className="reflection-card__content">
        <p className="reflection-card__title">{title}</p>
        <div className="reflection-card__idea">
          <img src={idea} alt="Idea" className="reflection-card__idea-icon"/>
          <p>{prompt}</p>
        </div>
        <p className="reflection-card__last-review">Last reviewed: {lastReviewed}</p>
      </div>
      <img src={dryleaf} alt="Dry leaf" className="reflection-card__dry-leaf-icon"/>
    </div>
  )
}

export default ReflectionCard