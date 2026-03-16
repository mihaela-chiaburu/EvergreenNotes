import Layout from "../components/Layout"
import { useNavigate } from "react-router-dom"
import StatsBar from "../components/garden-care/StatsBar"
import GrowingCard from "../components/garden-care/GrowingCard"
import ReflectionCard from "../components/garden-care/ReflectionCard"
import { mockGrowingCards, mockReflectionCards, mockStats } from "../data/mockGardenCare"
import "../styles/pages/garden-care.css"

function GardenCarePage() {
  const navigate = useNavigate()

  const handleOpenCareNote = (title) => {
    navigate(`/note?title=${encodeURIComponent(title)}&tag=Garden%20Care`, {
      state: {
        noteTitle: title,
        tagName: "Garden Care",
        tags: ["Garden Care"],
      },
    })
  }

  return (
    <Layout>
      <div className="garden-care-page">
        <p className="garden-care-title">Take Care of your ideas</p>
        <StatsBar stats={mockStats} />
        <p className="garden-care-subtitle">Ready for reflection</p>
        {mockReflectionCards.map((card) => (
          <ReflectionCard
            key={card.id}
            title={card.title}
            prompt={card.prompt}
            lastReviewed={card.lastReviewed}
            onOpen={() => handleOpenCareNote(card.title)}
          />
        ))}
        <p className="garden-care-subtitle">Growing</p>
        {mockGrowingCards.map((card) => (
          <GrowingCard
            key={card.id}
            title={card.title}
            nextReviewInDays={card.nextReviewInDays}
            lastReviewed={card.lastReviewed}
            onOpen={() => handleOpenCareNote(card.title)}
          />
        ))}
      </div>
    </Layout>
  )
}

export default GardenCarePage