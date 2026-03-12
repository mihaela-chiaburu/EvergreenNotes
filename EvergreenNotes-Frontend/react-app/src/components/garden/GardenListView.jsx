// src/components/garden/GardenListView.jsx
import leafSvg from "../../assets/images/leaf.svg"
import "../../styles/list-view.css"

function GardenListView() {
  return (
    <div className="garden-view garden-list-view">
      <div className="garden-list-view__options">
        <div className="list-view-all">
          <p>All Notes</p>
        </div>
        <div className="list-view-all">
          <p>Sort by: Date</p>
        </div>
      </div>
      <div className="garden-list-view__list garden-list-view__canvas">
        <div className="garden-list-view__item">
          <img src={leafSvg} alt="Note 1" className="garden-list-view__item-image" />
          <div className="garden-list-view__item-content">
            <div className="garden-list-view__item-content-header">
              <h3>Note 1</h3>
              <p className="garden-list-view__item-date">2026-12-03</p>
            </div>
            <div className="garden-list-view__item-content-tags">
              <p className="garden-list-view__item-tag">Tag 1</p>
              <p className="garden-list-view__item-tag">Tag 2</p>
              <p className="garden-list-view__item-tag">Tag 3</p>
            </div>
            <p className="garden-list-view__item-content-text">This is the content of the first note.</p>
          </div>
        </div>
        <div className="garden-list-view__scroll-bar">
          <div className="garden-list-view__scroll-thumb">
          </div>
      </div>
      </div>
    </div>
  )
}

export default GardenListView