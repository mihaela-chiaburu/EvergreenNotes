import { useState } from "react"
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

  const initialFocusStack = Array.isArray(location.state?.focusStack) ? location.state.focusStack : []

  return (
    <Layout>
      <div className="garden-page">
        <UserBio />

        {view === "graph" && <GardenGraphView initialFocusStack={initialFocusStack} />}
        {view === "list" && <GardenListView />}

        <GraphSettingsPanel setView={setView} />

        <AddNoteInput />
      </div>
    </Layout>
  )
}

export default GardenPage