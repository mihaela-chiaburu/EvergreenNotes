import CategoryCard from "./CategoryCard"
import GardenCard from "./GardenCard"
import Pagination from "./Pagination"
import "/src/styles/components/explore/category-card.css"

function ExploreSection() {
  return (
    <div className="explore-section">
        <CategoryCard />
        <GardenCard />
        <Pagination />
    </div>
  )
}

export default ExploreSection