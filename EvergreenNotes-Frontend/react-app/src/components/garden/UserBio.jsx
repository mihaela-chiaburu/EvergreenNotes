import "../../styles/components/garden/bio.css"
import { useAuth } from "../../context/AuthContext"

function UserBio() {
  const { authUser } = useAuth()
  const bioText = authUser?.bio || "Growing quietly, one note at a time."

  return (
    <div className="user-bio">
      <p className="user-bio__text">{bioText}</p>
    </div>
  )
}

export default UserBio