import { useState } from "react"
import { useNavigate } from "react-router-dom"
import CategoryCard from "./CategoryCard"
import GardenCard from "./GardenCard"
import Pagination from "./Pagination"
import { mockExploreGardens } from "../../data/mockExploreGardens"
import "/src/styles/components/explore/explore-section.css"

function ExploreSection() {
  const navigate = useNavigate()
  const [selectedTopic, setSelectedTopic] = useState("")
  const isTopicSelected = Boolean(selectedTopic)

  const handleOpenUserGarden = (garden) => {
    navigate(`/garden/${garden.id}`, { state: { userGarden: garden } })
  }

  return (
    <div className="explore-section">
      <div className="explore-section__header">
        <div className="explore-section__title-group">
          {!isTopicSelected && <h2 className="explore-section__title">Explore</h2>}
          {isTopicSelected && (
            <h2 className="explore-section__title explore-section__title--breadcrumb">
              <button
                type="button"
                className="explore-section__crumb explore-section__crumb--parent"
                onClick={() => setSelectedTopic("")}
              >
                Explore
              </button>
              <span className="explore-section__crumb-separator">/</span>
              <span className="explore-section__crumb explore-section__crumb--active">
                {selectedTopic}
              </span>
            </h2>
          )}
        </div>
        <div className="explore-section__tabs">
          <div className="explore-section__tab">Trending</div>
          <div className="explore-section__tab">New</div>
          <div className="explore-section__tab">Following</div>
        </div>
      </div>
      <div className="explore-section__content-block">
        <div className="explore-section__content-area">
          {!isTopicSelected && (
            <div className="explore-section__content">
              <h3 className="explore-section__subtitle">Recommended Topics</h3>
              <CategoryCard onTopicSelect={setSelectedTopic} />
            </div>
          )}
          <div className="explore-section__content explore-section__content--discover">
            {!isTopicSelected && (
              <h3 className="explore-section__subtitle">Discover something new</h3>
            )}
            <div className="explore-section__garden-grid">
              {mockExploreGardens.map((garden) => (
                <GardenCard
                  key={garden.id}
                  garden={garden}
                  onClick={() => handleOpenUserGarden(garden)}
                />
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