import "../../styles/components/explore/garden-card.css"
import flower from "../../assets/images/stage-flower.png"
import fallbackAvatar from "../../assets/images/avatar.jpg"

function GardenCard({ garden, onClick }) {
  const {
    userName,
    userBio,
    avatar,
    tags,
    noteCount,
    gardenState,
    recentNoteTitle,
    recentNoteText,
  } = garden

  return (
    <button type="button" className="garden-card" onClick={onClick}>
      <div className="garden-card__content">
        <div className="garden-card__image">
          <div className="garden-card__user-wrapper">
            <img src={avatar || fallbackAvatar} alt="avatar-garden" className="garden-card__image-content" />
            <div className="garden-card__title">
              <p className="garden-card__user-name">{userName}</p>
              <p className="garden-card__user-bio">{userBio}</p>
            </div>
          </div>
          <div className="garden-card__tags">
            {tags.map((tag) => (
              <div key={tag} className="garden-card__tag">{tag}</div>
            ))}
          </div>
          <div className="garden-card__garden-info">
            <div className="garden-card__info">{noteCount} notes</div>
            <div> | </div>
            <div className="garden-card__info">{gardenState}</div>
          </div>
        </div>
        <div className="garden-card__notes">
          <img src={flower} alt="flower" className="garden-card__notes-image"/>
          <div className="garden-card__notes-content">
            <p className="garden-card__notes-title">{recentNoteTitle}</p>
            <p className="garden-card__notes-text">{recentNoteText}</p>
          </div>
        </div>
      </div>
    </button>
  )
}

export default GardenCard