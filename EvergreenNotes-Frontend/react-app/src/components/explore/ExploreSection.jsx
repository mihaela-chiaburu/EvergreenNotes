import CategoryCard from "./CategoryCard"
import GardenCard from "./GardenCard"
import Pagination from "./Pagination"
import "/src/styles/components/explore/explore-section.css"

function ExploreSection() {
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
          <div className="explore-section__content">
            <h3 className="explore-section__subtitle">Recomended Topics</h3>
            <CategoryCard />
          </div>
          <div className="explore-section__content">
            <h3 className="explore-section__subtitle">Discover something new</h3>
            <GardenCard />
          </div>
          <div className="explore-section__scrollbar">
            <div className="explore-section__scrollbar-thumb"></div>
          </div>
        </div>
          <Pagination />
    </div>
  )
}

export default ExploreSection