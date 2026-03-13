import "/src/styles/components/garden-care/growing-card.css"
import greenleaf from "../../assets/images/green-leaf.png"

function GrowingCard() {
  return (
    <div className="growing-card">
      <div className="growing-card-info">
        <p>Dante Alighieri Divina comedie personaje </p>
        <p className="growing-card-info-reviewed">Last reviewed: 04.02.2026</p>
      </div>
      <div className="growing-card-status">
        <p>In 3 days</p>
        <img src={greenleaf} alt="Green Leaf" className="green-leaf-icon"/>
      </div>
    </div>
  )
}

export default GrowingCard