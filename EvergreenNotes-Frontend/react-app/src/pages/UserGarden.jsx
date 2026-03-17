import { useEffect, useState } from "react"
import { useLocation, useParams } from "react-router-dom"
import Layout from "../components/Layout"
import GardenListView from "../components/garden/GardenListView"
import GardenGraphView from "../components/garden/GardenGraphView"
import GraphSettingsPanel from "../components/garden/GraphSettingsPanel"
import AnotherUserCardDropdown from "../components/garden/AnotherUserCardDropdown"
import { useAuth } from "../context/AuthContext"
import { fetchPublicGarden } from "../utils/garden"
import { mapPublicGardenToExploreUser } from "../utils/explore"
import "../styles/pages/garden.css"

function UserGarden() {
	const [view, setView] = useState("graph")
	const [activeUser, setActiveUser] = useState(null)
	const { userId } = useParams()
	const location = useLocation()
	const { authUser } = useAuth()

	useEffect(() => {
		let isMounted = true

		const userFromState = location.state?.userGarden
		if (userFromState) {
			setActiveUser(userFromState)
		}

		const loadPublicGarden = async () => {
			if (!userId) {
				return
			}

			try {
				const payload = await fetchPublicGarden(userId, authUser?.token)
				if (!isMounted) {
					return
				}

				setActiveUser(mapPublicGardenToExploreUser(payload, userId))
			} catch {
				if (isMounted && !userFromState) {
					setActiveUser({
						id: String(userId),
						userId: String(userId),
						userName: "Unknown user",
						userBio: "Garden unavailable right now.",
						avatar: "",
						tags: [],
						noteCount: 0,
						gardenState: "Fresh Garden",
						recentNoteTitle: "Recent note",
						recentNoteText: "No public notes yet.",
						ideasCount: 0,
						growingCount: 0,
					})
				}
			}
		}

		loadPublicGarden()

		return () => {
			isMounted = false
		}
	}, [authUser?.token, location.state?.userGarden, userId])

	if (!activeUser) {
		return (
			<Layout>
				<div className="garden-page garden-page--another-user">
					<p>Loading garden...</p>
				</div>
			</Layout>
		)
	}

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
