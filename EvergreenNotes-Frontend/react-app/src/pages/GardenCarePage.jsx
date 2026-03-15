import Layout from "../components/Layout"
import StatsBar from "../components/garden-care/StatsBar"
import GrowingCard from "../components/garden-care/GrowingCard"
import ReflectionCard from "../components/garden-care/ReflectionCard"
import "../styles/pages/garden-care.css"

function GardenCarePage() {
  return (
    <Layout>
      <div className="garden-care-page">
        <p className="garden-care-title">Take Care of your ideas</p>
        <StatsBar />
        <p className="garden-care-subtitle">Ready for reflection</p>
        <ReflectionCard />
        <ReflectionCard />
        <p className="garden-care-subtitle">Growing</p>
        <GrowingCard />
        <GrowingCard />
        <GrowingCard />
        
      </div>
    </Layout>
  )
}

export default GardenCarePage