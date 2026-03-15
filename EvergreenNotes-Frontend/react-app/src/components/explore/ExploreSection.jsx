import { useState } from "react"
import { useNavigate } from "react-router-dom"
import CategoryCard from "./CategoryCard"
import GardenCard from "./GardenCard"
import Pagination from "./Pagination"
import { mockExploreGardens } from "../../data/mockExploreGardens"
import "../../styles/components/explore/explore-section.css"

const TAB_OPTIONS = ["Trending", "New", "Following"]
const PAGE_SIZE = 6

function ExploreSection() {
  const navigate = useNavigate()
  const [selectedTopic, setSelectedTopic] = useState("")
  const [activeTab, setActiveTab] = useState("Trending")
  const [currentPage, setCurrentPage] = useState(1)
  const isTopicSelected = Boolean(selectedTopic)

  const gardensByTab = {
    Trending: mockExploreGardens,
    New: [...mockExploreGardens].reverse(),
    Following: mockExploreGardens.filter((_, index) => index % 2 === 0),
  }

  const filteredByTopic = selectedTopic
    ? gardensByTab[activeTab].filter((garden) =>
        garden.tags.some((tag) => tag.toLowerCase() === selectedTopic.toLowerCase())
      )
    : gardensByTab[activeTab]

  const totalPages = Math.max(1, Math.ceil(filteredByTopic.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE
  const paginatedGardens = filteredByTopic.slice(startIndex, startIndex + PAGE_SIZE)

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
                onClick={() => {
                  setSelectedTopic("")
                  setCurrentPage(1)
                }}
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
          {TAB_OPTIONS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`explore-section__tab ${activeTab === tab ? "explore-section__tab--active" : ""}`}
              onClick={() => {
                setActiveTab(tab)
                setCurrentPage(1)
              }}
            >
              {tab}
            </button>
          ))}
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
              {paginatedGardens.map((garden) => (
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
          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  )
}

export default ExploreSection