import { useState } from "react"
import arrowIcon from "/src/assets/images/arrow-down.png"
import "/src/styles/components/garden/another-user-card-dropdown.css"

function AnotherUserCardDropdown({ user }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleToggleDropdown = () => {
    setIsExpanded((currentState) => !currentState)
  }

  return (
    <button
      type="button"
      className={`another-user-card ${isExpanded ? "another-user-card--expanded" : ""}`}
      onClick={handleToggleDropdown}
      aria-expanded={isExpanded}
      aria-label={`Open ${user.userName} garden details`}
    >
      <span className="another-user-card__main">
        <img src={user.avatar} alt={`${user.userName} avatar`} className="another-user-card__avatar" />

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
      </span>

      {isExpanded && (
        <span className="another-user-card__stats">
          <span className="another-user-card__stat-item">{user.ideasCount} ideas</span>
          <span className="another-user-card__stat-item">{user.growingCount} growing</span>
          <span className="another-user-card__follow">Follow</span>
        </span>
      )}
    </button>
  )
}

export default AnotherUserCardDropdown
