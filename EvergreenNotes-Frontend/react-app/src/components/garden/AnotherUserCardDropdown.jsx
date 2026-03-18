import { useState } from "react"
import arrowIcon from "../../assets/images/arrow-down.png"
import fallbackAvatar from "../../assets/images/avatar.jpg"
import "../../styles/components/garden/another-user-card-dropdown.css"

function AnotherUserCardDropdown({
  user,
  onFollowToggle,
  isFollowLoading = false,
  followError = "",
  isOwnGarden = false,
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleToggleDropdown = () => {
    setIsExpanded((currentState) => !currentState)
  }

  const handleFollowClick = (event) => {
    event.preventDefault()
    event.stopPropagation()

    if (!isFollowLoading && !isOwnGarden) {
      onFollowToggle?.()
    }
  }

  return (
    <div
      className={`another-user-card ${isExpanded ? "another-user-card--expanded" : ""}`}
    >
      <button
        type="button"
        className="another-user-card__main"
        onClick={handleToggleDropdown}
        aria-expanded={isExpanded}
        aria-label={`Open ${user.userName} garden details`}
      >
        <img src={user.avatar || fallbackAvatar} alt={`${user.userName} avatar`} className="another-user-card__avatar" />

        <span className="another-user-card__user">
          <span className="another-user-card__name">{user.userName}</span>
          <span className="another-user-card__bio">{user.userBio}</span>
        </span>

        <img
          src={arrowIcon}
          alt=""
          aria-hidden="true"
          className={`another-user-card__arrow ${isExpanded ? "another-user-card__arrow--open" : ""}`}
        />
      </button>

      {isExpanded && (
        <>
          <span className="another-user-card__stats">
            <span className="another-user-card__stat-item">{user.ideasCount} ideas</span>
            <span className="another-user-card__stat-item">{user.growingCount} growing</span>
            <button
              type="button"
              className={`another-user-card__follow ${user.isFollowing ? "another-user-card__follow--active" : ""}`}
              onClick={handleFollowClick}
              disabled={isFollowLoading || isOwnGarden}
            >
              {isOwnGarden ? "You" : isFollowLoading ? "Saving..." : user.isFollowing ? "Following" : "Follow"}
            </button>
          </span>
          {followError && <span className="another-user-card__error">{followError}</span>}
        </>
      )}
    </div>
  )
}

export default AnotherUserCardDropdown
