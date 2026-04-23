import { useState } from "react"
import { useLocation } from "react-router-dom"
import Layout from "../components/Layout"
import GardenListView from "../components/garden/GardenListView"
import GardenGraphView from "../components/garden/GardenGraphView"
import GraphSettingsPanel from "../components/garden/GraphSettingsPanel"
import AddNoteInput from "../components/garden/AddNoteInput"
import UserBio from "../components/garden/UserBio"
import "../styles/pages/garden.css"

const DEFAULT_GRAPH_SETTINGS = {
  filters: {
    visibility: [],
    noteStatus: [],
    careStatus: [],
    tags: [],
  },
  display: {
    nodeSize: 50,
    labelFontSize: 16,
    showLabels: true,
  },
}

function GardenPage() {
  const location = useLocation()
  const [view, setView] = useState(location.state?.view || "graph")
  const [focusPathLabels, setFocusPathLabels] = useState(Array.isArray(location.state?.focusPathLabels) ? location.state.focusPathLabels : [])
  const [graphRefreshTick, setGraphRefreshTick] = useState(0)
  const [graphSettings, setGraphSettings] = useState(DEFAULT_GRAPH_SETTINGS)

  const initialFocusStack = Array.isArray(location.state?.focusStack) ? location.state.focusStack : []
  const initialFocusPathLabels = Array.isArray(location.state?.focusPathLabels) ? location.state.focusPathLabels : []

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
            graphSettings={graphSettings}
          />
        )}
        {view === "list" && <GardenListView graphSettings={graphSettings} />}

        <GraphSettingsPanel
          setView={setView}
          graphSettings={graphSettings}
          onGraphSettingsChange={setGraphSettings}
        />

        <AddNoteInput
          contextPathTags={view === "graph" ? focusPathLabels : []}
          onCreated={() => setGraphRefreshTick((currentValue) => currentValue + 1)}
        />
      </div>
    </Layout>
  )
}

export default GardenPage