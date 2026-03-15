import Layout from "../components/Layout"
import StatsBar from "../components/garden-care/StatsBar"
import GrowingCard from "../components/garden-care/GrowingCard"
import ReflectionCard from "../components/garden-care/ReflectionCard"
import { mockGrowingCards, mockReflectionCards, mockStats } from "../data/mockGardenCare"
import "../styles/pages/garden-care.css"

function GardenCarePage() {
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
          />
        ))}
        <p className="garden-care-subtitle">Growing</p>
        {mockGrowingCards.map((card) => (
          <GrowingCard
            key={card.id}
            title={card.title}
            nextReviewInDays={card.nextReviewInDays}
            lastReviewed={card.lastReviewed}
          />
        ))}
      </div>
    </Layout>
  )
}

export default GardenCarePage