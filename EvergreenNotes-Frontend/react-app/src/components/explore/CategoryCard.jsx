import { useRef } from "react"
import "/src/styles/components/explore/category-card.css"
import topic1 from "../../assets/images/popular1.png"
import topic2 from "../../assets/images/popular2.png"
import topic3 from "../../assets/images/popular3.png"

function CategoryCard() {
  const cardsRef = useRef(null)

  const handleScroll = (direction) => {
    if (!cardsRef.current) {
      return
    }

    cardsRef.current.scrollBy({
      left: direction * 320,
      behavior: "smooth",
    })
  }

  return (
    <div className="category-card-section">
      <button
        type="button"
        className="category-card__nav category-card__nav--left"
        onClick={() => handleScroll(-1)}
        aria-label="Scroll categories left"
      >
        {'<'}
      </button>

      <div className="category-card" ref={cardsRef}>
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
        <div className="category-card__content">
          <img src={topic3} alt="Topic 3" className="category-card__image" />
          <p>Art</p>
        </div>
        <div className="category-card__content">
          <img src={topic3} alt="Topic 3" className="category-card__image" />
          <p>Art</p>
        </div>
        <div className="category-card__content">
          <img src={topic3} alt="Topic 3" className="category-card__image" />
          <p>Art</p>
        </div>
      </div>

      <button
        type="button"
        className="category-card__nav category-card__nav--right"
        onClick={() => handleScroll(1)}
        aria-label="Scroll categories right"
      >
        {'>'}
      </button>
    </div>
  )
}

export default CategoryCard