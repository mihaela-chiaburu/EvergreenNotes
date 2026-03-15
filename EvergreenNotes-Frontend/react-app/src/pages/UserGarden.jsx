import { useState } from "react"
import { useLocation, useParams } from "react-router-dom"
import Layout from "../components/Layout"
import GardenListView from "../components/garden/GardenListView"
import GardenGraphView from "../components/garden/GardenGraphView"
import GraphSettingsPanel from "../components/garden/GraphSettingsPanel"
import AnotherUserCardDropdown from "../components/garden/AnotherUserCardDropdown"
import { mockExploreGardens } from "../data/mockExploreGardens"
import "../styles/pages/garden.css"

function UserGarden() {
	const [view, setView] = useState("graph")
	const { userId } = useParams()
	const location = useLocation()

	const userFromState = location.state?.userGarden
	const userFromParams = mockExploreGardens.find((garden) => garden.id === userId)
	const activeUser = userFromState ?? userFromParams ?? mockExploreGardens[0]

	return (
		<Layout>
			<div className="garden-page garden-page--another-user">
				<AnotherUserCardDropdown user={activeUser} />

				{view === "graph" && <GardenGraphView />}
				{view === "list" && <GardenListView />}

				<GraphSettingsPanel setView={setView} isAnotherUserGarden />
			</div>
		</Layout>
	)
}

export default UserGarden
