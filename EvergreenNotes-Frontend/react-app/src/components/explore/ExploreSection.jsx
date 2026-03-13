import CategoryCard from "./CategoryCard"
import GardenCard from "./GardenCard"
import Pagination from "./Pagination"
import "/src/styles/components/explore/explore-section.css"

function ExploreSection() {
  const gardenCards = Array.from({ length: 6 })

  return (
    <div className="explore-section">
      <div className="explore-section__header">
        <h2 className="explore-section__title">Explore</h2>
        <div className="explore-section__tabs">
          <div>Trending</div>
          <div>New</div>
          <div>Following</div>
        </div>
      </div>
      <div className="explore-section__content-block">
        <div className="explore-section__content-area">
          <div className="explore-section__content">
            <h3 className="explore-section__subtitle">Recomended Topics</h3>
            <CategoryCard />
          </div>
          <div className="explore-section__content explore-section__content--discover">
            <h3 className="explore-section__subtitle">Discover something new</h3>
            <div className="explore-section__garden-grid">
              {gardenCards.map((_, index) => (
                <GardenCard key={index} />
              ))}
            </div>
          </div>
        </div>
        <div className="explore-section__pagination">
          <Pagination />
        </div>
      </div>
    </div>
  )
}

export default ExploreSection