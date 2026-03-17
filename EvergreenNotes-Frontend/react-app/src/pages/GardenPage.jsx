import { useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import Layout from "../components/Layout"
import GardenListView from "../components/garden/GardenListView"
import GardenGraphView from "../components/garden/GardenGraphView"
import GraphSettingsPanel from "../components/garden/GraphSettingsPanel"
import AddNoteInput from "../components/garden/AddNoteInput"
import UserBio from "../components/garden/UserBio"
import "../styles/pages/garden.css"

function GardenPage() {
  const location = useLocation()
  const [view, setView] = useState(location.state?.view || "graph")
  const [focusPathLabels, setFocusPathLabels] = useState(Array.isArray(location.state?.focusPathLabels) ? location.state.focusPathLabels : [])
  const [graphRefreshTick, setGraphRefreshTick] = useState(0)

  const initialFocusStack = useMemo(
    () => (Array.isArray(location.state?.focusStack) ? location.state.focusStack : []),
    [location.state?.focusStack]
  )

  const initialFocusPathLabels = useMemo(
    () => (Array.isArray(location.state?.focusPathLabels) ? location.state.focusPathLabels : []),
    [location.state?.focusPathLabels]
  )

  const handleFocusPathChange = (nextLabels) => {
    setFocusPathLabels((currentLabels) => {
      if (currentLabels.length === nextLabels.length && currentLabels.every((label, index) => label === nextLabels[index])) {
        return currentLabels
      }

      return nextLabels
    })
  }

  return (
    <Layout>
      <div className="garden-page">
        <UserBio />

        {view === "graph" && (
          <GardenGraphView
            initialFocusStack={initialFocusStack}
            initialFocusPathLabels={initialFocusPathLabels}
            onFocusPathChange={handleFocusPathChange}
            refreshTick={graphRefreshTick}
          />
        )}
        {view === "list" && <GardenListView />}

        <GraphSettingsPanel setView={setView} />

        <AddNoteInput
          contextPathTags={view === "graph" ? focusPathLabels : []}
          onCreated={() => setGraphRefreshTick((currentValue) => currentValue + 1)}
        />
      </div>
    </Layout>
  )
}

export default GardenPage