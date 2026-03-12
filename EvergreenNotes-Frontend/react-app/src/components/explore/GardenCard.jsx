import "/src/styles/components/explore/garden-card.css"
import avatar from "../../assets/images/garden-card-avatar.jpg"
import flower from "../../assets/images/stage-flower.png"

function GardenCard() {
  return (
    <div className="garden-card">
      <div className="garden-card__content">
        <div className="garden-card__image">
          <div className="garden-card__user-wrapper">
            <img src={avatar} alt="avatar-garden" className="garden-card__image-content" />
            <div className="garden-card__title">
              <p>User's Garden</p>
              <p>Blablabla Blebleble</p>
            </div>
          </div>
          <div className="garden-card__tags">
            <div className="garden-card__tag">tag1</div>
            <div className="garden-card__tag">tag2</div>
            <div className="garden-card__tag">tag3</div>
          </div>
          <div className="garden-card__garden-info">
            <div className="garden-card__info">100 notes</div>
            <div> | </div>
            <div className="garden-card__info">Growing Garden</div>
          </div>
        </div>
        <div className="garden-card__notes">
          <img src={flower} alt="flower" className="garden-card__notes-image"/>
          <div>
            <p>Recent note</p>
            <p>Dante Alighieri Divina comedie personaje</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GardenCard