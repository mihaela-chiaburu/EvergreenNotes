import "/src/styles/components/explore/category-card.css"
import topic1 from "../../assets/images/popular1.png"
import topic2 from "../../assets/images/popular2.png"
import topic3 from "../../assets/images/popular3.png"

function CategoryCard() {
  return (
    <div className="category-card">
      <div className="category-card__content">
        <img src={topic1} alt="Topic 1" className="category-card__image" />
        <p>Nature</p>
      </div>
      <div className="category-card__content">
        <img src={topic2} alt="Topic 2" className="category-card__image" />
        <p>Philosophy</p>
      </div>
      <div className="category-card__content">
        <img src={topic3} alt="Topic 3" className="category-card__image" />
        <p>Art</p>
      </div>
    </div>
  )
}

export default CategoryCard