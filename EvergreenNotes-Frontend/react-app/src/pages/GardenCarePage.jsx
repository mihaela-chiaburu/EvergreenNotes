import { useState } from "react"
import Layout from "../components/Layout"
import AddNoteInput from "../components/garden/AddNoteInput"
import UserBio from "../components/garden/UserBio"
import "../styles/pages/garden.css"

function GardenCarePage() {
  return (
    <Layout>
      <div className="garden-page">
        <UserBio />

        <AddNoteInput />
      </div>
    </Layout>
  )
}

export default GardenCarePage