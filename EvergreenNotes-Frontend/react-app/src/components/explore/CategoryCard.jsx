import { useRef } from "react"
import "../../styles/components/explore/category-card.css"
import topic1 from "../../assets/images/popular1.png"
import topic2 from "../../assets/images/popular2.png"
import topic3 from "../../assets/images/popular3.png"

function CategoryCard({ topics = [], onTopicSelect }) {
  const cardsRef = useRef(null)
  const imagePool = [topic1, topic2, topic3]
  const fallbackTopics = ["Nature", "Art", "Philosophy"]

  const normalizedTopics = (topics.length > 0 ? topics : fallbackTopics).map((name, index) => ({
    image: imagePool[index % imagePool.length],
    alt: `${name} topic`,
    name,
  }))

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
        {normalizedTopics.map((topic, index) => (
          <button
            key={`${topic.name}-${index}`}
            type="button"
            className="category-card__content"
            onClick={() => onTopicSelect?.(topic.name)}
            aria-label={`Explore ${topic.name}`}
          >
            <img src={topic.image} alt={topic.alt} className="category-card__image" />
            <p>{topic.name}</p>
          </button>
        ))}
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