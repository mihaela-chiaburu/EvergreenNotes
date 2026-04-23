import { useEffect, useState } from "react"
import { useLocation, useParams } from "react-router-dom"
import Layout from "../components/Layout"
import GardenListView from "../components/garden/GardenListView"
import GardenGraphView from "../components/garden/GardenGraphView"
import GraphSettingsPanel from "../components/garden/GraphSettingsPanel"
import AnotherUserCardDropdown from "../components/garden/AnotherUserCardDropdown"
import { useAuth } from "../context/AuthContext"
import { fetchPublicGarden } from "../utils/garden"
import {
	fetchFollowingUsers,
	followUser,
	mapPublicGardenToExploreUser,
	unfollowUser,
} from "../utils/explore"
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

function UserGarden() {
	const [view, setView] = useState("graph")
	const [activeUser, setActiveUser] = useState(null)
	const [isFollowLoading, setIsFollowLoading] = useState(false)
	const [followError, setFollowError] = useState("")
	const [graphSettings, setGraphSettings] = useState(DEFAULT_GRAPH_SETTINGS)
	const { userId } = useParams()
	const location = useLocation()
	const { authUser } = useAuth()
	const isOwnGarden = String(activeUser?.userId ?? "") === String(authUser?.id ?? "")

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
				const [payload, followingPayload] = await Promise.all([
					fetchPublicGarden(userId, authUser?.token),
					authUser?.token ? fetchFollowingUsers(authUser.token) : Promise.resolve([]),
				])
				if (!isMounted) {
					return
				}

				const followingIds = new Set((followingPayload ?? []).map((followedUser) => String(followedUser.userId)))
				const mappedUser = mapPublicGardenToExploreUser(payload, userId)

				setActiveUser({
					...mappedUser,
					isFollowing: followingIds.has(String(mappedUser.userId ?? userId ?? "")),
				})
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
						isFollowing: false,
					})
				}
			}
		}

		loadPublicGarden()

		return () => {
			isMounted = false
		}
	}, [authUser?.token, location.state?.userGarden, userId])

	const handleToggleFollow = async () => {
		if (!authUser?.token || !activeUser?.userId || isOwnGarden || isFollowLoading) {
			return
		}

		const wasFollowing = Boolean(activeUser.isFollowing)
		setFollowError("")
		setIsFollowLoading(true)
		setActiveUser((currentUser) => (currentUser ? { ...currentUser, isFollowing: !wasFollowing } : currentUser))

		try {
			if (wasFollowing) {
				await unfollowUser(authUser.token, activeUser.userId)
			} else {
				await followUser(authUser.token, activeUser.userId)
			}
		} catch (error) {
			setActiveUser((currentUser) => (currentUser ? { ...currentUser, isFollowing: wasFollowing } : currentUser))
			setFollowError(error instanceof Error ? error.message : "Unable to update follow status right now.")
		} finally {
			setIsFollowLoading(false)
		}
	}

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
				<AnotherUserCardDropdown
					user={activeUser}
					onFollowToggle={handleToggleFollow}
					isFollowLoading={isFollowLoading}
					followError={followError}
					isOwnGarden={isOwnGarden}
				/>

				{view === "graph" && <GardenGraphView userId={activeUser.userId} isReadOnly graphSettings={graphSettings} />}
				{view === "list" && <GardenListView userId={activeUser.userId} isReadOnly graphSettings={graphSettings} />}

				<GraphSettingsPanel
					setView={setView}
					isAnotherUserGarden
					graphSettings={graphSettings}
					onGraphSettingsChange={setGraphSettings}
				/>
			</div>
		</Layout>
	)
}

export default UserGarden
