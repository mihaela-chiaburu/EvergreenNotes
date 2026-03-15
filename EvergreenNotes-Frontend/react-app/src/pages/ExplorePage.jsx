import Layout from "../components/Layout"
import FilterPanel from "../components/explore/FilterPanel"
import ExploreSection from "../components/explore/ExploreSection"
import "../styles/pages/explore.css"

function ExplorePage() {
  return (
    <Layout>
      <div className="explore-page">
        <FilterPanel />
        <ExploreSection />
      </div>
    </Layout>
  )
}

export default ExplorePage