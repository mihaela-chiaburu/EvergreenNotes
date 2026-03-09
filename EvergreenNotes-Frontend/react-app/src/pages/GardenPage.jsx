import { useState } from "react"
import Layout from "../components/Layout"
import GardenListView from "../components/garden/GardenListView"
import GardenGraphView from "../components/garden/GardenGraphView"
import GraphSettingsPanel from "../components/garden/GraphSettingsPanel"
import AddNoteInput from "../components/garden/AddNoteInput"
import UserBio from "../components/garden/UserBio"
import "../styles/garden.css"

function GardenPage() {
  const [view, setView] = useState("graph") // sau "list"

  return (
    <Layout>
      <div className="garden-page">
        <UserBio />

        {view === "graph" && <GardenGraphView />}
        {view === "list" && <GardenListView />}

        <GraphSettingsPanel setView={setView} />

        <AddNoteInput />
      </div>
    </Layout>
  )
}

export default GardenPage