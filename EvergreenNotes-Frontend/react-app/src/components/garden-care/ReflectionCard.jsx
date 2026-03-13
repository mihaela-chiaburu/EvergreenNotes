import "/src/styles/components/garden-care/reflection-card.css"
import idea from "../../assets/images/idea.png"
import dryleaf from "../../assets/images/dry-leaf.png"

function ReflectionCard() {
  return (
    <div className="reflection-card">
      <div className="reflecion-card__content">
        <p className="reflecion-card__title"> Dante Alighieri Divina comedie personaje </p>
        <div className="reflection-idea">
          <img src={idea} alt="Idea" className="idea-icon"/>
          <p>What is the significance of the Nine Circles of Hell?</p>
        </div>
        <p className="reflecion-card__last-review">Last reviewed: 04.02.2026</p>
      </div>
      <img src={dryleaf} alt="Dry Leaf" className="dry-leaf-icon"/>
    </div>
  )
}

export default ReflectionCard