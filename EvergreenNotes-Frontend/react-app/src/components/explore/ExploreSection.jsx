import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import CategoryCard from "./CategoryCard"
import GardenCard from "./GardenCard"
import Pagination from "./Pagination"
import { useAuth } from "../../context/AuthContext"
import { fetchExploreGardens, fetchFollowingUsers, mapExploreGarden } from "../../utils/explore"
import "../../styles/components/explore/explore-section.css"

const TAB_OPTIONS = ["Trending", "New", "Following"]
const PAGE_SIZE = 6

function ExploreSection({ isPublicView = false }) {
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const [gardens, setGardens] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedTopic, setSelectedTopic] = useState("")
  const [activeTab, setActiveTab] = useState("Trending")
  const [currentPage, setCurrentPage] = useState(1)
  const isTopicSelected = Boolean(selectedTopic)
  const visibleTabs = isPublicView ? TAB_OPTIONS.filter((tab) => tab !== "Following") : TAB_OPTIONS

  useEffect(() => {
    let isMounted = true

    const loadExplore = async () => {
      setIsLoading(true)
      setError("")

      try {
        const [gardensPayload, followingPayload] = await Promise.all([
          fetchExploreGardens({ token: authUser?.token }),
          authUser?.token ? fetchFollowingUsers(authUser.token) : Promise.resolve([]),
        ])

        if (!isMounted) {
          return
        }

        const followingIds = new Set((followingPayload ?? []).map((user) => String(user.userId)))
        const mapped = (gardensPayload ?? []).map((garden) =>
          mapExploreGarden(garden, { followingUserIds: followingIds })
        )

        setGardens(mapped)
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message)
          setGardens([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadExplore()

    return () => {
      isMounted = false
    }
  }, [authUser?.token])

  const gardensByTab = useMemo(() => ({
    Trending: [...gardens].sort((firstGarden, secondGarden) => secondGarden.noteCount - firstGarden.noteCount),
    New: [...gardens].sort((firstGarden, secondGarden) => {
      const firstTime = Date.parse(firstGarden.lastActive ?? "") || 0
      const secondTime = Date.parse(secondGarden.lastActive ?? "") || 0
      return secondTime - firstTime
    }),
    Following: gardens.filter((garden) => garden.isFollowing),
  }), [gardens])

  const activeGardens = gardensByTab[activeTab] ?? gardensByTab.Trending
  const filteredByTopic = selectedTopic
    ? activeGardens.filter((garden) =>
        garden.tags.some((tag) => tag.toLowerCase() === selectedTopic.toLowerCase())
      )
    : activeGardens

  const topTopics = useMemo(() => {
    const tagScores = new Map()

    gardens.forEach((garden) => {
      garden.tags.forEach((tag) => {
        const normalizedTag = tag.trim()
        if (!normalizedTag) {
          return
        }

        tagScores.set(normalizedTag, (tagScores.get(normalizedTag) ?? 0) + 1)
      })
    })

    return [...tagScores.entries()]
      .sort((firstEntry, secondEntry) => secondEntry[1] - firstEntry[1])
      .slice(0, 6)
      .map(([tag]) => tag)
  }, [gardens])

  const totalPages = Math.max(1, Math.ceil(filteredByTopic.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE
  const paginatedGardens = filteredByTopic.slice(startIndex, startIndex + PAGE_SIZE)

  const handleOpenUserGarden = (garden) => {
    navigate(`/garden/${garden.userId}`, { state: { userGarden: garden } })
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
          {visibleTabs.map((tab) => (
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
              <h3 className="explore-section__subtitle">{isPublicView ? "Popular Topics" : "Recommended Topics"}</h3>
              <CategoryCard topics={topTopics} onTopicSelect={(topic) => {
                setSelectedTopic(topic)
                setCurrentPage(1)
              }} />
            </div>
          )}
          <div className="explore-section__content explore-section__content--discover">
            {!isTopicSelected && (
              <h3 className="explore-section__subtitle">Discover something new</h3>
            )}
            {isLoading && <p className="explore-section__empty">Loading gardens...</p>}
            {!isLoading && error && <p className="explore-section__empty">{error}</p>}
            <div className="explore-section__garden-grid">
              {!isLoading && !error && paginatedGardens.map((garden) => (
                <GardenCard
                  key={garden.id}
                  garden={garden}
                  onClick={() => handleOpenUserGarden(garden)}
                />
              ))}
              {!isLoading && !error && paginatedGardens.length === 0 && (
                <p className="explore-section__empty">No gardens found for this view.</p>
              )}
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